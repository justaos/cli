import * as path from "path";

const rootPath = path.normalize(__dirname + '/..');

const programName = path.basename(process.argv[1]);

let cwdPath: string;

if (programName === 'anysols.js' || programName === 'anysols') {
    cwdPath = process.cwd(); // current working directory
} else {
    cwdPath = path.normalize(__dirname + '/../example');
}


export {
    rootPath,
    cwdPath
}
