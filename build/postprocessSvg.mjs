/* eslint-env node */
// Copyright (c) 2024-2026 Mark Wainwright
// SPDX-License-Identifier: MIT

/**
 * Post-process LilyPond-generated SVGs.
 *
 * Parses \pointAndClickOn anchor tags to determine which voice part each
 * graphical element belongs to, adds data-part="N" attributes, removes
 * anchor wrappers, strips height/width from the SVG root element, and
 * deduplicates repeated path shapes via <defs> and <use>.
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

const DEFAULT_SPEM_PATH = "src/lilypond/Hugh Keyte/spem.ly";
const PART_INDICES = {
  Soprano: 0,
  Alto: 1,
  Tenor: 2,
  Baritone: 3,
  Bass: 4,
};

/**
 * Parse a LilyPond file and return a list of [start_line, end_line, part_index].
 * @param {string} path
 * @param {RegExp} pattern
 * @returns {[number, number, number][]}
 */
function parseVariables(path, pattern) {
  const text = readFileSync(path, "utf-8");
  const lines = text.split(/\r?\n/);

  /** @type {[number, string, string][]} */
  const variables = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(pattern);
    if (match) {
      variables.push([i + 1, match[1], match[2]]);
    }
  }

  /** @type {[number, number, number][]} */
  const partMap = [];
  for (let idx = 0; idx < variables.length; idx++) {
    const [start, , partName] = variables[idx];
    const end =
      idx + 1 < variables.length ? variables[idx + 1][0] : lines.length + 1;
    partMap.push([start, end, PART_INDICES[partName]]);
  }

  return partMap;
}

/**
 * @param {number} lineNumber
 * @param {[number, number, number][]} partMap
 * @returns {number | null}
 */
function findPartIndex(lineNumber, partMap) {
  for (const [start, end, partIndex] of partMap) {
    if (start <= lineNumber && lineNumber < end) {
      return partIndex;
    }
  }
  return null;
}

/**
 * @param {Element} path
 * @returns {Record<string, string>}
 */
function nonTransformAttrs(path) {
  const result = {};
  const attrs = path.attributes;
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs.item(i);
    if (attr && attr.name !== "d" && attr.name !== "transform") {
      result[attr.name] = attr.value;
    }
  }
  return result;
}

/**
 * Replace repeated <path> shapes with <defs>/<use> references.
 *
 * Paths whose non-transform attributes differ across occurrences are left
 * unchanged (defensive skip for attribute collision).
 * @param {Document} doc
 */
function deduplicatePaths(doc) {
  const allPaths = Array.from(doc.getElementsByTagName("path"));

  /** @type {Map<string, Element[]>} */
  const groups = new Map();
  for (const path of allPaths) {
    const d = path.getAttribute("d");
    if (d) {
      if (!groups.has(d)) {
        groups.set(d, []);
      }
      groups.get(d).push(path);
    }
  }

  /** @type {Map<string, Element[]>} */
  const valid = new Map();
  for (const [d, paths] of groups) {
    if (paths.length < 2) continue;
    const firstAttrs = nonTransformAttrs(paths[0]);
    const allSame = paths
      .slice(1)
      .every((p) => {
        const attrs = nonTransformAttrs(p);
        return (
          Object.keys(attrs).length === Object.keys(firstAttrs).length &&
          Object.entries(attrs).every(([k, v]) => firstAttrs[k] === v)
        );
      });
    if (!allSame) continue;
    valid.set(d, paths);
  }

  if (valid.size === 0) return;

  const svgElem = doc.documentElement;
  const defs = doc.createElement("defs");
  svgElem.insertBefore(defs, svgElem.firstChild);

  let i = 0;
  for (const [d, paths] of valid) {
    const defId = `spem-path-${i}`;

    const defPath = doc.createElement("path");
    defPath.setAttribute("id", defId);
    defPath.setAttribute("d", d);
    const firstAttrs = nonTransformAttrs(paths[0]);
    for (const [name, value] of Object.entries(firstAttrs)) {
      defPath.setAttribute(name, value);
    }
    defs.appendChild(defPath);

    for (const path of paths) {
      const use = doc.createElement("use");
      use.setAttribute("href", `#${defId}`);
      const transform = path.getAttribute("transform");
      if (transform) {
        use.setAttribute("transform", transform);
      }
      if (path.parentNode) {
        path.parentNode.replaceChild(use, path);
      }
    }

    i++;
  }
}

