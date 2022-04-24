import { Command, Flags } from '@oclif/core';
import ProjectSetupUtils from '../ProjectSetupUtils';
import * as ora from 'ora';
import { PRINT_COLORS, printBox } from '../utils';
import * as inquirer from 'inquirer';

export default class New extends Command {
  static description = 'Creates a new project and sets platform configuration in the package.json -> config property';

  static examples = [
    `$ justaos new my-first-project`
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    // flag with no value (-f, --force)
    force: Flags.boolean({ char: 'f' })
  };

  static args = [
    {
      name: 'name',               // name of arg to show in help and reference with args[name]
      required: true,            // make the arg required with `required: true`
      description: 'Project name', // help description
      hidden: false              // hide this arg from help
    }
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(New);
    const questions: inquirer.QuestionCollection<any> = [];

    const psUtils = new ProjectSetupUtils(args.name);
    if (!psUtils.isProjectAlreadyExist()) {
      inquirer.prompt(questions).then((answers) => {
        const spinner = ora('Creating new project').start();
        spinner.spinner = 'dots';
        spinner.text = 'Downloading project resources';
        psUtils.downloadSetupZip(() => {
          spinner.text = 'Extracting project files from zip';
          psUtils.extractProjectFiles(() => {
            spinner.text = 'Installing dependencies';
            psUtils.installDependencies(() => {
              spinner.stop();
            });
          });
        });
      });
    } else {
      printBox(PRINT_COLORS.FgRed, [`Folder "./${args.name}" already exists, please choose a different name.`]);
    }
  }
}
