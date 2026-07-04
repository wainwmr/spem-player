/* eslint-env node */
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { execFile, execFileSync } from "child_process";
import {
  copyFileSync,
  existsSync,
  globSync,
  mkdirSync,
  rmSync,
  statSync,
} from "fs";
import { availableParallelism } from "os";
import { basename, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { isMainModule, postprocessSvg } from "./postprocessSvg.mjs";

const execFileAsync = promisify(execFile);

// LilyPond renders are independent (distinct input and output) and the binary is
// single-threaded, so the renders run through a bounded pool instead of a serial
// loop (#760, part 2). Capped so memory stays bounded on a many-core host; the
// render is the bottleneck, so a small pool recovers most of the idle cores.
// `SCORES_CONCURRENCY` (a positive integer) overrides the pool size; it exists
// mainly so a test can force serial vs parallel and compare output.
function renderConcurrency() {
  const raw = process.env.SCORES_CONCURRENCY;
  if (raw !== undefined && raw !== "") {
    const override = Number(raw);
    if (Number.isInteger(override) && override > 0) {
      return override;
    }
    console.error(
      `Warning: ignoring invalid SCORES_CONCURRENCY=${raw} (want a positive integer).`
    );
  }
  try {
    return Math.max(1, Math.min(availableParallelism(), 4));
  } catch (error) {
    console.error(
      `Warning: could not detect CPU count (${error?.message ?? error}); building scores serially.`
    );
    return 1;
  }
}

/**
 * One render job passed through the pool. `maxLyMtime` is per-notation and rides
 * in the job; `version` and `outDirBase` are run-global and closed over.
 * @typedef {{ ly: string, notation: string, maxLyMtime: number }} RenderJob
 */

/**
 * Run `worker` over `items` with at most `concurrency` in flight. `concurrency`
 * must be a positive integer. Fail-fast: on the first worker error, no further
 * items are started; in-flight workers finish, then the first error is rethrown.
 * Later concurrent errors are logged to stderr (only the first is rethrown), so
 * a multi-failure run surfaces every root cause in one pass.
 *
 * @template T
 * @param {T[]} items
 * @param {(item: T) => Promise<void>} worker
 * @param {number} concurrency
 * @returns {Promise<void>}
 */
async function runPool(items, worker, concurrency) {
  let index = 0;
  let firstError = null;
  async function runNext() {
    while (index < items.length && !firstError) {
      const item = items[index++];
      try {
        await worker(item);
      } catch (error) {
        if (!firstError) {
          firstError = error;
        } else {
          console.error(`\n${error?.message ?? String(error)}`);
        }
      }
    }
  }
  const lanes = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: lanes }, runNext));
  if (firstError) throw firstError;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, "..");

const POSTPROCESS_SVG_MTIME = (() => {
  try {
    return statSync(new URL("./postprocessSvg.mjs", import.meta.url)).mtimeMs;
  } catch (error) {
    // Fail safe, not open. finalNeedsRebuild gates the whole build on this value,
    // so a `0` sentinel would silently skip a postprocessor change and ship stale
    // finals. `Infinity` forces a rebuild instead (Vera 760, silent-failure pass 2).
    console.error(
      `Warning: could not read postprocessSvg.mjs mtime (${error?.message ?? error}); forcing a full rebuild.`
    );
    return Infinity;
  }
})();


const defaults = {
  version: "Hugh Keyte",
  notation: null, // null means build all notations
  outDir: resolve(PACKAGE_ROOT, "..", "pwa", "src", "scores"),
  srcDir: resolve(PACKAGE_ROOT, "src"),
};

/**
 * Parse CLI-style flags into an options object.
 *
 * Accepts `--key=value`, `--key value`, and bare `--flag` (-> true).
 * A token starting with `--` is never consumed as a value for the
 * preceding key. Unknown keys are accepted and returned as-is.
 * Bare positional args (not starting with `--`) are ignored.
 *
 * @param {string[]} [args] argument list, defaults to `process.argv.slice(2)`.
 * @returns options object seeded with `defaults`.
 */
function parseArgs(args = process.argv.slice(2)) {
  const options = { ...defaults };
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const eqIndex = key.indexOf("=");
      if (eqIndex >= 0) {
        options[key.slice(0, eqIndex)] = key.slice(eqIndex + 1);
      } else if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        options[key] = args[i + 1];
        i++;
      } else {
        options[key] = true;
      }
    }
    i++;
  }
  return options;
}

