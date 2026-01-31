import fs from "node:fs";
import path from "node:path";
import Mocha from "mocha";

export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
    timeout: 10_000,
  });

  const testsRoot = __dirname;
  for (const entry of fs.readdirSync(testsRoot)) {
    if (!entry.endsWith(".test.js")) continue;
    mocha.addFile(path.join(testsRoot, entry));
  }

  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) reject(new Error(`${failures} tests failed.`));
      else resolve();
    });
  });
}
