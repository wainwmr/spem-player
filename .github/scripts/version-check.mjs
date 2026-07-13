/**
 * CI guard for the app version (ticket #810).
 *
 * Two builds must never ship under one version string. On 2026-07-13 PR #804 and
 * PR #805 each computed their version against `main` alone, both claimed 2.8.10,
 * and the second to merge shipped a different build under an already-published
 * version. That is the failure this guard exists to prevent, and the reason to
 * resist relaxing the rules below.
 *
 * THE RULE
 *
 *   1. A PR that changes APP SOURCE with a user-facing intent must carry a version
 *      strictly above main's, and equal to no other open PR's.
 *   2. Any other PR must carry no bump: its version must not be above main's. (It
 *      may sit BELOW main, which happens whenever main moves under a branch that
 *      correctly did not bump. Requiring equality would fail such a PR; #808 was
 *      exactly that shape.)
 *
 * WHY THE PATH, AND NOT THE COMMIT TYPE ALONE
 *
 * The first cut of this guard classified on the commit type alone (with a list of
 * "internal" scopes). Replayed against the real history of `main`, it demanded a
 * bump on 11 of 21 user-facing-typed commits that correctly shipped without one,
 * because the dominant real shape is an UNSCOPED `fix:` on the monitor package, on
 * lint config, or on a build script. Only 14 of 129 user-facing commits carry any
 * scope at all, so scope could never have carried this weight.
 *
 * Worse, it red-flagged its own review process: the Vera gate appends
 * `fix: ... (Vera NNN-NN)` commits to the branch it reviews, so any CI-only PR that
 * went through a gate would have been told to bump the app version. The escape
 * route (bump to go green) burns a version number a real in-flight PR is racing
 * for. That is a self-inflicted #810.
 *
 * The signal the history actually carries is the PATH: every commit that bumped touched
 * app source; none of the false reds did. So we ask that question directly, and the scope
 * list is gone. (Andrew's ruling, 2026-07-13, on the Vera gate for this branch.)
 *
 * Replayed against all 128 commits merged since `packages/pwa/package.json` was created,
 * the path rule agrees with what actually happened 122 times, with ZERO false greens in
 * either direction, and reds 6.
 *
 * FIVE of those reds are the guard working: #804 itself (`7ad3a8b`), and four commits
 * (`8467e3b`, `8acb303`, `d0127fc`, `73dbee2`) that changed app source and shipped under an
 * unchanged version.
 *
 * The SIXTH is a FALSE red, and it is named here rather than buried: `f2207fb fix: restore
 * ESLint coverage for packages/monitor .mjs files` touches only `pnpm-lock.yaml`, ships
 * nothing to a user, and is red solely because the lockfile counts as app source (see
 * `isAppSource`) under a `fix:` subject. That is the measured cost of closing the
 * dependency hole: one in 128. The remedy is honest typing, not a version burn: a
 * lint-dependency change is `build:` or `tooling:`, not `fix:`. Do NOT clear such a red by
 * bumping the version, which burns a number a real in-flight PR is racing for.
 *
 * The replay is on the Vera report attached to #810.
 *
 * WHAT SHIPS
 *
 * The version guards `packages/pwa/package.json`, which vite injects into
 * `index.html` at build time. `packages/scores/src` is app source too: `vite.config.ts`
 * aliases `@scores` to it and `lilyData.ts` and `config.ts` import from it, so it is
 * bundled. `packages/scores/build` is NOT: it is the LilyPond pipeline that produces
 * the assets, and it does not ship.
 *
 * WHICH SUBJECTS
 *
 * The repo squash-merges with `squash_merge_commit_title: COMMIT_OR_PR_TITLE`, which
 * means the landed subject is the branch COMMIT's when the PR has exactly one commit,
 * and the PR TITLE otherwise. EITHER can be the thing that ships, so the guard reads
 * the union: the title AND the branch commits, with a user-facing intent in any one of
 * them counting. Do not "simplify" the union away to just the title (a single-commit PR
 * would escape) or to just the commits (a `chore: wip` branch under a `feat:` title
 * would escape, which is #804 again).
 *
 * FAIL CLOSED
 *
 * Every LOOKUP here fails closed. A guard that passes when it cannot do its job is
 * worse than no guard, because it manufactures the confidence it was built to earn.
 * Do not add a path that returns `pass: true` on a value that stood in for a failed
 * lookup.
 *
 * KNOWN RESIDUAL, THE TYPE SIGNAL. An INTERNALLY-typed change to app source owes no
 * bump, and this is NOT the rare double-failure it might look like. Measured against
 * history: 12 of 122 passing commits changed app source, shipped no bump, and were
 * green, and they are ordinary honest `refactor:` PRs (`refactor: type fireEvent's
 * CustomEvent detail across the event system`, `refactor: harden colors() against
 * partial CSS load`). Roughly one commit in nine. The path does not mislead there; only
 * the type does, and `refactor:` is the CORRECT type for a change that does alter the
 * bundle.
 *
 * Closing it means dropping the type signal for app-source paths ("app source changed
 * implies a bump"), which would have flagged 18 of 128. That is a RULE CHANGE, not a
 * bug fix, and it is Andrew's and Mark's to make. It is tracked on the Workbench.
 *
 * KNOWN RESIDUAL, DEPENDABOT. A Dependabot dev-dependency bump changes the lockfile,
 * which IS app source, but classifies `internal` and so owes no bump. `vite` is a
 * devDependency, so a bundler bump can ship a different build under an unchanged
 * version. The exemption is deliberate: without it every Dependabot PR goes red, and
 * Dependabot can neither bump the app version nor clear the check, and its PRs
 * auto-merge. Whether that should change is the same call, tracked with the above.
 *
 * A LANDMINE for the day any package gains a real runtime dependency: Dependabot would then
 * emit `[deps](deps):`, which matches neither the dev exemption nor the conventional regex
 * (it starts with `[`), so it classifies `unrecognised`, touches the lockfile, and owes a
 * bump it cannot make. Unreachable today: every `dependencies` block in the repo is empty.
 *
 * The decision lives in `decideVersion`, a pure function. `main` gathers the inputs;
 * `version-check-cli.mjs` is the entry point CI runs.
 */