function validateOptions(options) {
  const stringFlags = ["version", "notation", "choir", "outDir", "srcDir"];
  for (const flag of stringFlags) {
    if (options[flag] === true) {
      console.error(`Error: --${flag} requires a value.`);
      if (flag === "notation") {
        console.error("  Valid values: early, modern");
      } else if (flag === "version") {
        console.error("  Valid values: Hugh Keyte, OUP");
      } else if (flag === "choir") {
        console.error('  Valid values: "I A", "I B", ... (any choir name)');
      }
      process.exit(1);
    }
  }

  // Whitelist version/notation because they become directory-path segments in
  // the build output (resolve(outDirBase, version, notation)); this bounds them
  // to known values. It is NOT the shell-injection defence — execFile (no
  // shell) is, and that covers every argument regardless of this list. Omitted
  // (undefined/null) is fine — the defaults are applied later; bare flags (true)
  // are handled above (#624).
  const allowedValues = { version: ["Hugh Keyte", "OUP"], notation: ["early", "modern"] };
  for (const [flag, values] of Object.entries(allowedValues)) {
    const value = options[flag];
    if (value === undefined || value === null || value === true) continue;
    if (!values.includes(value)) {
      console.error(`Error: --${flag} "${value}" is not a valid value.`);
      console.error(`  Valid values: ${values.join(", ")}`);
      process.exit(1);
    }
  }
}

