// Unit tests for the version-guard decision function (ticket #810).
// Run with: node --test .github/scripts/version-check.test.mjs
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decideVersion,
  classify,
  owesBump,
  isAppSource,
  exitCodeFor,
  readOpenPrVersions,
  main,
  NON_SHIPPING_PWA_FILES,
  USER_FACING_TYPES,
  INTERNAL_TYPES,
  PR_LIST_LIMIT,
} from "./version-check.mjs";

// The PR under test. `allOpenPrs` is EVERY open PR INCLUDING this one: the guard
// fails closed if it cannot see itself in the list, because an empty or wrong-repo
// list would otherwise read as "nothing to collide with".
const SELF = 810;
const alone = [{ number: SELF, version: "0.0.0" }];
const withPeers = (...peers) => [{ number: SELF, version: "0.0.0" }, ...peers];

const APP = ["packages/pwa/src/ts/MusicScore.ts"]; // ships
const NOT_APP = ["packages/monitor/monitor-resources.mjs"]; // does not ship

const at = (prVersion, mainVersion, changedPaths = APP, allOpenPrs = alone) => ({
  prVersion,
  mainVersion,
  changedPaths,
  allOpenPrs,
  selfNumber: SELF,
});

describe("isAppSource: what actually ships", () => {
  it("counts the PWA's shipped source", () => {
    for (const p of [
      "packages/pwa/src/ts/MusicScore.ts",
      "packages/pwa/src/scss/style.scss",
      "packages/pwa/index.ts",
      "packages/pwa/index.html",
      "packages/pwa/public/spem.json",
      "packages/pwa/vite.config.ts", // a resolver change DOES change the bundle (#610)
    ]) {
      assert.equal(isAppSource(p), true, p);
    }
  });

  it("counts packages/scores/src, which vite aliases as @scores and bundles", () => {
    assert.equal(isAppSource("packages/scores/src/lily/lilyData.json"), true);
    assert.equal(isAppSource("packages/scores/src/lily/music-classes.ts"), true);
  });

  it("does NOT count things that cannot reach the bundle", () => {
    for (const p of [
      "packages/pwa/package.json", // the version file itself: counting it is circular
      "packages/pwa/src/test/lily.test.ts",
      "packages/pwa/e2e/splitter-cursor.spec.ts",
      "packages/pwa/eslint.config.js",
      "packages/pwa/playwright.config.ts",
      "packages/scores/build/buildScores.mjs", // the LilyPond pipeline, not the app
      "packages/monitor/monitor-resources.mjs",
      ".github/workflows/version-check.yml",
      "doc/CI.md",
    ]) {
      assert.equal(isAppSource(p), false, p);
    }
  });

  // The lockfile IS build input. Everything the PWA builds with (vite, vite-plugin-pwa,
  // sass-embedded, workbox-window) is a devDependency, so its output is the bundle.
  // Without this, a dependency change is structurally invisible to the guard: it touches
  // only the lockfile and the version file, and both were excluded.
  it("counts pnpm-lock.yaml: a dependency change alters the bundle", () => {
    assert.equal(isAppSource("pnpm-lock.yaml"), true);
  });

  it("a Dependabot dev-dep bump still owes no bump (internal intent), despite the lockfile", () => {
    assert.equal(
      owesBump(
        ["[deps](deps-dev): bump prettier from 3.8.4 to 3.9.5 (#769)"],
        ["packages/pwa/package.json", "pnpm-lock.yaml"],
      ),
      false,
      "Dependabot cannot bump the app version and its PRs auto-merge",
    );
  });

  it("but a HUMAN user-facing PR that changes dependencies DOES owe a bump", () => {
    assert.equal(owesBump(["fix: upgrade vite to stop the stall"], ["pnpm-lock.yaml"]), true);
  });
});

