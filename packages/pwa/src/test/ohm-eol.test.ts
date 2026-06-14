import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

/**
 * Guards the `.gitattributes` rule that pins `*.ohm` to LF on checkout (#611).
 *
 * Without it, a Windows checkout (e.g. with `core.autocrlf=true`) writes
 * `ly-grammar.ohm` with CRLF, and `build:ohm` bakes those endings into the
 * `source` literal of `ly-grammar.ohm-bundle.js` (as the escaped sequence
 * `\r\n`, since Ohm embeds the grammar via `JSON.stringify`), giving a phantom
 * diff on every Windows build (see doc/BUILD.md). CI is Linux/LF and never
 * exhibits it, so these two checks are the cross-platform guard: case 1 asserts
 * the root-cause rule is present; case 2 checks the committed bundle's literal
 * for a baked `\r\n` escape (the bundle file's own line endings are already LF
 * via the pre-existing `*.js` rule, so case 2 guards the literal's content, not
 * the file).
 *
 * Reads are relative to the pwa package cwd, matching grammar-consistency.test.ts.
 */
describe("ohm grammar line-ending hygiene (#611)", () => {
  it(".gitattributes pins *.ohm to eol=lf", () => {
    const attrs = readFileSync("../../.gitattributes", "utf-8");
    const ohmRule = attrs
      .split(/\r?\n/)
      .find((line) => /^\s*\*\.ohm\b/.test(line));
    expect(
      ohmRule,
      "no `*.ohm` rule in .gitattributes, so Windows `build:ohm` bakes CRLF into the grammar bundle (#611)"
    ).toBeTruthy();
    expect(ohmRule, "the `*.ohm` rule must pin `eol=lf`").toMatch(/eol=lf/);
  });

  it("the grammar bundle has no baked-in CRLF escape", () => {
    const bundle = readFileSync("src/ohmjs/ly-grammar.ohm-bundle.js", "utf-8");
    // A CRLF-checked-out grammar is baked into the `source` literal as the
    // escaped sequence \r\n (the characters backslash-r-backslash-n), never a
    // raw CR byte, so search for the escape, not for a raw "\r".
    expect(
      bundle.includes("\\r\\n"),
      "ly-grammar.ohm-bundle.js has a \\r\\n escape in its source literal; a CRLF .ohm was baked in (#611)"
    ).toBe(false);
  });
});
