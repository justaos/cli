import { expandGlobSync } from 'https://deno.land/std@0.95.0/fs/mod.ts';
import { Command } from 'https://deno.land/x/cliffy@v0.24.2/command/command.ts';
import * as path from "https://deno.land/std@0.57.0/path/mod.ts";
import FileUtils from 'https://raw.githubusercontent.com/justaos/utils/1.2.1/file-utils/mod.ts';

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));

const indexCommand = new Command()
  .description("Creates index of json files in a directory")
  .action((options: any) => {
    const files = [];
    for (const file of expandGlobSync('**/*.json')) {
      files.push(path.normalize(file.path).replace(Deno.cwd(), ''));
    }
    FileUtils.writeTextFileSync('./folder-index.json', JSON.stringify(files, null, 2));
    console.log(`Indexed ${files.length} files in ./folder-index.json`);
  });

export default indexCommand;
