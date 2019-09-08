import {AnysolsCoreService} from "anysols-core-service";
import {cwdPath, rootPath} from "./config";
import {readJsonFileSync, writeFileSync, copySync} from "anysols-utils";
import {ServerService} from "./services/server/server-service";

const services = [AnysolsCoreService, ServerService];

export default class Anysols {

    constructor() {

    }

    static projectSetup() {
        const config = readJsonFileSync(cwdPath + "/anysols-config.json", null);
        if (config)
            throw new Error("");
        copySync(rootPath + '/example', cwdPath);
        writeFileSync(cwdPath + '/.env', 'NODE_ENV=development');
    }

    async run() {
        const anysolsConfig = readJsonFileSync(cwdPath + "/anysols-config.json", null);

        for (const serviceDefinition of anysolsConfig.services) {
            let Service: any;
            for (Service of services) {
                if (Service.getName() === serviceDefinition.name) {
                    await new Service(serviceDefinition.config).start();
                }
            }
        }
    }
}
