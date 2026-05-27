#!/usr/bin/env node
/* eslint-env node */
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { execSync } from "child_process";
import { existsSync, globSync, rmSync, statSync } from "fs";
import { basename, resolve } from "path";
import { fileURLToPath } from "url";
import { postprocessSvg } from "./postprocessSvg.mjs";


const defaults = {
  version: "Hugh Keyte",
  notation: null, // null means build all notations
};

function parseArgs(argv = process.argv.slice(2)) {
  const args = argv;
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

function checkLilypond(skipIfMissing) {
  let output;
  try {
    output = execSync("lilypond --version", { encoding: "utf-8", stdio: "pipe" });
  } catch {
    if (skipIfMissing) {
      console.log("LilyPond not found. Skipping score build (using committed SVGs).");
      process.exit(0);
    }
    console.error("Error: lilypond is not installed or not on PATH.");
    console.error("Please install LilyPond before building scores.");
    process.exit(1);
  }

  const version = parseLilypondVersion(output);
  const minVersion = "2.26.0";
  if (!version || compareVersions(version, minVersion) < 0) {
    console.error(
      `Error: LilyPond ${version || "unknown"} is installed, but ${minVersion} or later is required.`
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

function buildPattern(lyDir, choir) {
  return choir ? `${lyDir}/Choir ${choir}.ly` : `${lyDir}/Choir*.ly`;
}

function buildScore(ly, version, notation, maxLyMtime) {
  const choirName = basename(ly, ".ly");
  const svg = `src/scores/${version}/${notation}/${choirName}.svg`;

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
    execSync(
      `lilypond --svg -o "src/scores/${version}/${notation}/" "${ly}"`,
      {
        stdio: "inherit",
      }
    );
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

  checkLilypond(options["skip-if-missing"]);

  const version = options.version || defaults.version;
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

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(__filename);
if (isMain) {
  main();
}

export { parseArgs, buildPattern };
