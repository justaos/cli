import * as path from "path";
import * as fs from "fs";
import * as glob from "glob";

import {readJsonFileSync, writeFileSync, copySync, readJsonFilesFromPathSync, createLogger} from "@anysols/utils";
import {AnysolsRecord} from "@anysols/odm";
import {AnysolsCoreService, ANYSOLS_CORE_SERVICE} from "@anysols/core-service";
import {AnysolsServerService, ANYSOLS_SERVER_SERVICE} from "@anysols/server-service";
import {ANYSOLS_USER_MANAGEMENT, AnysolsUserManagement} from "@anysols/user-management";
import {ANYSOLS_SECURITY_SERVICE, AnysolsSecurityService} from "@anysols/security-service";
import {ANYSOLS_PLATFORM, AnysolsPlatform} from "@anysols/platform";
import {CORE_MODELS} from "@anysols/core-service/lib/constants";
import {ServiceManager} from "@anysols/commons";

import {SAMPLE_PATH, CWD_PATH} from "./config";

const serviceClasses: any = {
    [ANYSOLS_SERVER_SERVICE]: AnysolsServerService,
    [ANYSOLS_USER_MANAGEMENT]: AnysolsUserManagement,
    [ANYSOLS_SECURITY_SERVICE]: AnysolsSecurityService,
    [ANYSOLS_PLATFORM]: AnysolsPlatform,
};

function padStars(str?: string) {
    const size = 75;
    if (typeof str === 'string')
        return '* ' + str.padStart(str.length + Math.floor((size - str.length) / 2), ' ').padEnd(size, ' ') + ' *';

    else
        return ''.padStart(size + 4, '*');
}

const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const Reset = "\x1b[0m";

function printf(color: string, str?: string) {
    console.log(color, padStars(str), Reset);
}

function printBox(color: string, arr: string[]) {
    printf(color);
    arr.forEach(function (str) {
        printf(color, str);
    });
    printf(color);
}

export default class Anysols {

    serviceManager: ServiceManager;
    anysolsConfig: any;

    constructor() {
        this.serviceManager = new ServiceManager();
    }

    static projectSetup() {
        if (fs.existsSync(path.normalize(CWD_PATH + "/anysols-config.json")))
            throw new Error("Project already existing in the folder");
        copySync(SAMPLE_PATH, CWD_PATH);
        writeFileSync(CWD_PATH + '/.env', 'NODE_ENV=development');
    }

    async run() {
        try {
            this.anysolsConfig = readJsonFileSync(CWD_PATH + "/anysols-config.json", null);
            printBox(FgGreen, [
                'project name : ' + this.anysolsConfig.name,
                'current working directory : ' + CWD_PATH
            ]);
        } catch (e) {
            printBox(FgRed, [
                'anysols-config.json file not found',
                'Please initiate the project by running `anysols setup` command'
            ]);
            process.exit(0);
        }
        await this.startServices();
        await this.loadApps();
    }

    async initializeCoreService() {
        const coreConfig = this.anysolsConfig['core'];
        if (coreConfig) {
            const coreService = new AnysolsCoreService(coreConfig, logger);
            this.serviceManager.addService(coreService);
            await this.serviceManager.startService(ANYSOLS_CORE_SERVICE);
            return coreService;
        } else {
            throw new Error("Core configuration not provided");
        }
    }

    getCollectionByName(colName: string) {
        const coreService: AnysolsCoreService = this.serviceManager.getService(ANYSOLS_CORE_SERVICE);
        const col = coreService.collection(colName);
        if (!col)
            throw new Error("Unknown collection " + colName);
        return col;
    }

    getServiceClassByName(serviceName: string) {
        const ServiceClass = serviceClasses[serviceName];
        if (!ServiceClass)
            throw new Error("Unknown service :: " + serviceName);
        return ServiceClass;
    }

    async updateModels(modelsPath: string) {
        const coreService: AnysolsCoreService = this.serviceManager.getService(ANYSOLS_CORE_SERVICE);
        for (const schemaDefinition of readJsonFilesFromPathSync(modelsPath, null)) {
            if (coreService.isCollectionDefined(schemaDefinition.name)) {
                const col = this.getCollectionByName(schemaDefinition.name);
                const rec: AnysolsRecord | null = await col.findOne({name: schemaDefinition.name});
                if (rec)
                    await rec.delete();
            }
            await coreService.defineCollection(schemaDefinition);
        }
    }

    transformServiceConfig(serviceConfig: any) {
        const {paths: servicePaths} = serviceConfig;
        if (servicePaths)
            Object.keys(servicePaths).forEach((key: string) => {
                servicePaths[key] = CWD_PATH + "/" + servicePaths[key];
            });
    }

