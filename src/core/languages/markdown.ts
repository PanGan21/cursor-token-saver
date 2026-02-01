import type { LanguageSupport } from "../language-support";
import { elideMarkdownFencedCodeBlocks } from "../markdown-elide";

export const markdownSupport: LanguageSupport = {
  id: "markdown",
  vscodeLanguageIds: ["markdown", "mdx"],
  fenceLanguageId: "markdown",
  compress(input: string) {
    const res = elideMarkdownFencedCodeBlocks(input, { maxInnerLinesToKeep: 20 });

    const notes: string[] = [];
    if (res.didElide) {
      notes.push(
        `Markdown: elided ${res.elidedBlocks} large code block(s) (${res.elidedLines} line(s))`,
      );
    } else {
      notes.push("Markdown: no large code blocks to elide");
    }

    return { output: res.output, notes };
  },
};
