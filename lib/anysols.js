"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const anysols_platform_1 = require("anysols-platform");
const config_1 = require("./config");
const anysols_utils_1 = require("anysols-utils");
const server_service_1 = require("./services/server/server-service");
class Anysols {
    constructor() {
    }
    static projectSetup() {
        anysols_utils_1.copySync(config_1.rootPath + '/example', config_1.cwdPath);
        anysols_utils_1.writeFileSync(config_1.cwdPath + '/.env', 'NODE_ENV=development');
    }
    run() {
        const anysolsConfig = anysols_utils_1.readJsonFileSync(config_1.cwdPath + "/anysols-config.json", null);
        const platform = new anysols_platform_1.AnysolsPlatform({
            "db": anysolsConfig.db
        });
        platform.boot().then(() => {
            new server_service_1.ServerService(anysolsConfig.services[0].config).start();
        });
    }
}
exports.default = Anysols;
