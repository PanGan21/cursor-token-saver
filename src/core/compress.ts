import { elideJsTsFunctionBodies } from "./js-elide";

export interface CompressResult {
  output: string;
  notes: string[];
}

const JS_TS_LANGUAGE_IDS = new Set([
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact",
]);

export function compressForCursorAI(input: string, languageId: string): CompressResult {
  if (!JS_TS_LANGUAGE_IDS.has(languageId)) {
    return { output: input, notes: ["No compression applied (language not supported yet)"] };
  }

  const { output, didElide } = elideJsTsFunctionBodies(input);
  if (didElide) {
    return { output, notes: ["Function bodies removed"] };
  }

  return { output: input, notes: ["No compression applied (nothing obvious to elide)"] };
}
