import { spawnSync } from "child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "node:module";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const require = createRequire(import.meta.url);
const XMLDOM_PACKAGE_DIR = dirname(require.resolve("@xmldom/xmldom/package.json"));

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const BUILD_SCRIPT = join(REPO_ROOT, "packages", "scores", "build", "buildScores.mjs");
const POSTPROCESS_SCRIPT = join(REPO_ROOT, "packages", "scores", "build", "postprocessSvg.mjs");
const FAKE_LILYPOND_LOG = join(
  REPO_ROOT,
  "temp",
  "fake_lilypond_invocations.log"
);

/**
 * Create a fake lilypond helper script and return its directory. The fake is a
 * plain `_fake_lilypond.js` driven via `LILYPOND_CMD = [node, helper]`, not an
 * executable on PATH (#624).
 */
function createFakeLilypond(): string {
  const fakeDir = mkdtempSync(join(tmpdir(), "spem-fake-lilypond-"));

  // Clear any previous log
  if (existsSync(FAKE_LILYPOND_LOG)) {
    rmSync(FAKE_LILYPOND_LOG);
  }

  const helperJs = join(fakeDir, "_fake_lilypond.js");
  writeFileSync(
    helperJs,
    `const fs = require("fs");
const path = require("path");
const args = process.argv.slice(2);

if (args.includes("--version")) {
  const version = process.env.FAKE_LILYPOND_VERSION || "2.26.0";
  console.log(\`GNU LilyPond \${version} (running Guile 3.0)\`);
  process.exit(0);
}

const outdirIdx = args.indexOf("-o");
const outdir = outdirIdx >= 0 ? args[outdirIdx + 1] : ".";
const infile = args[args.length - 1];
const name = path.basename(infile, ".ly");

// Model real LilyPond: it does NOT create its output directory. If the
// target dir is missing it aborts (ticket #318: buildScores.mjs must
// create it first). The original bug shipped because both this fake and
// the test workspace pre-created the dir, masking the missing mkdir.
if (!fs.existsSync(outdir)) {
  process.stderr.write("fatal error: unable to change directory to: " + outdir + "\\n");
  process.exit(2);
}
const svgPath = path.join(outdir, name + ".svg");
fs.writeFileSync(
  svgPath,
  '<?xml version="1.0" encoding="UTF-8"?>\\n' +
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>\\n',
  "utf-8"
);

const logFile = ${JSON.stringify(FAKE_LILYPOND_LOG)};
fs.mkdirSync(path.dirname(logFile), { recursive: true });
fs.appendFileSync(logFile, args.join(" ") + "\\n", "utf-8");
`,
    "utf-8"
  );

  // The build invokes LilyPond via execFileSync(LILYPOND_CMD) with no shell, so
  // the fake is driven as [node, helperJs] (see envWithFakeLilypond) rather than
  // a PATH-resolved .bat/.sh: `node` is a real executable on every platform,
  // whereas execFileSync cannot run a script or a .bat without a shell (#624).
  return fakeDir;
}

/**
 * Return an environment object that points LILYPOND_CMD at the fake lilypond
 * (driven as [node, helper], no shell) and makes node_modules visible via
 * NODE_PATH. The fake is no longer placed on PATH (#624).
 */
function envWithFakeLilypond(fakeDir: string): NodeJS.ProcessEnv {
  const helperJs = join(fakeDir, "_fake_lilypond.js");
  const nodePath = process.env.NODE_PATH
    ? join(REPO_ROOT, "node_modules") +
      (process.platform === "win32" ? ";" : ":") +
      process.env.NODE_PATH
    : join(REPO_ROOT, "node_modules");
  return {
    ...process.env,
    NODE_PATH: nodePath,
    // Drive the fake via execFileSync([node, helper]) — cross-platform, no shell.
    LILYPOND_CMD: JSON.stringify([process.execPath, helperJs]),
  };
}

/**
 * Count SVG files in a directory (non-recursive).
 */
function countSvgs(dir: string): number {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => f.endsWith(".svg")).length;
}

/**
 * Recursively count SVG files.
 */
function countSvgsRecursive(dir: string): number {
  if (!existsSync(dir)) return 0;
  let count = 0;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      count += countSvgsRecursive(path);
    } else if (entry.endsWith(".svg")) {
      count++;
    }
  }
  return count;
}

function countScoreInvocations(): number {
  if (!existsSync(FAKE_LILYPOND_LOG)) return 0;
  const text = readFileSync(FAKE_LILYPOND_LOG, "utf-8").trim();
  if (!text) return 0;
  return text.split("\n").filter((line) => !line.includes("--version")).length;
}

