// Normalise the Ohm grammar to LF before `npx ohm generateBundles`, so a worktree
// that still holds a CRLF `ly-grammar.ohm` cannot bake `\r\n` into the bundle's
// embedded `source` literal (#648, a recurrence of #611). `.gitattributes`
// (`*.ohm text eol=lf`) only fixes *fresh* checkouts; an existing CRLF working
// copy reads clean against the LF blob and `git checkout --` never rewrites it,
// so the build itself must be the guard.
//
// Every Node API is imported (not used as a global) so the file lints clean
// under the baseline `no-undef` with no node-globals config, matching
// `eslint.config.js`'s own treatment of `URL`. `generateBundles` stays in the
// npm script (chained with `&&`) rather than spawned here, to avoid the Windows
// PATHEXT trap on extensionless `npx`.
import console from "node:console";
import { readFileSync, writeFileSync } from "node:fs";
import { argv } from "node:process";
import { fileURLToPath, pathToFileURL, URL } from "node:url";

/** Convert CRLF and lone CR to LF. */
export function toLf(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Force the file at `path` to LF in place. Returns true if it was rewritten,
 * false if it was already LF (idempotent).
 */
export function ensureLf(path) {
  const raw = readFileSync(path, "utf8");
  const lf = toLf(raw);
  if (lf !== raw) writeFileSync(path, lf);
  return lf !== raw;
}

// Run the normalisation only when executed as a script (not when imported by a
// test). pathToFileURL handles Windows drive letters, so this is the safe form
// of the main-module check.
if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  const grammar = fileURLToPath(
    new URL("../src/ohmjs/ly-grammar.ohm", import.meta.url)
  );
  // Log on rewrite so a triggered guard is a visible event, not a silent
  // recurrence (Vera 648-01).
  if (ensureLf(grammar)) {
    console.log("build:ohm: normalised ly-grammar.ohm to LF (#648)");
  }
}
