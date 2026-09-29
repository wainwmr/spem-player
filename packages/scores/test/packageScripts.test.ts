import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Guard against re-introducing a shell-expansion glob in a package script
// (#763). `test:integration` once used `vitest run test/*.integration.test.ts`,
// which relies on the shell expanding the glob. Windows cmd (which pnpm uses to
// run scripts) does not, so vitest received the literal pattern and found no
// tests. #597 fixed it with a vitest substring filter; #600's package move
// silently reverted it. Vitest matches a bareword filter against file paths
// itself, so the substring form works cross-platform.
describe("package.json scripts are Windows-safe (#763)", () => {
  const pkg = JSON.parse(
    readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"),
      "utf-8"
    )
  ) as { scripts: Record<string, string> };

  it("test:integration discovers files via a vitest filter, not a shell glob", () => {
    const script = pkg.scripts["test:integration"];
    // An unquoted `dir/*.ext` token relies on shell expansion; assert there is
    // no such bareword glob in the command.
    expect(script).not.toMatch(/\s[^\s"']*\*[^\s"']*/);
  });
});
