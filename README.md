# Cursor Token Saver

Prepare **token-efficient context** for Cursor AI: see token estimates, compress context, and copy a Cursor-friendly snippet to your clipboard.

> Cursor does **not** currently allow extensions to intercept AI requests. This is a **human-in-the-loop** context prep tool (manual paste into chat).

## Features

- **Status bar token meter**: estimate tokens for selection (or full file).
- **Quick pick actions**: click the status bar to choose what to do.
- **Clipboard output**: notes + token estimate + fenced code block.
- **Diff-only context**: copy `git diff` when available.

## Usage

- **Status bar**: click `Cursor: …`
- **Command palette**:
  - `Cursor: Prepare Context for AI` (asks only when context is large)
  - `Cursor: Compress Selection for AI`
  - `Cursor: Copy Diff-Only Context`
  - `Cursor: Estimate Tokens`

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
  - Extensions view → `...` → **Install from VSIX…** → select `cursor-token-saver-0.1.0.vsix`
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

## License

MIT — see [`LICENSE`](LICENSE).
