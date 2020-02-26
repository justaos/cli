#!/usr/bin/env node
const program = require("commander");
const {Plt4rmCLI, VERSION} = require("../index");
const pm2 = require('pm2');


program
    .version(VERSION, '-v, --version')
    .option('-s, --service', 'Run as a service');

program.parse(process.argv);

program.command('new <name>')
    .description('Creates a new workspace and sets plt4rm configuration values in the config.json file for the workspace.')
    .action(function (name) {
        Plt4rmCLI.createNewProject(name);
    });

program.command('run')
    .description('Builds and serves your project as a service.')
    .action(function () {
        if (!program.serive) {
            Plt4rmCLI.run();
        } else
            pm2.connect(function (err) {
                if (err) {
                    console.error(err);
                    process.exit(2);
                }

                pm2.start({
                    script: __dirname + '/../lib/app.js',         // Script to be run
                    exec_mode: 'cluster',        // Allows your app to be clustered
                    instances: 1,                // Optional: Scales your app by 4
                    max_memory_restart: '100M'   // Optional: Restarts your app if it reaches 100Mo
                }, function (err, apps) {
                    pm2.disconnect();   // Disconnects from PM2
                    if (err) throw err
                });
            });
    });

program.parse(process.argv);

// Check the program.args obj
let NO_COMMAND_SPECIFIED = program.args.length === 0;

// Handle it however you like
if (NO_COMMAND_SPECIFIED) {
    // e.g. display usage
    program.help();
}
