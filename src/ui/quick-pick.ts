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
        label: "Copy Prepared Context",
        description: "One-click: copy wrapped context to clipboard",
        command: "cursorTokenSaver.copyPreparedContext",
      },
      {
        label: "Copy Raw Prepared Content",
        description: "One-click: copy raw compressed content (no wrapper)",
        command: "cursorTokenSaver.copyRawPreparedContent",
      },
      {
        label: "Prepare Context from Files",
        description: "Pick multiple files and copy combined context",
        command: "cursorTokenSaver.prepareContextFromFiles",
      },
      {
        label: "Copy Raw Prepared Content from Files",
        description: "Pick multiple files and copy raw prepared content",
        command: "cursorTokenSaver.copyRawPreparedContentFromFiles",
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
    },
  );

  if (!picked) return;
  await vscode.commands.executeCommand(picked.command);
}
