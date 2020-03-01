import * as path from "path";
import * as fs from "fs";
import {copySync, writeFileSync, writeJsonFileSync} from "@plt4rm/utils";
import {CWD_PATH, PROJECT_PATH} from "./constants";
import {PRINT_COLORS, printBox} from "./utils";
import * as shell from "shelljs";
// @ts-ignore
import * as NpmApi from "npm-api";

const npm = new NpmApi();
let packageJson = {
    "name": "project",
    "version": "1.0.0",
    "description": "plt4rm's project",
    "dependencies": {
        "@plt4rm/plt4rm": ""
    },
    "scripts": {
        "start": "plt4rm run"
    },
    "plt4rm": {
        "loggerLevel": "info",
        "services": {
            "database": {
                "host": "localhost",
                "port": "27017",
                "database": "plt4rm",
                "dialect": "mongodb"
            },
            "server": {
                "port": 8080,
                "paths": {
                    "assets": "assets",
                    "views": "views"
                },
                "pages": {
                    "404": "404",
                    "500": "500"
                }
            }
        },
        "programs": ["@plt4rm/core", "@plt4rm/user-management", "@plt4rm/security"]
    },

};

export default class Plt4rmCLI {

    static createNewProject(projectName: string) {
        const projectFolder = path.normalize(CWD_PATH + "/" + projectName);
        if (fs.existsSync(projectFolder)) {
            console.error(`Folder "./${projectName}" already exists, please choose a different project name.`);
        } else {
            copySync(PROJECT_PATH, projectFolder);
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
        const {Plt4rm} = require(CWD_PATH + "/node_modules/@plt4rm/plt4rm");
        new Plt4rm(CWD_PATH).run();
    }

}