describe("classify: user-facing, internal, or unrecognised", () => {
  it("has exactly the expected type memberships", () => {
    assert.deepEqual([...USER_FACING_TYPES].sort(), ["feat", "feature", "fix", "perf", "revert"]);
    assert.deepEqual(
      [...INTERNAL_TYPES].sort(),
      ["build", "chore", "ci", "docs", "refactor", "style", "test", "tooling"],
    );
  });

  it("classifies the user-facing types", () => {
    for (const t of ["feat", "feature", "fix", "perf", "revert"]) {
      assert.equal(classify(`${t}: a change`), "user-facing", t);
    }
  });

  it("classifies the internal types", () => {
    for (const t of ["build", "chore", "ci", "docs", "refactor", "style", "test", "tooling"]) {
      assert.equal(classify(`${t}: a change`), "internal", t);
    }
  });

  // A capitalised type matched the regex, missed the lowercase lookup, and was a
  // CONFIDENT internal: a user-facing change shipped unbumped with a green tick.
  it("lowercases the type, so `Fix:` is not silently internal", () => {
    assert.equal(classify("Fix: crash on cold load"), "user-facing");
    assert.equal(classify("PERF: faster load"), "user-facing");
  });

  // A type it has never heard of must NOT collapse into "internal".
  it("calls an unknown conventional type unrecognised, not internal", () => {
    for (const s of ["bugfix: a crash", "hotfix: a crash", "patch: a thing", "wip"]) {
      assert.equal(classify(s), "unrecognised", s);
    }
  });

  // Neither `git revert` nor GitHub's button ever writes `revert:`. Matching only
  // that literal type covered nothing this repo actually produces.
  it("unwraps the real revert subject and inherits the reverted intent", () => {
    assert.equal(
      classify('Revert "fix: honour control changes during the audio load window (#805)"'),
      "user-facing",
    );
    assert.equal(classify('Revert "ci: add metadata:read permission"'), "internal");
  });

  // Dependabot cannot bump the app version and its PRs auto-merge, so a red here is
  // a red nobody can clear. Bumping prettier reformatted lily.ts in #769.
  it("treats a dependabot DEV-dependency subject as internal", () => {
    assert.equal(classify("[deps](deps-dev): bump prettier from 3.8.4 to 3.9.5 (#769)"), "internal");
  });

  // A RUNTIME dependency bump would change the bundle. None exists today; it must
  // fail SAFE if one appears.
  it("does NOT extend that exemption to a runtime dependency bump", () => {
    assert.notEqual(classify("[deps](deps): bump vite from 8.1.0 to 9.0.0"), "internal");
  });
});

describe("owesBump: BOTH signals must fire", () => {
  it("owes a bump only when app source changes AND the intent is not internal", () => {
    assert.equal(owesBump(["fix: a real bug"], APP), true);
    assert.equal(owesBump(["fix: a real bug"], NOT_APP), false, "no app source: nothing ships");
    assert.equal(owesBump(["chore: tidy"], APP), false, "internal intent");
    assert.equal(owesBump(["chore: tidy"], NOT_APP), false);
  });

  // The five real merged commits my scope-based first attempt would have red-flagged.
  it("does not red-flag an unscoped fix: outside the app (the false reds of the scope rule)", () => {
    assert.equal(
      owesBump(
        ["fix: value-preserving merge for monitor-series.json mergedPRs (#802)"],
        ["packages/monitor/merge-monitor-series.mjs"],
      ),
      false,
    );
    assert.equal(
      owesBump(
        ["fix: restore ESLint coverage for packages/monitor .mjs files (#617)"],
        ["packages/pwa/eslint.config.js"],
      ),
      false,
    );
  });

  // The Vera gate appends `fix: ... (Vera NNN-NN)` commits to the branch it reviews.
  // Under a type-only rule that turned every gated CI-only PR red and told the author
  // to bump the app version, burning a number a real PR was racing for.
  it("does not red-flag a CI-only PR carrying the Vera gate's own fix: commits", () => {
    const subjects = [
      "ci: cache generated SVGs to skip LilyPond on unchanged inputs (#421)",
      "fix: refuse a score cache key over zero inputs (Vera 421-02)",
      "fix: fail the CI key step on an invalid cache key (Vera 421-01)",
    ];
    assert.equal(owesBump(subjects, [".github/workflows/pwa-ci.yml"]), false);
  });

  // The repo squash-merges, so the PR TITLE is what lands on main. The guard is fed
  // [title, ...branchSubjects] and a user-facing intent in EITHER counts.
  it("catches a user-facing PR title over throwaway branch commits", () => {
    assert.equal(owesBump(["feat: add a metronome", "wip", "tweak"], APP), true);
  });

  it("catches a user-facing branch commit hidden under an internal title", () => {
    assert.equal(owesBump(["chore: tidy up", "fix: the actual crash"], APP), true);
  });

  it("an unrecognised subject touching app source owes a bump (fail-safe)", () => {
    assert.equal(owesBump(["bugfix: the crash"], APP), true);
  });
});

