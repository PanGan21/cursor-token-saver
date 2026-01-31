import type { TokenEstimate } from "./types";
import { formatTokenCount } from "./tokens";

function safeMd(text: string): string {
  // Keep it simple (v0.1): just trim trailing whitespace.
  return text.replace(/[ \t]+$/gm, "").trimEnd();
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

  return `### ${title}${fileLine}\n${notesBlock}${tokenLine}\n\n\`\`\`${input.languageIdForFence}\n${body}\n\`\`\`\n`;
}
