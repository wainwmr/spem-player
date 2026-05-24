import { execSync } from "child_process";
import { mkdtempSync, copyFileSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

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
    execSync(
      `node build/postprocessSvg.mjs "${tmpSvg}" --spem "${tmpSpem}" --words "${tmpWords}"`,
      { cwd: process.cwd(), encoding: "utf-8" }
    );

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
});
