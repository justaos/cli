import {Logger, readJsonFilesFromPathSync} from "anysols-utils";
import AnysolsUser from "./anysolsUser";
import {AnysolsCoreService} from "anysols-core-service";
import {ROOT_PATH} from "../../config";

const PATH_TO_MODELS = ROOT_PATH + "/resources/user-management/models/**.json";

const privates = new WeakMap();

export default class UserManagementApplication {

    constructor(config: any, logger: any | null, services: any) {
        privates.set(this, {config, services});
    }

    static getName() {
        return "userManagement";
    }

    async start() {
        const that = this;
        const config = _getConfig(that);
        const core: AnysolsCoreService = _getService(this).core;
        const userManagementSchemas = readJsonFilesFromPathSync(PATH_TO_MODELS, null);
        for(let schema of userManagementSchemas) {
            await core.defineCollection(schema);
        }
    }

    async stop() {

    }

    async getUserByUsername(username: string): Promise<AnysolsUser | null> {
        const core: AnysolsCoreService = _getService(this).core;
        const userRecord = await core.collection('p_user').findOne({username: new RegExp(`^${username}$`, 'i')});
        if (userRecord)
            return new AnysolsUser(userRecord);
        else
            return null;
    }

}

const logger = new Logger(UserManagementApplication.name);

function _getConfig(that: UserManagementApplication) {
    return privates.get(that).config;
}

function _getService(that: UserManagementApplication) {
    return privates.get(that).services;
}
