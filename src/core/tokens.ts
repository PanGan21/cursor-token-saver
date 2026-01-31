import type { TokenEstimate } from "./types";

const CHARS_PER_TOKEN_APPROX = 3.7;

export function estimateCursorTokens(text: string): TokenEstimate {
  // Transparent + stable heuristic; Cursor can swap models, so we keep it approximate.
  const tokens = Math.max(0, Math.ceil(text.length / CHARS_PER_TOKEN_APPROX));
  return { tokens, model: "cursor-approx", confidence: "low" };
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}m`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return `${tokens}`;
}
