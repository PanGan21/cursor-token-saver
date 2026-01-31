import type { PrepareOptions, PreparedContext } from "./types";
import { UnsupportedLanguageError } from "./compress";
import { getLanguageSupport } from "./languages/registry";
import { estimateCursorTokens } from "./tokens";
import { wrapForCursorChat } from "./wrap";

export interface PrepareInputs {
  text: string;
  options: PrepareOptions;
  diffText?: string;
}

export function prepareContextForAI(input: PrepareInputs): PreparedContext {
  const originalText = input.text;
  const originalTokens = estimateCursorTokens(originalText);

  let preparedContent = originalText;
  const notes: string[] = [];
  let fenceLang = input.options.languageId || "txt";

  if (input.options.mode === "compress") {
    const support = getLanguageSupport(input.options.languageId);
    if (!support) throw new UnsupportedLanguageError(input.options.languageId);

    const compressed = support.compress(originalText);
    preparedContent = compressed.output;
    notes.push(...compressed.notes);
    fenceLang = support.fenceLanguageId ?? fenceLang;
  } else if (input.options.mode === "diff") {
    if (!input.diffText) {
      throw new Error("Diff mode requested but no diff text was provided.");
    }
    preparedContent = input.diffText;
    fenceLang = "diff";
    notes.push("Diff-only context used");
  } else if (input.options.mode === "keep") {
    notes.push("Context kept unchanged");
  } else {
    const exhaustive: never = input.options.mode;
    throw new Error(`Unsupported mode: ${exhaustive}`);
  }

  const preparedTokens = estimateCursorTokens(preparedContent);
  const preparedText = wrapForCursorChat({
    fileName: input.options.fileName,
    notes,
    tokenEstimate: preparedTokens,
    languageIdForFence: fenceLang,
    content: preparedContent,
  });

  return {
    mode: input.options.mode,
    originalText,
    preparedText,
    originalTokens,
    preparedTokens,
    notes,
    languageIdForFence: fenceLang,
  };
}
