import * as path from 'path';

const ROOT_PATH = path.normalize(__dirname + '/..');

const PLATFORM_PACKAGE_NAME = '@p4/platform';

const programName = path.basename(process.argv[1]);

let CWD_PATH: string;

if (programName === 'playground') {
  CWD_PATH = path.normalize(ROOT_PATH + '/resources/playground');
} else {
  CWD_PATH = process.cwd(); // current working directory
}

console.log('CWD :: ' + CWD_PATH);


export {
  ROOT_PATH,
  CWD_PATH,
  PLATFORM_PACKAGE_NAME
};
