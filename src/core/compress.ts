import type { CompressResult, LanguageSupport } from "./language-support";
import { UnsupportedLanguageError } from "./language-support";
import { getLanguageSupport } from "./languages/registry";

export type { CompressResult, LanguageSupport };
export { UnsupportedLanguageError };

export function compressForCursorAI(input: string, languageId: string): CompressResult {
  const support = getLanguageSupport(languageId);
  if (!support) throw new UnsupportedLanguageError(languageId);
  return support.compress(input);
}
