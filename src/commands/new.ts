import ProjectSetupUtils from "../ProjectSetupUtils.ts";
import { PRINT_COLORS, printBox } from "../utils.ts";

import { Command, wait } from "../../deps.ts";

const newCommand = new Command()
  .arguments("<name:string>")
  .description(
    "Creates a new project and sets platform configuration in the config.json file",
  )
  .action(async (options: any, name: string) => {
    const psUtils = new ProjectSetupUtils(name);
    if (!psUtils.isProjectAlreadyExist()) {
      const spinner = wait("Creating new project").start();
      spinner.text = "Downloading and extracting project files from zip";
      await psUtils.extractProjectFiles();

      spinner.succeed("Project created successfully");

      printBox(PRINT_COLORS.FgGreen, [
        "Successfully initialized the project",
        "Please update platform configuration under config.json",
        "Happy coding!",
      ]);
    } else {
      printBox(PRINT_COLORS.FgRed, [
        `Folder "./${name}" already exists, please choose a different name.`,
      ]);
    }
  });

export default newCommand;
