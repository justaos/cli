import * as path from "path";
import {readJsonFileSync} from "@plt4rm/utils";

const ROOT_PATH = path.normalize(__dirname + '/..');
const PROJECT_PATH =  path.normalize(ROOT_PATH + '/resources/project');
const PLAYGROUND_PATH =  path.normalize(ROOT_PATH + '/resources/playground');

const programName = path.basename(process.argv[1]);

let CWD_PATH: string;

if (programName === 'start.js' || programName === 'plt4rm') {
    CWD_PATH = process.cwd(); // current working directory
} else {
    CWD_PATH = PLAYGROUND_PATH;
}

const packageJson: any = readJsonFileSync(path.normalize(ROOT_PATH + "/package.json"), null);
const PACKAGE_NAME = packageJson.name;
const VERSION = packageJson.version;

export {
    ROOT_PATH,
    CWD_PATH,
    PROJECT_PATH,
    PACKAGE_NAME,
    VERSION
};
