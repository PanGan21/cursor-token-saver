import path from "node:path";
import type { ExecFileSyncOptions } from "node:child_process";

export type ExecFileSync = (
  file: string,
  args: readonly string[],
  options: ExecFileSyncOptions & { encoding: "utf8" }
) => string;

export type GitDiffResult =
  | { kind: "ok"; diff: string; repoRoot: string }
  | { kind: "no-repo" }
  | { kind: "no-changes" }
  | { kind: "error"; message: string };

export function getGitDiffForFile(params: {
  filePath: string;
  cwd: string;
  execFileSyncImpl: ExecFileSync;
}): GitDiffResult {
  const { filePath, cwd, execFileSyncImpl } = params;

  let repoRoot: string;
  try {
    repoRoot = execFileSyncImpl("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8" }).trim();
    if (!repoRoot) return { kind: "no-repo" };
  } catch {
    return { kind: "no-repo" };
  }

  const rel = path.relative(repoRoot, filePath);
  try {
    const diff = execFileSyncImpl("git", ["diff", "--unified=3", "--", rel], { cwd: repoRoot, encoding: "utf8" });
    if (!diff.trim()) return { kind: "no-changes" };
    return { kind: "ok", diff, repoRoot };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { kind: "error", message: msg };
  }
}
