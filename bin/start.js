#!/usr/bin/env node
const program = require("commander");
const {Plt4rmCLI, VERSION} = require("../index");

program.version(VERSION, '-v, --version');

program.command('new <name>')
    .description('Creates a new workspace and sets plt4rm configuration values in the config.json file for the workspace.')
    .action(function (name) {
        Plt4rmCLI.createNewProject(name);
    });

program.command('run')
    .description('Builds and serves your project as a service.')
    .action(function () {
        Plt4rmCLI.run();
    });

program.parse(process.argv);

// Check the program.args obj
let NO_COMMAND_SPECIFIED = program.args.length === 0;

// Handle it however you like
if (NO_COMMAND_SPECIFIED) {
    // e.g. display usage
    program.help();
}
