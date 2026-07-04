import { describe, it, expect, vi, afterEach } from "vitest";

// buildScore must shell out without a shell, so mock the exec layer and the
// fs/postprocess touchpoints it hits between entry and the exec call. The render
// runs through promisified execFile (#760), so the mock invokes execFile's
// callback to resolve; execSync/execFileSync stay mocked to assert neither is
// used.
vi.mock("child_process", () => ({
  execSync: vi.fn(),
  execFileSync: vi.fn(),
  execFile: vi.fn((...args: unknown[]) => {
    const cb = args[args.length - 1];
    if (typeof cb === "function") {
      (cb as (e: unknown, r: unknown) => void)(null, { stdout: "", stderr: "" });
    }
  }),
}));
// existsSync:false makes rawNeedsRender() short-circuit true at its first check,
// so buildScore skips the real statSync and reaches the (mocked) exec call;
// mkdirSync/copyFileSync are stubbed because buildScore creates the output dir
// and copies the raw render to the final path before postprocessing (#760).
vi.mock("fs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("fs")>()),
  existsSync: () => false,
  mkdirSync: () => undefined,
  copyFileSync: () => undefined,
}));
// isMainModule is stubbed to false so importing buildScores.mjs does not run
// main() during the test (buildScores now guards its entry with it, #760/#555).
vi.mock("../build/postprocessSvg.mjs", () => ({
  postprocessSvg: vi.fn(),
  isMainModule: () => false,
}));

import { execSync, execFileSync, execFile } from "child_process";
import {
  validateOptions,
  buildScore,
  lilypondCommand,
} from "../build/buildScores.mjs";

afterEach(() => {
  vi.clearAllMocks();
});

describe("validateOptions value whitelist (#624)", () => {
  // validateOptions calls process.exit(1) on rejection; capture that as a throw.
  function run(options: Record<string, unknown>): string | null {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: number) => {
        throw new Error(`exit:${code}`);
      });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      validateOptions(options);
      return null;
    } catch (e) {
      return (e as Error).message;
    } finally {
      exitSpy.mockRestore();
      errSpy.mockRestore();
    }
  }

  it("accepts whitelisted version and notation values", () => {
    expect(run({ version: "Hugh Keyte", notation: "early" })).toBeNull();
    expect(run({ version: "OUP", notation: "modern" })).toBeNull();
  });

  it("accepts omitted version/notation (defaults are applied later)", () => {
    expect(run({})).toBeNull();
    expect(run({ notation: null })).toBeNull();
  });

  it("accepts a bare --version/--notation flag (true is left to the earlier loop)", () => {
    // The whitelist loop skips value === true; the bare-flag loop above it is
    // what rejects a bare --version. Document that interaction here so a future
    // reorder of the two loops is caught (Vera 624-S3).
    expect(run({ version: true })).toBe("exit:1");
    expect(run({ notation: true })).toBe("exit:1");
  });

  it("rejects a version outside the whitelist", () => {
    expect(run({ version: "Evil Edition" })).toBe("exit:1");
  });

  it("rejects a notation outside the whitelist", () => {
    expect(run({ notation: "baroque" })).toBe("exit:1");
  });

  it("rejects a shell-metacharacter injection payload in --version (#624)", () => {
    expect(run({ version: '" & echo INJECTED & ' })).toBe("exit:1");
  });
});

