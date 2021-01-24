import * as path from 'path';
import * as fs from 'fs';
import FileUtils from '@p4rm/file-utils';
import { CWD_PATH, PROJECT_PATH } from './constants';
import { getLatestPackageJson, PRINT_COLORS, printBox } from './utils';
import * as shell from 'shelljs';


export default class P4RMCLI {

  static createNewProject(projectName: string) {
    const projectFolder = path.normalize(CWD_PATH + '/' + projectName);
    if (!fs.existsSync(projectFolder)) {
      FileUtils.copySync(PROJECT_PATH, projectFolder);
      const packageJson = FileUtils.readJsonFileSync(PROJECT_PATH + '/package.json');
      getLatestPackageJson('@p4rm/p4rm').then(function(pkg: any) {
        packageJson.dependencies['@plt4rm/plt4rm'] = pkg.version;
        FileUtils.writeJsonFileSync(projectFolder + '/package.json', packageJson);
        printBox(PRINT_COLORS.FgGreen, [
          'Project file created',
          'Installing dependencies'
        ]);

        shell.cd(projectFolder);
        shell.exec('npm install', function() {
          printBox(PRINT_COLORS.FgGreen, [
            'Successfully initialized the project',
            'Happy coding!'
          ]);
        });
      }, function(err: Error) {
        console.error(err);
      });
    } else
      console.error(`Folder "./${projectName}" already exists, please choose a different project name.`);
  }

  static run() {
    const { Platform } = require(CWD_PATH + '/node_modules/@p4rm/p4rm');
    new Platform(CWD_PATH).run();
  }

}