/**
 * Create an isolated workspace with the files buildScores.mjs needs.
 */
function createWorkspace(): string {
  const ws = mkdtempSync(join(tmpdir(), "spem-build-test-"));

  // Copy build scripts
  mkdirSync(join(ws, "packages", "scores", "build"), { recursive: true });
  copyFileSync(BUILD_SCRIPT, join(ws, "packages", "scores", "build", "buildScores.mjs"));
  copyFileSync(POSTPROCESS_SCRIPT, join(ws, "packages", "scores", "build", "postprocessSvg.mjs"));

  // Copy lilypond files
  const lilyDir = join(ws, "packages", "scores", "src", "Hugh Keyte");
  mkdirSync(join(lilyDir, "early"), { recursive: true });
  mkdirSync(join(lilyDir, "modern"), { recursive: true });

  const realLilyDir = join(REPO_ROOT, "packages", "scores", "src", "Hugh Keyte");
  for (const f of readdirSync(join(realLilyDir, "early"))) {
    copyFileSync(join(realLilyDir, "early", f), join(lilyDir, "early", f));
  }
  for (const f of readdirSync(join(realLilyDir, "modern"))) {
    copyFileSync(join(realLilyDir, "modern", f), join(lilyDir, "modern", f));
  }
  copyFileSync(join(realLilyDir, "spem.ly"), join(lilyDir, "spem.ly"));
  copyFileSync(
    join(realLilyDir, "spem words.ly"),
    join(lilyDir, "spem words.ly")
  );

  // Create empty scores dirs
  mkdirSync(join(ws, "packages", "pwa", "src", "scores", "Hugh Keyte", "early"), {
    recursive: true,
  });
  mkdirSync(join(ws, "packages", "pwa", "src", "scores", "Hugh Keyte", "modern"), {
    recursive: true,
  });
  mkdirSync(join(ws, "packages", "pwa", "src", "scores", "OUP"), { recursive: true });

  // Copy @xmldom/xmldom so postprocessSvg.mjs can resolve it
  mkdirSync(join(ws, "packages", "scores", "node_modules", "@xmldom"), { recursive: true });
  cpSync(
    XMLDOM_PACKAGE_DIR,
    join(ws, "packages", "scores", "node_modules", "@xmldom", "xmldom"),
    { recursive: true }
  );

  return ws;
}

