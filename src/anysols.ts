import {readJsonFileSync, writeFileSync, copySync, readJsonFilesFromPathSync, createLogger} from "anysols-utils";

import {AnysolsCollection, AnysolsRecord} from "anysols-odm";
import {AnysolsCoreService} from "anysols-core-service";
import {AnysolsServerService} from "anysols-server-service";
import {AnysolsUserManagement} from "anysols-user-management";
import {AnysolsSecurityService} from "anysols-security-service";
import {AnysolsPlatform} from "anysols-platform";


import * as path from "path";
import {SAMPLE_PATH, CWD_PATH} from "./config";
import {CORE_MODELS} from "anysols-core-service/lib/constants";
import * as fs from "fs";

const serviceClasses: any = {
    [AnysolsServerService.getName()]: AnysolsServerService,
    [AnysolsUserManagement.getName()]: AnysolsUserManagement,
    [AnysolsSecurityService.getName()]: AnysolsSecurityService,
    [AnysolsPlatform.getName()]: AnysolsPlatform,
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

export default class Anysols {

    constructor() {

    }

    static projectSetup() {
        if (fs.existsSync(path.normalize(CWD_PATH + "/anysols-config.json")))
            throw new Error("Project already existing in the folder");
        copySync(SAMPLE_PATH, CWD_PATH);
        writeFileSync(CWD_PATH + '/.env', 'NODE_ENV=development');
    }

    async run() {
        let anysolsConfig;
        try {
            anysolsConfig = readJsonFileSync(CWD_PATH + "/anysols-config.json", null);
            printf(FgGreen);
            printf(FgGreen, 'project name : ' + anysolsConfig.name);
            printf(FgGreen, 'current working directory : ' + CWD_PATH);
            printf(FgGreen);
        } catch (e) {
            printf(FgRed);
            printf(FgRed, 'anysols-config.json file not found');
            printf(FgRed, 'Please initiate the project by running `anysols setup` command');
            printf(FgRed);
            process.exit(0);
        }

        const services: any = {};
        const coreService = new AnysolsCoreService(anysolsConfig.core, logger);
        await coreService.start();
        services[AnysolsCoreService.getName()] = coreService;

        const serviceCol = coreService.collection(CORE_MODELS.SERVICE);
        if (!serviceCol)
            throw new Error("Unknown model " + CORE_MODELS.SERVICE);
        const serviceRecords: AnysolsRecord[] = await serviceCol.find({}).toArray();
        for (const serviceConfig of anysolsConfig.services) {
            const serviceName = serviceConfig.name;
            const serviceRecord = serviceRecords.find((rec) => rec.get('name') === serviceName);
            const ServiceClass = serviceClasses[serviceName];
            if (!ServiceClass)
                throw new Error("Unknown service :: " + serviceName);

            if (serviceConfig.paths)
                Object.keys(serviceConfig.paths).forEach((key: string) => {
                    serviceConfig.paths[key] = CWD_PATH + "/" + serviceConfig.paths[key];
                });
            let service = new ServiceClass(serviceConfig, logger, services);
            await service.start();
            logger.info("Started '" + serviceName + "'");
            services[serviceName] = service;
            const projectPath = ServiceClass.getProjectPath();
            if (!serviceRecord) {
                const modelsPath = path.normalize(projectPath + "/resources/models/**.json");
                for (const schemaDefinition of readJsonFilesFromPathSync(modelsPath, null))
                    await coreService.defineCollection(schemaDefinition);

                const updatesPath = path.normalize(projectPath + "/resources/updates/**/*.json");
                for (const updateFile of readJsonFilesFromPathSync(updatesPath, null))
                    await coreService.loadUpdateRecords(updateFile);
                await _saveService(coreService, ServiceClass.getName(), ServiceClass.getVersion());
            } else if (serviceRecord.get('version') !== ServiceClass.getVersion()) {
                logger.info("Upgrading '" + serviceName + "'");
                const modelsPath = path.normalize(projectPath + "/resources/models/**.json");
                for (const schemaDefinition of readJsonFilesFromPathSync(modelsPath, null)) {
                    if (coreService.isCollectionDefined(schemaDefinition.name)) {
                        const col = coreService.collection(schemaDefinition.name);
                        if (!col)
                            throw new Error("Unknown model :: " + schemaDefinition.name);
                        const rec: AnysolsRecord | null = await col.findOne({name: schemaDefinition.name});
                        if (rec)
                            await rec.delete();
                    }
                    await coreService.defineCollection(schemaDefinition);
                }

                const updatesPath = path.normalize(projectPath + "/resources/updates/**/*.json");
                for (const updateFile of readJsonFilesFromPathSync(updatesPath, null)) {
                    await coreService.deleteRecords(updateFile);
                    await coreService.loadUpdateRecords(updateFile);
                }
                serviceRecord.set('name', serviceName);
                serviceRecord.set('version', ServiceClass.getVersion());
                await serviceRecord.update();
            }
        }


    }
}

const logger = createLogger({label: Anysols.name});

async function _saveService(core: AnysolsCoreService, name: string, version: string) {
    const serviceCol = core.collection(CORE_MODELS.SERVICE);
    if (!serviceCol)
        throw new Error("Unknown model " + CORE_MODELS.SERVICE);
    const serviceRecord = serviceCol.createNewRecord();
    serviceRecord.set('name', name);
    serviceRecord.set('version', version);
    await serviceRecord.insert();
}

process.on('unhandledRejection', function onError(err) {
    console.error(err);
});
