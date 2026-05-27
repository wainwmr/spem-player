# VERA-376 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-27 01:09
Last run:  2026-05-27 01:09

See also: [Original Report (cycle 1)](https://github.com/wainwmr/spem-player/issues/376#issuecomment-4550101568)

## Summary

[Placeholder — finalised at close-out.]

## Findings

### 376-01 — important — Idempotency test degraded to cache-identity check

> **pr-test-analyzer finding 1 — `src/test/lily.test.ts:96-103`:**
> Before the cache, the two `processLilypond()` calls each ran a full Ohm parse and equal lengths proved parser determinism. Post-cache, `result2 === result1` by reference; the test can no longer fail unless the cache itself is broken. The original contract is no longer covered.

**Bob's triage:** real coverage loss caused by this PR. The test name still says "idempotent — repeated calls give same dict length" but it now only checks cache identity. Split into two tests: one for cache identity (`expect(result2).toBe(result1)`) and one for parse determinism (`reset; result2 = processLilypond(); expect(result2).toEqual(result1)`).

**Resolution:** [open]

### 376-02 — important — `barCount` sync on cache hit is untested

> **pr-test-analyzer finding 2 — `src/test/lily.test.ts`, `src/ts/lily.ts:287`:**
> On cache hit, `processLilypond` reassigns the module-level `barCount` export. `MusicControls.ts:110, 162-163` consume it. No test exercises the sync. If someone moves the assignment out of the cache-hit branch in a future refactor, `MusicControls.barinput.max` silently becomes `"0"`.

**Bob's triage:** real coverage gap caused by this PR. Add a test that forces a known-wrong value into `barCount` (by direct reassignment via the export), then calls `processLilypond` again and asserts the cache-hit branch restored it.

**Resolution:** [open]

### 376-03 — suggestion — Post-throw cache state not asserted

> **pr-test-analyzer finding 3 — `src/test/lily.test.ts:94-103`:**
> On parse failure, the cache stays `null` (the assignment is unreachable past the throw). Undocumented. A future refactor that pre-allocates the cache slot before `lyGrammar.match` would silently corrupt every subsequent caller. Append `expect(processLilypond().dict.length).toBeGreaterThan(0)` after `vi.restoreAllMocks()` to prove the cache wasn't corrupted.

**Bob's triage:** defensive, cheap (+1 line). Address now.

**Resolution:** [open]

### 376-04 — suggestion — Cache reset relies on test ordering

> **silent-failure-hunter finding 1 — `src/test/lily.test.ts:98`:**
> The `resetLilypondCache()` call inside the throw test is keyed to test ordering ("earlier tests have warmed the cache"). If a future test before this one needs reset, or if `isolate: false` is ever set, the dependency becomes fragile. Move to a `beforeEach(() => resetLilypondCache())` at the top of the describe block.

**Bob's triage:** test robustness. `beforeEach` makes the assumption explicit and survives config or order changes. Address now.

**Resolution:** [open]

### 376-05 — suggestion — Cache-immutability invariant not expressed in `LilypondData`

> **type-design-analyzer concerns 1 + 4 — `src/ts/lily.ts:265-270`:**
> Cache hands out the same `dict` / `ranges` / `frLocations` references on every hit. `LilypondData` doesn't say "don't mutate me". No live bug today (no caller mutates), but the contract is load-bearing and invisible. Recommendation [A]: add `readonly` to the fields and the immediate array types so a future `lilyData.dict.push(...)` is a compile-time error.

**Bob's triage:** the invariant is real and load-bearing now. Compile-time enforcement is the right tool. Apply `readonly` at the field level and on the immediate outer arrays (`readonly dict: readonly Dictionary[][]` etc.) — covers the most likely mistakes without nesting `readonly` deeply.

**Resolution:** [open]

### 376-06 — suggestion — `resetLilypondCache` lacks an explanatory comment

> **type-design-analyzer concern 2 + code-reviewer finding 1 — `src/ts/lily.ts:383-385`:**
> `resetLilypondCache` is an arrow function (necessary — closure over `lilypondCache`), unlike the other `exportedForTesting` entries which are direct refs. The divergence is meaningful but unmarked. One-line comment explaining "test-only mutator; arrow form needed to close over the cache binding".

**Bob's triage:** trivial readability win. Address now.

**Resolution:** [open]

### 376-07 — suggestion — Cache comment doesn't flag the `barCount` sync side effect

> **comment-analyzer finding 2 — `src/ts/lily.ts:272-275`:**
> Current comment says cache holds the parsed data and is cleared by tests, but doesn't flag that on a cache hit the function reassigns the module-level `barCount` export. Worth a one-line addition: "On a cache hit, `barCount` is re-synced from the cached value to preserve the existing module-level side effect."

**Bob's triage:** trivial doc tighten. Address now.

**Resolution:** [open]

### 376-08 — suggestion — HACK comment could cross-link to the cache-hit sync

> **comment-analyzer finding 3 — `src/ts/lily.ts:261-262`:**
> The HACK comment is still accurate but the cache adds a second `barCount` write site (line 287). Append "(also re-synced on cache hits — see line 287)" so the two sites are discoverable from each other.

**Bob's triage:** trivial doc tighten. Address now.

**Resolution:** [open]

### 376-09 — suggestion — Diagnosis-delta should appear on the ticket close + PR body

> **comment-analyzer finding 1 — ticket #376, PR body:**
> Ticket body says "Add `test.sequential` or `--pool=forks`"; what landed is a result cache. The commit message explains, but the ticket and PR body should also note the delta so future readers don't grep for "sequential" and reach for the wrong fix.

**Bob's triage:** PR body covers it. Add an explicit note when closing the ticket too. Cheap.

**Resolution:** [open — addressed in PR body at publish step 8; ticket close-comment when PR merges]

### 376-10 — suggestion — Pre-existing dead `if (!semantics)` block

> **silent-failure-hunter finding 2 — `src/ts/lily.ts:291-293`:**
> The `if (!semantics) { semantics = setupLilypondParser(); }` block is dead code: `semantics` is initialised eagerly on line 35. Pre-existing, but the cache makes it doubly dead (also unreachable on cache hit). Worth removing or converting to a real lazy init.

**Bob's triage:** the file is already in the diff; removing the dead block is adjacent cleanup with no scope creep. Take it. (Alternative: file as a follow-up ticket. Chose to include — Bob.)

**Resolution:** [open]
