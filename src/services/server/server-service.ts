import * as express from "express";
import {Logger} from "anysols-utils";
import {ServerInterface} from "./server-interface";
import {Express, Request, Response, Router, NextFunction} from "express";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as engine from 'express-ejs-layouts';
import * as compression from 'compression';

const privates = new WeakMap();

export class ServerService {

    constructor(config: any) {
        const app: Express = express();
        const router: Router = express.Router();
        privates.set(this, {app, router, config});
    }

    getName() {
        return "server";
    }

    async start() {
        _registerRouterAndHandlers(this);
        _handleErrors(this);
        await _startExpressServer(this);
        logger.log('listening on port ' + _getConfig(this).port);
    }

    async stop() {

    }

    getInterface(): ServerInterface {
        return new ServerInterface(_getApp(this));
    }
}

const logger = new Logger(ServerService.name);

function _getApp(that: ServerService): Express {
    return privates.get(that).app;
}

function _getRouter(that: ServerService): Express {
    return privates.get(that).router;
}

function _registerRouterAndHandlers(that: ServerService) {
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
    app.use(cookieParser());// For Passport

    //bodyParser
    app.use(bodyParser.json()); // support json encoded bodies
    app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

    // routes should be at the last
    const router = _getRouter(that);
    _getApp(that).use(router);
}

function _handleErrors(that: ServerService) {
    // assume 404 since no middleware responded
    _getApp(that).use(function (req: Request, res: Response, next: NextFunction) {

        // respond with html page
        if (req.accepts('html')) {
            res.render('404', {url: req.url});
            return;
        }

        // respond with json
        if (req.accepts('json')) {
            res.send({error: 'Not found'});
            return;
        }

        // default to plain-text. send()
        res.type('txt').send('Not found');
    });
}

function _startExpressServer(that: ServerService): Promise<any> {
    const config = _getConfig(that);
    return new Promise((resolve, reject) => {
        _getApp(that).listen(config.port, function () {
            resolve();
        });
    });
}

function _getConfig(that: ServerService) {
    return privates.get(that).config;
}
