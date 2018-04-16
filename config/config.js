const path = require('path');
const fileUtils = require('../utils/file-utils');
const _ = require('lodash');
const dotEnv = require('dotenv');

const rootPath = path.normalize(__dirname + '/..');

let cwdPath;
let configs;
let defaultConfig;

const programName = path.basename(process.argv[1]);
console.log('program name: ' + programName);

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
  defaultConfig = fileUtils.readJsonFileSync(rootPath + '/config.json'); // load from default config.
}

const env = process.env.NODE_ENV || 'development';

console.log('-------- ' + env);

console.dir(configs);
let config = configs && configs[env] ? configs[env] : defaultConfig;
console.dir(config);
config.env = env;
config.root = rootPath;
config.cwd = cwdPath;

module.exports = config;