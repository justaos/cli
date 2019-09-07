"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const anysols_utils_1 = require("anysols-utils");
const server_interface_1 = require("./server-interface");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const engine = require("express-ejs-layouts");
const compression = require("compression");
const privates = new WeakMap();
class ServerService {
    constructor(config) {
        const app = express();
        const router = express.Router();
        privates.set(this, { app, router, config });
    }
    getName() {
        return "server";
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            _registerRouterAndHandlers(this);
            _handleErrors(this);
            yield _startExpressServer(this);
            logger.log('listening on port ' + _getConfig(this).port);
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    getInterface() {
        return new server_interface_1.ServerInterface(_getApp(this));
    }
}
exports.ServerService = ServerService;
const logger = new anysols_utils_1.Logger(ServerService.name);
function _getApp(that) {
    return privates.get(that).app;
}
function _getRouter(that) {
    return privates.get(that).router;
}
function _registerRouterAndHandlers(that) {
    const app = _getApp(that);
    // should be placed before express.static
    app.use(compression({
        filter: function (req, res) {
            const contentType = res.getHeader('Content-Type');
            if (typeof contentType !== 'string')
                return false;
            return /json|text|javascript|css/.test(contentType);
        },
        level: 9
    }));
    // set ui path, template engine and default layout
    app.use(engine);
    //app.set('views', config.root + '/resources/platform/ui');
    app.set('view engine', 'ejs');
    // cookieParser should be above session
    app.use(cookieParser()); // For Passport
    //bodyParser
    app.use(bodyParser.json()); // support json encoded bodies
    app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
    // routes should be at the last
    const router = _getRouter(that);
    _getApp(that).use(router);
}
function _handleErrors(that) {
    // assume 404 since no middleware responded
    _getApp(that).use(function (req, res, next) {
        // respond with html page
        if (req.accepts('html')) {
            res.render('404', { url: req.url });
            return;
        }
        // respond with json
        if (req.accepts('json')) {
            res.send({ error: 'Not found' });
            return;
        }
        // default to plain-text. send()
        res.type('txt').send('Not found');
    });
}
function _startExpressServer(that) {
    const config = _getConfig(that);
    return new Promise((resolve, reject) => {
        _getApp(that).listen(config.port, function () {
            resolve();
        });
    });
}
function _getConfig(that) {
    return privates.get(that).config;
}
