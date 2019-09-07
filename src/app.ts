import {AnysolsPlatform} from "anysols-platform";
import {cwdPath} from "./config";
import {readJsonFileSync} from "anysols-utils";
import {ServerService} from "./services/server/server-service";

const anysolsConfig = readJsonFileSync(cwdPath + "/anysols-config.json", null);

const platform = new AnysolsPlatform({
        "db": anysolsConfig.db
    }
);

platform.boot().then(() => {
    new ServerService(anysolsConfig.services[0].config).start();
});
