import { PRINT_COLORS, printBox } from "../utils.ts";
import ProjectRunUtils from "../ProjectRunUtils.ts";
import { Command } from "../../deps.ts";

const runCommand = new Command()
  .description("Runs the project")
  .action(async (options: any) => {
    const prUtils = new ProjectRunUtils();
    if (prUtils.isProjectFolder()) {
      prUtils.start();
    } else {
      printBox(PRINT_COLORS.FgRed, [
        `Please run the command in project folder`,
      ]);
    }
  });

export default runCommand;
