"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const privates = new WeakMap();
class ServerInterface {
    constructor(app) {
    }
}
exports.ServerInterface = ServerInterface;
function _getApp(that) {
    return privates.get(that).app;
}
