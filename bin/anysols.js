#!/usr/bin/env node
const copydir = require('copy-dir');
const _ = require('lodash');
const program = require('commander');
const {prompt} = require('inquirer');

function setupPlatform() {
    const fileUtils = require('../src-js/utils/file-utils');
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
    fileUtils.writeJsonFileSync(process.cwd() + '/anysols-config.json', generatedConfig);
    fileUtils.writeFileSync(process.cwd() + '/.env', 'NODE_ENV=development');
}

program
    .version('1.3.0', '-v, --version')
    .command('setup')
    .description('Setup the platform')
    .action(function (args) {
        let setupChoice = ['platform only', 'platform + sample applications'];

        prompt([{
            type: 'list',
            name: 'type',
            message: 'Setup type. Select the option you wish to perform',
            choices: setupChoice
        }]).then(answers => {
            if (answers.type === setupChoice[0]) {
                setupPlatform();
            } else {
                setupPlatform();
                copydir.sync(__dirname + '/../resources/apps', process.cwd() + '/resources/apps');
            }
            console.log("project setup complete");
            console.log("please run the command `anysols run` to start the application");
        });
    });

program.command('run').action(function () {
    require('../lib/app');
});

program.parse(process.argv);

// Check the program.args obj
let NO_COMMAND_SPECIFIED = program.args.length === 0;

// Handle it however you like
if (NO_COMMAND_SPECIFIED) {
    // e.g. display usage
    program.help();
}