import { execFileSync } from "node:child_process";

/** Commit types whose intent is a change a user of the app can perceive. */
export const USER_FACING_TYPES = Object.freeze(["feat", "feature", "fix", "perf", "revert"]);

/**
 * Commit types that are internal by nature, whatever they touch.
 *
 * This list exists so that "internal" and "I have never heard of this type" are
 * DIFFERENT answers. Collapsing them (a classifier returning a bare boolean) made an
 * unrecognised type a *confident* internal: `bugfix:` and `hotfix:` match the
 * conventional regex, miss the user-facing lookup, and used to ship a user-facing
 * change with no bump and a green tick. They are now `unrecognised`, which is not
 * internal, so they owe a bump when they touch app source.
 */
export const INTERNAL_TYPES = Object.freeze([
  "build",
  "chore",
  "ci",
  "docs",
  "refactor",
  "style",
  "test",
  "tooling", // live in this repo: 7c7f0bb moved the LilyPond pipeline into @spem/scores
]);

const CONVENTIONAL = /^(\w+)(?:\(([^)]*)\))?!?:/;

/** `git revert` and GitHub's Revert button both write `Revert "<original subject>"`. */
const GIT_REVERT = /^Revert\s+"(.*)"\s*$/i;

/**
 * Dependabot's DEV-dependency subject, e.g. `[deps](deps-dev): bump prettier ...`.
 *
 * It needs naming because the subject matches no conventional type, so it would
 * otherwise be `unrecognised`, and a dependency bump DOES change app source now that the
 * lockfile counts. Without this exemption every Dependabot PR would go red, and
 * Dependabot can neither bump the app version nor clear the check, and its PRs
 * auto-merge. See KNOWN RESIDUAL, DEPENDABOT in the header: the exemption is a
 * deliberate, tracked trade, not an oversight.
 */
const DEPENDABOT_DEV = /^\[deps\]\(deps-dev\)/i;

