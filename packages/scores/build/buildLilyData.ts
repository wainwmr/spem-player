// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

// Precompute the LilyPond note-data parse at build time (#693). Reads spem.ly,
// runs the Ohm parse + note-building + false-relation detection once, and writes
// the plain-JSON result to src/lily/lilyData.json, which the pwa runtime loads
// instead of parsing on every cold page load. Runs via `tsx` (no LilyPond binary
// needed -- this is the Ohm parse, not the SVG pipeline), so it can regenerate
// without the LilyPond toolchain that buildScores.mjs requires.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { processLilypond } from "../src/lily/lily";
import { serialise } from "../src/lily/serialise";

const here = dirname(fileURLToPath(import.meta.url));
const spemPath = resolve(here, "../src/Hugh Keyte/spem.ly");
const outPath = resolve(here, "../src/lily/lilyData.json");

const source = readFileSync(spemPath, "utf-8");
const data = processLilypond(source);
const plain = serialise(data);
// Minified, not pretty-printed: this is a generated artifact (regenerated
// wholesale when spem.ly changes, never hand-edited), and the full serialisation
// is ~3.5 MB pretty vs ~1.4 MB minified (~44 KB gzipped either way). Diff quality
// is irrelevant for a regenerated file; the raw size is not.
writeFileSync(outPath, JSON.stringify(plain) + "\n");
console.log(`build:lilydata: wrote ${outPath} (${source.length} bytes source)`);