describe("decideVersion: the version rule", () => {
  it("fails a user-facing PR sitting at main's version (bump owed, none carried)", () => {
    const r = decideVersion({ subjects: ["fix: repair the audio load window"], ...at("2.8.10", "2.8.10") });
    assert.equal(r.pass, false);
    assert.equal(r.code, "bump-owed");
  });

  it("fails #804 as it actually shipped: app source changed, version left at main's", () => {
    const r = decideVersion({
      subjects: ["perf: precompute the LilyPond parse at build time (#804)"],
      ...at("2.8.10", "2.8.10"),
    });
    assert.equal(r.pass, false);
    assert.equal(r.code, "bump-owed");
  });

  it("fails the #804/#805 collision: same version as another open PR", () => {
    const r = decideVersion({
      subjects: ["perf: precompute the LilyPond parse at build time (#804)"],
      ...at("2.8.10", "2.8.9", APP, withPeers({ number: 805, version: "2.8.10" })),
    });
    assert.equal(r.pass, false);
    assert.equal(r.code, "collision");
    assert.match(r.message, /#805/);
  });

  it("passes a user-facing PR strictly above main and unique among open PRs", () => {
    const r = decideVersion({
      subjects: ["fix: repair the audio load window"],
      ...at("2.8.11", "2.8.10", APP, withPeers({ number: 807, version: "2.8.12" })),
    });
    assert.equal(r.pass, true);
    assert.equal(r.code, "ok");
  });

  it("passes an internal PR at main's version (the #808 regression guard)", () => {
    const r = decideVersion({ subjects: ["test: cover the loader"], ...at("2.8.10", "2.8.10", NOT_APP) });
    assert.equal(r.pass, true);
  });

  it("passes an internal PR BELOW main's version (main moved under the branch; #808)", () => {
    const r = decideVersion({ subjects: ["test: cover the loader"], ...at("2.8.10", "2.8.11", NOT_APP) });
    assert.equal(r.pass, true);
  });

  it("fails an internal PR carrying a bump (none owed)", () => {
    const r = decideVersion({ subjects: ["test: cover the loader"], ...at("2.8.11", "2.8.10", NOT_APP) });
    assert.equal(r.pass, false);
    assert.equal(r.code, "no-bump-owed");
  });

  it("does not collide a PR with itself", () => {
    const r = decideVersion({
      subjects: ["fix: a bug"],
      ...at("2.8.11", "2.8.10", APP, [{ number: SELF, version: "2.8.11" }]),
    });
    assert.equal(r.pass, true);
  });

  // A string compare ranks "2.8.10" BELOW "2.8.9". Named so the boundary is defended
  // on purpose, not as a side effect of another test's fixture numbers.
  it("orders version segments numerically, not as strings", () => {
    const r = decideVersion({ subjects: ["fix: a bug"], ...at("2.8.10", "2.8.9") });
    assert.equal(r.pass, true, "2.8.10 must rank ABOVE 2.8.9");
  });
});

describe("decideVersion: it fails closed", () => {
  it("fails a malformed version on a USER-FACING PR", () => {
    const r = decideVersion({ subjects: ["fix: a bug"], ...at("next", "2.8.10") });
    assert.equal(r.code, "malformed-version");
  });

  // The `cmp === null` guard is hoisted ahead of both branches. Moving it inside the
  // owed branch leaves an internal PR reaching `if (cmp > 0)`, where `null > 0` is
  // false, and it PASSES on a version it could not parse.
  it("fails a malformed version on an INTERNAL PR too", () => {
    const r = decideVersion({ subjects: ["ci: retune"], ...at("not-a-version", "2.8.12", NOT_APP) });
    assert.equal(r.pass, false, "an unparseable version must never pass, bump owed or not");
    assert.equal(r.code, "malformed-version");
  });

  // parseSemver was unanchored, so these read as 2.8.10 and passed while the code's
  // own comment claimed they would not.
  for (const bad of ["2.8.10-rc.1", "2.8.10.4", "2.8.10junk"]) {
    it(`"${bad}" is not a plain x.y.z and fails closed`, () => {
      const r = decideVersion({ subjects: ["fix: a bug"], ...at(bad, "2.8.9") });
      assert.equal(r.pass, false, `${bad} must not be normalised to 2.8.10`);
      assert.equal(r.code, "malformed-version");
    });
  }

  it("fails closed when the open-PR list is unreadable, distinctly from a collision", () => {
    const r = decideVersion({ subjects: ["fix: a bug"], ...at("2.8.11", "2.8.10", APP, null) });
    assert.equal(r.code, "unreadable");
    assert.doesNotMatch(r.message, /collid/i);
  });

  // The silent pass: an empty list used to mean "nothing to collide with". But the PR
  // under test is ITSELF an open PR, so its absence proves the list cannot be trusted.
  it("fails closed on an EMPTY open-PR list, because this PR must appear in it", () => {
    const r = decideVersion({ subjects: ["fix: a bug"], ...at("2.8.11", "2.8.10", APP, []) });
    assert.equal(r.pass, false, "an empty open-PR list must never read as 'no collision'");
    assert.equal(r.code, "unreadable");
  });

  it("fails closed when the list does not contain this PR (a wrong-repo read)", () => {
    const r = decideVersion({
      subjects: ["fix: a bug"],
      ...at("2.8.11", "2.8.10", APP, [{ number: 999, version: "2.8.10" }]),
    });
    assert.equal(r.code, "unreadable");
    assert.match(r.message, /#810/);
  });

  // compareSemver returns null for an unparseable version, and null === 0 is false,
  // so such a peer used to drop silently out of the collision set.
  it("fails closed on a peer whose version will not parse", () => {
    const r = decideVersion({
      subjects: ["fix: a bug"],
      ...at("2.8.13", "2.8.12", APP, withPeers({ number: 805, version: "null" })),
    });
    assert.equal(r.code, "unreadable-peer");
    assert.match(r.message, /#805/);
  });

  it("fails closed when this PR's number is not an integer", () => {
    const r = decideVersion({
      subjects: ["fix: a bug"],
      prVersion: "2.8.13",
      mainVersion: "2.8.12",
      changedPaths: APP,
      allOpenPrs: alone,
      selfNumber: "810",
    });
    assert.equal(r.pass, false);
    assert.equal(r.code, "unreadable");
  });

  // An internal PR never consults the peer list, so it must not be failed for a peer
  // it never needed to read. Carrying no new version, it cannot collide.
  it("does NOT fail an internal PR when the peer list is unreadable", () => {
    const r = decideVersion({
      subjects: ["docs: fix a typo"],
      ...at("2.8.12", "2.8.12", NOT_APP, null),
    });
    assert.equal(r.pass, true, "an internal PR asks no question the peer list could answer");
  });
});

describe("exitCodeFor: the guard's contract with CI", () => {
  it("maps every verdict code to the right exit code", () => {
    const cases = [
      [{ pass: true, code: "ok" }, 0],
      [{ pass: false, code: "unreadable" }, 2],
      [{ pass: false, code: "unreadable-peer" }, 2],
      [{ pass: false, code: "bump-owed" }, 1],
      [{ pass: false, code: "no-bump-owed" }, 1],
      [{ pass: false, code: "collision" }, 1],
      [{ pass: false, code: "malformed-version" }, 1],
    ];
    for (const [verdict, expected] of cases) {
      assert.equal(exitCodeFor(verdict), expected, verdict.code);
    }
  });
});

describe("readOpenPrVersions: the layer where a silent pass originates", () => {
  const quiet = (fn) => {
    const err = console.error;
    console.error = () => {};
    try {
      return fn();
    } finally {
      console.error = err;
    }
  };
  const listOf = (...prs) => JSON.stringify(prs);

  it("returns every open PR's version, self INCLUDED", () => {
    const run = (cmd, args) =>
      args[0] === "pr"
        ? listOf({ number: 810, headRefOid: "aaa" }, { number: 811, headRefOid: "bbb" })
        : args.join(" ").includes("ref=aaa")
          ? "2.8.12\n"
          : "2.8.13\n";
    assert.deepEqual(readOpenPrVersions("wainwmr/spem-player", run), {
      prs: [
        { number: 810, version: "2.8.12" },
        { number: 811, version: "2.8.13" },
      ],
      skipped: [],
    });
  });

  it("fails closed when `gh pr list` throws", () => {
    const run = () => {
      throw Object.assign(new Error("boom"), { stderr: "HTTP 403 rate limited" });
    };
    assert.equal(quiet(() => readOpenPrVersions("r", run)), null);
  });

  it("fails closed when the list is not an array", () => {
    const run = () => '{"not":"an array"}';
    assert.equal(quiet(() => readOpenPrVersions("r", run)), null);
  });

  it("fails closed on a FULL page, because a full page is evidence of truncation", () => {
    const full = Array.from({ length: PR_LIST_LIMIT }, (_, i) => ({ number: i + 1, headRefOid: "x" }));
    const run = (cmd, args) => (args[0] === "pr" ? JSON.stringify(full) : "2.8.12\n");
    assert.equal(quiet(() => readOpenPrVersions("r", run)), null);
  });

  it("fails closed on a transport error reading a peer's package.json", () => {
    const run = (cmd, args) => {
      if (args[0] === "pr") return listOf({ number: 811, headRefOid: "bbb" });
      throw Object.assign(new Error("boom"), { stderr: "HTTP 403" });
    };
    assert.equal(quiet(() => readOpenPrVersions("r", run)), null);
  });

  // A 404 is INFORMATION, not the absence of it: that head carries no app
  // package.json, so it declares no version and cannot collide. Failing the whole
  // list would red every PR in the repo until that one stale PR was closed.
  // A FORK peer must NEVER be skipped, even on a resolvable 404. GitHub keeps PR heads
  // reachable in the base repo, so `commits/{forkHead}` resolves while
  // `contents/...?ref={forkHead}` 404s. Without the isCrossRepository guard the peer is
  // skipped, its real (possibly colliding) version drops out of the set, and the guard
  // prints "unique among open PRs": a silent pass on the one question it answers.
  it("FAILS CLOSED on a 404 from a FORK peer, even when the ref resolves", () => {
    const run = (cmd, args) => {
      const a = args.join(" ");
      if (args[0] === "pr")
        return JSON.stringify([
          { number: 810, headRefOid: "aaa", isCrossRepository: false },
          { number: 700, headRefOid: "fork", isCrossRepository: true },
        ]);
      // The ref DOES resolve: refResolves() is true, so the fork guard is the only thing
      // standing between this and a silent skip.
      if (a.includes("commits/fork")) return "fork\n";
      if (a.includes("ref=fork")) {
        throw Object.assign(new Error("boom"), { stderr: "gh: Not Found (HTTP 404)" });
      }
      return "2.8.12\n";
    };
    assert.equal(
      quiet(() => readOpenPrVersions("r", run)),
      null,
      "a fork peer must never be dropped from the collision set",
    );
  });

  // THE CRITICAL ONE. The contents API returns 404 for an UNRESOLVABLE REF as well as
  // for a missing path (a fork head, a force-pushed SHA). Skipping that peer would drop
  // a real, possibly colliding version out of the set and then print "unique among open
  // PRs" over it: a silent pass on the exact question this guard answers. So a skip
  // requires PROOF that the ref resolves.
  it("FAILS CLOSED on a 404 whose ref does not resolve (a fork or force-pushed head)", () => {
    const run = (cmd, args) => {
      const a = args.join(" ");
      if (args[0] === "pr")
        return listOf({ number: 810, headRefOid: "aaa" }, { number: 700, headRefOid: "gone" });
      if (a.includes("commits/gone")) {
        // The ref itself does not resolve, so the 404 is NOT "the path is absent".
        throw Object.assign(new Error("boom"), { stderr: "gh: Not Found (HTTP 404)" });
      }
      if (a.includes("ref=gone")) {
        throw Object.assign(new Error("boom"), {
          stderr: "gh: No commit found for the ref gone (HTTP 404)",
        });
      }
      return "2.8.12\n";
    };
    assert.equal(
      quiet(() => readOpenPrVersions("r", run)),
      null,
      "a peer we cannot resolve must not be silently dropped from the collision set",
    );
  });

  it("SKIPS a peer whose package.json 404s, rather than failing every PR in the repo", () => {
    const run = (cmd, args) => {
      if (args[0] === "pr")
        return listOf({ number: 810, headRefOid: "aaa" }, { number: 700, headRefOid: "old" });
      if (args.join(" ").includes("ref=old")) {
        throw Object.assign(new Error("boom"), { stderr: "gh: Not Found (HTTP 404)" });
      }
      return "2.8.12\n";
    };
    assert.deepEqual(quiet(() => readOpenPrVersions("r", run)), {
      prs: [{ number: 810, version: "2.8.12" }],
      skipped: [700],
    });
  });
});

describe("isAppSource: the non-shipping set is pinned by value", () => {
  // Pinned by VALUE, not by iterating the exported list, or deleting a member would
  // remove it from the loop rather than failing the test.
  it("NON_SHIPPING_PWA_FILES has exactly the expected membership", () => {
    assert.deepEqual(
      [...NON_SHIPPING_PWA_FILES].sort(),
      [
        "packages/pwa/.dependency-cruiser.cjs",
        "packages/pwa/.prettierignore",
        "packages/pwa/.prettierrc",
        "packages/pwa/eslint.config.js",
        "packages/pwa/knip.json",
        "packages/pwa/package.json",
        "packages/pwa/playwright.config.ts",
        "packages/pwa/tsconfig.e2e.json",
        "packages/pwa/worktree-ports.ts",
      ].sort(),
    );
  });

  // The repo's Prettier config is `.prettierrc`, so a `prettier.config.*` pattern
  // matched nothing and the file counted as app source: `fix: reformat` would have
  // demanded a version bump. Pin the real filenames.
  it("excludes the tooling configs this repo actually has", () => {
    for (const p of NON_SHIPPING_PWA_FILES) assert.equal(isAppSource(p), false, p);
  });

  // The DEFAULT under packages/pwa/ is IN. A new file added there fails SAFE (a loud
  // red) rather than silently shipping unbumped.
  it("a new, unknown file under packages/pwa/ counts as shipping (fail-safe default)", () => {
    assert.equal(isAppSource("packages/pwa/some-new-thing.ts"), true);
  });

  it("keeps .browserslistrc and .postcssrc.json IN: they shape the built CSS", () => {
    assert.equal(isAppSource("packages/pwa/.browserslistrc"), true);
    assert.equal(isAppSource("packages/pwa/.postcssrc.json"), true);
  });
});

describe("main: the CLI wiring (Vera 810-27)", () => {
  // This layer had NO test, and eight mutations of it survived the whole suite. The
  // worst simply dropped the PR title from `subjects`, which silently reinstates the
  // #804 false green. `env` and `run` are injected so the wiring is assertable.
  const ENV = { PR_NUMBER: "810", PR_TITLE: "chore: tidy", GH_REPO: "wainwmr/spem-player" };

  // A fake git+gh. `calls` records the argv so we can assert WHAT was asked, not just
  // what came back.
  const fake = ({ branchSubjects = ["chore: wip"], paths = ["packages/pwa/src/ts/x.ts"], head = "2.8.12", main: mainV = "2.8.12", peers = [] } = {}) => {
    const calls = [];
    const run = (cmd, args) => {
      calls.push([cmd, ...args].join(" "));
      if (cmd === "git" && args[0] === "log") return branchSubjects.join("\n") + "\n";
      if (cmd === "git" && args[0] === "diff") return paths.join("\n") + "\n";
      if (cmd === "git" && args[0] === "show")
        return JSON.stringify({ version: args[1].startsWith("HEAD") ? head : mainV });
      if (cmd === "gh" && args[0] === "pr")
        return JSON.stringify([{ number: 810, headRefOid: "self" }, ...peers.map((p) => ({ number: p.number, headRefOid: `h${p.number}` }))]);
      if (cmd === "gh" && args[0] === "api") {
        if (args.join(" ").includes("ref=self")) return `${head}\n`;
        const p = peers.find((x) => args.join(" ").includes(`ref=h${x.number}`));
        return `${p.version}\n`;
      }
      throw new Error(`unexpected call: ${cmd} ${args.join(" ")}`);
    };
    return { run, calls };
  };

  const quiet = (fn) => {
    const log = console.log;
    const err = console.error;
    console.log = () => {};
    console.error = () => {};
    try {
      return fn();
    } finally {
      console.log = log;
      console.error = err;
    }
  };

  // THE ONE THAT MATTERS. Branch commits are all `chore:`; the PR TITLE is the
  // user-facing thing, and it is what a multi-commit squash lands. Drop the title from
  // `subjects` and this PR passes with no bump: #804, all over again.
  it("reads the PR TITLE, so a `fix:` title over `chore:` commits owes a bump", () => {
    const { run } = fake({ branchSubjects: ["chore: wip", "chore: tweak"] });
    const code = quiet(() =>
      main({ env: { ...ENV, PR_TITLE: "fix: stop the crash on cold load" }, run }),
    );
    assert.equal(code, 1, "a user-facing PR title over app source must owe a bump");
  });

  it("still reads the BRANCH commits, so a `fix:` commit under a `chore:` title owes a bump", () => {
    const { run } = fake({ branchSubjects: ["chore: wip", "fix: the actual crash"] });
    const code = quiet(() => main({ env: ENV, run }));
    assert.equal(code, 1);
  });

  it("passes an internal PR that changes app source and carries no bump", () => {
    const { run } = fake({ branchSubjects: ["refactor: extract a helper"] });
    assert.equal(quiet(() => main({ env: ENV, run })), 0);
  });

  it("passes a user-facing PR that bumps correctly", () => {
    const { run } = fake({ branchSubjects: ["fix: a bug"], head: "2.8.13", main: "2.8.12" });
    assert.equal(quiet(() => main({ env: { ...ENV, PR_TITLE: "fix: a bug" }, run })), 0);
  });

  it("reads packages/pwa/package.json, NOT the root package.json", () => {
    const { run, calls } = fake();
    quiet(() => main({ env: ENV, run }));
    assert.ok(
      calls.some((c) => c === "git show HEAD:packages/pwa/package.json"),
      "must read the PWA package's version",
    );
    assert.ok(!calls.some((c) => /git show \S+:package\.json$/.test(c)), "must not read the root");
  });

  it("diffs against the MERGE BASE (three dots) and skips merge commits", () => {
    const { run, calls } = fake();
    quiet(() => main({ env: ENV, run }));
    assert.ok(calls.some((c) => c.includes("git diff --name-only origin/main...HEAD")));
    assert.ok(calls.some((c) => c.includes("--no-merges")));
  });

  it("refuses to guess when PR_NUMBER, PR_TITLE or GH_REPO is missing", () => {
    const { run } = fake();
    for (const missing of ["PR_NUMBER", "PR_TITLE", "GH_REPO"]) {
      const env = { ...ENV };
      delete env[missing];
      assert.equal(quiet(() => main({ env, run })), 2, missing);
    }
  });

  it("returns 2 (not 1) when git cannot be read: an infra failure is not a version fault", () => {
    const run = () => {
      throw Object.assign(new Error("boom"), { stderr: "fatal: bad revision" });
    };
    assert.equal(quiet(() => main({ env: ENV, run })), 2);
  });

  it("fails a collision end to end", () => {
    const { run } = fake({
      branchSubjects: ["fix: a bug"],
      head: "2.8.13",
      main: "2.8.12",
      peers: [{ number: 805, version: "2.8.13" }],
    });
    assert.equal(quiet(() => main({ env: { ...ENV, PR_TITLE: "fix: a bug" }, run })), 1);
  });
});
