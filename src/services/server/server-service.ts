import * as express from "express";
import {Logger, readFileSync, readJsonFileSync} from "anysols-utils";
import {ServerInterface} from "./server-interface";
import {Express, Request, Response, Router, NextFunction} from "express";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as engine from 'express-ejs-layouts';
import * as compression from 'compression';
import * as ejs from "ejs";
import {cwdPath} from "../../config";
import * as http from "http";

const privates = new WeakMap();

export class ServerService {

    constructor(config: any) {
        const app: Express = express();
        const router: Router = express.Router();
        privates.set(this, {app, router, config});
    }

    static getName() {
        return "server";
    }

    async start() {
        _registerRouterAndHandlers(this);
        _handleErrors(this);
        await _startExpressServer(this);
        logger.log('listening on port ' + _getConfig(this).port);
    }

    async stop() {
        _getServer(this).close();
        logger.log('stopped server');
    }

    getInterface(): ServerInterface {
        return new ServerInterface(_getRouter(this));
    }
}

const logger = new Logger(ServerService.name);

function _getApp(that: ServerService): Express {
    return privates.get(that).app;
}

function _getRouter(that: ServerService): Router {
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

    app.use('/assets', express.static(cwdPath + '/assets'));

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

    const app = _getApp(that);

    // assume "not found" in the error msgs
    // is a 404. this is somewhat silly, but
    // valid, you can do whatever you like, set
    // properties, use instanceof etc.
    app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
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
        } else
            res.status(500).render('500', {error: err.stack}); // error page
    });


    const ejs404 = readFileSync(cwdPath + "/views/404.ejs");

    // assume 404 since no middleware responded
    _getApp(that).use(function (req: Request, res: Response, next: NextFunction) {

        // respond with html page
        if (req.accepts('html')) {
            let html = "Not found";
            if (ejs404)
                html = ejs.render(ejs404.toString(), {url: req.originalUrl});
            res.type('html').send(html);
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

function _thisLine(err: any) {
    const regex = /\((.*):(\d+):(\d+)\)$/;
    const match = regex.exec(err.stack.split("\n")[2]);
    if (match && match.length >= 3) {
        return {
            filepath: match[1] ? match[1] : '',
            line: match[2] ? match[2] : '',
            column: match[3] ? match[3] : ''
        }
    }
}

function _startExpressServer(that: ServerService): Promise<any> {
    const config = _getConfig(that);
    return new Promise((resolve, reject) => {
        privates.get(that).server = _getApp(that).listen(config.port, function () {
            resolve();
        });
    });
}

function _getConfig(that: ServerService) {
    return privates.get(that).config;
}

function _getServer(that: ServerService): http.Server {
    return privates.get(that).server;
}
