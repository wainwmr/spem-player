#!/usr/bin/env node
/* eslint-env node */
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

import { execSync } from "child_process";
import { existsSync, statSync } from "fs";
import { globSync } from "fs";
import { basename } from "path";
import { postprocessSvg } from "./postprocessSvg.mjs";


const defaults = {
  version: "Hugh Keyte",
  notation: null, // null means build all notations
};

function parseArgs() {
  const args = process.argv.slice(2);
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

function needsRebuild(lyPath, svgPath) {
  if (!existsSync(svgPath)) {
    return true;
  }
  const lyStat = statSync(lyPath);
  const svgStat = statSync(svgPath);
  return lyStat.mtimeMs > svgStat.mtimeMs;
}

function buildScore(ly, version, notation) {
  const choirName = basename(ly, ".ly");
  const svg = `src/scores/${version}/${notation}/${choirName}.svg`;

  if (!needsRebuild(ly, svg)) {
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
    console.error(`\nError post-processing ${svg}:\n${error.message}`);
    process.exit(1);
  }
}

const options = parseArgs();

checkLilypond(options["skip-if-missing"]);

const version = options.version || defaults.version;
const notations = options.notation
  ? [options.notation]
  : ["early", "modern"];

for (const notation of notations) {
  const lyDir = `src/lilypond/${version}/${notation}`;
  const pattern = options.choir
    ? `${lyDir}/Choir ${options.choir}.ly`
    : `${lyDir}/Choir*.ly`;

  const files = globSync(pattern);

  if (files.length === 0) {
    console.error(`No LilyPond files found matching: ${pattern}`);
    process.exit(1);
  }

  for (const ly of files.sort()) {
    buildScore(ly, version, notation);
  }
}

console.log("\nDone.");
