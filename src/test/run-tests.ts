import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, "..", "..");
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");

    // Use short temp paths to avoid IPC socket path length issues / cleanup crashes.
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cursor-token-saver-"));
    const userDataDir = path.join(tmpRoot, "u");
    const extensionsDir = path.join(tmpRoot, "e");
    fs.mkdirSync(userDataDir, { recursive: true });
    fs.mkdirSync(extensionsDir, { recursive: true });

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ["--user-data-dir", userDataDir, "--extensions-dir", extensionsDir],
    });
  } catch (err) {
    console.error("Failed to run tests");
    console.error(err);
    process.exit(1);
  }
}

void main();
