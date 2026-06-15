/* eslint-env node */
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { execFileSync } from "child_process";
import { existsSync, globSync, mkdirSync, realpathSync, rmSync, statSync } from "fs";
import { basename, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { postprocessSvg } from "./postprocessSvg.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, "..");

const POSTPROCESS_SVG_MTIME = (() => {
  try {
    return statSync(new URL("./postprocessSvg.mjs", import.meta.url)).mtimeMs;
  } catch {
    return 0;
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
  // to known values. It is NOT the shell-injection defence — execFileSync (no
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
 * fake `["node","/path/to/fake.js"]`. The command is always invoked via
 * `execFileSync` (no shell), so the override is not a shell-injection surface.
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

/**
 * Decide whether an SVG needs rebuilding.
 *
 * @param {number} maxLyMtime - the precomputed max mtime of the .ly files
 *   in scope for this SVG. Must be produced by `maxLyMtimeFor(lyDir,
 *   versionDir)` where `lyDir` is the notation directory containing the
 *   choir's `.ly` and `versionDir` is the edition root. Passing an
 *   out-of-scope mtime (e.g. another notation's) silently violates the
 *   over-approximation strategy described above `maxLyMtimeFor`.
 * @param {string} svgPath - path to the candidate SVG.
 */
function needsRebuild(maxLyMtime, svgPath) {
  if (!existsSync(svgPath)) {
    return true;
  }
  const svgMtime = statSync(svgPath).mtimeMs;
  return maxLyMtime > svgMtime || POSTPROCESS_SVG_MTIME > svgMtime;
}

/**
 * Build the glob pattern for choir `.ly` files in a notation directory.
 * Encodes the on-disk naming convention (`Choir <id>.ly`, space-separated).
 * When `choir` is omitted, returns a wildcard matching every choir.
 */
function buildPattern(lyDir, choir) {
  return choir ? `${lyDir}/Choir ${choir}.ly` : `${lyDir}/Choir*.ly`;
}

function buildScore(ly, version, notation, maxLyMtime, outDirBase) {
  const choirName = basename(ly, ".ly");
  const outDir = resolve(outDirBase, version, notation);
  const svg = resolve(outDir, `${choirName}.svg`);

  if (!needsRebuild(maxLyMtime, svg)) {
    console.log(
      `Skipping ${choirName} (edition: ${version}, notation: ${notation}): SVG is up to date.`
    );
    return;
  }

  console.log(
    `\nBuilding ${choirName} (edition: ${version}, notation: ${notation})...`
  );
  try {
    // LilyPond does not create its output directory; on a clean checkout
    // (src/scores/ is gitignored post-#318) it aborts. Create it first.
    mkdirSync(outDir, { recursive: true });
    // execFileSync (no shell) so user-controlled path segments in `outDir`
    // (from --version/--notation/--outDir) and `ly` cannot break out of a quoted
    // argument and inject shell commands (#624). Each value is passed literally.
    const [bin, ...prefix] = lilypondCommand();
    execFileSync(bin, [...prefix, "--svg", "-o", `${outDir}/`, ly], { stdio: "inherit" });
  } catch (error) {
    rmSync(svg, { force: true });
    console.error(`\nError building ${choirName}:\n${error.message}`);
    process.exit(1);
  }

  console.log(`Post-processing ${svg}...`);
  try {
    postprocessSvg(svg);
  } catch (error) {
    try {
      rmSync(svg, { force: true });
    } catch {
      // ignore cleanup failure
    }
    console.error(`\nError post-processing ${svg}:\n${error.message}`);
    process.exit(1);
  }
}

function main() {
  const options = parseArgs();
  validateOptions(options);

  const version = options.version || defaults.version;
  const outDirBase = options.outDir || defaults.outDir;
  const srcRoot = options.srcDir || defaults.srcDir;
  checkLilypond(version);
  const notations = options.notation
    ? [options.notation]
    : ["early", "modern"];

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
      buildScore(ly, version, notation, maxLyMtime, outDirBase);
    }
  }

  console.log("\nDone.");
}

// Only run main() when this file is invoked directly from the CLI, not when
// imported by tests. `process.argv[1]` is undefined under some embed contexts;
// treat that as "not main".
const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(__filename);
if (isMain) {
  main();
}

export { parseArgs, buildPattern, validateOptions, buildScore, lilypondCommand };
