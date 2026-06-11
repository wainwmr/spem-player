import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join, relative, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { spawnSync } from "child_process";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { isMainModule } from "../build/postprocessSvg.mjs";

// Module-relative, not process.cwd(): an IDE or non-root vitest invocation
// must not point the script path at nothing.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const POSTPROCESS_SCRIPT = join(
  REPO_ROOT,
  "lilypond",
  "build",
  "postprocessSvg.mjs"
);
const POSTPROCESS_SCRIPT_RELATIVE = relative(REPO_ROOT, POSTPROCESS_SCRIPT);

const SPEM_LY = `notesIASoprano = \\relative c' { c4 d e f }
notesIAAlto = \\relative c' { c4 d e f }
`;

const WORDS_LY = `wordsIASoprano = \\lyricmode { Spem }
wordsIAAlto = \\lyricmode { Spem }
`;

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1000" height="500">
  <a xlink:href="spem.ly:1:1:1">
    <path d="M0,0 L1,1" transform="translate(10,10)"/>
  </a>
</svg>`;

// Node absolutises process.argv[1] at bootstrap, so a spawned child can never
// present the guard with a relative path — and the old broken guard
// (`new URL(process.argv[1], "file://")`) actually matched absolute POSIX
// paths. The inputs that discriminate the old guard from the working one
// (relative argv[1] on any platform; drive-lettered argv[1] on Windows) are
// therefore only reachable by calling the guard directly. These unit tests
// are the #555 regression coverage that works on the Linux CI runner; the
// spawn tests below are the end-to-end smoke.
describe("isMainModule (#555)", () => {
  const scriptUrl = pathToFileURL(POSTPROCESS_SCRIPT).href;

  it("matches an absolute argv[1] naming the same file", () => {
    expect(isMainModule(POSTPROCESS_SCRIPT, scriptUrl)).toBe(true);
  });

  it("matches a cwd-relative argv[1] — the #555 regression input", () => {
    const rel = relative(process.cwd(), POSTPROCESS_SCRIPT);
    expect(isMainModule(rel, scriptUrl)).toBe(true);
  });

  it("rejects a different file", () => {
    expect(isMainModule(join(REPO_ROOT, "package.json"), scriptUrl)).toBe(
      false
    );
  });

  it("treats a missing argv[1] as not-main (REPL, --eval, embedders)", () => {
    expect(isMainModule(undefined, scriptUrl)).toBe(false);
  });

  it("treats a nonexistent argv[1] path as not-main instead of throwing", () => {
    expect(isMainModule(join(REPO_ROOT, "no-such-file.mjs"), scriptUrl)).toBe(
      false
    );
  });
});

describe("postprocessSvg.mjs CLI (#555)", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "spem-cli-test-"));
  const tmpSvg = join(tmpDir, "Choir I A.svg");
  const tmpSpem = join(tmpDir, "spem.ly");
  const tmpWords = join(tmpDir, "spem words.ly");

  beforeEach(() => {
    writeFileSync(tmpSpem, SPEM_LY, "utf-8");
    writeFileSync(tmpWords, WORDS_LY, "utf-8");
    writeFileSync(tmpSvg, SVG, "utf-8");
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function runCli(scriptPath: string, args: string[]) {
    const result = spawnSync(process.execPath, [scriptPath, ...args], {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      timeout: 10_000,
    });
    // A spawn failure leaves status null, which `not.toBe(0)` would accept.
    expect(result.error).toBeUndefined();
    return result;
  }

  it("processes the SVG when invoked via a relative script path (ticket repro)", () => {
    const result = runCli(POSTPROCESS_SCRIPT_RELATIVE, [
      tmpSvg,
      "--spem",
      tmpSpem,
      "--words",
      tmpWords,
    ]);

    expect(result.status).toBe(0);
    const output = readFileSync(tmpSvg, "utf-8");
    expect(output).not.toMatch(/<a\s/);
    expect(output).toMatch(/data-part="0"/);
  }, 15000);

  it("prints usage and exits non-zero when no SVG path is given", () => {
    const result = runCli(POSTPROCESS_SCRIPT, []);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Usage:");
  });

  it("rejects bare --spem without a value", () => {
    const result = runCli(POSTPROCESS_SCRIPT, [tmpSvg, "--spem"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--spem requires a value");
  });

  it("rejects bare --words without a value", () => {
    const result = runCli(POSTPROCESS_SCRIPT, [tmpSvg, "--words"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--words requires a value");
  });

  it("rejects a flag as the value of another flag", () => {
    const result = runCli(POSTPROCESS_SCRIPT, [
      tmpSvg,
      "--spem",
      "--words",
      tmpWords,
    ]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--spem requires a value");
  });

  it("rejects an unknown option instead of silently ignoring it", () => {
    const result = runCli(POSTPROCESS_SCRIPT, [tmpSvg, "--word", tmpWords]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("unknown option --word");
    // The SVG must not have been processed against default paths.
    expect(readFileSync(tmpSvg, "utf-8")).toMatch(/<a\s/);
  });

  it("rejects a surplus positional argument", () => {
    const second = join(tmpDir, "second.svg");
    writeFileSync(second, SVG, "utf-8");
    const result = runCli(POSTPROCESS_SCRIPT, [tmpSvg, second]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("unexpected argument");
  });
});
