# VERA-376 Original Report (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-27 01:09

See also: [Final Synthesis (cycle 1)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)

## Raw agent reports (pass 1)

### code-reviewer

> **Verdict: clean** — caching preserves all observable semantics. One suggestion-level note below.
>
> 1. **`barCount` sync on cache hit.** Reassigns `barCount = lilypondCache.barCount` before returning. Matches the uncached side effect. `MusicControls.ts` consumers see the same value.
> 2. **`semantics` lazy init.** Initialised at module load. Cache hit bypasses but that's fine — `semantics` is only needed for parsing.
> 3. **`scores` populate side effect.** `scores` is module-private; skipping populate on cache hit is safe.
> 4. **Test throw path.** `resetLilypondCache()` before `vi.spyOn(...).mockReturnValueOnce(failedMatch)` lets the spy's `Once` budget be consumed by the call inside `processLilypond`.
> 5. **Vitest isolation.** Default `isolate: true` gives each test file its own module instance, so the cache is per-file.
>
> Finding 1 (suggestion): `resetLilypondCache` has no JSDoc and the name doesn't read as test-only on the consumer side. Optional: rename to `_resetLilypondCacheForTest` or add a one-line comment. The `exportedForTesting` namespace already signals intent — skip if you consider it bikeshedding.

### pr-test-analyzer

> Cache is sound. Two latent test gaps that the cache now actively masks rather than merely thins.
>
> 1. **important — `src/test/lily.test.ts:105-112`. Idempotency test silently degraded to a cache-hit assertion.** Before this PR, two calls each ran a full Ohm parse — equal lengths genuinely proved parser determinism. Post-PR, `result2 === result1` by reference (same cache object); the test cannot fail unless the cache is broken. Original contract no longer covered. Fix: call `resetLilypondCache()` between the two `processLilypond()` invocations, or split into two tests — one for cache identity (`expect(result2).toBe(result1)`) and one for parse determinism (`reset; result2 = processLilypond(); expect(result2).toEqual(result1)`).
>
> 2. **important — `src/test/lily.test.ts:85-92`. `barCount` sync-on-cache-hit branch is untested.** `lily.ts:287` mutates the module-level `barCount` export on every cache hit; `MusicControls.ts:110, 162-163` consume it. No test exercises the path. Regression risk: if someone moves the assignment out of the cache-hit branch, `MusicControls.barinput.max` silently becomes `"0"`. Fix: `it("processLilypond() restores barCount on cache hit")`.
>
> 3. **suggestion — `src/test/lily.test.ts:94-103`. Throw test does not assert post-throw cache state.** On parse failure the cache stays `null` (assignment unreachable past throw). Good, but undocumented. Fix: append `expect(processLilypond().dict.length).toBeGreaterThan(0)` after `vi.restoreAllMocks()` to prove the cache wasn't corrupted.
>
> 4. **suggestion — `src/ts/lily.ts:286-289`. Cache invariant not asserted in production.** Trust on `lilypondCache.barCount` matching the parser's `localBarCount`. Cheap insurance: an existing test assertion after reset+re-call.
>
> Confirmations: `resetLilypondCache` is needed only in the throw test (no other mock of `lyGrammar.match`). Production callers (`MusicCanvas.ts`, `MusicControls.ts` via `barCount`) treat the result as static data. No other test file relies on uncached behaviour.

### silent-failure-hunter

> **Verdict: clean.** The four focus questions resolve as follows.
>
> 1. **`scores` global on cache hit.** Safe. The only non-test importer of `scores` is `lily.ts` itself (line 316), which reads it inside `processLilypond` before the cache is set on the first call. No production reader outside `lily.ts`. Populated `scores` remains populated from call #1 onward.
> 2. **HMR / module reload.** Safe by construction. `src/ts/lily.ts` uses no `import.meta.hot` API; either full page reload or wholesale module replacement gives a fresh `lilypondCache = null` alongside fresh `semantics`/`scores`/`barCount`.
> 3. **`semantics` reset vs. cache hit.** Not exploitable. `semantics` is initialised eagerly at module top level (line 35), not lazily — the `if (!semantics)` guard inside `processLilypond` is already dead code on `main` and remains dead. Nothing nulls `semantics`, and `vi.restoreAllMocks()` doesn't touch module-level variables.
> 4. **Cross-file cache leak via `test.isolate`.** Safe at the current configuration. `vite.config.ts` doesn't set `isolate`, so it defaults to `true`.
>
> Findings:
>
> 1. **suggestion** — `src/test/lily.test.ts`. The cache reset on line 98 is keyed to test ordering ("earlier tests"). If a future test before this one needs `resetLilypondCache` or if `isolate: false` is ever set, the dependency becomes fragile. Fix: add `beforeEach(() => exportedForTesting.resetLilypondCache())` at the top of the `describe` block and drop the inline call, OR keep the inline call and add a short comment.
> 2. **suggestion** — `src/ts/lily.ts:291-293`. The `if (!semantics) { semantics = setupLilypondParser(); }` block is dead code: `semantics` is eagerly initialised on line 35. Not introduced by this PR, but the cache makes it doubly dead. Worth removing in a follow-up.

