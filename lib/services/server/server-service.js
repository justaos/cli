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
const ejs = require("ejs");
const config_1 = require("../../config");
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
            _getServer(this).close();
            logger.log('stopped server');
        });
    }
    getInterface() {
        return new server_interface_1.ServerInterface(_getRouter(this));
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
    app.use('/assets', express.static(config_1.cwdPath + '/assets'));
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
    const app = _getApp(that);
    // assume "not found" in the error msgs
    // is a 404. this is somewhat silly, but
    // valid, you can do whatever you like, set
    // properties, use instanceof etc.
    app.use(function (err, req, res, next) {
        // treat as 404
        if (err.message
            && (~err.message.indexOf('not found')
                || (~err.message.indexOf('Cast to ObjectId failed')))) {
            return next();
        }
        // log it
        // send emails if you want
        logger.error(err.message);
        console.error(err);
        if (req.headers['content-type'] === 'application/json') {
            res.status(500).send({
                message: err.toString(),
                details: _thisLine(err)
            });
        }
        else
            res.status(500).render('500', { error: err.stack }); // error page
    });
    const ejs404 = anysols_utils_1.readFileSync(config_1.cwdPath + "/views/404.ejs");
    // assume 404 since no middleware responded
    _getApp(that).use(function (req, res, next) {
        // respond with html page
        if (req.accepts('html')) {
            let html = "Not found";
            if (ejs404)
                html = ejs.render(ejs404.toString(), { url: req.originalUrl });
            res.type('html').send(html);
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
function _thisLine(err) {
    const regex = /\((.*):(\d+):(\d+)\)$/;
    const match = regex.exec(err.stack.split("\n")[2]);
    if (match && match.length >= 3) {
        return {
            filepath: match[1] ? match[1] : '',
            line: match[2] ? match[2] : '',
            column: match[3] ? match[3] : ''
        };
    }
}
function _startExpressServer(that) {
    const config = _getConfig(that);
    return new Promise((resolve, reject) => {
        privates.get(that).server = _getApp(that).listen(config.port, function () {
            resolve();
        });
    });
}
function _getConfig(that) {
    return privates.get(that).config;
}
function _getServer(that) {
    return privates.get(that).server;
}
