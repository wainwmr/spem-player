/* eslint-env node */
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { execSync } from "child_process";
import { existsSync, globSync, mkdirSync, realpathSync, rmSync, statSync } from "fs";
import { basename, resolve } from "path";
import { fileURLToPath } from "url";
import { postprocessSvg } from "./postprocessSvg.mjs";


const defaults = {
  version: "Hugh Keyte",
  notation: null, // null means build all notations
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

function checkLilypond(skipIfMissing, version) {
  let output;
  try {
    output = execSync("lilypond --version", { encoding: "utf-8", stdio: "pipe" });
  } catch {
    if (skipIfMissing) {
      // Ticket #318 untracked the SVGs. --skip-if-missing now requires a
      // canary SVG for the requested edition to skip safely; without it
      // the build would ship empty scores. The probe is canary-scope, not
      // a full inventory check — a partially-built tree (e.g. an
      // interrupted previous build) will still appear valid here. The
      // canary is sufficient for the PR #271 regression mode (entire
      // src/scores/ missing on Netlify) which motivated this guard.
      const probe = `src/scores/${version}/modern/Choir I A.svg`;
      if (!existsSync(probe)) {
        console.error(`LilyPond not found AND no pre-built SVGs at ${probe}.`);
        console.error("Install LilyPond, or run buildScores.mjs without --skip-if-missing.");
        process.exit(1);
      }
      console.log("LilyPond not found. Using existing SVGs.");
      process.exit(0);
    }
    console.error("Error: lilypond is not installed or not on PATH.");
    console.error("Please install LilyPond before building scores.");
    process.exit(1);
  }

  const lilypondVersion = parseLilypondVersion(output);
  const minVersion = "2.26.0";
  if (!lilypondVersion || compareVersions(lilypondVersion, minVersion) < 0) {
    console.error(
      `Error: LilyPond ${lilypondVersion || "unknown"} is installed, but ${minVersion} or later is required.`
    );
    console.error("Please upgrade LilyPond before building scores.");
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
  return maxLyMtime > statSync(svgPath).mtimeMs;
}

/**
 * Build the glob pattern for choir `.ly` files in a notation directory.
 * Encodes the on-disk naming convention (`Choir <id>.ly`, space-separated).
 * When `choir` is omitted, returns a wildcard matching every choir.
 */
function buildPattern(lyDir, choir) {
  return choir ? `${lyDir}/Choir ${choir}.ly` : `${lyDir}/Choir*.ly`;
}

function buildScore(ly, version, notation, maxLyMtime) {
  const choirName = basename(ly, ".ly");
  const outDir = `src/scores/${version}/${notation}`;
  const svg = `${outDir}/${choirName}.svg`;

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
    execSync(`lilypond --svg -o "${outDir}/" "${ly}"`, { stdio: "inherit" });
  } catch (error) {
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

  const version = options.version || defaults.version;
  checkLilypond(options["skip-if-missing"], version);
  const notations = options.notation
    ? [options.notation]
    : ["early", "modern"];

  for (const notation of notations) {
    const lyDir = `src/lilypond/${version}/${notation}`;
    const versionDir = `src/lilypond/${version}`;
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
      buildScore(ly, version, notation, maxLyMtime);
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

export { parseArgs, buildPattern };
