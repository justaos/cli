"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const privates = new WeakMap();
class ServerInterface {
    constructor(router) {
        privates.set(this, { router });
    }
    get(path, handler) {
        _getRouter(this).get(path, handler);
    }
    post(path, handler) {
        _getRouter(this).post(path, handler);
    }
}
exports.ServerInterface = ServerInterface;
function _getRouter(that) {
    return privates.get(that).router;
}
