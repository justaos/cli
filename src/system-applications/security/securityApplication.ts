import {Logger, readFileSync, createLogger} from "anysols-utils";
import {AnysolsServerService} from "anysols-server-service";
import {AnysolsCoreService} from "anysols-core-service";
import {AnysolsRecord} from "anysols-odm";
import * as passport from 'passport';
import * as passportLocal from 'passport-local';
import * as passportJWT from 'passport-jwt';
import * as jwt from 'jsonwebtoken';
import AnysolsUser from "../userManagement/anysolsUser";
import * as ejs from "ejs";

const LocalStrategy = passportLocal.Strategy;
const JWTStrategy = passportJWT.Strategy;

const privates = new WeakMap();

export default class SecurityApplication {

    constructor(config: any, logger: any | null, services: any) {
        privates.set(this, {config, services, logger});
    }

    static getName() {
        return "security";
    }

    async start() {
        _registerLocalStrategy(this);
        _registerJWTStrategy(this);
        _initializeApis(this);


    }

    async stop() {

    }

}

function _initializeApis(that: SecurityApplication) {
    const config = _getConfig(that);
    const server = _getService(that).server;

    server.use({
        checkConfig: function (config: any) {
            return !!config.authenticate;
        },
        handler: function (req: any, res: any, next: any) {
            passport.authenticate('jwt', function (err: any, user: any, info: any) {
                if (err)
                    return next(err);
                if (!user)
                    return res.redirect('/auth/login?redirect=' + req.originalUrl);
                req.user = user;
                next();
                return null;
            })(req, res, next);
        }
    });
    server.post('/auth/login', {}, (req: any, res: any, next: any) => {
        passport.authenticate('local', {session: false}, (err: Error, user: AnysolsUser, info: any) => {
            if (err || !user)
                return res.status(400).json({
                    message: info ? info.message : 'Login failed',
                    user: info ? info.found : undefined
                });

            req.login(user, {session: false}, (err: Error) => {
                if (err)
                    res.send(err);

                const token: string = jwt.sign(user.toPlainObject(), config.cookieSecret || 'secret');
                res.cookie(config.cookieName, token,
                    {maxAge: config.tokenExpiration, httpOnly: true});
                return res.send({token});
            });
        })
        (req, res);
    });

    let loginPageEjs: any;
    if (config.loginPage) {
        try {
            loginPageEjs = readFileSync(config.loginPage).toString();
        } catch (e) {
            _getLogger(that).warn("Login view Not found");
        }
    }
    server.get('/auth/login', {}, (req: any, res: any, next: any) => {
        if (loginPageEjs)
            res.status(200).type('html').send(ejs.render(loginPageEjs, {}));
        else
            next();
    });
    server.get('/auth/logout', {}, (req: any, res: any, next: any) => {
        res.clearCookie(config.cookieName);
        res.redirect('/auth/login');
    });
}

function _registerLocalStrategy(that: SecurityApplication) {
    const userManagement = _getService(that).userManagement;
    passport.use(new LocalStrategy(
        function (username: string, password: string, done: any) {

            //Assume there is a DB module providing a global UserModel
            username = username.replace('.', '[.]');
            userManagement.getUserByUsername(username).then((user: AnysolsUser | null) => {
                if (!user)
                    return done(null, false, {
                        found: false,
                        message: 'Username does not exist'
                    });

                if (!user.isValidPassword(password))
                    return done(null, false,
                        {found: true, message: 'Incorrect password.'});

                return done(null, user, {message: 'Logged In Successfully'});

            });
        }));
}

function _registerJWTStrategy(that: SecurityApplication) {
    const config = _getConfig(that);
    const userManagement = _getService(that).userManagement;
    passport.use(new JWTStrategy({
            jwtFromRequest: function (req) {
                let token = null;
                if (req && req.cookies)
                    token = req.cookies[config.cookieName];
                return token;
            },
            secretOrKey: config.cookieSecret || 'secret'
        },
        function (jwtPayload, cb) {
            //find the user in db if needed
            return userManagement.getUserByUsername(jwtPayload.username).then((user: AnysolsRecord | null) => {
                if (user) {
                    cb(null, user);
                } else
                    throw Error('no such user')
            });
        }
    ));
}

function _getConfig(that: SecurityApplication) {
    return privates.get(that).config;
}

function _getService(that: SecurityApplication) {
    return privates.get(that).services;
}

function _getLogger(that: SecurityApplication): Logger {
    if (privates.get(that).logger)
        return privates.get(that).logger;
    else
        return createLogger({label: AnysolsServerService.name});
}
