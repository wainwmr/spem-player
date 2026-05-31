# VERA-423 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-31 22:?? GMTST
Last run:  2026-05-31 22:?? GMTST

See also: [Original Report (cycle 1)](LINK_TO_BE_FILLED_AFTER_ORIGINAL_POSTED)

## Summary

[Placeholder — finalised at close-out.]

## Findings

### 423-01 — [important] decideScoreCache: missing exact-match (anti-fuzzy) boundary test

> **pr-test-analyzer, src/test/decideScoreCache.test.ts (suite) / decideScoreCache.mjs:19:**
> No test exercises a `restoredKey` sharing a prefix with but not equal to `currentKey`. A
> `startsWith`/prefix mutant of `restoredKey === currentKey` survives the whole suite. The docstring
> makes exact-match-only the core promise; nothing pins it. Add the prefix-mismatch-with-canary case → `"miss"`.

**Bob's triage:** [pending]

**Resolution:** [pending]

### 423-02 — [important] index.js: restored-marker normalisation is pure and untested

> **pr-test-analyzer, plugins/cache-scores/index.js:28-30:**
> `existsSync ? readFileSync(...).trim() : undefined` is the analogue of what #421 extracted and tested
> for the key, feeding directly into `decideScoreCache`; silent-staleness risk if the marker ever gains
> trailing whitespace. Extract `normaliseRestoredMarker` and unit-test newline/whitespace/empty.

**Bob's triage:** [pending]

**Resolution:** [pending]

### 423-03 — [important] index.js: catch logs at console.log, not warn/error

> **silent-failure-hunter, plugins/cache-scores/index.js:54-59 (also :50, :70-75):**
> The fail-safe catch logs (not silent) but at info level. A build that should hit but silently falls
> through to a full install every time deploys green while the cache is dead and nobody notices. Emit at
> `console.warn`/`console.error`.

**Bob's triage:** [pending]

**Resolution:** [pending]

### 423-04 — [important] 1-of-32 canary: a partial cache restore ships an incomplete site

> **silent-failure-hunter, plugins/cache-scores/index.js:36 + decideScoreCache.mjs:18 + buildScores.mjs:78-86:**
> The hit decision trusts one canary SVG to vouch for ~32 scores. A blob restoring the canary but dropping
> (say) all `early/` passes both `decideScoreCache` and buildScores' same-canary `--skip-if-missing` → ships
> ~30 missing scores, green. The #318/#271 class at sub-tree granularity. Comments overclaim "guarding a
> partial restore". Cheap guard: a manifest count in the marker. (Cross-cuts #424.)

**Bob's triage:** [pending]

**Resolution:** [pending]

### 423-05 — [important] index.js: onPostBuild non-atomic save; marker-last ordering undocumented

> **silent-failure-hunter, plugins/cache-scores/index.js:66-68:**
> Two independent `save` calls; the marker is saved last *specifically* so a half-save can't validate bad
> scores, but nothing asserts it and a future reorder would silently poison the cache ("marker present,
> scores absent/partial") past the canary. Document the marker-last invariant; ideally a content manifest.

**Bob's triage:** [pending]

**Resolution:** [pending]

### 423-06 — [important] decideScoreCache.d.mts: restoredKey should be `string | null`

> **type-design-analyzer, plugins/cache-scores/decideScoreCache.d.mts:5:**
> Runtime tolerates a nullable "no restored key"; the `.d.mts` `?: string` would reject a `null` the `.mjs`
> handles correctly. Widen to `restoredKey?: string | null` to match the runtime, and add a `null` test.

**Bob's triage:** [pending]

**Resolution:** [pending]

### 423-07 — [important] decideScoreCache.d.mts: currentKey optionality hides the precondition

> **type-design-analyzer, decideScoreCache.d.mts:6 / decideScoreCache.mjs:18:**
> `if (!currentKey) return "miss"` is a defined defensive MISS, but the optional gives no signal that
> `""`/absent is a meaningful input rather than a programming error. A doc comment expressing the invariant.

**Bob's triage:** [pending]

**Resolution:** [pending]

### 423-08 — [important] index.js: untyped `utils` → a cache-API typo becomes a permanent silent MISS

> **type-design-analyzer, plugins/cache-scores/index.js:22, 35-36, 67-69:**
> `utils.cache.restore`/`save` are untyped `any`; under the fail-safe, a misspelled method throws, is caught,
> logged as "skipped", and the cache silently never engages — correct deploys forever, optimisation dead. Add
> a local JSDoc typedef for the `utils` slice used.

**Bob's triage:** [pending]

**Resolution:** [pending]

## Suggestions (noted, non-blocking)

- **code-reviewer:** plugins/ ungated by lint/format/knip (consistent with build/, but production code);
  CANARY constant coupling index.js↔buildScores.mjs; onPostBuild re-saves on a hit (idempotent, avoidable).
- **pr-test-analyzer:** empty-string restoredKey with a real currentKey untested; null marker not reachable
  (no action); HIT_FLAG/CANARY duplicated across plugin/toml/buildScores.
- **silent-failure-hunter:** computeScoreCacheKey throw conflated with infra failure in one catch; miss-path
  rmSync can throw mid-tree (mtime-trust window).
- **type-design-analyzer:** canaryPresent boolean is correct (keep); "hit"|"miss" union is correct (keep);
  add a null test; discarded restore() boolean; cross-file string-constant coupling.
- **comment-analyzer:** .gitignore "branches on" ambiguity; index.js deploy-only scope not stated;
  "render"/"regeneration" wording drift.
