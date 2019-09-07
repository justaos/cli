"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const rootPath = path.normalize(__dirname + '/..');
exports.rootPath = rootPath;
const programName = path.basename(process.argv[1]);
let cwdPath;
exports.cwdPath = cwdPath;
if (programName === 'anysols.js' || programName === 'anysols') {
    exports.cwdPath = cwdPath = process.cwd(); // current working directory
}
else {
    exports.cwdPath = cwdPath = path.normalize(__dirname + '/../example');
}
