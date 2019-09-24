import * as platformConfig from "./config";
import {readJsonFileSync, writeFileSync, copySync, readJsonFilesFromPathSync} from "anysols-utils";

import {AnysolsCollection, AnysolsRecord} from "anysols-odm";
import {AnysolsCoreService} from "anysols-core-service";
import {AnysolsServerService} from "anysols-server-service";
import {AnysolsUserManagement} from "anysols-user-management";
import {AnysolsSecurityService} from "anysols-security-service";
import PlatformApplication from "./system-applications/platform/platformApplication";


import * as path from "path";
import {SAMPLE_PATH} from "./config";
import {CORE_MODELS} from "anysols-core-service/lib/constants";

const serviceClasses: any = {
    [AnysolsServerService.getName()]: AnysolsServerService,
    [AnysolsUserManagement.getName()]: AnysolsUserManagement,
    [AnysolsSecurityService.getName()]: AnysolsSecurityService
};

export default class Anysols {

    constructor() {

    }

    static projectSetup() {
        const config = readJsonFileSync(path.normalize(platformConfig.CWD_PATH + "/anysols-config.json"), null);
        if (config)
            throw new Error("");
        copySync(SAMPLE_PATH, platformConfig.CWD_PATH);
        writeFileSync(platformConfig.CWD_PATH + '/.env', 'NODE_ENV=development');
    }

    async run() {
        const anysolsConfig = readJsonFileSync(platformConfig.CWD_PATH + "/anysols-config.json", null);
        const services: any = {};
        const coreService = new AnysolsCoreService(anysolsConfig.core, undefined);
        await coreService.start();
        services[AnysolsCoreService.getName()] = coreService;

        const serviceCol = coreService.collection(CORE_MODELS.SERVICE);
        const serviceRecords: AnysolsRecord[] = await serviceCol.find({}).toArray();
        for (const serviceConfig of anysolsConfig.services) {
            const serviceName = serviceConfig.name;
            const serviceRecord = serviceRecords.find((rec) => rec.get('name') === serviceName);
            const ServiceClass = serviceClasses[serviceName];
            if (!ServiceClass)
                throw new Error("Unknown service :: " + serviceName);

            if (serviceConfig.paths)
                Object.keys(serviceConfig.paths).forEach((key: string) => {
                    serviceConfig.paths[key] = platformConfig.CWD_PATH + "/" + serviceConfig.paths[key];
                });
            let service = new ServiceClass(serviceConfig, null, services);
            await service.start();
            console.log("Service started :: " + serviceName);
            services[serviceName] = service;
            if (!serviceRecord) {
                const projectPath = ServiceClass.getProjectPath();
                const modelsPath = path.normalize(projectPath + "/resources/models/**.json");
                for (const schemaDefinition of readJsonFilesFromPathSync(modelsPath, null))
                    services[AnysolsCoreService.getName()].defineCollection(schemaDefinition);
                await _saveService(services[AnysolsCoreService.getName()], ServiceClass.getName(), ServiceClass.getVersion());
            }
        }


        /*for (const serviceDefinition of anysolsConfig.services) {
            let serviceName: string = serviceDefinition.name;
            if (serviceClasses[serviceName]) {
                let ServiceClass = serviceClasses[serviceName];
                console.log("loading service :: " + serviceName);
                if (ServiceClass.getName() === 'server') {
                    if (serviceDefinition.config.assetsPath)
                        serviceDefinition.config.assetsPath = platformConfig.CWD_PATH + "/" + serviceDefinition.config.assetsPath;
                    if (serviceDefinition.config.viewsPath)
                        serviceDefinition.config.viewsPath = platformConfig.CWD_PATH + "/" + serviceDefinition.config.viewsPath;
                }
                let service = new ServiceClass(serviceDefinition.config, null, services);
                await service.start();
                services[serviceName] = service;
            }
        }
        let platformApplication = new PlatformApplication({}, null, services);
        await platformApplication.start();*/

    }
}

async function _saveService(core: AnysolsCoreService, name: string, version: string) {
    const serviceCol: AnysolsCollection = core.collection(CORE_MODELS.SERVICE);
    const serviceRecord = serviceCol.createNewRecord();
    serviceRecord.set('name', name);
    serviceRecord.set('version', version);
    await serviceRecord.insert();
}


process.on('unhandledRejection', function onError(err) {
    console.error(err);
});
