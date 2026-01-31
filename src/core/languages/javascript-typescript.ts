import type { LanguageSupport } from "../language-support";
import { elideJsTsFunctionBodies } from "../js-elide";

export const javascriptTypescriptSupport: LanguageSupport = {
  id: "javascript-typescript",
  vscodeLanguageIds: ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  compress(input: string) {
    const { output, didElide } = elideJsTsFunctionBodies(input);
    if (didElide) {
      return { output, notes: ["Function bodies removed"] };
    }
    return {
      output: input,
      notes: ["No compression applied (nothing obvious to elide)"],
    };
  },
};
