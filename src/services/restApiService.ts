import {Logger} from "anysols-utils/lib";

const privates = new WeakMap();

export default class RestApiService {

    constructor(config: any, apis: any) {
        privates.set(this, {config, apis});
    }

    static getName() {
        return "server";
    }

    async start() {
      //  const s  = _getAPIs(this).server;
     //   const coreAPI  = _getAPIs(this).core;
     //   coreAPI
    }

    async stop() {

    }

    /*getAPI():  {
        return new AnysolsServerAPI(_getRouter(this));
    }*/
}

const logger = new Logger(RestApiService.name);


function _getConfig(that: RestApiService) {
    return privates.get(that).config;
}

function _getAPIs(that: RestApiService) {
    return privates.get(that).apis;
}
