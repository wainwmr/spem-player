import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { postprocessSvg } from "../build/postprocessSvg.mjs";

describe("postprocessSvg build script", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "spem-annotate-test-"));
  const tmpSvg = join(tmpDir, "Choir I A.svg");
  const tmpSpem = join(tmpDir, "spem.ly");
  const tmpWords = join(tmpDir, "spem words.ly");

  beforeAll(() => {
    // Minimal spem.ly with voice variables for one choir
    writeFileSync(
      tmpSpem,
      `notesIASoprano = \\relative c' { c4 d e f }
notesIAAlto = \\relative c' { c4 d e f }
notesIATenor = \\relative c' { c4 d e f }
notesIABaritone = \\relative c' { c4 d e f }
notesIABass = \\relative c' { c4 d e f }
`,
      "utf-8"
    );

    // Minimal lyrics file
    writeFileSync(
      tmpWords,
      `wordsIASoprano = \\lyricmode { Spem }
wordsIAAlto = \\lyricmode { Spem }
wordsIATenor = \\lyricmode { Spem }
wordsIABaritone = \\lyricmode { Spem }
wordsIABass = \\lyricmode { Spem }
`,
      "utf-8"
    );

    // Synthetic SVG with anchor tags pointing to line numbers in the .ly files.
    // Line 1 = Soprano (part 0), line 2 = Alto (part 1), etc.
    writeFileSync(
      tmpSvg,
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1000" height="500">
  <a xlink:href="spem.ly:1:1:1">
    <path d="M0,0 L1,1" transform="translate(10,10)"/>
  </a>
  <a xlink:href="spem.ly:2:1:1">
    <path d="M0,0 L1,1" transform="translate(20,10)"/>
  </a>
  <a xlink:href="spem.ly:3:1:1">
    <path d="M0,0 L1,1" transform="translate(30,10)"/>
  </a>
  <a xlink:href="spem.ly:4:1:1">
    <path d="M0,0 L1,1" transform="translate(40,10)"/>
  </a>
  <a xlink:href="spem.ly:5:1:1">
    <path d="M0,0 L1,1" transform="translate(50,10)"/>
  </a>
  <a xlink:href="spem%20words.ly:1:1:1">
    <text x="10" y="20">Spem</text>
  </a>
  <a xlink:href="spem%20words.ly:3:1:1">
    <text x="10" y="30">in</text>
  </a>
</svg>`,
      "utf-8"
    );
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("removes all anchor tags and adds data-part attributes", () => {
    postprocessSvg(tmpSvg, tmpSpem, tmpWords);

    const output = readFileSync(tmpSvg, "utf-8");

    // No anchor tags should remain
    expect(output).not.toMatch(/<a\s/);
    expect(output).not.toMatch(/<\/a>/);

    // Should contain data-part attributes for Soprano (part 0)
    expect(output).toMatch(/data-part="0"/);

    // Should contain data-part attributes for multiple parts
    expect(output).toMatch(/data-part="4"/);

    // Lyrics path: <text> elements (children of `spem words.ly` anchors)
    // must receive `data-part` directly. Tighter assertion than a bare
    // `data-part="[0-4]"` check, which would be satisfied by the note
    // anchors alone — a regression in the words-vs-notes branch in
    // postprocessSvg would slip through otherwise.
    expect(output).toMatch(/<text[^>]*data-part="[0-4]"/);

    // Should strip height and width from the root <svg> element
    expect(output).not.toMatch(/<svg[^>]*\sheight=/);
    expect(output).not.toMatch(/<svg[^>]*\swidth=/);
  }, 15000);

  it("preserves processing of well-formed anchors when an earlier anchor has a malformed href", () => {
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100">
  <a xlink:href="textedit:///spem.ly:1:0:0?bad=%ZZ">
    <text>malformed</text>
  </a>
  <a xlink:href="textedit:///spem.ly:1:0:0">
    <text>well-formed</text>
  </a>
</svg>`;

    // Fixture variable names must match postprocessSvg's notePattern /
    // wordsPattern. Otherwise parseVariables returns an empty map and
    // the well-formed anchor's data-part assertion would be vacuous.
    const spemLy = `notesIASoprano = \\relative c' { c' }`;
    const wordsLy = `wordsIASoprano = \\lyricmode { la }`;

    const malformedSvg = join(tmpDir, "malformed-test.svg");
    const malformedSpem = join(tmpDir, "malformed-spem.ly");
    const malformedWords = join(tmpDir, "malformed-spem words.ly");

    writeFileSync(malformedSvg, svgContent, "utf-8");
    writeFileSync(malformedSpem, spemLy, "utf-8");
    writeFileSync(malformedWords, wordsLy, "utf-8");

    expect(() =>
      postprocessSvg(malformedSvg, malformedSpem, malformedWords)
    ).not.toThrow();

    const output = readFileSync(malformedSvg, "utf-8");

    // Both anchors unwrapped — text content survives as direct children.
    expect(output).not.toMatch(/<a\s/);
    expect(output).toMatch(/>well-formed</);
    expect(output).toMatch(/>malformed</);

    // Well-formed anchor's child was classified (loop did not abort on
    // the malformed throw); malformed anchor's child was not classified
    // (the `if (href)` guard suppressed the includes() checks).
    expect(output).toMatch(/<text[^>]*data-part="0"[^>]*>well-formed/);
    expect(output).toMatch(/<text(?![^>]*data-part)[^>]*>malformed/);

    // Defence in depth: exactly one data-part in the output.
    const dataParts = output.match(/data-part="\d+"/g) || [];
    expect(dataParts).toEqual(['data-part="0"']);
  });
});
