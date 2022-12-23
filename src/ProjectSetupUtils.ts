import { FileUtils, path } from "../deps.ts";

export default class ProjectSetupUtils {
  projectName: string;

  constructor(projectName: string) {
    this.projectName = projectName;
  }

  isProjectAlreadyExist() {
    return FileUtils.existsSync(this.#getProjectFolderPath());
  }

  async extractProjectFiles() {
    FileUtils.mkdirSync(this.#getProjectFolderPath());
    await FileUtils.unZipFromURL(
      new URL("https://codeload.github.com/justaos/setup/zip/refs/tags/latest"),
      this.#getProjectFolderPath(),
    );
    const unzipFolder = path.normalize(
      this.#getProjectFolderPath() + "/setup-latest",
    );
    FileUtils.copySync(unzipFolder, this.#getProjectFolderPath(), {
      overwrite: true,
    });
    await FileUtils.remove(this.#getProjectFolderPath() + "/setup-latest", {
      recursive: true,
    });
  }

  #getProjectFolderPath() {
    return path.normalize(`${Deno.cwd()}/${this.projectName}`);
  }
}
