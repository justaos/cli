const p = Deno.run({
  cmd: ["cmd", "/c", "justaos", "--version"],
});
const status = await p.status();
