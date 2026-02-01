type ScanMode = "code" | "lineComment" | "blockComment" | "string" | "rawString";

function isIdentChar(ch: string): boolean {
  return /[A-Za-z0-9_]/.test(ch);
}

function isBoundary(text: string, i: number): boolean {
  const prev = i > 0 ? (text[i - 1] ?? "") : "";
  const next = i < text.length ? (text[i] ?? "") : "";
  return !isIdentChar(prev) && isIdentChar(next);
}

function findMatchingBraceRust(text: string, openIndex: number): number | null {
  if (text[openIndex] !== "{") return null;

  let depth = 1;
  let mode: ScanMode = "code";
  let rawHashCount = 0;

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

    if (mode === "string") {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === '"') mode = "code";
      continue;
    }

    if (mode === "rawString") {
      if (ch !== '"') continue;

      // raw string ends with: "### (hashCount times)
      let ok = true;
      for (let k = 0; k < rawHashCount; k++) {
        if (i + 1 + k >= text.length || text[i + 1 + k] !== "#") {
          ok = false;
          break;
        }
      }
      if (ok) {
        mode = "code";
        i += rawHashCount; // consume hashes
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

    // normal string
    if (ch === '"') {
      mode = "string";
      continue;
    }

    // raw string prefixes: r###"..."###, br###"..."###, rb###"..."###
    if (ch === "r" || ch === "b") {
      const start = i;
      let j = i;

      // optional leading 'b'
      if (text[j] === "b") j++;
      // optional 'r' (required for raw strings)
      if (j < text.length && text[j] === "r") j++;
      else if (text[i] === "r") j = i + 1;

      // only proceed if we saw an 'r' in the prefix
      const sawR = text.slice(start, j).includes("r");
      if (!sawR) continue;

      // count hashes
      let hashCount = 0;
      while (j < text.length && text[j] === "#") {
        hashCount++;
        j++;
      }
      if (j < text.length && text[j] === '"') {
        mode = "rawString";
        rawHashCount = hashCount;
        i = j; // positioned at '"', rawString handler will consume
        continue;
      }
    }

    if (ch === "{") {
      depth++;
      continue;
    }

    if (ch === "}") {
      depth--;
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
  const innerIndent = indent + "    ";
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

export interface ElideResult {
  output: string;
  didElide: boolean;
}

function findFunctionBodyOpenBrace(text: string, fnIndex: number): number | null {
  let mode: ScanMode = "code";
  let rawHashCount = 0;
  let parenDepth = 0;
  let bracketDepth = 0;

  for (let i = fnIndex; i < text.length; i++) {
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
    if (mode === "string") {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === '"') mode = "code";
      continue;
    }
    if (mode === "rawString") {
      if (ch !== '"') continue;
      let ok = true;
      for (let k = 0; k < rawHashCount; k++) {
        if (i + 1 + k >= text.length || text[i + 1 + k] !== "#") {
          ok = false;
          break;
        }
      }
      if (ok) {
        mode = "code";
        i += rawHashCount;
      }
      continue;
    }

    // code
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
    if (ch === '"') {
      mode = "string";
      continue;
    }
    if (ch === "r" || ch === "b") {
      const start = i;
      let j = i;
      if (text[j] === "b") j++;
      if (j < text.length && text[j] === "r") j++;
      else if (text[i] === "r") j = i + 1;
      const sawR = text.slice(start, j).includes("r");
      if (!sawR) continue;
      let hashCount = 0;
      while (j < text.length && text[j] === "#") {
        hashCount++;
        j++;
      }
      if (j < text.length && text[j] === '"') {
        mode = "rawString";
        rawHashCount = hashCount;
        i = j;
        continue;
      }
    }

    if (ch === "(") parenDepth++;
    else if (ch === ")") parenDepth = Math.max(0, parenDepth - 1);
    else if (ch === "[") bracketDepth++;
    else if (ch === "]") bracketDepth = Math.max(0, bracketDepth - 1);

    if (parenDepth === 0 && bracketDepth === 0) {
      if (ch === "{") return i;
      if (ch === ";") return null; // trait/extern declaration without body
    }
  }

  return null;
}

export function elideRustFunctionBodies(input: string): ElideResult {
  const candidates: Array<{ open: number; close: number }> = [];

  // Scan for `fn` tokens. This avoids false matches in identifiers like `define`.
  for (let i = 0; i < input.length - 1; i++) {
    if (!isBoundary(input, i)) continue;
    if (input[i] !== "f" || input[i + 1] !== "n") continue;
    if (i + 2 < input.length && isIdentChar(input[i + 2]!)) continue;

    const brace = findFunctionBodyOpenBrace(input, i + 2);
    if (brace === null) continue;
    const close = findMatchingBraceRust(input, brace);
    if (close === null) continue;
    if (!looksWorthEliding(input, brace, close)) continue;
    candidates.push({ open: brace, close });
  }

  if (candidates.length === 0) return { output: input, didElide: false };

  candidates.sort((a, b) => b.open - a.open);
  const filtered: Array<{ open: number; close: number }> = [];
  let lastStart = Number.POSITIVE_INFINITY;
  for (const c of candidates) {
    if (c.close >= lastStart) continue;
    filtered.push(c);
    lastStart = c.open;
  }

  let output = input;
  for (const c of filtered) {
    output = replaceBlockWithOmitted(output, c.open, c.close);
  }

  return { output, didElide: output !== input };
}
