import { Command } from "https://deno.land/x/cliffy@v0.24.2/command/mod.ts";
import newCommand from "./src/commands/new.ts";
import indexCommand from "./src/commands/index.ts";
import runCommand from "./src/commands/run.ts";

await new Command()
  .description(`
    A command line utility for managing your JUSTAOS platform and applications.
  `)
  .version("1.0.0")
  .name("justaos")
  .command("new", newCommand)
  .command("run", runCommand)
  .command("index", indexCommand)
  .parse(Deno.args);
/*
deno install -f -A -n justaos mod.ts
 */
