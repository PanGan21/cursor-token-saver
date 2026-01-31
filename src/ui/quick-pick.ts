import * as vscode from "vscode";

export async function showActionsQuickPick(): Promise<void> {
  const picked = await vscode.window.showQuickPick(
    [
      {
        label: "Prepare Context for AI",
        description: "Smart: asks only if context is large",
        command: "cursorTokenSaver.prepareContextForAI",
      },
      {
        label: "Compress Selection for AI",
        description: "Remove JS/TS implementations (heuristic)",
        command: "cursorTokenSaver.compressSelectionForAI",
      },
      {
        label: "Copy Diff-Only Context",
        description: "Git required: sends only changed lines",
        command: "cursorTokenSaver.copyDiffOnlyContext",
      },
      {
        label: "Estimate Tokens",
        description: "Show token estimate for current selection/file",
        command: "cursorTokenSaver.estimateTokens",
      },
    ],
    {
      title: "Cursor Token Saver",
      placeHolder: "Choose an action",
    }
  );

  if (!picked) return;
  await vscode.commands.executeCommand(picked.command);
}
