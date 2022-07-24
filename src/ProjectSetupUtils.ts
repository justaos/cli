import * as path from 'path';
import { CWD_PATH } from './constants.ts';
import * as fs from 'fs';
import * as https from 'https';
import * as extract from 'extract-zip';
import * as shell from 'shelljs';
import FileUtils from '../deps.ts';
import { PRINT_COLORS, printBox } from './utils.ts';


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

  downloadSetupZip(callback: any) {
    fs.mkdirSync(this.projectFolder);
    const setupZipFilePath = path.normalize(this.projectFolder + '/setup.zip');
    const setupZipFile = fs.createWriteStream(setupZipFilePath);
    https.get('https://codeload.github.com/justaos/setup/zip/refs/tags/latest', (response) => {
      response.pipe(setupZipFile);
      setupZipFile.on('finish', () => {
        setupZipFile.close();
        callback();
      });
    });
  }

  extractProjectFiles(callback: any) {
    const setupZipFilePath = path.normalize(this.projectFolder + '/setup.zip');
    extract(setupZipFilePath, { dir: path.normalize(this.projectFolder) }).then(() => {
      const unzipFolder = path.normalize(this.projectFolder + "/setup-latest");
      FileUtils.copySync(unzipFolder, path.normalize(this.projectFolder));
      FileUtils.delete(setupZipFilePath);
      FileUtils.delete(unzipFolder);
      callback();
    }, function(err) {
      console.log(err);
    });
  }

  placeAuthToken(authToken: string) {
    const npmrcPath = path.normalize(this.projectFolder + '/.npmrc');
    let file = FileUtils.readFileSync(npmrcPath, 'utf8').toString();
    file = file.replace('{{P4RM_NPM_TOKEN}}', authToken);
    FileUtils.writeFileSync(npmrcPath, file);
  }

  installDependencies(callback: any) {
    shell.cd(this.projectFolder);
    shell.exec('npm ci', () => {
      callback();
      printBox(PRINT_COLORS.FgGreen, [
        'Successfully initialized the project',
        'Please update config under package.json',
        'Happy coding!'
      ]);
    });
  }

}
