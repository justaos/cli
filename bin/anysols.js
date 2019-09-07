#!/usr/bin/env node
const Anysols = require("../lib").default;
const program = require('commander');
const fs = require('fs');

program
    .version('1.3.0', '-v, --version');

program.command('setup')
    .description('Setup the platform')
    .action(function () {
        const files = fs.readdirSync(process.cwd());
        if (!files.length)
            Anysols.projectSetup();
        else
            throw new Error("Folder should be empty to create project.")
    });

program.command('run')
    .description('Run the platform')
    .action(function () {
        const anysols = new Anysols();
        anysols.run();
    });

program.parse(process.argv);

// Check the program.args obj
let NO_COMMAND_SPECIFIED = program.args.length === 0;

// Handle it however you like
if (NO_COMMAND_SPECIFIED) {
    // e.g. display usage
    program.help();
}
