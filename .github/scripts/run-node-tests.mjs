// Runs the .github/scripts `node:test` suites, failing loudly if the glob
// matches nothing. `node --test "<glob>"` on a zero-match glob exits 0 (Node 24),
// which would let the required `test` job pass having run no script tests — the
// exact false-green #564 was created to close (a required check that tested
// nothing). Guard the zero-match here, then delegate to the runner.
import { globSync } from "node:fs";
import { spawnSync } from "node:child_process";

const PATTERN = ".github/scripts/*.test.mjs";

const files = globSync(PATTERN);
if (files.length === 0) {
  console.error(
    `test:scripts: no files matched ${PATTERN} — refusing to pass vacuously (#564).`,
  );
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
});
if (result.error) {
  console.error(`test:scripts: failed to launch node --test: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