/**
 * The files under `packages/pwa/` that CANNOT change what a user downloads.
 *
 * Enumerated by exact path, not matched by pattern, because `packages/pwa/` is small
 * and closed (three subdirectories and fourteen top-level files) and a pattern drifts
 * silently: a `prettier.config.*` glob matched nothing here, because this repo's
 * Prettier config is `.prettierrc`, so it was app source and `fix: reformat` would have
 * demanded a version bump.
 *
 * NOT excluded, and deliberately so: `.browserslistrc` and `.postcssrc.json` shape the
 * built CSS through autoprefixer and PostCSS, so they DO affect what ships.
 */
export const NON_SHIPPING_PWA_FILES = Object.freeze([
  "packages/pwa/package.json", // the version file itself: counting it is circular
  "packages/pwa/eslint.config.js",
  "packages/pwa/.prettierrc",
  "packages/pwa/.prettierignore",
  "packages/pwa/knip.json",
  "packages/pwa/.dependency-cruiser.cjs",
  "packages/pwa/playwright.config.ts",
  "packages/pwa/tsconfig.e2e.json",
  "packages/pwa/worktree-ports.ts", // dev-server ports, not the bundle
]);

/**
 * Does a changed path ship in the app bundle?
 *
 * The boundary is "can this change what a user downloads". A false positive is a loud
 * red the author can argue with; a false negative ships a different build under an
 * unchanged version, which is #810. So the DEFAULT under `packages/pwa/` is IN: a new
 * file added there counts as shipping until someone says otherwise, which fails safe.
 */
export function isAppSource(path) {
  const p = path.replace(/\\/g, "/");
  // The lockfile IS build input. `packages/pwa/package.json` declares `dependencies: {}`,
  // so EVERYTHING is a devDependency, `vite`, `vite-plugin-pwa`, `sass-embedded` and
  // `workbox-window` included, and their output is the bundle. Without this line a
  // dependency change is structurally invisible: it touches only the lockfile and the
  // version file, both of which were excluded, so no bump could ever be owed. `pwa-ci`
  // already treats the lockfile as build-affecting in its path filter (doc/CI.md).
  if (p === "pnpm-lock.yaml") return true;
  if (p.startsWith("packages/scores/src/")) return true; // aliased as @scores, bundled
  if (!p.startsWith("packages/pwa/")) return false; // monitor, scores/build, .github, docs
  if (p.startsWith("packages/pwa/src/test/")) return false; // tests do not ship
  if (p.startsWith("packages/pwa/e2e/")) return false; // nor do they
  if (NON_SHIPPING_PWA_FILES.includes(p)) return false;
  return true; // src/, public/, index.html, index.ts, vite.config.ts, tsconfig.json, ...
}

/** @returns {"user-facing" | "internal" | "unrecognised"} */
export function classify(subject) {
  if (DEPENDABOT_DEV.test(subject)) return "internal";
  const reverted = GIT_REVERT.exec(subject);
  // A revert inherits the intent of what it reverts: reverting a shipped `fix:` is
  // itself user-facing. Neither `git revert` nor GitHub's button ever writes
  // `revert:`, so matching only that literal type covered nothing real.
  if (reverted) return classify(reverted[1]);
  const m = CONVENTIONAL.exec(subject);
  if (!m) return "unrecognised"; // a merge subject, a bare `wip`
  const type = m[1].toLowerCase();
  if (USER_FACING_TYPES.includes(type)) return "user-facing";
  if (INTERNAL_TYPES.includes(type)) return "internal";
  return "unrecognised"; // `bugfix:`, `hotfix:`, a typo. (`Fix:` is lowercased above.)
}

/**
 * Does this PR owe a version bump?
 *
 * BOTH signals must fire: an intent that is not plainly internal, AND a change to
 * something that actually ships. Either alone produces the false reds and false
 * greens documented in the header.
 */
export function owesBump(subjects, changedPaths) {
  if (!changedPaths.some(isAppSource)) return false;
  return subjects.map(classify).some((k) => k !== "internal");
}

/**
 * The pure decision.
 *
 * @param {object} input
 * @param {string[]} input.subjects - The PR title, then the branch commit subjects.
 *   Not "commits": the title is what a squash-merge actually lands.
 * @param {string[]} input.changedPaths - `git diff --name-only origin/main...HEAD`.
 * @param {string} input.prVersion - `packages/pwa/package.json` version at the PR head.
 * @param {string} input.mainVersion - The same version at `origin/main`.
 * @param {Array<{number: number, version: string}>|null} input.allOpenPrs -
 *   EVERY open PR's version, INCLUDING this one, or null when it could not be read.
 *   Self-inclusion is not a convenience: when the guard runs, the PR under test is
 *   itself an open PR, so its absence proves the list is not the list we think it
 *   is, and an empty list would otherwise read as "nothing to collide with".
 * @param {number} input.selfNumber - This PR's number. Required.
 * @returns {{pass: boolean, code: string, message: string}}
 */
