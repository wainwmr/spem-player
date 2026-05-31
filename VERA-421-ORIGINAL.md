# VERA-421 Original Report (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-31 21:30

See also: [Final Synthesis (cycle 1)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)

## Raw agent reports (pass 1)

### code-reviewer

> **[important] Cache-key step swallows a key-script crash and collapses to a constant key — silent stale-cache risk.** `ci.yml` `Compute score cache key` step `run: echo "key=$(node build/scoreCacheKey.mjs)" >> "$GITHUB_OUTPUT"` and the identical line in `netlify-preview.yml`. GitHub's default `run:` shell on `ubuntu-latest` is `bash -euo pipefail`. A command-substitution failure in that position does not trip `set -e`, and `echo` still exits 0. Reproduced: `bash -euo pipefail -c 'echo "key=$(node -e "process.exit(3)")"; echo "exit=$?"'` → `key=` / `exit=0`. If `node build/scoreCacheKey.mjs` ever throws, the step passes and emits an empty key → the cache key degrades to the constant `scores-v1-`; first run misses+saves, every later run hits and ships stale SVGs silently. Defeats the no-restore-keys discipline by collapsing all keys to one. Fix: `key="$(node build/scoreCacheKey.mjs)" || exit 1; [ -n "$key" ] || exit 1; echo "key=$key" >> "$GITHUB_OUTPUT"`.
>
> **[suggestion] New `build/` files fail `prettier --check`** (outside CI's enforced scope — `check:format` only globs `src/`, and `build/` is eslint-ignored). Not a guideline violation; the existing `build/*.mjs` are equally outside scope. Optional `prettier --write` for consistency.
>
> Verified correct (no action): actions/cache@v4 path/key/cache-hit references; save-on-success only; cache-hit path safety (install skipped → canary → exit 0, mtime logic not reached); key determinism (slash-normalised + sorted + NUL-separated, proven by test matrix); input coverage (.ly + buildScores + postprocessSvg + install-lilypond pinning LILYPOND_VERSION; xmldom residual documented); the integration job's pre-existing no-cache state unchanged.

### pr-test-analyzer

> **[critical] Empty / vanished input set produces a stable, valid-looking key instead of failing** — `build/scoreCacheKey.mjs:55-71`, untested. `globSync("src/lilypond/**/*.ly", {cwd: emptyDir})` returns `[]` (no throw), so `computeScoreCacheKey` over an empty/renamed/moved tree returns `sha256("")` = a fixed 64-char hex digest that passes the `/^[0-9a-f]{64}$/` shape test and is deterministic — nothing in the suite catches it. If `src/lilypond` is renamed, `REPO_ROOT` drifts, or the glob silently matches nothing on CI, the key collapses to one constant across all input states — the canonical stale-cache failure. Recommendation: `computeScoreCacheKey` should throw on an empty match set; add `it("throws when no inputs match")`. Rating 8.
>
> **[important] No path-separator normalisation assertion.** The cross-OS claim (`scoreCacheKey.mjs:47-49`) is load-bearing for whether keys match across Windows/Linux; the `.replace(/\\/g, "/")` has zero direct coverage — deleting the `.map` would still pass all tests on Linux CI. Assert the hash is over normalised paths. Rating 6.
>
> **[important] Path/content boundary-collision property is unguarded** — `scoreCacheKey.mjs:64-69`. The NUL separators stop `path="a"+content="bc"` colliding with `path="ab"+content="c"`; no test constructs the collision pair, so deleting `hash.update("\0")` fails nothing. Add one test with two fixtures differing only in boundary placement. Rating 5.
>
> **[important] Rename-with-identical-content not directly tested** (`scoreCacheKey.test.ts:74-84`). Covered indirectly by add+remove; a distinct asserted property, cheap to pin. Rating 4.
>
> **[suggestion] `SCORE_CACHE_INPUTS` assertion uses `expect.arrayContaining`** (line 88-96) — passes even if extra untested patterns are added later; a future 5th input class could be added without forcing a fixture. Consider `toEqual` exact. Rating 4.
>
> **[suggestion] Ordering-independence not asserted** — the `.sort()` makes the key order-independent; largely theoretical. Rating 3.
>
> Sound: CLI-vs-function contract test correct; per-input-class mutation test is the right behavioural design; no implementation-detail asserts beyond the sha256 shape.

### silent-failure-hunter

> **[critical] Command substitution swallows a `scoreCacheKey.mjs` failure → poisoned/empty cache key, build stays green** — `ci.yml:32`, `netlify-preview.yml:34`. GitHub runs `run:` with `bash --noprofile --norc -eo pipefail {0}`; the substitution is an argument to `echo`, so `set -e` does not fire and there is no pipe. Reproduced: `bash -eo pipefail -c 'echo "key=$(node -e "process.exit(3)")" >> /tmp/out; echo "step-exit=$?"'` → `step-exit=0`. The assignment form `out="$(...)"` DOES trip `set -e`; the PR uses the one syntax that throws the exit code away. Empty key → constant `scores-v1-` → first run saves the empty key, every later run hits it; edit any `.ly` and CI keeps shipping cached scores. Fix: capture into a var, assert `^[0-9a-f]{64}$`, then write.
>
> **[critical] `computeScoreCacheKey` returns a valid-looking key over zero files** — `scoreCacheKey.mjs:55-70`. `globSync` returns `[]` with no throw; `hash.digest("hex")` over empty sha256 = `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, a valid 64-char digest that passes the shape test. Silently aliases every "no inputs found" state to one constant. `buildScores.mjs` guards this (`maxLyMtimeFor` throws "no .ly files found"; `main()` exits 1 on empty glob); the key path has no equivalent. A non-glob input that resolves to zero matches also silently drops. Fix: throw when `files.length === 0`; consider asserting each literal input matches exactly one file.
>
> **[important] The `--skip-if-missing` canary masks a partially-restored cache by design** — `buildScores.mjs:73-86`. On a hit the workflow skips LilyPond and lets `--skip-if-missing` carry the build, checking ONE file (`src/scores/<v>/modern/Choir I A.svg`). actions/cache restore is not transactional; a partial restore leaves the canary green while `early/*` and later choirs are missing/stale, and the build exits 0. Last line of defence inspecting ~1 of N files. Pre-existing, amplified by the cache feeding this path. Recommendation: count expected vs present SVGs (derive from the `.ly` inventory the key globs); at minimum probe both notations' canaries.
>
> **[suggestion] No `restore-keys`** — correct and deliberate; credited explicitly. The hard-coded `lilypond-2.26.0` PATH in both workflows vs the pin in `install-lilypond.sh` is a pre-existing coupling surfaced (not introduced) by this PR; on a miss after a missed manual bump the PATH points at a nonexistent dir. Worth a centralisation follow-up.

### type-design-analyzer

> The typed surface is small, correct, and faithful to the implementation and the established `.d.mts` pattern. No critical or important defects.
>
> **[suggestion] `build/scoreCacheKey.d.mts:5`** — `string[]` is defensible but `readonly string[]` would express the source-of-truth invariant more tightly and is non-breaking (the only consumer reads via `toEqual(arrayContaining(...))`; the impl only `.flatMap`s). Caveat: it's a compile-time-only guarantee since the `.mjs` array isn't frozen (consistent with any `as const`-less export). Recommended change.
>
> **[suggestion]** Don't go to a tuple/literal-union element type — the input list legitimately grows. `readonly string[]` is the right altitude.
>
> **[suggestion]** `computeScoreCacheKey(opts?: { root?: string }): string` is precise on every axis (optional param, optional field, return). The real postcondition (64-hex sha256) lives in the doc-comment + test rather than the type; acceptable (a brand would be over-engineering). Drift is guarded by the TS test importing both exports. Fully consistent with `buildScores.d.mts` / `postprocessSvg.d.mts`. Encapsulation strong; the load-bearing invariant correctly lives in the test, not the type.

### comment-analyzer

> Every load-bearing comment verified accurate against the code. No critical or important inaccuracies.
>
> Verified ACCURATE: the module doc-comment input classes match `SCORE_CACHE_INPUTS` and the test fixture; "install-lilypond.sh pins LILYPOND_VERSION" correct; the xmldom "known residual" is correct and well-reasoned (a high-value "why we did NOT do X" comment). Workflow comments: "exact-key only / NO restore-keys" confirmed (no `restore-keys:` key present); "skips install + regeneration on a hit / --skip-if-missing carries the build on restored SVGs" matches the gating + `buildScores.mjs:72-87`. NUL-separator collision example accurate. Path-normalisation comment accurate.
>
> **[suggestion]** `scoreCacheKey.mjs:57` — the `.replace`/`.sort` is load-bearing but has no inline comment (rationale is 10 lines up in the doc-comment); a one-line note where a future editor might "simplify" it would help. Optional.
>
> **[suggestion]** `scoreCacheKey.mjs:24-25` — "could in theory stale the cache" slightly undersells; consider "could silently stale the cache". Wording only.
>
> **[suggestion]** The `src/scores` cache is never written by an explicit step — `actions/cache@v4` saves in a post-job step on a key miss. Neither workflow comment states *when* the cache is populated; a maintainer debugging "why always a miss" has no pointer. A single clause on the Restore step would close the gap. The one piece of load-bearing behaviour in the diff with no comment.
