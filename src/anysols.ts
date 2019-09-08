import {AnysolsCoreService} from "anysols-core-service";
import * as platformConfig from "./config";
import {readJsonFileSync, writeFileSync, copySync} from "anysols-utils";
import {AnysolsServerService} from "anysols-server-service";

const services = [AnysolsCoreService, AnysolsServerService];

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

        for (const serviceDefinition of anysolsConfig.services) {
            let Service: any;
            for (Service of services) {
                if (Service.getName() === serviceDefinition.name) {
                    if (Service.getName() === 'server') {
                        if (serviceDefinition.config.assets)
                            serviceDefinition.config.assets = platformConfig.cwdPath + "/" + serviceDefinition.config.assets;
                        if (serviceDefinition.config.pages) {
                            for (let key of Object.keys(serviceDefinition.config.pages)) {
                                serviceDefinition.config.pages[key] = platformConfig.cwdPath + "/" + serviceDefinition.config.pages[key];
                            }
                        }
                    }

                    await new Service(serviceDefinition.config).start();
                }
            }
        }
    }
}