/**
 * @param {string} svgPath
 * @param {string} spemLyPath
 * @param {string} wordsLyPath
 */
export function postprocessSvg(
  svgPath,
  spemLyPath = DEFAULT_SPEM_PATH,
  wordsLyPath = null
) {
  if (!wordsLyPath) {
    wordsLyPath = join(dirname(spemLyPath), "spem words.ly");
  }
  const notePattern =
    /^(notes(?:I{1,3}|IV)[AB](Soprano|Alto|Tenor|Baritone|Bass))\s*=\s*\\relative/;
  const wordsPattern =
    /^(words(?:I{1,3}|IV)[AB](Soprano|Alto|Tenor|Baritone|Bass))\s*=\s*\\lyricmode/;

  const noteMap = parseVariables(spemLyPath, notePattern);
  const wordsMap = parseVariables(wordsLyPath, wordsPattern);

  const svgText = readFileSync(svgPath, "utf-8");
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");

  const aElems = Array.from(doc.getElementsByTagName("a"));
  const xlinkNs = "http://www.w3.org/1999/xlink";

  for (const aElem of aElems) {
    let href =
      aElem.getAttributeNS(xlinkNs, "href") || aElem.getAttribute("href");
    if (!href) continue;

    href = decodeURIComponent(href);
    let partIndex = null;

    // Check words first since "spem words.ly" contains "spem.ly"
    if (href.includes("spem words.ly") || href.includes("spem%20words.ly")) {
      const match = href.match(/:(\d+):\d+:\d+$/);
      if (match) {
        partIndex = findPartIndex(Number(match[1]), wordsMap);
      }
    } else if (href.includes("spem.ly:")) {
      const match = href.match(/:(\d+):\d+:\d+$/);
      if (match) {
        partIndex = findPartIndex(Number(match[1]), noteMap);
      }
    }

    if (partIndex !== null) {
      for (let j = 0; j < aElem.childNodes.length; j++) {
        const child = aElem.childNodes[j];
        if (
          child.nodeType === child.ELEMENT_NODE &&
          !child.hasAttribute("data-part")
        ) {
          child.setAttribute("data-part", String(partIndex));
        }
      }
    }

    // Unwrap anchor: move children to parent, then remove anchor
    const parent = aElem.parentNode;
    if (parent) {
      while (aElem.firstChild) {
        parent.insertBefore(aElem.firstChild, aElem);
      }
      parent.removeChild(aElem);
    }
  }

  // Strip height and width from the root <svg> element
  const svgElem = doc.documentElement;
  if (svgElem.tagName === "svg") {
    if (svgElem.hasAttribute("height")) {
      svgElem.removeAttribute("height");
    }
    if (svgElem.hasAttribute("width")) {
      svgElem.removeAttribute("width");
    }
  }

  deduplicatePaths(doc);

  const serializer = new XMLSerializer();
  const output = serializer.serializeToString(doc.documentElement);
  writeFileSync(svgPath, output, "utf-8");
}

function main() {
  const args = process.argv.slice(2);

  let svgPath = null;
  let spemPath = DEFAULT_SPEM_PATH;
  let wordsPath = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--spem") {
      spemPath = args[++i];
    } else if (arg === "--words") {
      wordsPath = args[++i];
    } else if (!svgPath && !arg.startsWith("-")) {
      svgPath = arg;
    }
  }

  if (!svgPath) {
    console.error("Usage: node postprocessSvg.mjs <svg-file> [--spem <path>] [--words <path>]");
    process.exit(1);
  }

  const wordsLyPath = wordsPath ?? join(dirname(spemPath), "spem words.ly");
  postprocessSvg(svgPath, spemPath, wordsLyPath);
}

if (import.meta.url === new URL(process.argv[1], "file://").href) {
  main();
}
