import {
  mkdtempSync,
  copyFileSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { postprocessSvg } from "../../build/postprocessSvg.mjs";

describe("postprocessSvg build script", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "spem-annotate-test-"));
  const svgSource = "src/scores/Hugh Keyte/modern/Choir I A.svg";
  const spemSource = "src/lilypond/Hugh Keyte/spem.ly";
  const wordsSource = "src/lilypond/Hugh Keyte/spem words.ly";
  const tmpSvg = join(tmpDir, "Choir I A.svg");
  const tmpSpem = join(tmpDir, "spem.ly");
  const tmpWords = join(tmpDir, "spem words.ly");

  beforeAll(() => {
    copyFileSync(svgSource, tmpSvg);
    copyFileSync(spemSource, tmpSpem);
    copyFileSync(wordsSource, tmpWords);
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

    // Should contain data-part attributes for lyrics (text elements are direct children of anchors)
    expect(output).toMatch(/data-part="[0-4]"/);

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
