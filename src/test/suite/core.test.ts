import assert from "node:assert";

import { estimateCursorTokens, formatTokenCount } from "../../core/tokens";
import { elideJsTsFunctionBodies } from "../../core/js-elide";
import { prepareContextForAI } from "../../core/prepare";
import { UnsupportedLanguageError } from "../../core/compress";

suite("core", () => {
  test("estimateCursorTokens is stable and non-negative", () => {
    assert.deepStrictEqual(estimateCursorTokens(""), {
      tokens: 0,
      model: "cursor-approx",
      confidence: "low",
    });

    const big = estimateCursorTokens("a".repeat(37));
    assert.strictEqual(big.model, "cursor-approx");
    assert.strictEqual(big.confidence, "low");
    assert.ok(big.tokens >= 9 && big.tokens <= 11);
  });

  test("formatTokenCount", () => {
    assert.strictEqual(formatTokenCount(0), "0");
    assert.strictEqual(formatTokenCount(999), "999");
    assert.strictEqual(formatTokenCount(1_000), "1.0k");
    assert.strictEqual(formatTokenCount(12_600), "12.6k");
    assert.strictEqual(formatTokenCount(1_000_000), "1.0m");
  });

  test("elideJsTsFunctionBodies elides function bodies but keeps signatures", () => {
    const input = `
export function fetchUser(id: string): User {
  const x = "{ not a brace }";
  // something
  return db.get(id);
}
`;
    const res = elideJsTsFunctionBodies(input);
    assert.ok(res.didElide);
    assert.match(res.output, /export function fetchUser/);
    assert.match(res.output, /implementation omitted/);
    assert.ok(!res.output.includes("db.get"));
  });

  test("elideJsTsFunctionBodies handles template strings with ${...}", () => {
    const input = `
const f = () => {
  const s = \`hello \${(() => { return "{ still fine }"; })()}\`;
  return s;
};
`;
    const res = elideJsTsFunctionBodies(input);
    assert.ok(res.didElide);
    assert.ok(res.output.includes("const f = () =>"));
    assert.ok(res.output.includes("implementation omitted"));
  });

  test("prepareContextForAI wraps output for cursor chat", () => {
    const input = `function x(){\n  return 1;\n}\n`;
    const res = prepareContextForAI({
      text: input,
      options: { mode: "compress", languageId: "typescript", fileName: "a.ts" },
    });

    assert.ok(res.preparedText.includes("### Cursor Context (Prepared)"));
    assert.ok(res.preparedText.includes("Notes:"));
    assert.ok(res.preparedText.includes("Token estimate: ~"));
    assert.ok(res.preparedText.includes("```typescript"));
  });

  test("prepareContextForAI throws on unsupported language in compress mode", () => {
    assert.throws(
      () =>
        prepareContextForAI({
          text: "print('hi')\n",
          options: { mode: "compress", languageId: "python", fileName: "a.py" },
        }),
      (err: unknown) => err instanceof UnsupportedLanguageError && err.languageId === "python",
    );
  });
});
