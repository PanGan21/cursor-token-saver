import type { LanguageSupport } from "../language-support";
import { javascriptTypescriptSupport } from "./javascript-typescript";
import { rustSupport } from "./rust";

const ALL_SUPPORTS: readonly LanguageSupport[] = [javascriptTypescriptSupport, rustSupport];

export function getLanguageSupport(languageId: string): LanguageSupport | undefined {
  return ALL_SUPPORTS.find((s) => s.vscodeLanguageIds.includes(languageId));
}

export function listSupportedLanguageIds(): string[] {
  const set = new Set<string>();
  for (const s of ALL_SUPPORTS) {
    for (const id of s.vscodeLanguageIds) set.add(id);
  }
  return [...set].sort();
}
