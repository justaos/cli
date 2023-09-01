/*const p = Deno.run({
  cmd: ["cmd", "/c", "justaos", "--version"],
});
const status = await p.status();*/


import { walkSync } from "https://deno.land/std@0.198.0/fs/walk.ts";
import * as path from "https://deno.land/std@0.198.0/path/mod.ts";

const currentPath = new URL('.', import.meta.url);
for (const file of walkSync(currentPath,
  {
    maxDepth: 5,
    includeDirs: false,
    exts: [".json"],
    skip: [/node_modules/]
  })) {
  console.log(path.toFileUrl(file.path).pathname.replace(currentPath.pathname, ''));
}
