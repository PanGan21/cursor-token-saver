import { UnsupportedLanguageError } from "./compress";
import { estimateCursorTokens } from "./tokens";
import { getLanguageSupport } from "./languages/registry";
import type { TokenEstimate } from "./types";
import { formatTokenCount } from "./tokens";

export interface FileInput {
  fileName: string;
  languageId: string;
  text: string;
}

export interface PreparedFileSection {
  fileName: string;
  languageId: string;
  fenceLanguageId: string;
  notes: string[];
  content: string;
}

export interface PrepareMultiResult {
  originalTokens: TokenEstimate;
  preparedTokens: TokenEstimate;
  notes: string[];
  preparedText: string;
}

export function prepareContextFromFilesForAI(params: {
  files: FileInput[];
  mode: "compress" | "keep";
}): PrepareMultiResult {
  const files = params.files;
  if (files.length === 0) {
    return {
      originalTokens: estimateCursorTokens(""),
      preparedTokens: estimateCursorTokens(""),
      notes: ["No files selected"],
      preparedText: "### Cursor Context (Prepared)\n\nNotes:\n- No files selected\n",
    };
  }

  const originalCombined = files.map((f) => f.text).join("\n\n");
  const originalTokens = estimateCursorTokens(originalCombined);

  const sections: PreparedFileSection[] = files.map((f) => {
    if (params.mode === "keep") {
      return {
        fileName: f.fileName,
        languageId: f.languageId,
        fenceLanguageId: f.languageId || "txt",
        notes: ["Context kept unchanged"],
        content: f.text,
      };
    }

    const support = getLanguageSupport(f.languageId);
    if (!support) throw new UnsupportedLanguageError(f.languageId);

    const compressed = support.compress(f.text);
    return {
      fileName: f.fileName,
      languageId: f.languageId,
      fenceLanguageId: support.fenceLanguageId ?? f.languageId,
      notes: compressed.notes,
      content: compressed.output,
    };
  });

  const preparedContentOnly = sections.map((s) => s.content).join("\n\n");
  const preparedTokens = estimateCursorTokens(preparedContentOnly);

  const notes: string[] = [];
  if (params.mode === "compress") notes.push("Files compressed (language-aware)");
  if (params.mode === "keep") notes.push("Files kept unchanged");

  const preparedText = wrapManyForCursorChat({
    sections,
    notes,
    tokenEstimate: preparedTokens,
  });

  return { originalTokens, preparedTokens, notes, preparedText };
}

function safeMd(text: string): string {
  return text.replace(/[ \t]+$/gm, "").trimEnd();
}

function wrapManyForCursorChat(params: {
  sections: PreparedFileSection[];
  notes: string[];
  tokenEstimate: TokenEstimate;
}): string {
  const tokenLine = `Token estimate: ~${formatTokenCount(params.tokenEstimate.tokens)} (${params.tokenEstimate.model})`;
  const notesBlock =
    params.notes.length > 0 ? `Notes:\n- ${params.notes.join("\n- ")}\n` : "Notes:\n- (none)\n";

  const fileCountLine = `Files: ${params.sections.length}\n`;

  const body = params.sections
    .map((s) => {
      const sectionNotes = s.notes.length > 0 ? `- ${s.notes.join("\n- ")}\n` : "- (none)\n";
      const content = safeMd(s.content);
      return (
        `#### File: \`${s.fileName}\` (\`${s.languageId}\`)\n\n` +
        `Section notes:\n${sectionNotes}\n` +
        `\`\`\`${s.fenceLanguageId}\n${content}\n\`\`\`\n`
      );
    })
    .join("\n");

  return `### Cursor Context (Prepared)\n\n${fileCountLine}\n${notesBlock}${tokenLine}\n\n${body}`;
}
