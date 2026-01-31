export type PrepareMode = "compress" | "diff" | "keep";

export type TokenModel = "cursor-approx";

export interface TokenEstimate {
  tokens: number;
  model: TokenModel;
  confidence: "low";
}

export interface PreparedContext {
  mode: PrepareMode;
  originalText: string;
  preparedText: string;
  originalTokens: TokenEstimate;
  preparedTokens: TokenEstimate;
  notes: string[];
  languageIdForFence: string;
}

export interface PrepareOptions {
  mode: PrepareMode;
  languageId: string;
  fileName?: string;
}
