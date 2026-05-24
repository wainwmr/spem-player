import { execSync, spawnSync } from "child_process";
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
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const REPO_ROOT = resolve(process.cwd());
const BUILD_SCRIPT = join(REPO_ROOT, "build", "buildScores.mjs");
const POSTPROCESS_SCRIPT = join(REPO_ROOT, "build", "postprocessSvg.mjs");
const FAKE_LILYPOND_LOG = join(
  REPO_ROOT,
  "temp",
  "fake_lilypond_invocations.log"
);

/**
 * Create a fake lilypond executable and return its directory.
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

fs.mkdirSync(outdir, { recursive: true });
const svgPath = path.join(outdir, name + ".svg");
fs.writeFileSync(
  svgPath,
  '<?xml version="1.0" encoding="UTF-8"?>\\n' +
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>\\n',
  "utf-8"
);

const logFile = ${JSON.stringify(FAKE_LILYPOND_LOG)};
fs.appendFileSync(logFile, args.join(" ") + "\\n", "utf-8");
`,
    "utf-8"
  );

  // Windows batch file
  const bat = join(fakeDir, "lilypond.bat");
  writeFileSync(bat, `@echo off\nnode "${helperJs}" %*\n`, "utf-8");

  // Unix shell script
  const sh = join(fakeDir, "lilypond");
  writeFileSync(sh, `#!/bin/sh\nnode "${helperJs}" "$@"\n`, "utf-8");
  try {
    execSync(`chmod +x "${sh}"`);
  } catch {
    // ignore chmod failure on Windows
  }

  return fakeDir;
}

/**
 * Return an environment object with fake lilypond on PATH and node_modules visible.
 */
function envWithFakeLilypond(fakeDir: string): NodeJS.ProcessEnv {
  const nodePath = process.env.NODE_PATH
    ? join(REPO_ROOT, "node_modules") +
      (process.platform === "win32" ? ";" : ":") +
      process.env.NODE_PATH
    : join(REPO_ROOT, "node_modules");
  return {
    ...process.env,
    PATH:
      fakeDir + (process.platform === "win32" ? ";" : ":") + process.env.PATH,
    NODE_PATH: nodePath,
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
  mkdirSync(join(ws, "build"), { recursive: true });
  copyFileSync(BUILD_SCRIPT, join(ws, "build", "buildScores.mjs"));
  copyFileSync(POSTPROCESS_SCRIPT, join(ws, "build", "postprocessSvg.mjs"));

  // Copy lilypond files
  const lilyDir = join(ws, "src", "lilypond", "Hugh Keyte");
  mkdirSync(join(lilyDir, "early"), { recursive: true });
  mkdirSync(join(lilyDir, "modern"), { recursive: true });

  const realLilyDir = join(REPO_ROOT, "src", "lilypond", "Hugh Keyte");
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
  mkdirSync(join(ws, "src", "scores", "Hugh Keyte", "early"), {
    recursive: true,
  });
  mkdirSync(join(ws, "src", "scores", "Hugh Keyte", "modern"), {
    recursive: true,
  });
  mkdirSync(join(ws, "src", "scores", "OUP"), { recursive: true });

  // Copy @xmldom/xmldom so postprocessSvg.mjs can resolve it
  mkdirSync(join(ws, "node_modules", "@xmldom"), { recursive: true });
  cpSync(
    join(REPO_ROOT, "node_modules", "@xmldom", "xmldom"),
    join(ws, "node_modules", "@xmldom", "xmldom"),
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
        [join(ws, "build", "buildScores.mjs")],
        {
          cwd: ws,
          env,
          encoding: "utf-8",
        }
      );

      expect(
        result.status,
        `stderr: ${result.stderr}\nstdout: ${result.stdout}`
      ).toBe(0);
      expect(result.stderr).not.toContain("Error");

      expect(countSvgs(join(ws, "src", "scores", "Hugh Keyte", "early"))).toBe(
        8
      );
      expect(countSvgs(join(ws, "src", "scores", "Hugh Keyte", "modern"))).toBe(
        8
      );
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it("caches by mtime", () => {
    const ws = createWorkspace();
    try {
      if (existsSync(FAKE_LILYPOND_LOG)) {
        rmSync(FAKE_LILYPOND_LOG);
      }

      const script = join(ws, "build", "buildScores.mjs");

      // First run
      const result1 = spawnSync(process.execPath, [script], {
        cwd: ws,
        env,
        encoding: "utf-8",
      });
      expect(
        result1.status,
        `stderr: ${result1.stderr}\nstdout: ${result1.stdout}`
      ).toBe(0);
      const afterFirst = countScoreInvocations();

      // Second run
      const result2 = spawnSync(process.execPath, [script], {
        cwd: ws,
        env,
        encoding: "utf-8",
      });
      expect(
        result2.status,
        `stderr: ${result2.stderr}\nstdout: ${result2.stdout}`
      ).toBe(0);
      const afterSecond = countScoreInvocations();

      expect(afterSecond).toBe(afterFirst);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it("fails gracefully without lilypond", () => {
    const envNoLilypond = {
      ...process.env,
      PATH: "",
    };

    const result = spawnSync(process.execPath, [BUILD_SCRIPT], {
      cwd: REPO_ROOT,
      env: envNoLilypond,
      encoding: "utf-8",
    });

    expect(result.status).not.toBe(0);
    const output = (result.stdout + result.stderr).toLowerCase();
    expect(output).toContain("lilypond");
  });

  it("skips gracefully with --skip-if-missing", () => {
    const envNoLilypond = {
      ...process.env,
      PATH: "",
    };

    const result = spawnSync(
      process.execPath,
      [BUILD_SCRIPT, "--skip-if-missing"],
      {
        cwd: REPO_ROOT,
        env: envNoLilypond,
        encoding: "utf-8",
      }
    );

    expect(result.status).toBe(0);
    const output = (result.stdout + result.stderr).toLowerCase();
    expect(output).toContain("skipping");
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
        [join(ws, "build", "buildScores.mjs")],
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

  it("does not build OUP", () => {
    const ws = createWorkspace();
    try {
      if (existsSync(FAKE_LILYPOND_LOG)) {
        rmSync(FAKE_LILYPOND_LOG);
      }

      const result = spawnSync(
        process.execPath,
        [join(ws, "build", "buildScores.mjs")],
        {
          cwd: ws,
          env,
          encoding: "utf-8",
        }
      );
      expect(
        result.status,
        `stderr: ${result.stderr}\nstdout: ${result.stdout}`
      ).toBe(0);

      if (existsSync(FAKE_LILYPOND_LOG)) {
        const invocations = readFileSync(FAKE_LILYPOND_LOG, "utf-8")
          .trim()
          .split("\n");
        const oupInvocations = invocations.filter((line) =>
          line.includes("OUP")
        );
        expect(oupInvocations.length).toBe(0);
      }

      const oupDir = join(ws, "src", "scores", "OUP");
      if (existsSync(oupDir)) {
        expect(countSvgsRecursive(oupDir)).toBe(0);
      }
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });
});
