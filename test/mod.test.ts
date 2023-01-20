import { assertEquals, describe, it } from "../test.deps.ts";

describe({
  name: "cli",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: () => {
    it("#cli version", async () => {
      const p = Deno.run({
        cmd: ["cmd", "/c", "justaos", "--version"],
        stdout: "piped",
        stderr: "piped"
      });
      const status = await p.output();
      const output = new TextDecoder().decode(status);
      assertEquals(output.includes("justaos"), true);
      p.close();
    });
  }
});