### type-design-analyzer

> ### Ratings
>
> - **Encapsulation: 8/10.** Cache variable is module-private; only `processLilypond` writes it on the success path; reset is gated through `exportedForTesting`. Tiny leak: `barCount` is still a writable `export var` (pre-existing HACK).
> - **Invariant Expression: 4/10.** `LilypondData | null` says only "maybe present". The "result is immutable to callers" contract (load-bearing now that the same reference is handed out repeatedly) is unwritten.
> - **Invariant Usefulness: 7/10.** The cache prevents the re-parse; the null-vs-set discriminant is the right shape.
> - **Invariant Enforcement: 5/10.** Construction-time invariants (parse success) are enforced. Post-construction immutability is enforced by convention only.
>
> ### Concerns
>
> 1. **Type modelling — `LilypondData | null`.** Correct discriminant, but misses the new invariant: the returned value is now shared across calls and must be treated as immutable. Surveyed call sites — none mutate `dict` / `ranges` / `frLocations` today. A tighter form: `Readonly<LilypondData> | null` with `readonly` on each field, or `DeepReadonly<LilypondData>`.
> 2. **`resetLilypondCache` as arrow function vs direct refs.** The divergence is necessary (closure over the binding), not stylistic. Worth a one-line comment explaining the mutation context.
> 3. **TS narrowing on cache-hit return.** Yes — TS narrows `lilypondCache` from `LilypondData | null` to `LilypondData`. Correct.
> 4. **Mutable internals + shared reference.** The cache hands out the same `dict` / `ranges` / `frLocations` references on every hit. `LilypondData` doesn't say "don't mutate me". Today no caller mutates them, but the contract is now load-bearing and invisible.
>
> ### Recommended improvements (pick at most one or two)
>
> - **[A] (recommended)** Add `readonly` to `LilypondData`'s fields and (ideally) the immediate array types. Cost-free at runtime; expresses immutability invariant; surveyed call sites compile unchanged.
> - **[B] (alternative)** Add a one-line doc comment on `LilypondData`.
> - **[C] (cheap, independent)** One-line comment on `resetLilypondCache` explaining why it diverges.
>
> Take [A] + [C].

### comment-analyzer

> The two new comments accurately describe behaviour. The pre-existing `HACK` comment at `lily.ts:261-262` remains accurate. The only meaningful gap is the ticket diagnosis vs. fix delta, which the commit message handles but the PR body / ticket close should make explicit.
>
> 1. **suggestion — ticket #376 / PR body — diagnosis delta not surfaced on the ticket.** Ticket says "Add `test.sequential` or `--pool=forks`"; what landed is a result cache. Close with a short note: "Landed as a `processLilypond` result cache (see commit). `describe.sequential` was a no-op — tests in a describe already run sequentially in Vitest 4; contention is inter-file, not intra-file. Caching eliminates the redundant parses."
> 2. **suggestion — `src/ts/lily.ts:272-275` — cache comment is accurate but understates the test-side contract.** Doesn't flag the `barCount` re-sync side effect on hit. Worth a one-line addition: "On a cache hit, `barCount` is re-synced from the cached value to preserve the existing module-level side effect (see HACK at line 261)."
> 3. **suggestion — `src/ts/lily.ts:261-262` HACK comment.** Still accurate. If you touch this comment, append "(also re-synced on cache hits — see line 287)" so the two sites are discoverable from each other.
> 4. **No action** — the test reset comment on line 95-97 is accurate; `doc/notes/issue-89.md` and `src/test/canvas.test.ts:10` are unaffected.
