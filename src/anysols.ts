import * as platformConfig from "./config";
import {readJsonFileSync, writeFileSync, copySync} from "anysols-utils";

import {AnysolsRecord} from "anysols-odm";
import {AnysolsCoreService} from "anysols-core-service";
import {AnysolsServerService} from "anysols-server-service";
import PlatformApplication from "./system-applications/platform/platformApplication";
import SecurityApplication from "./system-applications/security/securityApplication";
import UserManagementApplication from "./system-applications/userManagement/userManagement";
import * as path from "path";
import {SAMPLE_PATH} from "./config";
import {CORE_MODELS} from "anysols-core-service/lib/constants";

const serviceClasses: any = {
    [AnysolsServerService.getName()]: AnysolsServerService,
    [UserManagementApplication.getName()]: UserManagementApplication
};
// userManagement: UserManagementApplication,
//     security: SecurityApplication

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
            if (!serviceRecord) {
                const ServiceClass = serviceClasses[serviceName];
                if (ServiceClass) {
                    if (ServiceClass.paths)
                        Object.keys(ServiceClass.paths).forEach((key: string) => {
                            ServiceClass.paths[key] = platformConfig.CWD_PATH + "/" + ServiceClass.paths[key];
                        });
                    let service = new ServiceClass(serviceConfig, null, services);
                    await service.start();
                    services[serviceName] = service;
                }
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


process.on('unhandledRejection', function onError(err) {
    console.error(err);
});
