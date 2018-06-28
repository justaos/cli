const path = require('path');
const fileUtils = require('../utils/file-utils');
const _ = require('lodash');
const dotEnv = require('dotenv');

const rootPath = path.normalize(__dirname + '/../..');

let cwdPath;
let configs;
let defaultConfig;

const programName = path.basename(process.argv[1]);

if (programName === 'anysols.js' || programName === 'anysols') {
  cwdPath = process.cwd(); // current working directory
  try {
    console.log(cwdPath + '/anysols-config.json');
    configs = fileUtils.readJsonFileSync(cwdPath + '/anysols-config.json'); // load from default config.
  } catch (e) {
    const FgRed = '\x1b[31m';
    console.log(FgRed,
        '*********************************************************************');
    console.log(FgRed,
        '***               anyols-config.js file not found                 ***');
    console.log(FgRed,
        '*** Please initiate the project by running `anysols init` command ***');
    console.log(FgRed,
        '*********************************************************************');
    console.log('\x1b[0m', 'EXIT');
    process.exit(0);
  }
  dotEnv.config(cwdPath + '.env');
}
else {
  cwdPath = rootPath;
  dotEnv.config();
  defaultConfig = fileUtils.readJsonFileSync(rootPath + '/resources/config.json'); // load from default config.
  defaultConfig.mode = 'internal';
}

const env = process.env.NODE_ENV || 'development';

let config = configs && configs[env] ? configs[env] : defaultConfig;
config.env = env;
config.root = rootPath;
config.cwd = cwdPath;

let size = 50;

function logBox(str) {
  console.log('* ' + _.padEnd(str, size, ' ') + ' *');
}

console.log(_.padStart('', size + 4, '*'));
logBox('program : ' + programName);
logBox('environment : ' + config.env);
logBox('logger level : ' + config.loggerLevel);
logBox('port : ' + config.app.port);
logBox('current working directory : ' + config.cwd);
console.log(_.padStart('', size + 4, '*'));

module.exports = config;