export function decideVersion({
  subjects,
  changedPaths,
  prVersion,
  mainVersion,
  allOpenPrs,
  selfNumber,
}) {
  const cmp = compareSemver(prVersion, mainVersion);
  if (cmp === null) {
    return {
      pass: false,
      code: "malformed-version",
      message: `version "${prVersion}" or main's "${mainVersion}" is not a plain x.y.z version, so they cannot be compared`,
    };
  }

  const owed = owesBump(subjects, changedPaths);

  // An internal-only PR never consults the peer list, so it must not be failed for
  // a peer it never needed to read. Carrying no new version, it cannot collide.
  if (!owed) {
    if (cmp > 0) {
      return {
        pass: false,
        code: "no-bump-owed",
        message: `version ${prVersion} bumps above main's ${mainVersion}, but this PR changes no app source with a user-facing intent, so no bump is owed`,
      };
    }
    return {
      pass: true,
      code: "ok",
      message: `version ${prVersion} is not above main's ${mainVersion}, and no bump is owed`,
    };
  }

  // From here the PR owes a bump, so the collision question is live and the open-PR
  // list must be readable and trustworthy.
  if (allOpenPrs === null || allOpenPrs === undefined) {
    return {
      pass: false,
      code: "unreadable",
      message:
        "could not read the open PR list, so a version collision cannot be ruled out; see the log above for why",
    };
  }
  if (!Number.isInteger(selfNumber)) {
    return {
      pass: false,
      code: "unreadable",
      message: `this PR's own number is not an integer (got ${JSON.stringify(selfNumber)}), so a version collision cannot be ruled out`,
    };
  }
  if (!allOpenPrs.some((p) => p.number === selfNumber)) {
    return {
      pass: false,
      code: "unreadable",
      message: `the open PR list does not contain this PR (#${selfNumber}), so it cannot be trusted and a version collision cannot be ruled out`,
    };
  }

  const peers = allOpenPrs.filter((p) => p.number !== selfNumber);

  // A peer whose version will not parse must not silently drop out of the collision
  // set: `compareSemver` returns null there and `null === 0` is false, so it would
  // read as "does not collide".
  const unparseable = peers.find((p) => parseSemver(p.version) === null);
  if (unparseable) {
    return {
      pass: false,
      code: "unreadable-peer",
      message: `could not read the version of open PR #${unparseable.number} (got "${unparseable.version}"), so a version collision cannot be ruled out`,
    };
  }

  if (cmp <= 0) {
    return {
      pass: false,
      code: "bump-owed",
      message: `version ${prVersion} is not strictly above main's ${mainVersion}, but this PR changes app source with a user-facing intent, so it owes a version bump`,
    };
  }
  const hit = peers.find((p) => compareSemver(p.version, prVersion) === 0);
  if (hit) {
    return {
      pass: false,
      code: "collision",
      message: `version ${prVersion} collides with open PR #${hit.number}, which declares the same version`,
    };
  }
  return {
    pass: true,
    code: "ok",
    message: `version ${prVersion} is above main's ${mainVersion} and unique among open PRs`,
  };
}

/**
 * Parse a plain `x.y.z`. Returns null for anything else.
 *
 * Anchored at BOTH ends on purpose. Unanchored it prefix-matched, so `2.8.10-rc.1`,
 * `2.8.10.4` and `2.8.10junk` all read as `2.8.10` and passed, while this comment
 * claimed they would not. We have no prerelease convention, so anything that is not
 * a plain `x.y.z` is something we do not understand, and this file fails closed on
 * what it does not understand rather than normalising it away.
 */
