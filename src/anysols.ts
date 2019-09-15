import * as platformConfig from "./config";
import {readJsonFileSync, writeFileSync, copySync} from "anysols-utils";

import {AnysolsCoreService} from "anysols-core-service";
import {AnysolsServerService} from "anysols-server-service";
import PlatformAPIsApplication from "./system-applications/platform-apis/platformAPIsApplication";
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
                    if (serviceDefinition.config.assets)
                        serviceDefinition.config.assets = platformConfig.CWD_PATH + "/" + serviceDefinition.config.assets;
                    if (serviceDefinition.config.pages)
                        for (let key of Object.keys(serviceDefinition.config.pages))
                            serviceDefinition.config.pages[key] = platformConfig.CWD_PATH + "/" + serviceDefinition.config.pages[key];
                }  else if (ServiceClass.getName() === 'security') {
                    if (serviceDefinition.config.loginPage)
                        serviceDefinition.config.loginPage = platformConfig.CWD_PATH + "/" + serviceDefinition.config.loginPage;
                }
                let service = new ServiceClass(serviceDefinition.config, null, services);
                await service.start();
                services[serviceName] = service;
            }
        }
        let platformAPIsApplication = new PlatformAPIsApplication({}, null, services);
        await platformAPIsApplication.start();

    }
}


process.on('unhandledRejection', function onError(err) {
    console.error(err);
});
