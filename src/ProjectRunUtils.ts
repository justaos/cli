import * as path from 'path';
import { CWD_PATH, OS_PACKAGE_NAME } from './constants';
import * as fs from 'fs';
import * as pm2 from 'pm2';


export default class ProjectRunUtils {

  projectFolder: string = CWD_PATH;

  constructor() {

  }

  isProjectFolder() {
    const projectJsonPath = path.normalize(this.projectFolder + "/package.json");
    return fs.existsSync(projectJsonPath);
  }

  start() {
    const OS = require(this.projectFolder + "/node_modules/" + OS_PACKAGE_NAME);
    new OS.default(this.projectFolder).run();
  }


  startProjectAsService() {
    pm2.connect(function (err) {
      if (err) {
        console.error(err);
        process.exit(2);
      }

      pm2.start({
        script: __dirname + '/../lib/app.js',         // Script to be run
        cwd: CWD_PATH,
        exec_mode: 'cluster',        // Allows your app to be clustered
        instances: 1,                // Optional: Scales your app by 4
        max_memory_restart: '100M'   // Optional: Restarts your app if it reaches 100Mo
      }, function (err, apps) {
        pm2.disconnect();   // Disconnects from PM2
        if (err) throw err
      });
    });
  }


}