function parseSemver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(v).trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/**
 * Returns -1, 0, 1, or null when either side is not a semver.
 *
 * The `null` is an in-band error value flowing into `<=` / `>` comparisons, and
 * JavaScript coerces it to 0 (`null <= 0` is true, `null > 0` is false). The two
 * ordering comparisons below therefore run only AFTER the `cmp === null` guard at
 * the top of `decideVersion`. The collision test uses `=== 0`, which is null-safe by
 * strict equality. Do not move that guard inside a branch: an internal-only PR would
 * then reach `if (cmp > 0)`, `null > 0` is false, and it would PASS on a version it
 * could not parse.
 */
function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

/** Read `packages/pwa/package.json`'s version from a git ref. NOT the root package.json. */
function versionAtRef(ref, run) {
  return JSON.parse(run("git", ["show", `${ref}:packages/pwa/package.json`])).version;
}

/**
 * A full page back from `gh pr list` is evidence of truncation, not of completeness,
 * and a dropped PR is a collision we cannot see. Set well above any plausible
 * open-PR count; hitting it fails closed rather than guessing.
 */
export const PR_LIST_LIMIT = 500;

/** The guard's contract with CI, kept pure so it can be tested. */
export function exitCodeFor(verdict) {
  if (verdict.pass) return 0;
  // Exit 2 means "the guard could not tell" (an infrastructure failure). Exit 1
  // means "it told you, and the version is wrong". Conflating them tells a
  // contributor to fix their version when the real fault is a 403 on the PR list.
  return verdict.code === "unreadable" || verdict.code === "unreadable-peer" ? 2 : 1;
}

/** Run a command and return stdout. Injectable so the CLI layer is testable. */
const execRun = (cmd, args) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

/**
 * EVERY open PR's head version, INCLUDING this one.
 *
 * Returns `{prs, skipped}`, or `null` when the list could not be read. `skipped` names
 * the PRs left out of the collision set (a head with no app package.json), so the
 * verdict can SAY the set was reduced rather than printing a bare "unique among open
 * PRs" over a shortened list.
 *
 * Self is deliberately not filtered out here: `decideVersion` owns that, and it
 * needs to see self to know the list is trustworthy at all.
 *
 * The repo is PINNED rather than resolved from the ambient git remote, because a
 * wrong-repo read returns a confident EMPTY list. Do not add `--search`, `--author`
 * or `--label` to the `gh pr list` call: those switch it to the search API, which
 * has indexing lag, and a freshly-opened PR would then be legitimately absent from
 * its own list and every new PR would fail closed.
 */
export function readOpenPrVersions(repo, run = execRun) {
  let prs;
  try {
    prs = JSON.parse(
      run("gh", [
        "pr",
        "list",
        "--repo",
        repo,
        "--state",
        "open",
        "--json",
        "number,headRefOid,isCrossRepository",
        "--limit",
        String(PR_LIST_LIMIT),
      ]),
    );
  } catch (e) {
    // Fail closed, but SAY WHY: "re-run the check" is useless advice for a 403, a
    // missing `gh`, or a rate limit.
    console.error(`version-check: could not list open PRs: ${e.stderr || e.message}`);
    return null;
  }
  if (!Array.isArray(prs)) {
    console.error(`version-check: the open PR list was not an array; refusing to guess`);
    return null;
  }
  if (prs.length >= PR_LIST_LIMIT) {
    console.error(
      `version-check: the open PR list came back full (${prs.length} of a ${PR_LIST_LIMIT} limit), so it may be truncated and a collision could be hidden`,
    );
    return null;
  }
  const out = [];
  const skipped = [];
  for (const pr of prs) {
    try {
      const raw = run("gh", [
        "api",
        "-H",
        "Accept: application/vnd.github.raw",
        `repos/${repo}/contents/packages/pwa/package.json?ref=${pr.headRefOid}`,
        "--jq",
        ".version",
      ]);
      out.push({ number: pr.number, version: raw.trim() });
    } catch (e) {
      const why = String(e.stderr || e.message);
      // A 404 CAN be information rather than the absence of it: a head with no
      // `packages/pwa/package.json` (a branch cut before the monorepo move) declares no
      // app version, so it cannot collide, and failing the list would red every PR in
      // the repo until that one stale PR was closed.
      //
      // But the contents API ALSO returns 404 when it cannot resolve the REF (a fork
      // head, a force-pushed and unreferenced SHA). Skipping that peer would drop a
      // real, possibly colliding version out of the set and print "unique among open
      // PRs" over it: a silent pass on the exact question this guard answers.
      //
      // So skip only on PROOF: the ref must independently resolve. If it does not, or
      // if we cannot tell, fail closed.
      // A FORK peer must never be skipped. `repos/{base}/contents/...?ref={forkHead}`
      // can 404 even though that PR declares a real, possibly colliding version, so a
      // skip there would drop it out of the collision set and print "unique among open
      // PRs" over it.
      const forkable = pr.isCrossRepository === true;
      if (!forkable && /\(HTTP 404\)/.test(why) && refResolves(repo, pr.headRefOid, run)) {
        console.error(
          `version-check: open PR #${pr.number} has no packages/pwa/package.json at a ref that does resolve, so it declares no app version; not counting it`,
        );
        skipped.push(pr.number);
        continue;
      }
      console.error(
        `version-check: could not read packages/pwa/package.json on open PR #${pr.number}: ${why}`,
      );
      return null;
    }
  }
  return { prs: out, skipped };
}

