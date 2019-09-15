import * as path from "path";

const ROOT_PATH = path.normalize(__dirname + '/..');

const programName = path.basename(process.argv[1]);

let CWD_PATH: string;

if (programName === 'anysols.js' || programName === 'anysols') {
    CWD_PATH = process.cwd(); // current working directory
} else {
    CWD_PATH = path.normalize(__dirname + '/../example');
}


export {
    ROOT_PATH,
    CWD_PATH
}
