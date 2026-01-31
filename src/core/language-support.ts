export interface CompressResult {
  output: string;
  notes: string[];
}

/**
 * Base "trait" for adding language-specific support.
 *
 * - Map VS Code `languageId` -> this implementation via `vscodeLanguageIds`
 * - Perform language-aware compression in `compress()`
 *
 * Future languages (e.g. Rust, Go, JSON, etc.) should implement this interface.
 */
export interface LanguageSupport {
  /**
   * Stable identifier for this support module (not a VS Code languageId).
   * Example: "javascript-typescript"
   */
  readonly id: string;

  /**
   * VS Code languageIds supported by this module.
   * Examples: "typescript", "javascriptreact", ...
   */
  readonly vscodeLanguageIds: readonly string[];

  /**
   * Optional: override the markdown fence language.
   * By default we use the VS Code languageId.
   */
  readonly fenceLanguageId?: string;

  compress(input: string): CompressResult;
}

export class UnsupportedLanguageError extends Error {
  public readonly languageId: string;

  constructor(languageId: string) {
    super(
      `Unsupported languageId "${languageId}". ` + `No language support is registered for it yet.`,
    );
    this.name = "UnsupportedLanguageError";
    this.languageId = languageId;
  }
}
