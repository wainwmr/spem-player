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

  it("handles malformed anchor hrefs gracefully", () => {
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100">
  <a xlink:href="textedit:///test%ZZ.ly:1:2:3">
    <text>malformed</text>
  </a>
  <a xlink:href="textedit:///spem.ly:1:0:0">
    <text>well-formed</text>
  </a>
</svg>`;

    const spemLy = `\\notesSoprano = \\relative c' \\new Voice = "soprano" { c' }`;
    const wordsLy = `\\wordsSoprano = \\lyricmode \\new Lyrics = "wordsSoprano" { la }`;

    const tmpSvg = join(tmpDir, "malformed-test.svg");
    const tmpSpem = join(tmpDir, "malformed-spem.ly");
    const tmpWords = join(tmpDir, "malformed-spem words.ly");

    writeFileSync(tmpSvg, svgContent, "utf-8");
    writeFileSync(tmpSpem, spemLy, "utf-8");
    writeFileSync(tmpWords, wordsLy, "utf-8");

    expect(() => postprocessSvg(tmpSvg, tmpSpem, tmpWords)).not.toThrow();

    const output = readFileSync(tmpSvg, "utf-8");

    // Both anchors should be unwrapped
    expect(output).not.toMatch(/<a\s/);
    expect(output).not.toMatch(/<\/a>/);

    // Malformed anchor should have no data-part; well-formed may or may not
    // depending on whether the href matches a variable range.
    // The key assertion is that processing completed without throwing.
  });
});
