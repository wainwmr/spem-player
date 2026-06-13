import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const CONTRIBUTING_PATH = resolve(
  process.cwd(),
  "..",
  "..",
  "doc",
  "CONTRIBUTING.md"
);

describe("CONTRIBUTING.md", () => {
  it("does not contain the obsolete Tracked Generated Files section", () => {
    const content = readFileSync(CONTRIBUTING_PATH, "utf-8");

    expect(content).not.toContain("### Tracked Generated Files");
    expect(content).not.toContain("git update-index --skip-worktree");
    expect(content).not.toContain("src/ohmjs/ly-grammar.ohm-bundle.js");
    expect(content).not.toContain("src/ohmjs/ly-grammar.ohm-bundle.d.ts");
  });
});
