const path = require('path');
const jsonfile = require('jsonfile');
const _ = require('lodash');
const dotEnv = require('dotenv');

const rootPath = path.normalize(__dirname + '/..');

let cwdPath;

const programName = path.basename(process.argv[1]);
if (programName === 'anysols.js')
  cwdPath = process.cwd(); // current working directory
else
  cwdPath = rootPath;

console.log('cwd : ' + cwdPath);

dotEnv.config();

const env = process.env.NODE_ENV || 'development';

const defaultConfig = {
  loggerLevel: 'debug', // use info for test/prod
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
    port: 8080,
    cookieName: 'myCookie',
    cookieSecret: 'boom',
    tokenExpiration: 3600000 * 2
  }
};

const prodConfig = _.cloneDeep(defaultConfig, true);
prodConfig.logger = 'info';
prodConfig.db.password = 'anysols';
prodConfig.app.port = 80;

const configs = {
  development: defaultConfig,
  test: prodConfig,
  production: prodConfig
};

let config = configs[env] ? configs[env] : defaultConfig;
config.env = env;
config.root = rootPath;
config.cwd = cwdPath;

module.exports = config;