describe("lilypondCommand LILYPOND_CMD parsing (#624)", () => {
  // lilypondCommand calls process.exit(1) with a specific message on bad input.
  // Capture the exit as a throw and the console.error text so we can assert the
  // branch that fired. These error paths gate an exec call and were previously
  // untested (Vera 624-03).
  function call(envValue: string | undefined): {
    result: string[] | null;
    exited: boolean;
    errMsg: string;
  } {
    const prev = process.env.LILYPOND_CMD;
    if (envValue === undefined) delete process.env.LILYPOND_CMD;
    else process.env.LILYPOND_CMD = envValue;
    let errMsg = "";
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });
    const errSpy = vi
      .spyOn(console, "error")
      .mockImplementation((m?: unknown) => {
        errMsg += String(m) + "\n";
      });
    try {
      return { result: lilypondCommand(), exited: false, errMsg };
    } catch {
      return { result: null, exited: true, errMsg };
    } finally {
      exitSpy.mockRestore();
      errSpy.mockRestore();
      if (prev === undefined) delete process.env.LILYPOND_CMD;
      else process.env.LILYPOND_CMD = prev;
    }
  }

  it("defaults to ['lilypond'] when LILYPOND_CMD is unset", () => {
    expect(call(undefined)).toMatchObject({
      result: ["lilypond"],
      exited: false,
    });
  });

  it("returns a valid override array verbatim", () => {
    expect(call('["node", "/fake/helper.js"]').result).toEqual([
      "node",
      "/fake/helper.js",
    ]);
  });

  it("rejects a non-JSON value (the most likely typo: no brackets)", () => {
    const r = call("lilypond");
    expect(r.exited).toBe(true);
    expect(r.errMsg).toContain("must be a JSON array");
  });

  it("rejects JSON that is not an array", () => {
    const r = call('"lilypond"');
    expect(r.exited).toBe(true);
    expect(r.errMsg).toContain("non-empty JSON array");
  });

  it("rejects an empty array", () => {
    const r = call("[]");
    expect(r.exited).toBe(true);
    expect(r.errMsg).toContain("non-empty JSON array");
  });

  it("rejects an array with a non-string element", () => {
    const r = call("[1, 2]");
    expect(r.exited).toBe(true);
    expect(r.errMsg).toContain("non-empty JSON array");
  });
});

describe("buildScore shells out without a shell (#624)", () => {
  // The render now runs through promisified execFile (#760), so buildScore is
  // async and the no-shell guarantee is asserted against execFile — the array
  // form and literal-argument property are unchanged from the execFileSync era.
  it("invokes execFile with an argument array, never a shell string", async () => {
    await buildScore("/src/Choir I A.ly", "Hugh Keyte", "early", 0, "/out");

    expect(execFile).toHaveBeenCalledTimes(1);
    const [cmd, args, opts] = vi.mocked(execFile).mock.calls[0];
    expect(cmd).toBe("lilypond");
    expect(Array.isArray(args)).toBe(true);
    expect(args).toContain("--svg");
    expect(args).toContain("-o");
    expect(args).toContain("/src/Choir I A.ly");

    // The property that actually defeats injection: no shell. With shell:true,
    // execFile re-joins the array through a shell and the guarantee is lost, yet
    // every assertion above would still pass — so pin it explicitly (Vera 624-S1).
    expect((opts as { shell?: unknown } | undefined)?.shell).toBeFalsy();

    // Neither the sync exec APIs nor the vulnerable execSync string form run.
    expect(execSync).not.toHaveBeenCalled();
    expect(execFileSync).not.toHaveBeenCalled();
  });

  it("passes a metacharacter-laden outDir to execFile as one literal arg (#624)", async () => {
    // outDir flows from --outDir (deliberately not whitelisted, since it is a
    // real user path). execFile (no shell) must pass it literally, so a
    // shell-metacharacter value cannot inject. Pins the bug class against a
    // future revert to a template string on the -o argument (Vera 624-06).
    await buildScore("/src/Choir I A.ly", "Hugh Keyte", "early", 0, "/out; touch pwned");

    const args = vi.mocked(execFile).mock.calls[0][1] as string[];
    const outArg = args[args.indexOf("-o") + 1];
    expect(outArg).toContain("; touch pwned"); // survived as a literal segment
    expect(outArg).toContain("Hugh Keyte");
    // It is a single argv element, not split on the metacharacters.
    expect(args.filter((a) => a.includes("touch pwned"))).toHaveLength(1);
    expect(execSync).not.toHaveBeenCalled();
  });

  it("honours a LILYPOND_CMD override as [binary, ...prefix] (#624)", async () => {
    const prev = process.env.LILYPOND_CMD;
    process.env.LILYPOND_CMD = JSON.stringify(["node", "/fake/helper.js"]);
    try {
      await buildScore("/src/Choir I A.ly", "Hugh Keyte", "early", 0, "/out");
      const [cmd, args] = vi.mocked(execFile).mock.calls[0];
      expect(cmd).toBe("node");
      expect(args?.[0]).toBe("/fake/helper.js");
      expect(args).toContain("--svg");
      expect(args).toContain("/src/Choir I A.ly");
    } finally {
      if (prev === undefined) delete process.env.LILYPOND_CMD;
      else process.env.LILYPOND_CMD = prev;
    }
  });
});
