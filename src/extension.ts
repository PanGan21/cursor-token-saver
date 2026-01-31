import * as vscode from "vscode";
import { execFileSync } from "node:child_process";

import { getActiveContext } from "./commands/active-context";
import { estimateCursorTokens, formatTokenCount } from "./core/tokens";
import { getGitDiffForFile } from "./core/git";
import { prepareContextForAI } from "./core/prepare";
import type { PrepareMode } from "./core/types";
import { TOKENS_DECISION_THRESHOLD, TOKENS_DANGER } from "./ui/constants";
import { showActionsQuickPick } from "./ui/quick-pick";
import { TokenMeterStatusBar } from "./ui/status-bar";
import type { ExecFileSync } from "./core/git";

let statusBar: TokenMeterStatusBar | undefined;

function showNoEditor(): void {
  void vscode.window.showWarningMessage("No active editor found.");
}

function copyPreparedResult(result: { preparedText: string; originalTokens: { tokens: number }; preparedTokens: { tokens: number } }): Thenable<void> {
  const from = formatTokenCount(result.originalTokens.tokens);
  const to = formatTokenCount(result.preparedTokens.tokens);
  const isHuge = result.preparedTokens.tokens >= TOKENS_DANGER;

  return vscode.env.clipboard.writeText(result.preparedText).then(() => {
    if (isHuge) {
      void vscode.window.showWarningMessage(`Cursor context prepared (${from} → ${to}) and copied to clipboard. Large context may reduce answer quality.`);
    } else {
      void vscode.window.showInformationMessage(`Cursor context prepared (${from} → ${to}) and copied to clipboard.`);
    }
  });
}

async function chooseLargeContextMode(tokens: number): Promise<PrepareMode | null> {
  const pretty = formatTokenCount(tokens);
  const picked = await vscode.window.showQuickPick(
    [
      {
        label: "Compress code (remove implementations)",
        description: "Best default; preserves APIs, drops big bodies",
        mode: "compress" as const,
      },
      {
        label: "Use git diff only",
        description: "Only changed lines (requires git repo)",
        mode: "diff" as const,
      },
      {
        label: "Keep context unchanged",
        description: "No token savings",
        mode: "keep" as const,
      },
    ],
    {
      title: "Prepare Context for Cursor AI",
      placeHolder: `This context is ~${pretty} tokens. How should Cursor see it?`,
    }
  );

  return picked?.mode ?? null;
}

async function runPrepare(mode: PrepareMode, opts?: { forceAskOnLarge?: boolean }): Promise<void> {
  const ctx = getActiveContext();
  if (!ctx) return showNoEditor();

  const tokenEstimate = estimateCursorTokens(ctx.text);
  const shouldAsk = opts?.forceAskOnLarge !== false && tokenEstimate.tokens >= TOKENS_DECISION_THRESHOLD;

  let finalMode = mode;
  if (mode === "compress" && shouldAsk) {
    const chosen = await chooseLargeContextMode(tokenEstimate.tokens);
    if (!chosen) return;
    finalMode = chosen;
  }

  if (finalMode === "diff") {
    if (!ctx.filePath) {
      return void vscode.window.showWarningMessage("Diff-only context requires a file on disk.");
    }

    const execFileSyncImpl: ExecFileSync = (file, args, options) =>
      execFileSync(file, args as unknown as string[], options);

    const diffRes = getGitDiffForFile({
      filePath: ctx.filePath,
      cwd: ctx.cwdForGit,
      execFileSyncImpl,
    });

    if (diffRes.kind === "no-repo") {
      return void vscode.window.showWarningMessage("No git repository detected — diff mode unavailable.");
    }
    if (diffRes.kind === "no-changes") {
      return void vscode.window.showInformationMessage("No git diff for this file (no unstaged changes).");
    }
    if (diffRes.kind === "error") {
      return void vscode.window.showErrorMessage(`Failed to get git diff: ${diffRes.message}`);
    }

    const result = prepareContextForAI({
      text: ctx.text,
      diffText: diffRes.diff,
      options: { mode: "diff", languageId: ctx.languageId, fileName: ctx.fileName },
    });

    await copyPreparedResult(result);
    statusBar?.updateSoon();
    return;
  }

  const result = prepareContextForAI({
    text: ctx.text,
    options: { mode: finalMode, languageId: ctx.languageId, fileName: ctx.fileName },
  });

  await copyPreparedResult(result);
  statusBar?.updateSoon();
}

export function activate(context: vscode.ExtensionContext): void {
  statusBar = new TokenMeterStatusBar({
    getTextForEstimate: () => {
      const ctx = getActiveContext();
      return ctx?.text ?? null;
    },
  });
  statusBar.show();
  context.subscriptions.push(statusBar);

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => statusBar?.updateSoon()),
    vscode.window.onDidChangeTextEditorSelection(() => statusBar?.updateSoon()),
    vscode.workspace.onDidChangeTextDocument(() => statusBar?.updateSoon())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("cursorTokenSaver.showQuickPick", async () => {
      await showActionsQuickPick();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("cursorTokenSaver.prepareContextForAI", async () => {
      // Smart default: compress, but ask if huge.
      await runPrepare("compress");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("cursorTokenSaver.compressSelectionForAI", async () => {
      await runPrepare("compress", { forceAskOnLarge: false });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("cursorTokenSaver.copyDiffOnlyContext", async () => {
      await runPrepare("diff", { forceAskOnLarge: false });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("cursorTokenSaver.estimateTokens", async () => {
      const ctx = getActiveContext();
      if (!ctx) return showNoEditor();
      const estimate = estimateCursorTokens(ctx.text);
      await vscode.window.showInformationMessage(`Estimated tokens: ~${formatTokenCount(estimate.tokens)} (${estimate.model})`);
    })
  );
}

export function deactivate(): void {
  // no-op; subscriptions dispose automatically
}
