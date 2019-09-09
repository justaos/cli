import * as platformConfig from "./config";
import {readJsonFileSync, writeFileSync, copySync} from "anysols-utils";

import {AnysolsCoreService} from "anysols-core-service";
import {AnysolsServerService} from "anysols-server-service";
import RestApiService from "./services/restApiService";

const serviceClasses: any = {
    core: AnysolsCoreService,
    server: AnysolsServerService
};

export default class Anysols {

    constructor() {

    }

    static projectSetup() {
        const config = readJsonFileSync(platformConfig.cwdPath + "/anysols-config.json", null);
        if (config)
            throw new Error("");
        copySync(platformConfig.rootPath + '/example', platformConfig.cwdPath);
        writeFileSync(platformConfig.cwdPath + '/.env', 'NODE_ENV=development');
    }

    async run() {
        const anysolsConfig = readJsonFileSync(platformConfig.cwdPath + "/anysols-config.json", null);
        const services: any = {};

        for (const serviceDefinition of anysolsConfig.services) {
            let serviceName: string = serviceDefinition.name;
            if (serviceClasses[serviceName]) {
                let ServiceClass = serviceClasses[serviceName];
                if (ServiceClass.getName() === 'server') {
                    if (serviceDefinition.config.assets)
                        serviceDefinition.config.assets = platformConfig.cwdPath + "/" + serviceDefinition.config.assets;
                    if (serviceDefinition.config.pages)
                        for (let key of Object.keys(serviceDefinition.config.pages))
                            serviceDefinition.config.pages[key] = platformConfig.cwdPath + "/" + serviceDefinition.config.pages[key];
                }
                let service = new ServiceClass(serviceDefinition.config);
                await service.start();
                services[serviceName] = service;
            }

            let restApiService = new RestApiService({}, services);
            await restApiService.start();
        }
    }
}


process.on('unhandledRejection', function onError(err) {
    console.error(err);
});
