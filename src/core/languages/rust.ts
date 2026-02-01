import type { LanguageSupport } from "../language-support";
import { elideRustFunctionBodies } from "../rust-elide";

export const rustSupport: LanguageSupport = {
  id: "rust",
  vscodeLanguageIds: ["rust"],
  compress(input: string) {
    const { output, didElide } = elideRustFunctionBodies(input);
    if (didElide) {
      return { output, notes: ["Function bodies removed"] };
    }
    return { output: input, notes: ["No compression applied (nothing obvious to elide)"] };
  },
};
