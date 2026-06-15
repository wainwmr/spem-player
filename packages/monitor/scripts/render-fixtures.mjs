#!/usr/bin/env node
// Batch-render every monitor fixture and generate an HTML gallery.
//
// Usage:
//   node scripts/render-fixtures.mjs
//   node scripts/render-fixtures.mjs --output-dir temp/fixtures
//   node scripts/render-fixtures.mjs --open

import { readdirSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { basename, extname, resolve } from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(__dirname, "..", "..", "..");
const fixturesDir = resolve(repoRoot, "packages/monitor/fixtures");
const drawScript = resolve(repoRoot, "packages/monitor/scripts/draw-burndown.mjs");

const args = process.argv.slice(2);

function parseArg(flag) {
  const idx = args.findIndex((a) => a === flag);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

const outputDir = resolve(repoRoot, parseArg("--output-dir") ?? "temp");
const shouldOpen = args.includes("--open");

mkdirSync(outputDir, { recursive: true });

const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) => extname(f) === ".json")
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

if (fixtureFiles.length === 0) {
  console.error(`No JSON fixtures found in ${fixturesDir}`);
  process.exit(1);
}

const rendered = [];

for (const fixtureFile of fixtureFiles) {
  const name = basename(fixtureFile, ".json");
  const dataPath = resolve(fixturesDir, fixtureFile);
  const outPath = resolve(outputDir, `burndown-${name}.png`);

  const fixtureData = JSON.parse(readFileSync(dataPath, "utf8"));
  const lastDate = fixtureData[fixtureData.length - 1]?.date;
  const args = [drawScript, "--data", dataPath, "-o", outPath];
  if (lastDate) args.push("--as-of", lastDate);

  const { stdout, stderr } = await execFileAsync("node", args, { cwd: repoRoot });

  rendered.push({ name, png: `burndown-${name}.png` });
  console.log(`✓ ${name}`);
  if (stderr) console.error(stderr.trim());
  for (const line of stdout.trim().split("\n").slice(1)) {
    console.log(`  ${line}`);
  }
}

const galleryPath = resolve(outputDir, "fixtures-gallery.html");
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Monitor fixture burndowns</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 1rem; background: #f8fafc; color: #0f172a; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    figure { margin: 0; background: #fff; border-radius: 12px; padding: 0.75rem; box-shadow: 0 1px 3px rgb(0 0 0 / 0.1); }
    figcaption { font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; }
    img { width: 240px; height: auto; display: block; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Monitor fixture burndowns</h1>
  <div class="grid">
${rendered
  .map(
    ({ name, png }) => `    <figure>
      <figcaption>${name}</figcaption>
      <img src="${png}" alt="Burndown for ${name}" width="1200" height="600">
    </figure>`
  )
  .join("\n")}
  </div>
</body>
</html>
`;

writeFileSync(galleryPath, html);
console.log(`\nGallery written to ${galleryPath}`);

if (shouldOpen) {
  await execFileAsync("open", [galleryPath]);
}
