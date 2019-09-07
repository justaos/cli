import {AnysolsPlatform} from "anysols-platform";
import {cwdPath, rootPath} from "./config";
import {readJsonFileSync, writeFileSync, copySync} from "anysols-utils";
import {ServerService} from "./services/server/server-service";

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

    run() {
        const anysolsConfig = readJsonFileSync(cwdPath + "/anysols-config.json", null);

        const platform = new AnysolsPlatform({
            "db": anysolsConfig.db
        });

        platform.boot().then(() => {
            new ServerService(anysolsConfig.services[0].config).start();
        });
    }
}
