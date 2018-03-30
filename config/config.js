const path = require('path');
const dotenv = require('dotenv');
const rootPath = path.normalize(__dirname + '/..');
dotenv.config();

// Load configurations according to the selected environment
const env = process.env.NODE_ENV || 'development';

const configs = {
    development: {
        loggerLevel: 'debug',
        db: {
            host: 'localhost',
            port: '3306',
            name: 'anysols',
            user: 'root',
            password: 'root',
            dialect: 'mysql'
        },
        app: {
            name: 'Anysols - Platform for Business applications',
            port: 80,
            cookieName: 'myCookie',
            cookieSecret: 'boom',
            tokenExpiration: 3600000 * 2
        }
    },
    test: {
        loggerLevel: 'info',
        db: {
            dialect: 'sqlite'
        },
        app: {
            name: 'Anysols - Platform for Business applications - TEST',
            port: 3001,
            cookieName: 'myCookie',
            cookieSecret: 'boom',
            tokenExpiration: 3600000 * 2
        },
    },
    production: {
        loggerLevel: 'info',
        cookieName: 'myCookie',
        app: {
            name: 'Anysols - Platform for Business applications - PROD',
            port: 3001,
            cookieName: 'myCookie',
            cookieSecret: 'boom',
            tokenExpiration: 3600000 * 2
        }
    }
};

let config = configs[env];
config.env = env;
config.root = rootPath;
module.exports = config;