#!/usr/bin/env node
/**
 * The entry point CI runs for the app-version guard (ticket #810).
 *
 * This file exists so `version-check.mjs` can be imported by its tests without
 * running, WITHOUT the module needing to ask "was I invoked directly?". That question
 * used to be answered by comparing `process.argv[1]` against `import.meta.url`
 * (realpath'd on both sides, after a symlinked-checkout bug). It was a fail-OPEN guard
 * on a fail-CLOSED tool: had the comparison ever returned false in CI, `main()` would
 * simply not have run, the process would have exited 0, and the check would have been a
 * silent no-op on every PR forever. A separate entry file cannot fail that way. There
 * is no condition to get wrong.
 */
import { main } from "./version-check.mjs";

let code;
try {
  code = main();
} catch (e) {
  // An uncaught throw would exit 1, and 1 is reserved for "the version is wrong". A
  // crash is not a version violation; report it as one the contributor cannot fix.
  console.error(`version-check: crashed: ${e?.stack || e}`);
  code = 2;
}
// `process.exitCode`, never `process.exit()`: stdout to a pipe (which is what an
// Actions step gives us) is async, and `process.exit()` terminates without draining it,
// so the verdict we just printed could be thrown away and the guard would blame nothing.
process.exitCode = code;