    async startServices() {
        const coreService: AnysolsCoreService = await this.initializeCoreService();
        const serviceCol = this.getCollectionByName(CORE_MODELS.SERVICE);
        const serviceRecords: AnysolsRecord[] = await serviceCol.find({}).toArray();
        //const coreService: AnysolsCoreService = this.serviceManager.getService(ANYSOLS_CORE_SERVICE);
        for (const serviceConfig of this.anysolsConfig.services) {
            this.transformServiceConfig(serviceConfig);
            let {name: serviceName} = serviceConfig;
            serviceName = "@anysols/" + serviceName;
            const serviceRecord = serviceRecords.find((rec) => rec.get('name') === serviceName);
            const ServiceClass = this.getServiceClassByName(serviceName);
            const service = new ServiceClass(serviceConfig, logger, this.serviceManager);
            this.serviceManager.addService(service);
            await this.serviceManager.startService(serviceName);
            logger.info("STARTED - '" + serviceName + "'");

            const projectPath = service.getProjectPath();
            const modelsPath = path.normalize(projectPath + "/resources/models/**.json");
            const updatesPath = path.normalize(projectPath + "/resources/updates/**/*.json");

            if (!serviceRecord) {
                for (const schemaDefinition of readJsonFilesFromPathSync(modelsPath, null))
                    await coreService.defineCollection(schemaDefinition);

                for (const updateFile of readJsonFilesFromPathSync(updatesPath, null))
                    await coreService.loadUpdateRecords(updateFile);
                await _saveService(this, service.getName(), service.getVersion());
            } else if (serviceRecord.get('version') !== service.getVersion()) {
                logger.info("Upgrading service - '" + serviceName + "'");
                await this.updateModels(modelsPath);
                for (const updateFile of readJsonFilesFromPathSync(updatesPath, null)) {
                    await coreService.deleteRecords(updateFile);
                    await coreService.loadUpdateRecords(updateFile);
                }
                await _updateService(serviceRecord, serviceName, service.getVersion());
            }
        }

    }

    async loadApps() {
        const coreService: AnysolsCoreService = this.serviceManager.getService(ANYSOLS_CORE_SERVICE);
        const appCol = this.getCollectionByName("p_application");
        const appRecords: AnysolsRecord[] = await appCol.find({}).toArray();
        for (const file of glob.sync(CWD_PATH + '/apps/**/config.json')) {
            const config = readJsonFileSync(file, null);
            const appPath = CWD_PATH + "/apps/" + config.name;
            const appRecord = appRecords.find((rec) => rec.get('name') === config.name);
            const modelsPath = path.normalize(appPath + "/models/**.json");
            const updatesPath = path.normalize(appPath + "/updates/**/*.json");
            if (!appRecord) {
                for (const schemaDefinition of readJsonFilesFromPathSync(modelsPath, null))
                    await coreService.defineCollection(schemaDefinition);

                for (const updateFile of readJsonFilesFromPathSync(updatesPath, null))
                    await coreService.loadUpdateRecords(updateFile);
                await _saveApplication(coreService, config.name, config.label, config.version);
            } else if (appRecord.get('version') !== config.version) {
                logger.info("Upgrading application - '" + config.name + "'");
                await this.updateModels(modelsPath);
                for (const updateFile of readJsonFilesFromPathSync(updatesPath, null)) {
                    await coreService.deleteRecords(updateFile);
                    await coreService.loadUpdateRecords(updateFile);
                }
                await _updateApplication(appRecord, config.version);
            }

            const server: AnysolsServerService = this.serviceManager.getService(ANYSOLS_SERVER_SERVICE);
            server.registerStatic("/app/" + config.name + '/assets', appPath + "/ui/assets");
            server.get("/app/" + config.name, {authenticate: true}, (req: any, res: any, next: any) => {
                res.render(appPath + "/ui/index", {
                    layout: false,
                    user: req.user.toPlainObject()
                });
            });
        }
    }
}

const logger = createLogger({label: Anysols.name});

async function _saveService(that: Anysols, name: string, version: string) {
    const serviceCol = that.getCollectionByName(CORE_MODELS.SERVICE);
    const serviceRecord = serviceCol.createNewRecord();
    serviceRecord.set('name', name);
    serviceRecord.set('version', version);
    await serviceRecord.insert();
}

async function _updateService(serviceRecord: AnysolsRecord, name: string, version: string) {
    serviceRecord.set('name', name);
    serviceRecord.set('version', version);
    await serviceRecord.update();
}

async function _saveApplication(core: AnysolsCoreService, name: string, label: string, version: string) {
    const appCol = core.collection("p_application");
    if (!appCol)
        throw new Error("Unknown model " + "p_application");
    const appRecord = appCol.createNewRecord();
    appRecord.set('name', name);
    appRecord.set('label', label);
    appRecord.set('version', version);
    await appRecord.insert();
}

async function _updateApplication(serviceRecord: AnysolsRecord, version: string) {
    serviceRecord.set('version', version);
    await serviceRecord.update();
}

process.on('unhandledRejection', function onError(err) {
    console.error(err);
});
