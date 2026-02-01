# Cursor Token Saver

Prepare **token-efficient context** for Cursor AI: see token estimates, compress context, and copy a Cursor-friendly snippet to your clipboard.

> Cursor does **not** currently allow extensions to intercept AI requests. This is a **human-in-the-loop** context prep tool (manual paste into chat).

## Features

- **Selection-aware**: commands operate on the current **selection** (if any), otherwise the **entire file**.
- **Status bar token meter**: shows an approximate token estimate for your current context.
- **Quick pick menu**: click the status bar (or run the command) to choose an action.
- **Language-aware compression**: for supported languages, removes implementations while keeping APIs/structure.
- **Two copy formats**:
  - **Prepared context (wrapped)**: includes notes + token estimate + fenced code blocks (ready to paste into chat).
  - **Prepared content (raw)**: only the core payload (no wrapper).
- **Diff-only option**: can copy `git diff` (when available) instead of full code.

## Usage

- **Status bar**: click the `Cursor: …` token meter to open actions.
- **Command palette**: search “Cursor:” and run any command below.

## Commands (what each one does)

- **Cursor: Show Token Saver Actions**
  - Opens the Quick Pick menu (same as clicking the status bar).

- **Cursor: Prepare Context for AI**
  - **Default behavior**: prepares context in **compress** mode and copies **prepared context (wrapped)** to clipboard.
  - **If context is large**: asks you to choose one:
    - **Compress code**: language-aware implementation elision (supported languages only).
    - **Use git diff only**: uses `git diff` output instead of full context (requires a file on disk + git repo).
    - **Keep unchanged**: no compression, just wrap + copy.

- **Cursor: Copy Prepared Context**
  - One-click: **compress + copy prepared context (wrapped)**.
  - **No large-context prompt** (always proceeds).

- **Cursor: Copy Raw Prepared Content**
  - One-click: **compress + copy prepared content (raw)**.
  - Copies only the compressed payload (no notes/header/fences).

- **Cursor: Prepare Context from Files**
  - Pick **multiple files** from your workspace.
  - Compresses each file (supported languages only).
  - Copies **one combined prepared context (wrapped)** to clipboard, with per-file sections like:
    - `#### File: \`path/to/file\` (\`languageId\`)`
    - a fenced code block per file.

- **Cursor: Copy Raw Prepared Content from Files**
  - Pick **multiple files** from your workspace.
  - Compresses each file (supported languages only).
  - Copies **raw prepared content** with simple separators:
    - `--- path/to/file (languageId) ---`
    - followed by the compressed content.

- **Cursor: Compress Selection for AI**
  - Compresses your current context and copies **prepared context (wrapped)**.
  - Note: today this is effectively the same behavior as **Cursor: Copy Prepared Context** (selection-aware).

- **Cursor: Copy Diff-Only Context**
  - Copies a **wrapped** snippet whose payload is `git diff` for the active file (unstaged changes).
  - If there’s no git repo, no file on disk, or no changes, it shows a message instead of copying.

- **Cursor: Estimate Tokens**
  - Shows an informational toast with the approximate token count for your current context.

## Workflow

```text
Open file / select code
  ↓
See token estimate in status bar
  ↓
Pick action (Compress / Diff / Keep)
  ↓
Context prepared + copied to clipboard
  ↓
Paste into Cursor Chat
```

## Install / Uninstall

- **Try it (recommended)**: open this repo in Cursor/VS Code and press `F5` (Extension Development Host).
- **Install from VSIX**:
  - `npm install && npm run build && npm run package`
  - Extensions view → `...` → **Install from VSIX…** → select `cursor-token-saver-*.vsix`
- **Uninstall**: Extensions view → search **Cursor Token Saver** → gear icon → **Uninstall**

## Development

```bash
npm install
npm run format
npm run lint
npm test
```

## Extending language support

Add a new language by implementing `LanguageSupport` (`src/core/language-support.ts`) in `src/core/languages/` and registering it in `src/core/languages/registry.ts`.

In **compress mode**, unsupported languages throw `UnsupportedLanguageError` (so adding JSON and other formats later stays clean).

Currently registered: **JavaScript/TypeScript**, **Rust** and **Markdown**.

## License

MIT — see [`LICENSE`](LICENSE).
