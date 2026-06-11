import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";

// Pins the cross-file invariant behind #558: ci.yml's lilypond-prefixed
// `paths-ignore` entries must mirror lilypond.yml's `paths` exactly, so every
// lilypond path triggers exactly one of the two workflows. Drift in the
// dangerous direction (an entry ignored by ci.yml but absent from
// lilypond.yml's paths) leaves files triggering neither workflow — the
// required `test` check then never reports and such PRs cannot merge.
//
// GitHub Actions offers no cross-file single source for these lists (in-file
// YAML anchors exist since 2025 but cannot span files), so the two files are
// maintained by hand; each also duplicates its list across the push and
// pull_request blocks. This test is the enforcement.
//
// The extraction is deliberately textual (no YAML dependency): it collects
// quoted "- ..." entries under each `paths:` / `paths-ignore:` key, and
// throws on any entry line it cannot parse, so a quoting-style change cannot
// silently truncate a list. Restructures (a block added or removed, flow
// style, anchors) fail the block-count assertions loudly.
//
// Known limit: the cross-file check compares literal "lilypond/"-prefixed
// entries, so an ignore pattern covering lilypond files without that prefix
// (e.g. "**") would pass unnoticed, and a non-lilypond entry ever added to
// lilypond.yml's paths fails this test by design (extend the filter then).

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function extractBlocks(file: string, key: "paths" | "paths-ignore"): string[][] {
  const text = readFileSync(resolve(root, file), "utf-8");
  const blocks: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== `${key}:`) continue;
    const entries: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j].trim();
      // Comments and blank lines may sit between entries.
      if (line === "" || line.startsWith("#")) continue;
      // A line that is not a sequence item genuinely ends the block.
      if (!line.startsWith("- ")) break;
      const m = line.match(/^- "(.+)"$/);
      if (!m) {
        // An entry-shaped line we cannot parse must fail loudly: silently
        // breaking here would let an unquoted entry truncate the list and
        // pass the suite while the #558 hole reopened.
        throw new Error(
          `Unparseable entry under "${key}:" at ${file}:${j + 1}: ${line} — entries must be double-quoted`
        );
      }
      entries.push(m[1]);
    }
    blocks.push(entries);
  }
  return blocks;
}

describe("workflow path filters stay mirrored (#558)", () => {
  const ciBlocks = extractBlocks(".github/workflows/ci.yml", "paths-ignore");
  const lilyBlocks = extractBlocks(".github/workflows/lilypond.yml", "paths");

  it("finds both blocks in each workflow file", () => {
    // push + pull_request; a third block or a restructure must be looked at.
    expect(ciBlocks.length).toBe(2);
    expect(lilyBlocks.length).toBe(2);
    for (const b of [...ciBlocks, ...lilyBlocks]) {
      expect(b.length).toBeGreaterThan(0);
    }
  });

  it("ci.yml's push and pull_request ignore lists are identical", () => {
    expect(ciBlocks[0]).toEqual(ciBlocks[1]);
  });

  it("lilypond.yml's push and pull_request paths are identical", () => {
    expect(lilyBlocks[0]).toEqual(lilyBlocks[1]);
  });

  it("ci.yml ignores exactly the lilypond paths that lilypond.yml covers", () => {
    const ciLilypondEntries = ciBlocks[0]
      .filter((p) => p.startsWith("lilypond/"))
      .sort();
    const lilypondPaths = [...lilyBlocks[0]].sort();
    expect(ciLilypondEntries).toEqual(lilypondPaths);
  });

  it("ci.yml does not ignore the files whose edits must run this test", () => {
    // The "deliberately NOT ignored" choice is load-bearing: re-ignoring
    // either workflow file would let its edits skip this test at PR time,
    // guarded only by comments — the failure shape that opened #558.
    for (const b of ciBlocks) {
      expect(b).not.toContain(".github/workflows/lilypond.yml");
      expect(b).not.toContain(".github/workflows/ci.yml");
    }
  });
});
