import {Router} from "express";
import {ServerService} from "./server-service";

const privates = new WeakMap();

export class ServerInterface {
    constructor(router: Router) {
        privates.set(this, {router});
    }

    get(path: string, handler: any) {
        _getRouter(this).get(path, handler);
    }

    post(path: string, handler: any) {
        _getRouter(this).post(path, handler);
    }

}

function _getRouter(that: ServerInterface): Router {
    return privates.get(that).router;
}
