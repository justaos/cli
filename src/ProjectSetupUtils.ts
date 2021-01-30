import * as path from 'path';
import { CWD_PATH } from './constants';
import * as fs from 'fs';
import * as https from 'https';
import * as extract from 'extract-zip';
import * as shell from 'shelljs';
import FileUtils from '@p4rm/file-utils';
import { PRINT_COLORS, printBox } from './utils';


export default class ProjectSetupUtils {

  projectName: string;
  projectFolder: string;

  constructor(projectName: string) {
    this.projectName = projectName;
    this.projectFolder = path.normalize(CWD_PATH + '/' + projectName);
  }

  isProjectAlreadyExist() {
    return fs.existsSync(this.projectFolder);
  }

  downloadAndExtractProjectFiles(callback: any) {
    fs.mkdirSync(this.projectFolder);
    const setupZipFilePath = path.normalize(this.projectFolder + '/setup.zip');
    const setupZipFile = fs.createWriteStream(setupZipFilePath);
    https.get('https://p4rm.com/store/setup.zip', (response) => {
      response.pipe(setupZipFile);
      extract(setupZipFilePath, { dir: this.projectFolder }).then(() => {
        callback();
      });
    });
  }

  placeAuthToken(authToken: string) {
    const npmrcPath = path.normalize(this.projectFolder + "/.npmrc");
    let file = FileUtils.readFileSync(npmrcPath, 'utf8').toString();
    file = file.replace("{{P4RM_NPM_TOKEN}}", authToken);
    FileUtils.writeFileSync(npmrcPath, file);
  }

  installDependencies(callback: any) {
    shell.cd(this.projectFolder);
    shell.exec('npm install', () => {
      callback();
      printBox(PRINT_COLORS.FgGreen, [
        'Successfully initialized the project',
        'Please update config under package.json',
        'Happy coding!'
      ]);
    });
  }

}