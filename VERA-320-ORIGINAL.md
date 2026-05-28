# VERA-320 Original Report (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-28 16:25 UTC

See also: [Final Synthesis (cycle 1)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)

## Raw agent reports (pass 1)

### code-reviewer

> **Critical**
>
> **`src/ts/MusicScore.ts:154` — Unguarded `this.bars[1]` access; relies on undefined comparison.** Severity: critical. If `this.bars` has fewer than two elements (e.g. an empty array, or a degenerate score with only the intro bar position), `this.bars[1]` is `undefined`, and `cursorpt.x < undefined` evaluates to `false`. That means the ternary silently falls through to `idx`, which is itself derived from a `find` that would have returned `undefined` and short-circuited via the outer `if (result)` — so in practice the path is dead, but the new line introduces a comparison-against-undefined that is fragile and hides intent. The function should not assume `bars[1]` exists; a length check (or a guard that the click falls within a valid in-score region) is the principled fix.
>
> **Important**
>
> **`src/ts/MusicScore.ts:154` — Magic number `1` is the wrong abstraction.** Severity: important. The cut-off `this.bars[1]` is a re-statement of "the start of bar 1", but the original loop already computes exactly that via `find` + `indexOf`. The cleaner formulation is to test whether the found index is `1` AND the cursor is to the left of `bars[1]` (i.e. inside the intro), or — better — to expose the intro region semantically (`introEnd = this.bars[1]`) with a comment explaining that `bars[0]` is the intro bar's left edge and `bars[1]` is bar 1's left edge. The current expression duplicates the boundary value already implicit in `result` and couples the fix to an array-position convention that is nowhere documented in the file.
>
> **`src/ts/MusicScore.ts:154` — Boundary behaviour at `cursorpt.x === bars[1]` is asymmetric and unspecified.** Severity: important. The `find` predicate is strictly `x > cursorpt.x`, so a click landing exactly on `bars[1]` makes `find` return `bars[2]` (not `bars[1]`), giving `idx = 2`. The new ternary is `cursorpt.x < this.bars[1]`, also strict, so the exact-equality click is treated as "not intro" and falls through to `idx = 2` — i.e. clicking precisely on the start of bar 1 jumps to bar 2, not bar 1. This boundary behaviour pre-dates the fix but the change does nothing to address it and the new test (`clientX: 50`) doesn't cover it; the ticket should either document the boundary as out-of-scope or pick a consistent inequality.
>
> **`src/test/score.test.ts:393–429` — Test doesn't exercise the bug's actual cause.** Severity: important. The test sets `elem.bars = [0, 100, 200, 300]` and clicks at `x = 50`, which is the easy "well inside the intro" case. It does not cover: (a) `x = 0` (the very start), (b) `x` just under `bars[1]` (e.g. 99, where the off-by-one would bite), (c) `x = 100` (the exact boundary discussed above), or (d) a non-zero `bars[0]` (the code assumes `bars[0]` is the intro's left edge but tests it with `0`, which is the trivially-passing case for many wrong implementations). A single mid-region click confirms the fix superficially but provides little regression value.
>
> **Suggestions**
>
> **`src/ts/MusicScore.ts:151` — Far-right click past the last bar still silently no-ops.** `find((x) => x > cursorpt.x)` returns `undefined` for any click to the right of the last bar position, and the outer `if (result)` swallows the click without firing `music-score-click`. Not a regression introduced by the diff, but the ticket touches exactly this control flow.
>
> **`src/ts/MusicScore.ts:153–154` — Readability: inline ternary obscures intent.** An early-return `if (cursorpt.x < this.bars[1]) { ... return; }` — or a brief comment naming the intro-bar case — would make the next reader's job easier.
>
> **`src/test/score.test.ts:408–414` — `getScreenCTM` mock duplicated verbatim from sibling test.** A small helper (`setupClickableScore(elem)`) would remove ~15 lines of duplication and make future boundary-case tests cheap to add.
>
> **`src/ts/MusicScore.ts:154` — Preserves non-intro behaviour, but only by accident of array shape.** A comment stating the invariant (`bars[0]` == intro left edge, `bars[1]` == bar-1 left edge) would lock the assumption in.

### pr-test-analyzer

> **Summary.** The new test pins one concrete case (click at clientX=50 with `bars=[0,100,200,300]` produces `bar=0`), which would catch a full regression of the fix. However the test exercises the same code path that the old test already partially exercised, and several edge cases that the new conditional `cursorpt.x < this.bars[1] ? 0 : idx` introduces are not covered. The fix also encodes an implicit assumption (`bars` has at least two elements and `bars[0]` is `0`) that no test guards.
>
> **[A] `src/test/score.test.ts:393` — Missing boundary test at `cursorpt.x === bars[1]` — important.** The fix uses a strict `<` comparator. No test pins behaviour at the exact boundary `cursorpt.x === bars[1]` (i.e. clientX=100 with the chosen `bars`). A future refactor that flips `<` to `<=` would change which bar is selected on the boundary and no test would notice.
>
> **[B] `src/test/score.test.ts:393` — No coverage of the "click inside numbered bar 1" case — important.** The existing non-intro test (line 355) picks clientX=150, which lands in bar 2's region (per the existing convention). Nothing covers a click in the region `bars[0]..bars[1]` that is supposed to resolve to bar 1 specifically. The fix makes bar 1 unreachable by clicking — the new code forces bar 0 whenever `cursorpt.x < bars[1]`. Worth confirming with the ticket: does bar 1 still get a clickable region, or is the entire pre-bars[1] strip now bar 0?
>
> **[C] `src/ts/MusicScore.ts:154` — Untested assumption that `this.bars.length >= 2` — important.** `this.bars[1]` will be `undefined` if `bars` is empty or single-element. In production `bars` is populated from `getBars()` so this may never happen, but the fix introduces a new dependency on `bars[1]` that wasn't there before.
>
> **[D] `src/test/score.test.ts:393` — Test name does not pin the bug being fixed — suggestion.** A name like `"scoreClicked returns bar 0 for clicks left of bar 1 (#320)"` would tie the test to the ticket.
>
> **[E] `src/test/score.test.ts:378,416` — Direct mutation of `elem.bars` is an implementation seam — suggestion.** Both `scoreClicked` tests overwrite `elem.bars` after load, bypassing `getBars()`. Pragmatic but worth a comment explaining why `bars` is being stubbed.
>
> **[F] `src/test/score.test.ts:355,393` — Two near-identical tests with heavy setup — suggestion.** Parameterising via `it.each` would let you add the boundary case and the "past the last bar" case cheaply.
>
> **[G] `src/ts/MusicScore.ts:151-156` — "Click past the last bar" path is silently uncovered — suggestion.** When `cursorpt.x >= bars[bars.length-1]`, `find` returns `undefined`, `setBar` is never called, and the event never fires. No test asserts this.
>
> **Positive observations.** The new test uses real `MusicScore` loading and a real `MouseEvent` rather than calling `setBar` directly. The mock of `getScreenCTM` is the right seam. The existing non-intro test at line 355 still passes against the patched code. Awaiting the `music-score-click` event is a clean way to handle the async `setBar`.

### silent-failure-hunter

> **`src/ts/MusicScore.ts:154` — critical.** The expression `this.bars[1]` will return `undefined` when `bars.length < 2`. Any `<` comparison against `undefined` evaluates to `false`, so the ternary silently selects `idx` instead of `0` — meaning on a degenerate score with only one detected bar position, the intro-bar fix mutely reverts to the very behaviour it was written to fix. No log, no warning. This is a NEW dependency the original code did not have, and `getBars()` at lines 455–476 has multiple failure paths (missing `parentElement`, missing `transform`, all tspans filtered out as ≤ 6) that can produce a short `bars` array without throwing.
>
> **`src/ts/MusicScore.ts:151-156` — critical (pre-existing, exposed by diff).** The pre-existing `if (result)` guard remains: when the user clicks past the last bar, `find` returns `undefined`, the `if` is falsy, and the handler returns without firing `music-score-click`, without logging, and without telling the user why their click did nothing. The diff was the right moment to address this.
>
> **`src/ts/MusicScore.ts:154` — important.** The fix conflates two distinct geometric conditions into the single test `cursorpt.x < this.bars[1]`: (a) "click landed in the intro region before bar 1" and (b) "click landed before `bars[0]` itself" (negative-x clicks). Both collapse silently to `setBar(0)`. If `bars[0]` is ever non-zero, an out-of-range click is silently coerced rather than reported.
>
> **`src/ts/MusicScore.ts:148-149` — important (pre-existing, exposed by diff).** `getScreenCTM()` can return `null` (the type is `DOMMatrix | null`), and `m?.inverse()` then passes `undefined` to `matrixTransform`, producing a `cursorpt` with `NaN` coordinates. `NaN > x` is always `false`, so `find` returns `undefined`, `if (result)` is false, and the click is silently dropped. Worth flagging because the new code reads `bars[1]` unconditionally before the ternary branches.
>
> **`src/test/score.test.ts:416` — important (test-seam masking).** The test sets `elem.bars = [0, 100, 200, 300]` directly after `await waitingForLoaded`, overwriting whatever `getBars()` populated from the real SVG. The fix's NEW failure modes (above) are all invisible to this test. A reviewer reading only the test would conclude the fix is covered; a user hitting a one-bar score in production would see the original bug return with no diagnostic.
>
> **`src/ts/MusicScore.ts:154` — suggestion.** `indexOf(result)` can in principle return `-1` if `result` was mutated out of `bars` between the `find` and the `indexOf` calls. The diff doubles the TOCTOU surface by adding a second public-field read.

### type-design-analyzer

> **[A] `src/ts/MusicScore.ts:18` — suggestion.** The field `bars: number[]` carries none of the structural invariants the new click code now depends on. The expression `this.bars[1]` on line 154 is silently `number | undefined` under strict index access. A typed alias like `type BarPositions = readonly [0, ...number[], number]` would make `bars[1]` provably present and document the `getBars()` postcondition — but this is a stylistic upgrade, not a correctness gap given the existing `getBars()` always pushes a 0-prefix and svgWidth suffix.
>
> **[B] `src/ts/MusicScore.ts:151-156` — suggestion.** `scoreClicked` is now the second site (alongside `scrollSmooth` at lines 264, 299-301) that indexes `this.bars` with hard-coded offsets without any local guard. The fact that two methods independently rely on length-greater-than-1 and on `bars[0]===0` suggests these invariants should be encoded once. Pragmatically, given the array is only ever populated by the single `getBars()` producer in the same class, this is low-priority.
>
> **[C] `src/ts/MusicScore.ts:236` — suggestion.** `setBar(b: string | number)` accepts any number, but the value space the click handler now passes is the closed interval `[0, bars.length-1]`. The signature does not distinguish the "bar index 0..139" domain from the "fractional bar position used by `scrollSmooth`" domain — both flow through the same `string | number` parameter. The diff didn't introduce this conflation.
>
> **Verdict.** No critical or important type-design findings against this diff. The existing `bars: number[]` type under-expresses its invariants, but: (i) the invariants are upheld by a single in-class producer (`getBars()`), (ii) the new code's reliance on `bars[1]` is no riskier than the pre-existing reliance on `bars[length-1]` and `bars[length-2]` in `scrollSmooth`, and (iii) tightening the type would be a refactor disproportionate to a 2-line bug fix.

### comment-analyzer

> **Summary.** The fix at `MusicScore.ts:154` introduces a load-bearing magic relationship (`bars[1]` as the intro-bar boundary) with no comment to anchor it. The semantics of `bars[0]` / `bars[1]` are knowable only by reading `getBars()` 300 lines further down. There is no comment drift elsewhere in the file — pre-existing comments remain accurate. The test name pins the right behaviour.
>
> **Critical Issues:** None. The new code is correct and no existing comment now lies about behaviour.
>
> **`src/ts/MusicScore.ts:154` — important.** Current state: `this.setBar(cursorpt.x < this.bars[1] ? 0 : idx);` carries no comment. A future reader sees the literal `bars[1]` and has to derive from `getBars()` (lines 473-474) that `bars[0] === 0` and `bars[1]` is the x-coordinate of the first numbered bar — i.e. that the region `[0, bars[1])` is the intro. The clarity gap here is exactly the bug's centre of gravity: this method has been wrong since it was written precisely because the relationship between `find((x) => x > cursorpt.x)` and the intro region was implicit. The original `setBar(bars.indexOf(result))` looks "obviously right" until you remember bar 0 exists. Suggestion: a one-line WHY comment such as `// bars[1] is the x of bar 1; clicks left of it land in the intro (bar 0)`.
>
> **`src/ts/MusicScore.ts:18` — suggestion.** Current state: `bars: number[] = [];` — the public field has no JSDoc. After this fix, `bars` is no longer just "a list of bar x-positions"; the boundaries are semantically distinguished: `bars[0] === 0` and `bars[bars.length - 1] === svgWidth` are synthetic sentinels added by `getBars()`, and `bars[1]` is now load-bearing for click semantics.
>
> **Positive Findings.** The test name `"scoreClicked selects bar 0 when clicking in intro bar region"` is well chosen. It names the input domain ("intro bar region" — abstract enough to outlive the `clientX: 50` choice) AND pins the asserted behaviour ("selects bar 0" — concrete enough that a future "off-by-one" regression won't sneak past a renamed test). The `// Ignore clicks on the overlay area` and `// The cursor point, translated into svg coordinates` comments still remain truthful.
>
> **Comment-drift check.** Searched all `bars[…]` access sites in `MusicScore.ts` (lines 151, 153, 154, 264, 266, 300, 301, 303, 304) and the `getBars()` body (lines 455-476). **No comment drift found.**

- Claude
