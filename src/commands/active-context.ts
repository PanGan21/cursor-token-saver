import * as vscode from "vscode";
import path from "node:path";

export interface ActiveContext {
  editor: vscode.TextEditor;
  text: string;
  languageId: string;
  fileName?: string;
  filePath?: string;
  cwdForGit: string;
}

export function getActiveContext(): ActiveContext | null {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return null;

  const doc = editor.document;
  const text = editor.selection.isEmpty ? doc.getText() : doc.getText(editor.selection);

  const filePath = doc.uri.scheme === "file" ? doc.uri.fsPath : undefined;
  const fileName = filePath ? path.basename(filePath) : undefined;

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
  const cwdForGit =
    workspaceFolder?.uri.fsPath ?? (filePath ? path.dirname(filePath) : process.cwd());

  return {
    editor,
    text,
    languageId: doc.languageId,
    fileName,
    filePath,
    cwdForGit,
  };
}