/** Does this commit-ish exist in the repo? Used to tell a missing PATH from a missing REF. */
function refResolves(repo, sha, run) {
  try {
    run("gh", ["api", `repos/${repo}/commits/${sha}`, "--jq", ".sha"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * The CLI. Called by `version-check-cli.mjs`; never runs on import.
 *
 * `env` and `run` are injected so this WIRING is testable. It was not, and eight
 * mutations of it survived the whole suite: the worst simply dropped `prTitle` from
 * `subjects`, which silently reinstates the #804 false green (a PR titled `fix:` over
 * `chore:` branch commits stops owing a bump) with no test to catch it.
 */
export function main({ env = process.env, run = execRun } = {}) {
  const prNumber = Number(env.PR_NUMBER);
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    console.error("version-check: PR_NUMBER is not set; refusing to guess");
    return 2;
  }
  const prTitle = env.PR_TITLE;
  if (!prTitle) {
    console.error("version-check: PR_TITLE is not set; refusing to guess");
    return 2;
  }
  // No hard-coded fallback. A wrong-repo read returns a confident EMPTY open-PR list,
  // which is the silent pass the repo pin exists to prevent; defaulting to a guess
  // re-opens it by another door.
  const repo = env.GH_REPO;
  if (!repo) {
    console.error("version-check: GH_REPO is not set; refusing to guess the repository");
    return 2;
  }

  let subjects;
  let changedPaths;
  let prVersion;
  let mainVersion;
  try {
    const branchSubjects = run("git", [
      "log",
      "origin/main..HEAD",
      "--format=%s",
      "--no-merges", // a merge of main into the branch is not this PR's own work
    ])
      .split("\n")
      .filter(Boolean);
    // BOTH the title and the branch commits. Under squash-merge the landed subject is
    // the branch commit's when there is exactly one, and the PR title otherwise, so
    // either can be what ships. Reading the union means we never miss the one that does.
    subjects = [prTitle, ...branchSubjects];
    // Three dots: diff against the MERGE BASE, so this is the branch's own work and not
    // whatever main changed underneath it.
    changedPaths = run("git", ["diff", "--name-only", "origin/main...HEAD"])
      .split("\n")
      .filter(Boolean);
    prVersion = versionAtRef("HEAD", run);
    mainVersion = versionAtRef("origin/main", run);
  } catch (e) {
    console.error(
      `version-check: could not read the PR's subjects, paths or versions: ${e.stderr || e.message}`,
    );
    return 2;
  }

  const read = readOpenPrVersions(repo, run);
  const allOpenPrs = read ? read.prs : null;
  const verdict = decideVersion({
    subjects,
    changedPaths,
    prVersion,
    mainVersion,
    allOpenPrs,
    selfNumber: prNumber,
  });
  const tag = verdict.pass ? "PASS" : `FAIL (${verdict.code})`;
  const skipped = read?.skipped;
  const caveat = skipped?.length
    ? ` (the collision set excludes #${skipped.join(", #")}: no app package.json at that head)`
    : "";
  console.log(`version-check ${tag}: ${verdict.message}${caveat}`);
  return exitCodeFor(verdict);
}
