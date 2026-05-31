# VERA-423 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-31 22:51 GMTST
Last run:  2026-05-31 23:15 GMTST

See also: [Original Report (cycle 1)](LINK_TO_BE_FILLED_AFTER_ORIGINAL_POSTED)

## Summary

Pass 1 raised no criticals and eight important findings across five reviewers,
with strong convergence on one root: the single canary cannot detect a sub-tree
partial cache restore. Bob's triage split them five-address / three-defer. Five
were addressed in #423 (an exact-match-only + null boundary test; warn-level
fail-safe logging; `restoredKey: string | null`; a `currentKey` precondition
note; a `NetlifyCacheUtils` JSDoc typedef; plus a comment-honesty pass). The
canary/partial-restore strengthening (423-04/05) and the marker-normalisation
extraction (423-02) were deferred to #424, which is chartered for exactly this
and already earmarks "full inventory counting" as a future step — #424's
build-side 2-canary is the backstop that makes #423's existing canary safe
(a false plugin hit fails the build rather than shipping incomplete). The
deferral was the one judgement call; it aligns with the deliberately staged plan
across #423 and #424, and was confirmed with the user. [Pass count / final re-run
noted at close-out.]

## Findings

### 423-01 — [important] decideScoreCache: missing exact-match (anti-fuzzy) boundary test

> **pr-test-analyzer, src/test/decideScoreCache.test.ts (suite) / decideScoreCache.mjs:19:**
> No test exercises a `restoredKey` sharing a prefix with but not equal to `currentKey`. A
> `startsWith`/prefix mutant of `restoredKey === currentKey` survives the whole suite.

**Bob's triage:** Real test gap (test behaviour, not implementation) — the exact-match-only guarantee
is the no-stale-ship discipline #421/#423 exist for, and nothing pins it. Address now.

**Resolution:** addressed (commit ddc851a) — added a near-match test (same-length last-char difference
AND a strict prefix of the current key, both → MISS) plus a `null`-key test.

### 423-02 — [important] index.js: restored-marker normalisation is pure and untested

> **pr-test-analyzer, plugins/cache-scores/index.js:28-30:**
> `existsSync ? readFileSync(...).trim() : undefined` is the analogue of what #421 extracted and tested
> for the key. Extract `normaliseRestoredMarker` and unit-test newline/whitespace/empty.

**Bob's triage:** Defensive nit. The `.trim()` is currently correct and can only cause a false MISS
(safe), never a false HIT (whitespace stripping cannot make two different keys equal). Extracting a
`.trim()` into a tested module is disproportionate (YAGNI). Defer.

**Resolution:** deferred — folds into #424 if/when the marker gains structure (e.g. an inventory count,
where normalisation becomes non-trivial). Noted on #424.

### 423-03 — [important] index.js: catch logs at console.log, not warn/error

> **silent-failure-hunter, plugins/cache-scores/index.js:54-59 (also :70-75):**
> The fail-safe catch logs (not silent) but at info level; a build that should hit but silently falls
> through to a full install every time deploys green while the cache is dead. Emit at warn/error.

**Bob's triage:** Real (fail fast / surface errors). A fail-safe that hides its own death is the worst
kind. Behaviour-preserving, cheap. Address now.

**Resolution:** addressed (commit 7f5a750) — both fail-safe catches now `console.warn`; routine HIT/MISS
stay `console.log`.

### 423-04 — [important] 1-of-N canary: a partial cache restore ships an incomplete site

> **silent-failure-hunter, plugins/cache-scores/index.js:36 + decideScoreCache.mjs:18 + buildScores.mjs:78-86:**
> The hit decision trusts one canary SVG to vouch for ~32 scores; a blob restoring the canary but dropping
> (say) all `early/` passes both checks → ships incomplete, green. Comments overclaim "guarding a partial
> restore". A manifest count would close it.

**Bob's triage:** Real, but pre-existing (#421 already established restore + 1-canary trust on CI) and
deliberately staged: #424 is chartered for exactly this and stages it (build-side 2-canary backstop now;
full inventory counting it explicitly defers to a future ticket). The manifest-count guard is that
deferred work. Pulling it into #423 overrides a deliberate plan and expands scope. Defer the
strengthening; fix the overclaiming comments now and cross-reference #424.

