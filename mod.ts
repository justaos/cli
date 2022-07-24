import { Command } from "https://deno.land/x/cliffy@v0.24.2/command/mod.ts";
import newCommand from './src/commands/new.ts';
import indexCommand from './src/commands/index.ts';



await new Command()
  .description(`
    A command line utility for managing your JUSTAOS platform and applications.
  `)
  .version("1.0.0")
  .name("justaos")
  .command("new", newCommand)
  .command("index", indexCommand)
  .parse(Deno.args);
/*
deno install -f --allow-net --allow-read -n justaos mod.ts
 */
