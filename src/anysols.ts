import * as platformConfig from "./config";
import {readJsonFileSync, writeFileSync, copySync} from "anysols-utils";

import {AnysolsCoreService} from "anysols-core-service";
import {AnysolsServerService} from "anysols-server-service";
import PlatformApplication from "./system-applications/platform/platformApplication";
import SecurityApplication from "./system-applications/security/securityApplication";
import UserManagementApplication from "./system-applications/userManagement/userManagement";

const serviceClasses: any = {
    core: AnysolsCoreService,
    server: AnysolsServerService,
    userManagement: UserManagementApplication,
    security: SecurityApplication
};

export default class Anysols {

    constructor() {

    }

    static projectSetup() {
        const config = readJsonFileSync(platformConfig.CWD_PATH + "/anysols-config.json", null);
        if (config)
            throw new Error("");
        copySync(platformConfig.ROOT_PATH + '/example', platformConfig.CWD_PATH);
        writeFileSync(platformConfig.CWD_PATH + '/.env', 'NODE_ENV=development');
    }

    async run() {
        const anysolsConfig = readJsonFileSync(platformConfig.CWD_PATH + "/anysols-config.json", null);
        const services: any = {};

        for (const serviceDefinition of anysolsConfig.services) {
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
        await platformApplication.start();

    }
}


process.on('unhandledRejection', function onError(err) {
    console.error(err);
});
