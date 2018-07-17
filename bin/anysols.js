#!/usr/bin/env node
const copydir = require('copy-dir');
const _ = require('lodash');
  
// Delete the 0 and 1 argument (node and script.js)
let args = process.argv.splice(process.execArgv.length + 2);

// Retrieve the first argument
let name = args[0];

if (name === 'init') {
  const fileUtils = require('../src/utils/file-utils');
  let defaultConfig = fileUtils.readJsonFileSync(__dirname + '/../resources/config.json'); // load from default config.
  const prodConfig = _.cloneDeep(defaultConfig, true);
  prodConfig.logger = 'info';
  prodConfig.db.password = 'YOUR_DB_PASSWORD';
  prodConfig.app.port = 80;

  let generatedConfig = {
    development: defaultConfig,
    test: prodConfig,
    production: prodConfig
  };
  fileUtils.writeJsonFileSync(process.cwd() + '/anysols-config.json',
      generatedConfig);
  fileUtils.writeFileSync(process.cwd() + '/.env', 'NODE_ENV=development');

  copydir.sync(__dirname + '/../resources/apps', process.cwd() + '/resources/apps');
  console.log("Project setup complete.");
  console.log("Modify the anysols-config.js file.");
} else
  require('../src/app');