**Resolution:** strengthening deferred to #424 (noted there); comments corrected (commits 4f8aca5 the
decideScoreCache docstring, 7f5a750 the index.js CANARY comment + MISS-branch wording) to say the canary
guards a TOTAL payload wipe, not a sub-tree partial restore, with a #424 cross-reference.

### 423-05 — [important] index.js: onPostBuild non-atomic save; marker-last ordering undocumented

> **silent-failure-hunter, plugins/cache-scores/index.js:66-68:**
> Two independent `save` calls; the marker is saved last specifically so a half-save can't validate bad
> scores, but nothing asserts it and a future reorder would silently poison the cache. Document the
> invariant; ideally a content manifest.

**Bob's triage:** The full fix is the same manifest mechanism as 423-04 → defer. But the marker-last
ordering is load-bearing and a future reorder is a cheap, silent footgun — document it now.

**Resolution:** addressed (comment, commit 7f5a750) — added a "do not reorder, save payload before
marker (the commit-point)" comment; manifest-based desync detection deferred to #424 with 423-04.

### 423-06 — [important] decideScoreCache.d.mts: restoredKey should be `string | null`

> **type-design-analyzer, plugins/cache-scores/decideScoreCache.d.mts:5:**
> Runtime tolerates a nullable "no restored key"; the `.d.mts` `?: string` would reject a `null` the
> `.mjs` handles correctly. Widen to `restoredKey?: string | null` and add a `null` test.

**Bob's triage:** Real `.d.mts`↔`.mjs` drift, cheap. Address now.

**Resolution:** addressed (commit 4f8aca5) — widened to `restoredKey?: string | null` in both the
`.d.mts` and the `.mjs` JSDoc; the `null` test (423-01 commit) locks it. `tsc --noEmit` clean.

### 423-07 — [important] decideScoreCache.d.mts: currentKey optionality hides the precondition

> **type-design-analyzer, decideScoreCache.d.mts:6 / decideScoreCache.mjs:18:**
> `if (!currentKey) return "miss"` is a defined defensive MISS, but the optional gives no signal that
> `""`/absent is meaningful rather than a programming error.

**Bob's triage:** The optional is needed for the defensive branch; the fix is a clarifying comment, not
a type change. Address now (comment).

**Resolution:** addressed (commit 4f8aca5) — comments in both the `.d.mts` and the `.mjs` docstring note
that an empty/absent key is a defined defensive MISS and that production always supplies a 64-char digest.

### 423-08 — [important] index.js: untyped `utils` → a cache-API typo becomes a permanent silent MISS

> **type-design-analyzer, plugins/cache-scores/index.js:22, 35-36, 67-69:**
> `utils.cache.restore`/`save` are untyped `any`; under the fail-safe, a misspelled method throws, is
> caught, logged as "skipped", and the cache silently never engages. Add a local JSDoc typedef.

**Bob's triage:** Real hole — exactly the kind of silent miss the fail-safe would mask. Cheap. Address now.

**Resolution:** addressed (commit 7f5a750) — added a `NetlifyCacheUtils` JSDoc typedef
(`{ cache: { restore(path): Promise<boolean>, save(path): Promise<boolean> } }`) with `@param` on both hooks.

## Suggestions (noted, non-blocking)

Addressed opportunistically while in the files: the `.gitignore` "branches on" ambiguity (CM-1, commit
7f5a750), the deploy-only scope note on the header (CM-2, 7f5a750), and the "render"/"regeneration"
wording drift (CM-3, 7f5a750). Left as note-only, consistent with their severity: plugins/ ungated by
lint/format/knip (code-reviewer — consistent with the existing build/ exemption; a scoped ESLint override
is a separate tooling call); onPostBuild re-saves on a hit (idempotent, avoidable); computeScoreCacheKey
throw conflated with infra failure in the catch (silent-failure-hunter — the warn now at least surfaces
it); miss-path rmSync mid-tree (narrow, the catch keeps the flag off); discarded `restore()` boolean; the
cross-file string-constant coupling (can't be typed across `.toml`). The canaryPresent boolean and the
`"hit" | "miss"` union were affirmed correct (keep).
