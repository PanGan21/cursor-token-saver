export interface MarkdownElideResult {
  output: string;
  didElide: boolean;
  elidedBlocks: number;
  elidedLines: number;
}

/**
 * Elide large fenced code blocks in Markdown.
 *
 * This is intentionally conservative:
 * - Only touches fenced blocks started by ``` or ~~~
 * - Keeps small blocks unchanged
 * - Replaces large block bodies with a short placeholder while preserving the fence and info string
 *
 * Why: Markdown often contains huge embedded code blocks; in "compress" mode we prefer keeping
 * the surrounding explanation while reducing token usage.
 */
export function elideMarkdownFencedCodeBlocks(
  input: string,
  opts?: {
    /**
     * If a fenced block has more than this many inner lines, it will be elided.
     * Default: 20
     */
    maxInnerLinesToKeep?: number;
  },
): MarkdownElideResult {
  const maxKeep = opts?.maxInnerLinesToKeep ?? 20;
  const lines = input.split(/\r?\n/);

  let didElide = false;
  let elidedBlocks = 0;
  let elidedLines = 0;

  const out: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    // Fence start: ```lang or ~~~lang (3+ is valid in markdown, but we keep it simple and accept 3+).
    const fenceStartMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (!fenceStartMatch) {
      out.push(line);
      i += 1;
      continue;
    }

    const indent = fenceStartMatch[1] ?? "";
    const fence = fenceStartMatch[2] ?? "```";
    const fenceChar = fence[0] ?? "`";
    const fenceLen = fence.length;
    const _info = (fenceStartMatch[3] ?? "").trimEnd();
    void _info;

    // Find the matching closing fence (same char, length >= opening length).
    const body: string[] = [];
    let j = i + 1;
    let foundClose = false;
    for (; j < lines.length; j += 1) {
      const l = lines[j] ?? "";
      const close = l.match(new RegExp(`^(\\s*)(${fenceChar}{${fenceLen},})\\s*$`));
      if (close) {
        foundClose = true;
        break;
      }
      body.push(l);
    }

    // If we can't find the close fence, treat as normal text.
    if (!foundClose) {
      out.push(line);
      i += 1;
      continue;
    }

    const innerLines = body.length;
    if (innerLines <= maxKeep) {
      // Keep block as-is.
      out.push(line, ...body, lines[j] ?? "");
      i = j + 1;
      continue;
    }

    // Elide the body.
    didElide = true;
    elidedBlocks += 1;
    elidedLines += innerLines;

    const placeholder =
      innerLines === 1
        ? `<!-- code omitted (1 line) -->`
        : `<!-- code omitted (${innerLines} lines) -->`;

    out.push(line, `${indent}${placeholder}`, lines[j] ?? "");
    i = j + 1;
  }

  const output = out.join("\n");
  return { output, didElide, elidedBlocks, elidedLines };
}
