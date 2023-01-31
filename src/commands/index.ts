import { Command, FileUtils, path, walkSync } from "../../deps.ts";


const indexCommand = new Command()
  .description("Creates index of json files in a directory")
  .action((options: any) => {
    const files = [];
    for (const file of walkSync("./",
      {
        maxDepth: 5,
        includeDirs: false,
        exts: [".json"],
        skip: [/node_modules/]
      })) {
      files.push("\\" + path.normalize(file.path).replace(Deno.cwd(), ""));
    }
    FileUtils.writeTextFileSync(
      "./folder-index.json",
      JSON.stringify(files, null, 2)
    );
    console.log(`Indexed ${files.length} files in ./folder-index.json`);
  });

export default indexCommand;
