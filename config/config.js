const path = require('path');
const _ = require('lodash');
const dotEnv = require('dotenv');

const rootPath = path.normalize(__dirname + '/..');

dotEnv.config();
const env = process.env.NODE_ENV || 'development';

const devConfig = {
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

const prodConfig = _.clone(devConfig, true);
prodConfig.logger = 'info';

const configs = {
	development: devConfig,
	test: devConfig,
	production: devConfig
};

let config = configs[env];
config.env = env;
config.root = rootPath;
module.exports = config;