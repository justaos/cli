import * as path from "path";

const ROOT_PATH = path.normalize(__dirname + '/..');

const programName = path.basename(process.argv[1]);

let CWD_PATH: string;

const SAMPLE_PATH =  path.normalize(__dirname + '/../resources/sample');

if (programName === 'anysols.js' || programName === 'anysols') {
    CWD_PATH = process.cwd(); // current working directory
} else {
    CWD_PATH = SAMPLE_PATH;
}

export {
    ROOT_PATH,
    CWD_PATH,
    SAMPLE_PATH
}
