import * as path from "path";
import * as fs from "fs";
import {copySync, readJsonFileSync, writeJsonFileSync} from "@plt4rm/utils";
import {CWD_PATH, PROJECT_PATH} from "./constants";
import {PRINT_COLORS, printBox} from "./utils";
import * as shell from "shelljs";
// @ts-ignore
import * as NpmApi from "npm-api";

const npm = new NpmApi();

export default class P4RMCLI {

    static createNewProject(projectName: string) {
        const projectFolder = path.normalize(CWD_PATH + "/" + projectName);
        if (fs.existsSync(projectFolder)) {
            console.error(`Folder "./${projectName}" already exists, please choose a different project name.`);
        } else {
            copySync(PROJECT_PATH, projectFolder);
            const packageJson = readJsonFileSync(PROJECT_PATH + "/package.json")
            const plt4rmRep = npm.repo("@plt4rm/plt4rm");
            plt4rmRep.package()
                .then(function (pkg: any) {
                    packageJson.dependencies["@plt4rm/plt4rm"] = pkg.version;
                    writeJsonFileSync(projectFolder + '/package.json', packageJson);
                    printBox(PRINT_COLORS.FgGreen, [
                        "Project file created",
                        "Installing dependencies"
                    ]);

                    shell.cd(projectFolder);
                    shell.exec('npm install', function () {
                        printBox(PRINT_COLORS.FgGreen, [
                            "Successfully initialized the project",
                            "Happy coding!"
                        ]);
                    });
                }, function (err: Error) {
                    console.error(err);
                });
        }
    }

    static run() {
        const {Platform} = require(CWD_PATH + "/node_modules/@p4rm/p4rm");
        new Platform(CWD_PATH).run();
    }

}



