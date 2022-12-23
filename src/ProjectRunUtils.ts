import { FileUtils, path } from "../deps.ts";
import { PRINT_COLORS, printBox } from "./utils.ts";

export default class ProjectRunUtils {
  constructor() {
  }

  isProjectFolder() {
    return FileUtils.existsSync(this.#getConfigPath());
  }

  #getConfigPath() {
    return path.normalize(`${Deno.cwd()}/config.json`);
  }

  async start() {
    const config = this.#getConfig();
    if (config["main"]) {
      console.log(`Running project using os ${config["main"]}`);
      let OS;
      try {
        OS = await import(config["main"]);
      } catch (e) {
        console.error(e);
        console.error("Please check the version in config.json.");
        Deno.exit(1);
      }
      console.log(OS)
      new OS.default(Deno.cwd()).run();
    } else {
      printBox(PRINT_COLORS.FgRed, [
        `Please update 'main' to point to os module config.json`,
      ]);
    }
  }

  #getConfig() {
    return FileUtils.readJsonFileSync(this.#getConfigPath());
  }
}
