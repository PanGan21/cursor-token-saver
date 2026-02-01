import type { TokenEstimate } from "./types";
import { formatTokenCount } from "./tokens";

function safeMd(text: string): string {
  // Keep it simple (v0.1): just trim trailing whitespace.
  return text.replace(/[ \t]+$/gm, "").trimEnd();
}

function maxConsecutiveBackticks(text: string): number {
  let max = 0;
  const re = /`+/g;
  for (;;) {
    const m = re.exec(text);
    if (!m) break;
    max = Math.max(max, m[0]?.length ?? 0);
  }
  return max;
}

function chooseFenceForContent(content: string): string {
  // If content already contains triple backticks (common in markdown), use 4+.
  const maxTicks = maxConsecutiveBackticks(content);
  const n = Math.max(3, maxTicks + 1);
  return "`".repeat(n);
}

export function buildFencedBlock(languageId: string, content: string): string {
  const fence = chooseFenceForContent(content);
  return `${fence}${languageId}\n${content}\n${fence}\n`;
}

export interface WrapInput {
  title?: string;
  fileName?: string;
  notes: string[];
  tokenEstimate: TokenEstimate;
  languageIdForFence: string;
  content: string;
}

export function wrapForCursorChat(input: WrapInput): string {
  const title = input.title ?? "Cursor Context (Prepared)";
  const fileLine = input.fileName ? `\nFile: \`${input.fileName}\`\n` : "\n";
  const notesBlock =
    input.notes.length > 0 ? `Notes:\n- ${input.notes.join("\n- ")}\n` : "Notes:\n- (none)\n";
  const tokenLine = `Token estimate: ~${formatTokenCount(input.tokenEstimate.tokens)} (${input.tokenEstimate.model})`;
  const body = safeMd(input.content);

  const fenced = buildFencedBlock(input.languageIdForFence, body);
  return `### ${title}${fileLine}\n${notesBlock}${tokenLine}\n\n${fenced}`;
}
