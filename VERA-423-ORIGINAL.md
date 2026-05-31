# VERA-423 Original Report (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-31 22:?? GMTST

See also: [Final Synthesis (cycle 1)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)

## Raw agent reports (pass 1)

Five `pr-review-toolkit` agents reviewed `git diff origin/main...andrew/423-netlify-cache`
(the local branch tip): `plugins/cache-scores/` (the ESM Netlify build plugin,
`index.js` + `decideScoreCache.mjs` + `.d.mts` + `manifest.yml`), its Vitest suite
(`src/test/decideScoreCache.test.ts`), and the `netlify.toml` / `eslint.config.js` /
`.gitignore` changes. No critical findings; eight important findings, with strong
convergence on the partial-restore / canary weakness.

### code-reviewer

> **No critical, no important.** Three suggestions:
>
> 1. (suggestion) `plugins/` is fully exempt from every quality gate (`eslint.config.js:51`
>    adds `'plugins/'` to ignores; `check:format`/knip globs exclude it too). So the plugin's
>    `index.js`/`decideScoreCache.mjs` are never linted, prettier-checked, or knip-scanned —
>    only the test file is gated. Mirrors the pre-existing `build/` exemption (consistent, not a
>    regression), but the plugin is real production build code. Consider a scoped ESLint override
>    for `plugins/**/*.{js,mjs}` (Node env) rather than blanket-ignoring, or a comment noting it
>    is intentionally ungated.
> 2. (suggestion) The hit path is load-bearing on an undocumented coupling between two independent
>    canary constants: `index.js:21` hard-codes `CANARY = "src/scores/Hugh Keyte/modern/Choir I A.svg"`
>    and `buildScores.mjs:80` independently reconstructs the same path (default `version="Hugh Keyte"`).
>    Both must agree or a hit fails the build (outside the plugin's try/catch). A one-line cross-ref
>    comment or a shared constant.
> 3. (suggestion) `onPostBuild` re-saves the cache on every successful build including a hit
>    (`index.js:65-69`) — re-uploading an identical payload on the fast path. Harmless/idempotent but
>    avoidable; consider skipping the save when `onPreBuild` recorded a hit.
>
> Note: the PR-preview build (`netlify-preview.yml`) uses `actions/cache` + a direct `npm run build`,
> so it does not exercise this plugin — the plugin runs only on Netlify's own production build via
> `netlify.toml`. Consistent with the deploy-only verification noted. The change is well-constructed;
> lifecycle, hook contracts, `utils.cache` usage, and `netlify.toml` shell branching are correct.

### pr-test-analyzer

> The suite for the pure `decideScoreCache` is well-targeted and behaviour-focused; mutation analysis
> kills 4 of 5 realistic wrong-impl mutants. One real gap, plus one extractable-pure-logic finding.
>
> **Finding 1 — [important] Missing exact-match (anti-fuzzy) boundary case.** No test exercises a
> `restoredKey` that shares a prefix with but is not equal to `currentKey`. Replacing `restoredKey === currentKey`
> with a `startsWith`/prefix match **survives the entire suite**. The docstring elevates "exact-match-only…
> no fuzzy/prefix matching" to the function's core promise, but no test pins it. Add:
> `decideScoreCache({restoredKey: "a".repeat(63)+"z", currentKey: "a".repeat(64), canaryPresent: true})` → `"miss"`.
>
> **Finding 2 — [suggestion]** `restoredKey` empty-string with a real `currentKey` is untested (the
> existing empty test sets both keys to `""`, re-covering the `!currentKey` guard).
>
> **Finding 3 — [suggestion]** `null` marker not exercised; not reachable from the caller (returns
> `"miss"` anyway). No action recommended.
>
> **Finding 4 — [important] Restored-marker normalisation is pure and untested** (`index.js:28-30`:
> `existsSync ? readFileSync(...).trim() : undefined`). The exact analogue of what #421 extracted and
> tested for the key, feeding directly into `decideScoreCache`. Carries a silent-staleness risk
> (marker written without trailing newline; `.trim()` is the only guard). Extract e.g.
> `normaliseRestoredMarker(raw) -> string | undefined` and unit-test trailing-newline/whitespace/empty.
>
> **Finding 5 — [suggestion]** Constants (`HIT_FLAG`, `CANARY`) duplicated across plugin / `netlify.toml` /
> `buildScores.mjs`, no guard; drift breaks the handshake silently. Track, don't block.
>
> The deploy-only boundary for `index.js` hooks is mostly sound (cache persistence, the try/catch
> fallthrough, the toml branch, orchestration sequencing are genuinely deploy-only). The one exception is
> Finding 4's marker normalisation.

### silent-failure-hunter

> Headline: the central design tension is resolved **correctly**. The fail-safe direction is right
> (cache error → full LilyPond build, never a stale/empty ship), the catch blocks deliver that intent,
> and the hit flag is the single gate every error/miss path explicitly removes. **No dangerous
> error-swallowing found.** Findings are about thin seams and observability.
>
> **Finding 1 — [important] onPreBuild catch logs at `console.log`, not `warn`/`error`** (`index.js:54-59`,
> also `:50`, `:70-75`). The catch logs (good, not silent), but at info level among routine chatter. A
> build that *should* hit but silently falls through to a full install every time (e.g. `utils.cache.restore`
> throwing on a quota/permissions change) deploys green while build minutes balloon and nobody notices the
> cache is dead. Emit at `console.warn`/`console.error`.
>
> **Finding 2 — [suggestion] `computeScoreCacheKey()` runs inside the try** (`index.js:25`, `:65`), so its
> #421 zero-inputs poison-guard throw is indistinguishable from a cache-infra I/O failure — a structural
> input-set regression downgraded to a generic "skipped" line. Compute the key before the try, or log a
> discriminator.
>
> **Finding 3 — [important] The canary is 1-of-32; a partial cache restore ships an incomplete site**
> (`index.js:36` + `decideScoreCache.mjs:18` + `buildScores.mjs:78-86`). A blob that restored the canary
> but dropped (say) all `early/` or all `OUP/` scores passes `decideScoreCache` (canary present, key matches)
> AND buildScores' own `--skip-if-missing` canary (the same single file) → ships ~30 missing scores, green.
> This is the #318/#271 class at sub-tree granularity. The plugin comment (`:45`) and the decideScoreCache
> docstring overclaim "guarding a partial restore" — a one-file check guards only a total wipe. This diff
> *introduces* the trust-restored-bytes path for production deploys (pre-#423, production always regenerated).
> Cheap guard available now: write a manifest count (number of `.svg` files) into the marker on save and
> compare globbed count on restore before declaring a hit.
>
> **Finding 4 — [important] onPostBuild save ordering can poison the cache** (`index.js:66-68`). Two
> independent non-atomic `save` calls; the marker is saved last *specifically* so a half-save can't validate
> bad scores — but nothing asserts that ordering, and a future reorder (`:67`/`:68` look swappable) would
> silently create a "marker present, scores absent/partial" cache the canary cannot catch. Document the
> marker-last invariant; ideally save a content-derived manifest so payload/marker desync is detectable.
>
> **Finding 5 — [suggestion] Miss-path `rmSync` can throw mid-tree** (`index.js:47`), leaving a partial
> `src/scores` the full build then trusts via mtime (`buildScores.mjs:142-148`). Narrow window; the catch
> keeps the flag off so no false hit. Comment that the delete is best-effort.
>
> What's done well (genuine): no empty catches; the fallback direction is correct; the hit flag is removed
> on every non-hit path (all four exits traced); `decideScoreCache` is exact-match-only, pure, tested;
> postBuild failure correctly does not fail the deploy. Findings 3 and 4 are the two to address before merge;
> a manifest-count guard closes both at once.

### type-design-analyzer

> The `decideScoreCache` declaration is well-shaped: return type is the tight `"hit" | "miss"` union (right —
> encodes the decision, gives exhaustiveness/typo protection). Defects are in parameter precision.
>
> Ratings: Encapsulation 8/10; Invariant expression 6/10; Usefulness 8/10; Enforcement 7/10.
>
> **Finding 1 — [important] `restoredKey?: string` drifts from the `.mjs`** (`decideScoreCache.d.mts:5`).
> Runtime tolerates absent and compares by `===`; the "no restored key" case is naturally nullable. A caller
> passing `null` would be rejected by the `.d.mts` though the `.mjs` handles it (`null === key` → `"miss"`).
> Recommend `restoredKey?: string | null`.
>
> **Finding 2 — [important] `currentKey?: string` hides the central precondition** (`d.mts:6`,
> `decideScoreCache.mjs:18`). `if (!currentKey) return "miss"` is a defined defensive MISS, but
> `computeScoreCacheKey(): string` always supplies a present key, so the optional exists only for the
> defensive branch with no signal that `""`/absent is meaningful. A doc comment, or split overloads.
>
> **Finding 3 — [suggestion] `canaryPresent: boolean` is correctly precise — keep.**
> **Finding 4 — [suggestion] `"hit" | "miss"` union is the right representation — keep, don't switch to
> boolean/enum** (the `index.js:39` `else` does destructive work; the named union is self-documenting and
> extensible).
> **Finding 5 — [suggestion]** Add a `null` test to lock the contract once the type is widened.
>
> **Finding 6 — [important] `utils` is untyped `any`; a cache-API typo surfaces only as a swallowed runtime
> error → a permanent silent MISS** (`index.js:22`, `35-36`, `67-69`). Because everything is try/catch'd and
> degrades to a full build, a misspelled `utils.cache.restore`/`save` would never fail the build — it throws,
> is caught, logged as "skipped", and the cache silently never engages. Add a local JSDoc typedef for the
> `utils` slice used (`{ cache: { restore(path): Promise<boolean>, save(path): Promise<boolean> } }`).
>
> **Finding 7 — [suggestion]** `restore`'s boolean result is discarded (`index.js:23-24`); the code re-derives
> via `existsSync`. Correct, but a type would expose the ignored branch.
> **Finding 8 — [suggestion]** The three string constants are cross-file couplings (`.js`/`.toml`/`.mjs`) with
> no shared definition; can't be typed across `.toml`.

### comment-analyzer

> The comments are unusually accurate and well-maintained: the `netlify.toml` header was correctly rewritten
> for the new branching command, constants match, the canary path matches `buildScores.mjs`, and the 2.26.0
> sync warning is preserved and correct. **No critical (factually wrong / misleading) issues.** Three minor.
>
> **1. (suggestion) `.gitignore` — ambiguous "branches on" scope.** "the key marker and the cache-hit flag
> the build command branches on" parses as the command branching on *both* markers; it branches only on
> `.netlify-scores-hit`. The key marker is read by the plugin's `onPreBuild`, never by the build command.
> Distinguish the two roles.
>
> **2. (suggestion) `index.js:5` — deploy-only scope not stated.** "across production deploys" is correct and
> not rot, but the cache being a no-op locally / in CI (the `utils.cache` API only does anything on Netlify)
> is a non-obvious precondition worth stating, so local-vs-deploy behaviour differences read as expected, not
> bugs.
>
> **3. (suggestion) `index.js:42` wording drift** — "install + render" vs "install + regeneration" vs
> "install and regenerate" across log lines/comments. All correct; standardise for clarity.
>
> Positive: the `netlify.toml` build-command header (the file most at risk of comment-rot) was handled well;
> the fail-safe rationale comments explain *why* not *what*; the CANARY mirror comment and the decideScoreCache
> docstring are exactly right. No removals recommended.