describe("buildScores.mjs integration", () => {
  let fakeDir: string;
  let env: NodeJS.ProcessEnv;

  beforeAll(() => {
    fakeDir = createFakeLilypond();
    env = envWithFakeLilypond(fakeDir);
  });

  afterAll(() => {
    rmSync(fakeDir, { recursive: true, force: true });
  });

  it("builds all notations", () => {
    const ws = createWorkspace();
    try {
      const result = spawnSync(
        process.execPath,
        [join(ws, "packages", "scores", "build", "buildScores.mjs")],
        {
          cwd: ws,
          env,
          encoding: "utf-8",
        }
      );

      expect(result.status).toBe(0);
      expect(result.stderr).not.toContain("Error");

      expect(countSvgs(join(ws, "packages", "pwa", "src", "scores", "Hugh Keyte", "early"))).toBe(
        8
      );
      expect(countSvgs(join(ws, "packages", "pwa", "src", "scores", "Hugh Keyte", "modern"))).toBe(
        8
      );
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  }, 60000);

  it("creates missing score output directories on a clean checkout (#318)", () => {
    // Regression: post-#318 src/scores/ is gitignored, so a fresh
    // Netlify/CI checkout has no output directory. Real LilyPond does not
    // create it and aborts; buildScores.mjs must mkdir it first. The fake
    // LilyPond models that strict behaviour, so this test fails if the
    // mkdir is missing.
    const ws = createWorkspace();
    try {
      // Simulate the clean checkout: remove the pre-created score dirs.
      rmSync(join(ws, "packages", "pwa", "src", "scores"), { recursive: true, force: true });

      const result = spawnSync(
        process.execPath,
        [join(ws, "packages", "scores", "build", "buildScores.mjs")],
        { cwd: ws, env, encoding: "utf-8" }
      );

      expect(result.status).toBe(0);
      expect(result.stderr).not.toContain("unable to change directory");
      expect(countSvgs(join(ws, "packages", "pwa", "src", "scores", "Hugh Keyte", "early"))).toBe(
        8
      );
      expect(countSvgs(join(ws, "packages", "pwa", "src", "scores", "Hugh Keyte", "modern"))).toBe(
        8
      );
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  }, 60000);

  it("caches by mtime", () => {
    const ws = createWorkspace();
    try {
      if (existsSync(FAKE_LILYPOND_LOG)) {
        rmSync(FAKE_LILYPOND_LOG);
      }

      const script = join(ws, "packages", "scores", "build", "buildScores.mjs");

      // First run
      const result1 = spawnSync(process.execPath, [script], {
        cwd: ws,
        env,
        encoding: "utf-8",
      });
      expect(result1.status).toBe(0);
      const afterFirst = countScoreInvocations();

      // Second run
      const result2 = spawnSync(process.execPath, [script], {
        cwd: ws,
        env,
        encoding: "utf-8",
      });
      expect(result2.status).toBe(0);
      const afterSecond = countScoreInvocations();

      expect(afterSecond).toBe(afterFirst);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  }, 60000);

  it("rebuilds all scores when a version-root include is newer (Vera 353-01)", () => {
    const ws = createWorkspace();
    try {
      if (existsSync(FAKE_LILYPOND_LOG)) {
        rmSync(FAKE_LILYPOND_LOG);
      }

      const script = join(ws, "packages", "scores", "build", "buildScores.mjs");

      const result1 = spawnSync(process.execPath, [script], {
        cwd: ws,
        env,
        encoding: "utf-8",
      });
      expect(result1.status).toBe(0);
      const afterFirst = countScoreInvocations();
      // First run builds all 16 scores (8 early + 8 modern).
      expect(afterFirst).toBe(16);

      // Touch an edition-root include (spem.ly) two seconds in the future
      // to avoid coarse-FS mtime resolution (FAT/exFAT: 2s).
      const includePath = join(ws, "packages", "scores", "src", "Hugh Keyte", "spem.ly");
      const future = new Date(Date.now() + 2000);
      utimesSync(includePath, future, future);

      const result2 = spawnSync(process.execPath, [script], {
        cwd: ws,
        env,
        encoding: "utf-8",
      });
      expect(result2.status).toBe(0);
      const afterSecond = countScoreInvocations();
      // Edition-root include affects both notations — all 16 rebuild.
      expect(afterSecond).toBe(afterFirst + 16);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  }, 60000);

  it("rebuilds the touched choir's notation when its own .ly is newer (Vera 353-11)", () => {
    const ws = createWorkspace();
    try {
      if (existsSync(FAKE_LILYPOND_LOG)) {
        rmSync(FAKE_LILYPOND_LOG);
      }

      const script = join(ws, "packages", "scores", "build", "buildScores.mjs");

      const result1 = spawnSync(process.execPath, [script], {
        cwd: ws,
        env,
        encoding: "utf-8",
      });
      expect(result1.status).toBe(0);
      const afterFirst = countScoreInvocations();
      expect(afterFirst).toBe(16);

      // Touch a single choir .ly two seconds in the future.
      const choirPath = join(
        ws,
        "packages", "scores", "src", "Hugh Keyte",
        "early",
        "Choir I A.ly"
      );
      const future = new Date(Date.now() + 2000);
      utimesSync(choirPath, future, future);

      const result2 = spawnSync(process.execPath, [script], {
        cwd: ws,
        env,
        encoding: "utf-8",
      });
      expect(result2.status).toBe(0);
      const afterSecond = countScoreInvocations();
      // Over-approximation: touching one early/*.ly rebuilds all 8
      // early scores (notation-level glob), but does NOT touch modern.
      expect(afterSecond).toBe(afterFirst + 8);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  }, 60000);

  it("does NOT rebuild a sibling notation when only one notation changes (Vera 353-07)", () => {
    const ws = createWorkspace();
    try {
      if (existsSync(FAKE_LILYPOND_LOG)) {
        rmSync(FAKE_LILYPOND_LOG);
      }

      const script = join(ws, "packages", "scores", "build", "buildScores.mjs");

      const result1 = spawnSync(process.execPath, [script], {
        cwd: ws,
        env,
        encoding: "utf-8",
      });
      expect(result1.status).toBe(0);
      const afterFirst = countScoreInvocations();
      expect(afterFirst).toBe(16);

      // Touch a modern/.ly two seconds in the future.
      const modernPath = join(
        ws,
        "packages", "scores", "src", "Hugh Keyte",
        "modern",
        "Choir I A.ly"
      );
      const future = new Date(Date.now() + 2000);
      utimesSync(modernPath, future, future);

      const result2 = spawnSync(process.execPath, [script], {
        cwd: ws,
        env,
        encoding: "utf-8",
      });
      expect(result2.status).toBe(0);
      const afterSecond = countScoreInvocations();
      // Only the 8 modern scores should rebuild — early is untouched and
      // shares no dependencies with modern/Choir I A.ly.
      expect(afterSecond).toBe(afterFirst + 8);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  }, 60000);

  it("fails gracefully without lilypond", () => {
    const envNoLilypond = {
      ...process.env,
      PATH: "",
    };
    // Use the default ["lilypond"] (so the spawn fails with ENOENT) even if the
    // ambient/CI environment has LILYPOND_CMD set — the rest of the suite sets it.
    delete envNoLilypond.LILYPOND_CMD;

    const result = spawnSync(process.execPath, [BUILD_SCRIPT], {
      cwd: REPO_ROOT,
      env: envNoLilypond,
      encoding: "utf-8",
    });

    expect(result.status).not.toBe(0);
    const output = (result.stdout + result.stderr).toLowerCase();
    expect(output).toContain("lilypond");
    // No shell runs now (execFileSync): an absent lilypond fails to spawn with
    // ENOENT (status null), not a shell "command not found"/"not recognized".
    // checkLilypond's evidence line (#549) carries that message to stderr, so
    // pin ENOENT — the one class an absent binary produces under execFileSync.
    expect(result.stderr).toMatch(/ENOENT/);
    expect(result.stderr).toMatch(/\(status: (?:\d+|none), signal: none\)/);
  });

  it("reports the raw --version output when the version cannot be parsed (#549)", () => {
    // createWorkspace() containment: if the guarded regression ever occurs
    // (parse failure not detected), the build proceeds and the fake would
    // overwrite real gitignored src/scores SVGs with stubs. Contain it.
    const ws = createWorkspace();
    try {
      const envWeird = {
        ...env,
        FAKE_LILYPOND_VERSION: "weird-build",
      };

      const result = spawnSync(
        process.execPath,
        [join(ws, "packages", "scores", "build", "buildScores.mjs")],
        {
          cwd: ws,
          env: envWeird,
          encoding: "utf-8",
        }
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("LilyPond unknown is installed");
      expect(result.stderr).toContain("'lilypond --version' stdout was");
      expect(result.stderr).toContain("weird-build");
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it("fails when lilypond version is too old", () => {
    const ws = createWorkspace();
    try {
      const envOld = {
        ...env,
        FAKE_LILYPOND_VERSION: "2.24.4",
      };

      const result = spawnSync(
        process.execPath,
        [join(ws, "packages", "scores", "build", "buildScores.mjs")],
        {
          cwd: ws,
          env: envOld,
          encoding: "utf-8",
        }
      );

      expect(result.status).not.toBe(0);
      const output = (result.stdout + result.stderr).toLowerCase();
      expect(output).toContain("2.26.0");
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it("deletes SVG on post-processing failure", () => {
    const ws = createWorkspace();
    try {
      // Replace postprocessSvg with a script that throws
      const brokenPostprocess = `export function postprocessSvg(svgPath) { throw new Error("Simulated postprocess failure"); }`;
      writeFileSync(
        join(ws, "packages", "scores", "build", "postprocessSvg.mjs"),
        brokenPostprocess,
        "utf-8"
      );

      const result = spawnSync(
        process.execPath,
        [join(ws, "packages", "scores", "build", "buildScores.mjs")],
        {
          cwd: ws,
          env,
          encoding: "utf-8",
        }
      );

      expect(result.status).not.toBe(0);
      const svgPath = join(
        ws,
        "packages",
        "pwa",
        "src",
        "scores",
        "Hugh Keyte",
        "early",
        "Choir I A.svg"
      );
      expect(existsSync(svgPath)).toBe(false);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it("does not build OUP", () => {
    const ws = createWorkspace();
    try {
      if (existsSync(FAKE_LILYPOND_LOG)) {
        rmSync(FAKE_LILYPOND_LOG);
      }

      const result = spawnSync(
        process.execPath,
        [join(ws, "packages", "scores", "build", "buildScores.mjs")],
        {
          cwd: ws,
          env,
          encoding: "utf-8",
        }
      );
      expect(result.status).toBe(0);

      if (existsSync(FAKE_LILYPOND_LOG)) {
        const invocations = readFileSync(FAKE_LILYPOND_LOG, "utf-8")
          .trim()
          .split("\n");
        const oupInvocations = invocations.filter((line) =>
          line.includes("OUP")
        );
        expect(oupInvocations.length).toBe(0);
      }

      const oupDir = join(ws, "packages", "pwa", "src", "scores", "OUP");
      if (existsSync(oupDir)) {
        expect(countSvgsRecursive(oupDir)).toBe(0);
      }
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  }, 60000);

  it("rejects bare --notation without a value (#306)", () => {
    const result = spawnSync(
      process.execPath,
      [BUILD_SCRIPT, "--notation"],
      { cwd: REPO_ROOT, encoding: "utf-8" }
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--notation requires a value");
    expect(result.stderr).toContain("early");
    expect(result.stderr).toContain("modern");
  });

  it("rejects bare --version without a value (#306)", () => {
    const result = spawnSync(
      process.execPath,
      [BUILD_SCRIPT, "--version"],
      { cwd: REPO_ROOT, encoding: "utf-8" }
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--version requires a value");
    expect(result.stderr).toContain("Hugh Keyte");
    expect(result.stderr).toContain("OUP");
  });

  it("rejects bare --choir without a value (#306)", () => {
    const result = spawnSync(
      process.execPath,
      [BUILD_SCRIPT, "--choir"],
      { cwd: REPO_ROOT, encoding: "utf-8" }
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("--choir requires a value");
  });

  it("rebuilds when postprocessSvg.mjs is newer (#393)", () => {
    const ws = createWorkspace();
    try {
      if (existsSync(FAKE_LILYPOND_LOG)) {
        rmSync(FAKE_LILYPOND_LOG);
      }

      const script = join(ws, "packages", "scores", "build", "buildScores.mjs");

      // First run
      const result1 = spawnSync(process.execPath, [script], {
        cwd: ws,
        env,
        encoding: "utf-8",
      });
      expect(result1.status).toBe(0);
      const afterFirst = countScoreInvocations();
      expect(afterFirst).toBe(16);

      // Touch postprocessSvg.mjs two seconds in the future
      const postprocessPath = join(ws, "packages", "scores", "build", "postprocessSvg.mjs");
      const future = new Date(Date.now() + 2000);
      utimesSync(postprocessPath, future, future);

      const result2 = spawnSync(process.execPath, [script], {
        cwd: ws,
        env,
        encoding: "utf-8",
      });
      expect(result2.status).toBe(0);
      const afterSecond = countScoreInvocations();

      // All scores should rebuild because postprocessor changed.
      expect(afterSecond).toBe(afterFirst + 16);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  }, 60000);

  it("deletes SVG on lilypond failure (#394)", () => {
    const ws = createWorkspace();
    let failDir: string | undefined;
    try {
      // First, build successfully so SVG exists
      const result1 = spawnSync(
        process.execPath,
        [join(ws, "packages", "scores", "build", "buildScores.mjs")],
        { cwd: ws, env, encoding: "utf-8" }
      );
      expect(result1.status).toBe(0);

      const svgPath = join(
        ws,
        "packages",
        "pwa",
        "src",
        "scores",
        "Hugh Keyte",
        "early",
        "Choir I A.svg"
      );
      expect(existsSync(svgPath)).toBe(true);

      // Touch a .ly file to force rebuild
      const lyPath = join(
        ws,
        "packages", "scores", "src", "Hugh Keyte",
        "early",
        "Choir I A.ly"
      );
      const future = new Date(Date.now() + 2000);
      utimesSync(lyPath, future, future);

      // Create a fake lilypond that fails on build but answers --version
      failDir = mkdtempSync(join(tmpdir(), "spem-fail-lilypond-"));
      const failHelperJs = join(failDir, "_fake_lilypond.js");
      writeFileSync(
        failHelperJs,
        `const args = process.argv.slice(2);\n` +
          `if (args.includes("--version")) {\n` +
          `  console.log("GNU LilyPond 2.26.0 (running Guile 3.0)");\n` +
          `  process.exit(0);\n` +
          `}\n` +
          `console.error("fatal error: simulated lilypond failure");\n` +
          `process.exit(2);\n`,
        "utf-8"
      );

      // Point LILYPOND_CMD at the failing helper via [node, helper] — the same
      // no-shell, cross-platform mechanism the success fake uses (#624).
      const envFail = {
        ...env,
        LILYPOND_CMD: JSON.stringify([process.execPath, failHelperJs]),
      };

      const result2 = spawnSync(
        process.execPath,
        [join(ws, "packages", "scores", "build", "buildScores.mjs")],
        { cwd: ws, env: envFail, encoding: "utf-8" }
      );

      expect(result2.status).not.toBe(0);
      // Pin the failure to the simulated fake: a fallthrough to the success
      // fake or a version-check failure would not carry this marker
      // (Vera 539-03).
      expect(result2.stderr).toContain("simulated lilypond failure");
      expect(existsSync(svgPath)).toBe(false);
    } finally {
      rmSync(ws, { recursive: true, force: true });
      if (failDir) rmSync(failDir, { recursive: true, force: true });
    }
  }, 60000);
});
