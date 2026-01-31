type ScanMode = "code" | "lineComment" | "blockComment" | "single" | "double" | "template";

function findMatchingBrace(text: string, openIndex: number): number | null {
  if (text[openIndex] !== "{") return null;

  let depth = 1;
  let mode: ScanMode = "code";
  const templateReturnDepthStack: number[] = [];

  for (let i = openIndex + 1; i < text.length; i++) {
    const ch = text[i]!;
    const next = i + 1 < text.length ? text[i + 1]! : "";

    if (mode === "lineComment") {
      if (ch === "\n") mode = "code";
      continue;
    }

    if (mode === "blockComment") {
      if (ch === "*" && next === "/") {
        mode = "code";
        i++;
      }
      continue;
    }

    if (mode === "single") {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === "'") mode = "code";
      continue;
    }

    if (mode === "double") {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === '"') mode = "code";
      continue;
    }

    if (mode === "template") {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === "`") {
        mode = "code";
        continue;
      }

      // Enter a `${ ... }` expression inside the template.
      if (ch === "$" && next === "{") {
        depth++;
        templateReturnDepthStack.push(depth);
        mode = "code";
        i++; // skip '{'
      }
      continue;
    }

    // mode === "code"
    if (ch === "/" && next === "/") {
      mode = "lineComment";
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      mode = "blockComment";
      i++;
      continue;
    }
    if (ch === "'") {
      mode = "single";
      continue;
    }
    if (ch === '"') {
      mode = "double";
      continue;
    }
    if (ch === "`") {
      mode = "template";
      continue;
    }

    if (ch === "{") {
      depth++;
      continue;
    }

    if (ch === "}") {
      depth--;

      // If we just closed a `${ ... }` inside a template literal, return to template mode.
      const top = templateReturnDepthStack[templateReturnDepthStack.length - 1];
      if (top !== undefined && depth === top - 1) {
        templateReturnDepthStack.pop();
        mode = "template";
        continue;
      }

      if (depth === 0) return i;
    }
  }

  return null;
}

function getLineIndentation(text: string, index: number): string {
  const lastNewline = text.lastIndexOf("\n", index);
  const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
  const prefix = text.slice(lineStart, index);
  const match = prefix.match(/^\s*/);
  return match ? match[0] : "";
}

function replaceBlockWithOmitted(text: string, openIndex: number, closeIndex: number): string {
  const indent = getLineIndentation(text, openIndex);
  const innerIndent = indent + "  ";

  const replacement = `{\n${innerIndent}/* implementation omitted */\n${indent}}`;
  return text.slice(0, openIndex) + replacement + text.slice(closeIndex + 1);
}

function looksWorthEliding(text: string, openIndex: number, closeIndex: number): boolean {
  const body = text.slice(openIndex + 1, closeIndex);
  const nonWs = body.replace(/\s+/g, "");
  if (nonWs.length < 40) return false;
  const lines = body.split("\n").length;
  return lines >= 3 || body.length >= 200;
}

function findNextNonWs(text: string, from: number): number {
  for (let i = from; i < text.length; i++) {
    const ch = text[i]!;
    if (!/\s/.test(ch)) return i;
  }
  return -1;
}

export interface ElideResult {
  output: string;
  didElide: boolean;
}

export function elideJsTsFunctionBodies(input: string): ElideResult {
  // Find a conservative set of candidate block starts: `function ... {` and `=> {`
  const candidates: Array<{ open: number; close: number }> = [];

  // `function ... {`
  const fnRe = /\bfunction\b/g;
  for (;;) {
    const match = fnRe.exec(input);
    if (!match) break;
    const start = match.index;
    const brace = input.indexOf("{", start);
    if (brace === -1) continue;
    if (brace - start > 250) continue; // probably not a function
    const close = findMatchingBrace(input, brace);
    if (close === null) continue;
    if (!looksWorthEliding(input, brace, close)) continue;
    candidates.push({ open: brace, close });
  }

  // `=> {`
  const arrowRe = /=>/g;
  for (;;) {
    const match = arrowRe.exec(input);
    if (!match) break;
    const after = findNextNonWs(input, match.index + match[0].length);
    if (after === -1) continue;
    if (input[after] !== "{") continue;
    const close = findMatchingBrace(input, after);
    if (close === null) continue;
    if (!looksWorthEliding(input, after, close)) continue;
    candidates.push({ open: after, close });
  }

  if (candidates.length === 0) return { output: input, didElide: false };

  // Deduplicate + avoid overlaps (apply from end to start).
  candidates.sort((a, b) => b.open - a.open);
  const filtered: Array<{ open: number; close: number }> = [];
  let lastStart = Number.POSITIVE_INFINITY;

  for (const c of candidates) {
    if (c.close >= lastStart) continue; // overlaps a previously kept replacement
    filtered.push(c);
    lastStart = c.open;
  }

  let output = input;
  for (const c of filtered) {
    output = replaceBlockWithOmitted(output, c.open, c.close);
  }

  return { output, didElide: output !== input };
}
