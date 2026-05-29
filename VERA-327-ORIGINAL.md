# VERA-327 Original Report (cycle 2)

Mode: redo-pr (Vera re-ran after PR rework, before re-publish)
Cycle: 2
Generated: 2026-05-29 22:20

See also: [Final Synthesis (cycle 2)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)
(Earlier cycles: [Synthesis (cycle 1)](https://github.com/wainwmr/spem-player/issues/327#issuecomment-4568208091))

## Raw agent reports (pass 1)

### code-reviewer

> **Summary of review for #327 (cycle 2)**
>
> Files reviewed: `src/ts/MusicCanvas.ts` (lines 568-624), `src/test/canvas.test.ts` (lines 483-643).
>
> Math verified independently: at rect 1400x400, canvasPadding=5, choirs.length=8, parts.length=5:
> - (1200, 300) → y=6.051 → choir=6, part=0 — confirms the `.toBe(0)` rebase change is correct.
> - clientY 10/20/30/40/50 → part 0/1/2/3/4 — confirms the table-driven cases.
>
> Type safety: `PartType = "all" | number` (`src/ts/common.ts:6`), so returning `Math.floor(...)` from `#getTouchPos` is type-compatible. `#moveToPosition` assignment to `voicePart` remains valid.
>
> Test suite: 28/28 pass in the Spem worktree (unrelated `spem-tele` worktree import error is harness noise, not from this branch).
>
> **Findings**
>
> **Critical:** none.
>
> **Important:**
>
> 1. **Stale comment misrepresents production behaviour** — `src/ts/MusicCanvas.ts:635-637`. The `#touchMoved` block still reads: *"…silently switching to `voicePart: "all"` (since `#getTouchPos` hard-codes "all", see #327)."* After this branch lands, `#getTouchPos` no longer hard-codes `"all"` — it returns a derived numeric part. The comment now (a) describes obsolete behaviour and (b) references its own ticket as if the fix lived elsewhere. A future reader/agent reading this comment will draw wrong conclusions about what touchmove would commit. Suggested fix: update to reflect that the part is now derived; drop the `#327` parenthetical here since #327 changed the derived value, not the touchmove invariant.
>
> **Rebase semantic-change check.** The `expect(canvas!.voicePart).toBe(0)` change is correct. Pre-#327 the test asserted `"all"` because `#getTouchPos` hard-coded it; post-#327 the formula `floor((y%1)*parts.length)` at clientY=300 with the rect mock yields `floor(0.0513 * 5) = floor(0.256) = 0`. The seeded sentinel `voicePart = 2` (line 489) still differs from the derived value (0), so the test retains its falsifier role: any spurious commit still overwrites `2` with a different value (`0`). Cycle-1 intent preserved.
>
> No other rebase residue detected in the diff. The `bar` derivation asymmetry between `#getTouchPos` and `#getMousePos` is pre-existing on `origin/main` and outside this ticket's scope.

### pr-test-analyzer

> **Critical:**
>
> **[C1] No test for the upper-edge clamp invariant that the diff's comment claims is load-bearing** — `src/test/canvas.test.ts` (missing test). The production diff adds an explicit comment in both `#getMousePos` and `#getTouchPos` claiming: *"the strict-`<` semantic of `%` guarantees the result is < parts.length, so no clamp needed"* — i.e. the formula's correctness rests on `y % 1 < 1` at the bottom edge. No test asserts `getTouchPos` returns a valid `part ∈ [0, parts.length)` AND `choir ∈ [0, choirs.length)` at this clamp boundary (e.g. `clientY = 400` or `clientY = 99999`). Recommend a test asserting bounds at and beyond the bottom edge.
>
> **[C2] No test for the top-padding region's part value** — for mouse, the existing test checks only that `part` is in range. For touch, even that weak check is absent: nothing tests what `#getTouchPos` returns when `clientY < canvasPadding`. The clamp forces `clampedY = canvasPadding`, so `y = 0`, `y%1 = 0`, `part = 0`. Recommend an explicit test for `clientY = 0` (and `clientY = 2`) asserting `part === 0` and `choir === 0`.
>
> **Important:**
>
> **[I1] `voicePart.toBe(0)` is brittle to a deliberately legitimate refactor** — `src/test/canvas.test.ts:519`. The assertion couples the #326 test to #327's specific arithmetic. The load-bearing property of this test (per its `(#326)` purpose) is "touchstart commits", not "commits to part=0 specifically". Recommend replacing `.toBe(0)` with `.not.toBe(2)` (the sentinel) — same falsifier strength for the #326 contract, decoupled from #327's specific arithmetic.
>
> **[I2] Table-driven test silently bound to config dimensions** — `src/test/canvas.test.ts:579-642`. The expected-part column is hand-computed against `choirs[0].length = 8` and `parts.length = 5`. Recommend an `expect(config.choirs[0].length).toBe(8); expect(config.parts.length).toBe(5);` guard at the top of the test.
>
> **[I3] No test for multi-touch (`targetTouches[0]` selection)** — `src/ts/MusicCanvas.ts:602-603` (untested branch). `#getTouchPos` reads only `e.targetTouches[0]`. No test verifies behaviour when `targetTouches` contains 2+ touches.
>
> **[I4] No test for `targetTouches` empty array** — `src/ts/MusicCanvas.ts:602`. `e.targetTouches[0].clientX` will throw if `targetTouches.length === 0`.

### silent-failure-hunter

> **Critical:**
>
> **[C1] `#getTouchPos` silently returns NaN for `choir`, `part`, `bar` when `rect.height === 2 * canvasPadding` (or `rect.width === 0`)** — `src/ts/MusicCanvas.ts:613-623`. Division-by-zero produces `Infinity` or `NaN`; `Math.floor(NaN) === NaN`; `Math.max(0, NaN) === NaN`. The new `part: Math.floor((y % 1) * config.parts.length)` likewise yields `NaN` when `y` is `NaN`/`Infinity`. The canvas can commit `choir: NaN, part: NaN, bar: NaN` into state with zero feedback. Pre-existing on main, but post-#327 `part` is now also `NaN`-vulnerable through the same division.
>
> **[C2] `e.targetTouches[0]` dereferenced without guard — `TypeError` is unhandled** — `src/ts/MusicCanvas.ts:602-603`. If `targetTouches` is empty (touchcancel converted to touchmove on some Android browsers, synthetic events from tests, accessibility tooling), `.clientX` throws. Pre-existing on main but reasserted here.
>
> **Important:**
>
> **[I1] `#getMousePos` and `#getTouchPos` produce different `bar` values for identical canvas coordinates** — `src/ts/MusicCanvas.ts:580` vs `:622`. For any point near the right edge, a mouse click and a touch tap at the exact same `clientX` map to different `bar` indices. The post-#327 change now makes touch a "first-class" input that commits derived `choir`/`part`/`bar` to state.
>
> **[I2] Comment claim "no explicit clamp is needed" relies on undocumented invariants** — `src/ts/MusicCanvas.ts:571-576, 616-618`. If `y` is `NaN` (see C1), `y % 1` is `NaN`; for `y` extremely close to an integer from below, `(y % 1) * 5` can round up to exactly `5.0` due to FP precision. Recommend keeping the symmetric clamp on `part` mirroring `choir`'s clamp.
>
> **[I3] No error path / no logging in either coord method — failures are structurally invisible** — `src/ts/MusicCanvas.ts:558-582, 600-624`. Neither method ever calls `logForDebugging`, `logError`. Every failure mode fails silently or throws unobserved.

### type-design-analyzer

> **[IMPORTANT] Stale comment falsely describes invariant** — `src/ts/MusicCanvas.ts:635-639`. The `#touchMoved` comment still reads "silently switching to `voicePart: \"all\"` (since `#getTouchPos` hard-codes \"all\", see #327)." The very change under review removed that. Tighten to reflect derived behaviour.
>
> **[IMPORTANT] Type system cannot express the new "touch produces a concrete part" invariant** — `src/ts/common.ts:6-12` and `MusicCanvas.ts:600`. After #327, `#getMousePos` and `#getTouchPos` are both total functions into the numeric half of `PartType`. Neither ever returns `"all"`. But the return type is still the union `Position` with `part: "all" | number`. Targeted fix: introduce `type DerivedPosition = Position & { part: number };` and change both `#getMousePos` and `#getTouchPos` to return `DerivedPosition`. `#moveToPosition` and `fireEvent` continue to accept the wider `Position`.
>
> **[IMPORTANT] Floor-of-product invariant relies on `clampedY ≥ canvasPadding` and is no longer documented at the boundary** — `src/ts/MusicCanvas.ts:571-580, 616-622`. The new comment correctly notes that `(y % 1) < 1` guarantees `floor((y%1) * parts.length) < parts.length`. It does not state the lower-bound assumption: `y % 1 ∈ [0, 1)` only if `y ≥ 0`. If a future refactor lets `clampedY < canvasPadding` slip through, `y % 1` becomes negative in JavaScript, yielding negative `part`. Either add an explicit `Math.max(0, …)` clamp, or extend the comment.
>
> **[IMPORTANT] `setPart`'s defensive widening (`pos.part == "all" ? "all" : Number(pos.part)`) is now dead along the touch path** — `index.ts:221, 543`. Not a bug introduced by this PR, but worth a brief comment noting the partition.

### comment-analyzer

> **Critical:** None.
>
> **Important:**
>
> **[Important] Hard-coded `8 choirs and 5 parts` in comment** — `src/test/canvas.test.ts:484-485`. The numbers are correct today, but `config.choirs[0].length` and `config.parts.length` are the source of truth. At minimum the comment should name the config keys, not the literals.
>
> **[Important] Derivation-table comment hard-codes `1400x400`, `canvasPadding=5`, `choirs.length=8`, `parts.length=5`, derived `390`** — `src/test/canvas.test.ts:579-587`. Four of those five numbers are configurable; if any changes, every numeric line in the table comment becomes wrong. Recommend the comment state the derivation symbolically.
>
> **[Important] Invariant comment claims `y` is "a float in `[0, choirs.length]`" — true only because of the clamp** — `src/ts/MusicCanvas.ts:571-576`. Tighten the lead sentence: "Because `clampedY` is clamped to `[canvasPadding, rect.height - canvasPadding]`, `y` lies in `[0, choirs.length]`...".
>
> **[Important] "strict-`<` semantic of `%`" claim — same theme** — `src/ts/MusicCanvas.ts:616-618`. The claim is correct for non-negative dividends; `y` here is provably non-negative only because of the clamp. The comment delegates to `#getMousePos` for "the `y` semantics" — that's good DRY, but the two `y` formulas are textually duplicated and the "see `#getMousePos`" pointer will quietly mislead if they ever drift.
>
> **[Important] `bar≈119` correct for touch but wrong for mouse** — `src/test/canvas.test.ts:542` and `:485`. Both rebased comments cite `bar≈119` at `(1200,300)`. Correct for `#getTouchPos`; for `#getMousePos` the value is `120`. Worth saying "via `#getTouchPos`" explicitly.

- Claude
