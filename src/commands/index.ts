import { Command, FileUtils, path, walkSync } from "../../deps.ts";


const indexCommand = new Command()
  .description("Creates index of json files in a directory")
  .action((options: any) => {
    const files = [];
    const currentPath = path.toFileUrl(Deno.cwd());
    for (const file of walkSync(currentPath,
      {
        maxDepth: 5,
        includeDirs: false,
        exts: [".json"],
        skip: [/node_modules/]
      })) {
      files.push(path.toFileUrl(file.path).pathname.replace(currentPath.pathname, ''));
    }
    FileUtils.writeTextFileSync(
      "./folder-index.json",
      JSON.stringify(files, null, 2)
    );
    console.log(`Indexed ${files.length} files in ./folder-index.json`);
  });

export default indexCommand;