function parseLilypondVersion(output) {
  const match = output.match(/GNU LilyPond (\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

function compareVersions(a, b) {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
}

/**
 * The command used to invoke LilyPond, as `[binary, ...prefixArgs]`.
 *
 * Defaults to `["lilypond"]`. Override with the `LILYPOND_CMD` env var (a JSON
 * array of strings) to point at a wrapped install — e.g.
 * `["flatpak","run","org.lilypond.LilyPond"]`, `["wsl","lilypond"]`, or a test
 * fake `["node","/path/to/fake.js"]`. The command is always invoked via the
 * `execFile` family (no shell) — `execFileSync` for the `--version` probe,
 * promisified `execFile` for the render — so the override is not a
 * shell-injection surface.
 */
function lilypondCommand() {
  const raw = process.env.LILYPOND_CMD;
  if (!raw) return ["lilypond"];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error('Error: LILYPOND_CMD must be a JSON array of strings, e.g. ["lilypond"].');
    process.exit(1);
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every((s) => typeof s === "string")) {
    console.error("Error: LILYPOND_CMD must be a non-empty JSON array of strings.");
    process.exit(1);
  }
  return parsed;
}

function checkLilypond(version) {
  let output;
  try {
    const [bin, ...prefix] = lilypondCommand();
    // Pipe (don't inherit) the child's stderr: without an explicit stdio,
    // execFileSync leaks LilyPond's startup/Guile noise to the build console
    // and muddies the catch block's "is not installed" message. stdout stays
    // piped so the version string below can be parsed (#624).
    output = execFileSync(bin, [...prefix, "--version"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    console.error("Error: lilypond is not installed or not on PATH.");
    console.error("Please install LilyPond before building scores.");
    console.error(String(error?.message ?? error));
    console.error(
      `(status: ${error?.status ?? "none"}, signal: ${error?.signal ?? "none"})`
    );
    process.exit(1);
  }

  const lilypondVersion = parseLilypondVersion(output);
  const minVersion = "2.26.0";
  if (!lilypondVersion || compareVersions(lilypondVersion, minVersion) < 0) {
    console.error(
      `Error: LilyPond ${lilypondVersion || "unknown"} is installed, but ${minVersion} or later is required.`
    );
    console.error("Please upgrade LilyPond before building scores.");
    if (!lilypondVersion) {
      console.error(
        `'lilypond --version' stdout was:\n${output.trim() || "(empty)"}`
      );
    }
    process.exit(1);
  }
}

// Over-approximation strategy for rebuild detection. We do not parse
// `\include` directives; instead, an SVG is rebuilt when the MAX mtime
// across two glob sets exceeds the SVG's mtime:
//   - notation siblings (`<lyDir>/*.ly`): the choir's own file and the
//     notation-specific layout.ly
//   - edition-root includes (`<versionDir>/*.ly`): shared files like
//     spem.ly, basic.ly, spem words.ly
// Consequence: touching one choir's .ly rebuilds every score in that
// notation (mild over-approximation; parser-free correctness for
// includes). Touching a notation-specific layout rebuilds only that
// notation. Touching an edition-root include rebuilds both notations.
// Sibling notations are NOT coupled — modern/* changes do not
// invalidate early/*.
function maxLyMtimeFor(lyDir, versionDir) {
  const lyFiles = [
    ...globSync(`${lyDir}/*.ly`),
    ...globSync(`${versionDir}/*.ly`),
  ];
  if (lyFiles.length === 0) {
    throw new Error(
      `buildScores: no .ly files found under ${lyDir} or ${versionDir}`
    );
  }
  return Math.max(...lyFiles.map((p) => statSync(p).mtimeMs));
}

// Rebuild is decided in two questions (#760). The expensive stage is the
// LilyPond render; postprocessing the render is cheap. We keep the raw render
// under `<outDir>/.raw/` (gitignored) so the two can invalidate independently:
//   1. finalNeedsRebuild — is the committed final SVG stale vs its `.ly` sources
//      or the postprocessor? If not, skip entirely. This keys off the FINAL,
//      which is committed and present on a CI checkout, so an unchanged tree
//      renders nothing even when no `.raw/` is present.
//   2. rawNeedsRender — given the final must be (re)produced, are the sources
//      newer than the kept raw? If so re-render, then postprocess; if the raw is
//      already current, postprocess it in place with no render. A
//      postprocessor-only change therefore re-postprocesses in seconds (locally,
//      where `.raw/` persists) instead of re-running LilyPond 16 times.
// Both gates use `>=` so an equal mtime forces the work: a strict `>` skips a
// genuine change on coarse-granularity filesystems (the project's own W05
// anti-pattern; RR item 4 folded in here).

/**
 * Decide whether the raw LilyPond render needs (re)producing.
 *
 * @param {number} maxLyMtime - the precomputed max mtime of the .ly files in
 *   scope for this SVG, from `maxLyMtimeFor(lyDir, versionDir)`. Passing an
 *   out-of-scope mtime silently violates the over-approximation strategy above
 *   `maxLyMtimeFor`.
 * @param {string} rawPath - path to the candidate raw render.
 * @returns {boolean} true when the raw is missing or older-or-equal than its sources.
 */
function rawNeedsRender(maxLyMtime, rawPath) {
  if (!existsSync(rawPath)) {
    return true;
  }
  return maxLyMtime >= statSync(rawPath).mtimeMs;
}

/**
 * Decide whether the final SVG needs (re)producing at all. It is stale when
 * missing, older-or-equal than its `.ly` sources, or older-or-equal than the
 * postprocessor. Keyed off the committed final so it holds on a CI checkout that
 * has no `.raw/`, and it catches a final left stale by an interrupted build.
 *
 * @param {number} maxLyMtime - max mtime of the in-scope .ly files (see `rawNeedsRender`).
 * @param {string} finalPath - path to the candidate final SVG.
 * @param {number} [postprocessMtime] - mtime of the postprocessor script;
 *   defaults to the module-load snapshot. Injectable for unit testing.
 * @returns {boolean} true when the final is missing or stale.
 */
function finalNeedsRebuild(maxLyMtime, finalPath, postprocessMtime = POSTPROCESS_SVG_MTIME) {
  if (!existsSync(finalPath)) {
    return true;
  }
  const finalMtime = statSync(finalPath).mtimeMs;
  return maxLyMtime >= finalMtime || postprocessMtime >= finalMtime;
}

/**
 * Build the glob pattern for choir `.ly` files in a notation directory.
 * Encodes the on-disk naming convention (`Choir <id>.ly`, space-separated).
 * When `choir` is omitted, returns a wildcard matching every choir.
 */
function buildPattern(lyDir, choir) {
  return choir ? `${lyDir}/Choir ${choir}.ly` : `${lyDir}/Choir*.ly`;
}

/**
 * Build one score: render its `.ly` to a kept raw SVG (only when stale), then
 * postprocess the raw into the final SVG the app consumes. `async` because the
 * render runs through promisified `execFile`. Mutates the filesystem: creates
 * `.raw/` and the final SVG, and on failure removes the affected outputs.
 * **Throws** an `Error` on a render or postprocess failure rather than calling
 * `process.exit` — the caller (`runPool`/`main`) owns the exit, so the pool can
 * fail-fast.
 *
 * @param {string} ly - path to the choir's `.ly` source.
 * @param {string} version - edition name (a directory segment, e.g. "Hugh Keyte").
 * @param {string} notation - notation name (a directory segment, e.g. "early").
 * @param {number} maxLyMtime - max mtime of the in-scope `.ly` files for this notation.
 * @param {string} outDirBase - the scores output root.
 * @returns {Promise<void>}
 */
async function buildScore(ly, version, notation, maxLyMtime, outDirBase) {
  const choirName = basename(ly, ".ly");
  const outDir = resolve(outDirBase, version, notation);
  const rawDir = resolve(outDir, ".raw");
  const rawSvg = resolve(rawDir, `${choirName}.svg`);
  const finalSvg = resolve(outDir, `${choirName}.svg`);

  // Skip when the committed final is already current (works on CI, which has no
  // `.raw/`). Otherwise re-render only when the raw is stale; a fresh raw is
  // postprocessed in place.
  if (!finalNeedsRebuild(maxLyMtime, finalSvg)) {
    console.log(
      `Skipping ${choirName} (edition: ${version}, notation: ${notation}): SVG is up to date.`
    );
    return;
  }

  const render = rawNeedsRender(maxLyMtime, rawSvg);
  if (render) {
    console.log(
      `Building ${choirName} (edition: ${version}, notation: ${notation})...`
    );
    try {
      // LilyPond does not create its output directory (it aborts on a missing
      // one), so create the raw dir first. execFile (no shell) so
      // user-controlled path segments in `rawDir` (from --version/--notation/
      // --outDir) and `ly` cannot break out of a quoted argument and inject
      // shell commands (#624). Each value is passed literally. Output is
      // buffered and printed on completion (below) so LilyPond's own output does
      // not interleave between concurrent renders.
      mkdirSync(rawDir, { recursive: true });
      const [bin, ...prefix] = lilypondCommand();
      const { stdout, stderr } = await execFileAsync(
        bin,
        [...prefix, "--svg", "-o", `${rawDir}/`, ly],
        { maxBuffer: 32 * 1024 * 1024 }
      );
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
    } catch (error) {
      // Build the diagnostic BEFORE cleanup: a cleanup rmSync that itself throws
      // (an EBUSY/EPERM lock during a parallel build on Windows) must not clobber
      // LilyPond's stderr, which is the actionable detail. Throw rather than exit
      // so the pool can fail-fast; main() reports and exits.
      const detail = [error.message, error.stderr, error.stdout]
        .filter(Boolean)
        .join("\n");
      // The raw render failed, so both the partial raw and any stale final are
      // now untrustworthy — remove both (the pre-#760 behaviour deleted the final
      // on a failed render). Guarded so a cleanup fault cannot mask `detail`.
      try {
        rmSync(rawSvg, { force: true });
        rmSync(finalSvg, { force: true });
      } catch {
        // ignore cleanup failure; the render error is what matters
      }
      throw new Error(`Error building ${choirName}:\n${detail}`);
    }
  }

  // Postprocess the kept raw into the final path: copy raw -> final, then run
  // the in-place postprocessor on the copy. The raw is preserved so a later
  // postprocessor-only change re-postprocesses without re-rendering.
  console.log(`Post-processing ${finalSvg}...`);
  try {
    mkdirSync(outDir, { recursive: true });
    copyFileSync(rawSvg, finalSvg);
    postprocessSvg(finalSvg);
  } catch (error) {
    try {
      rmSync(finalSvg, { force: true });
    } catch {
      // ignore cleanup failure
    }
    throw new Error(
      `Error post-processing ${finalSvg}:\n${error?.message ?? String(error)}`
    );
  }
}

async function main() {
  const options = parseArgs();
  validateOptions(options);

  const version = options.version || defaults.version;
  const outDirBase = options.outDir || defaults.outDir;
  const srcRoot = options.srcDir || defaults.srcDir;
  checkLilypond(version);
  const notations = options.notation
    ? [options.notation]
    : ["early", "modern"];

  // Gather every (choir, notation) render into one flat job list, then run them
  // through a bounded pool. maxLyMtime is still computed once per notation.
  const jobs = [];
  for (const notation of notations) {
    const lyDir = resolve(srcRoot, version, notation);
    const versionDir = resolve(srcRoot, version);
    const pattern = buildPattern(lyDir, options.choir);

    const files = globSync(pattern);

    if (files.length === 0) {
      console.error(`No LilyPond files found matching: ${pattern}`);
      process.exit(1);
    }

    // Compute max .ly mtime once per notation, not once per choir file.
    let maxLyMtime;
    try {
      maxLyMtime = maxLyMtimeFor(lyDir, versionDir);
    } catch (error) {
      console.error(`\nError computing rebuild scope:\n${error.message}`);
      process.exit(1);
    }

    for (const ly of files.sort()) {
      jobs.push({ ly, notation, maxLyMtime });
    }
  }

  try {
    await runPool(
      jobs,
      (job) => buildScore(job.ly, version, job.notation, job.maxLyMtime, outDirBase),
      renderConcurrency()
    );
  } catch (error) {
    console.error(`\n${error.message ?? String(error)}`);
    process.exit(1);
  }

  console.log("\nDone.");
}

// Only run main() when this file is invoked directly from the CLI, not when
// imported by tests. `isMainModule` (reused from the sibling postprocessSvg.mjs,
// #555) treats a missing or non-existent `argv[1]` as "not main" rather than
// throwing ENOENT at module scope.
if (isMainModule(process.argv[1], import.meta.url)) {
  main().catch((error) => {
    console.error(`\n${error?.message ?? String(error)}`);
    process.exit(1);
  });
}

export {
  parseArgs,
  buildPattern,
  validateOptions,
  buildScore,
  lilypondCommand,
  rawNeedsRender,
  finalNeedsRebuild,
};
