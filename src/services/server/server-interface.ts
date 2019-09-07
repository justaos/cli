import {Express} from "express";

const privates = new WeakMap();

export class ServerInterface {
    constructor(app: Express) {

    }
}

function _getApp(that: ServerInterface):Express  {
    return privates.get(that).app;
}
