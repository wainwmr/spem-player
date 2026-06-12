/* eslint-env node */
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { execSync } from "child_process";
import { existsSync, globSync, mkdirSync, realpathSync, rmSync, statSync } from "fs";
import { basename, resolve } from "path";
import { fileURLToPath } from "url";
import { postprocessSvg } from "./postprocessSvg.mjs";

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
  const stringFlags = ["version", "notation", "choir"];
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
}

function parseLilypondVersion(output) {
  // Capture the numeric core PLUS any pre-release suffix (e.g.
  // "2.26.0-rc1"). The previous `\d+\.\d+\.\d+` silently truncated the
  // suffix, which masked the pre-release ordering bug in compareVersions
  // and let a pre-release of the minimum version pass the check (#519).
  // The trailing `\S*` keeps the suffix while still requiring an X.Y.Z
  // core, so a non-version banner returns null and is reported as
  // "unknown" with the raw stdout echoed (#549) — a bare `\S+` would
  // wrongly accept garbage tokens as a version.
  const match = output.match(/GNU LilyPond (\d+\.\d+\.\d+\S*)/);
  return match ? match[1] : null;
}

// Compare two dot-separated version strings. Each part is split into its
// leading integer run and any trailing suffix; integers compare numerically
// and a part with no suffix outranks one with a suffix (release > pre-release,
// per semver precedence), so "2.26.0" > "2.26.0-rc1". Suffixes among
// themselves compare lexicographically, which orders multi-digit identifiers
// wrongly — "-rc10" sorts BELOW "-rc2". Not a full semver implementation
// (no build metadata, no multi-identifier pre-release ordering) — see #519.
function compareVersions(a, b) {
  const parse = (v) =>
    v.split(".").map((p) => {
      // Match the leading digit run explicitly so a part keeps its full
      // suffix and a leading-zero part is not mis-sliced. The sole caller
      // feeds X.Y.Z[suffix], but the exported comparator must not mangle a
      // digit-less or leading-zero part (Vera 519-01).
      const [, digits, rest] = /^(\d*)(.*)$/.exec(p);
      return { num: digits === "" ? 0 : parseInt(digits, 10), rest };
    });
  const partsA = parse(a);
  const partsB = parse(b);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const pa = partsA[i] || { num: 0, rest: "" };
    const pb = partsB[i] || { num: 0, rest: "" };
    if (pa.num !== pb.num) return pa.num < pb.num ? -1 : 1;
    if (pa.rest !== pb.rest) {
      if (pa.rest === "") return 1;
      if (pb.rest === "") return -1;
      return pa.rest < pb.rest ? -1 : 1;
    }
  }
  return 0;
}

function checkLilypond(version) {
  let output;
  try {
    output = execSync("lilypond --version", { encoding: "utf-8", stdio: "pipe" });
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
  checkLilypond(version);
  const notations = options.notation
    ? [options.notation]
    : ["early", "modern"];

  for (const notation of notations) {
    const lyDir = `lilypond/src/${version}/${notation}`;
    const versionDir = `lilypond/src/${version}`;
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

export { parseArgs, buildPattern, parseLilypondVersion, compareVersions };
