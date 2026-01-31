import * as vscode from "vscode";
import { estimateCursorTokens, formatTokenCount } from "../core/tokens";
import { TOKENS_DANGER, TOKENS_WARN } from "./constants";

export interface StatusBarDeps {
  getTextForEstimate: () => string | null;
}

export class TokenMeterStatusBar {
  private readonly item: vscode.StatusBarItem;
  private updateTimer: NodeJS.Timeout | undefined;

  constructor(private readonly deps: StatusBarDeps) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.command = "cursorTokenSaver.showQuickPick";
    this.item.tooltip = "Click to prepare context for Cursor AI";
  }

  dispose(): void {
    if (this.updateTimer) clearTimeout(this.updateTimer);
    this.item.dispose();
  }

  show(): void {
    this.item.show();
    this.updateSoon();
  }

  updateSoon(): void {
    if (this.updateTimer) clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => this.updateNow(), 120);
  }

  updateNow(): void {
    const text = this.deps.getTextForEstimate();
    if (text === null) {
      this.item.text = "$(zap) Cursor: —";
      this.item.color = undefined;
      return;
    }

    const estimate = estimateCursorTokens(text);
    const n = estimate.tokens;
    const pretty = formatTokenCount(n);

    if (n >= TOKENS_DANGER) {
      this.item.text = `$(error) Cursor: ${pretty}`;
      this.item.color = new vscode.ThemeColor("statusBarItem.errorForeground");
      this.item.tooltip = `~${n} tokens (approx). Click to prepare token-efficient context.`;
      return;
    }

    if (n >= TOKENS_WARN) {
      this.item.text = `$(warning) Cursor: ${pretty}`;
      this.item.color = new vscode.ThemeColor("statusBarItem.warningForeground");
      this.item.tooltip = `~${n} tokens (approx). Click to prepare token-efficient context.`;
      return;
    }

    this.item.text = `$(zap) Cursor: ${pretty}`;
    this.item.color = undefined;
    this.item.tooltip = `~${n} tokens (approx). Click to prepare token-efficient context.`;
  }
}
