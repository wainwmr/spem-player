# VERA-327 Final Synthesis (cycle 2)

Mode: redo-pr (Vera re-ran after PR rework, before re-publish)
Cycle: 2
Generated: 2026-05-29 22:25
Last run:  2026-05-29 22:25

See also: [Original Report (cycle 2)](https://github.com/wainwmr/spem-player/issues/327#issuecomment-4579981818)
(Earlier cycles: [Synthesis (cycle 1)](https://github.com/wainwmr/spem-player/issues/327#issuecomment-4568208091))

## Summary

[To be finalised at close-out.]

## Findings

### 327-01 — important Stale comment misrepresents production behaviour

> **code-reviewer + type-design-analyzer, `src/ts/MusicCanvas.ts:635-639`:**
> The `#touchMoved` block still reads "silently switching to `voicePart: \"all\"` (since `#getTouchPos` hard-codes \"all\", see #327)." After this branch lands, `#getTouchPos` no longer hard-codes `"all"` — it returns a derived numeric part. A future reader will be misled about what touchmove would commit.

**Bob's triage:** real defect, caused by diff — comment-to-code drift introduced when the `(#326)` tests landed on `main` and #327 then rebased on top. The comment's `(#327)` parenthetical is now self-referentially wrong: this is the change that removed the hard-coding.

**Resolution:** addressed (commit TBD).

### 327-02 — important Test assertion couples #326 test to #327 arithmetic

> **pr-test-analyzer, `src/test/canvas.test.ts:519`:**
> The `touchstart commits position (#326)` test asserts `expect(canvas!.voicePart).toBe(0)`. The test's purpose is "touchstart commits", not "commits to part=0 specifically". Replacing with `.not.toBe(2)` (the seeded sentinel) preserves the falsifier and decouples from #327's arithmetic.

**Bob's triage:** defensive nit, but caused by my rebase resolution. I over-coupled when changing `"all"` → `0`. Restoring the original falsifier shape (any-value-other-than-sentinel) is a small fix that aligns the test's assertion with its load-bearing purpose. The #327 arithmetic is already pinned by the new table-driven test below.

**Resolution:** addressed (commit TBD).

### 327-03 — critical NaN propagation in coord helpers on degenerate rect

> **silent-failure-hunter, `src/ts/MusicCanvas.ts:613-623`:**
> `#getTouchPos` returns `NaN` for `choir`, `part`, `bar` when `rect.height === 2 * canvasPadding` or `rect.width === 0`. `Math.floor(NaN)` is `NaN`; `Math.max`/`Math.min` propagate NaN. The canvas can commit `choir: NaN, part: NaN, bar: NaN` into state with zero feedback.

**Bob's triage:** pre-existing — the same arithmetic was on `main` before #327. The PR does not introduce the failure mode, it does increase the surface (part is now also derived). Out of scope for #327's narrow purpose.

**Resolution:** deferred to Workbench Item TBD.

### 327-04 — critical Empty `targetTouches[0]` dereference

> **silent-failure-hunter + pr-test-analyzer, `src/ts/MusicCanvas.ts:602-603`:**
> `e.targetTouches[0].clientX` throws `TypeError` if `targetTouches.length === 0`. Edge cases include synthetic events, accessibility tooling, touchcancel-converted-to-touchmove on some Android browsers.

**Bob's triage:** pre-existing — same dereference on main. Defensive nit. The W3C touch model guarantees at least one targetTouch on touchstart/touchmove, so violations come from synthetic input. Bundle with 327-03 in a single "coord-helper defensive hardening" Workbench item.

**Resolution:** deferred to Workbench Item TBD (bundled with 327-03).

### 327-05 — important `bar` derivation asymmetry between mouse and touch

> **silent-failure-hunter, `src/ts/MusicCanvas.ts:580` vs `:622`:**
> `#getMousePos` computes `bar` without subtracting `canvasPadding` from `clampedX`; `#getTouchPos` does. For identical canvas coordinates the two return different `bar` values.

**Bob's triage:** pre-existing — already filed as [Item #278](https://github.com/wainwright1000/spem-tools/issues/278). Duplicate.

**Resolution:** rejected (duplicate of WB #278).

### 327-06 — important `DerivedPosition` narrower type

> **type-design-analyzer, `src/ts/common.ts:6-12` and `MusicCanvas.ts:600`:**
> After #327, `#getMousePos` and `#getTouchPos` are both total functions into the numeric half of `PartType`. The type system still says `part: "all" | number`. Targeted fix: introduce `type DerivedPosition = Position & { part: number };` so "canvas-derived positions never produce 'all'" is compile-time enforced.

**Bob's triage:** defensive nit at the type level. The change is well-scoped, but it expands #327's diff into a type-system change touching the Position interface and ripple sites. Design call — the existing type accepts the wider union deliberately because state can be `"all"` (URL/controls path). The narrowing is correct but pulls #327 into a wider refactor.

**Resolution:** deferred to Workbench Item TBD.

### 327-07 — coverage gaps for boundary / multi-touch / empty cases

> **pr-test-analyzer C1/C2/I3/I4:**
> Missing tests for: upper-clamp boundary (`clientY = 400`, `clientY = 99999`); top-padding region (`clientY = 0..4`); multi-touch (`targetTouches.length >= 2`); empty `targetTouches`.

**Bob's triage:** defensive coverage. The happy path is covered by the new table-driven test (5 cases). The boundary cases pin against future regressions but no current bug. Worthwhile — bundle as one Workbench item, "extend canvas touch coverage".

**Resolution:** deferred to Workbench Item TBD.

### 327-08 — error logging in coord helpers

> **silent-failure-hunter I3:**
> Neither `#getMousePos` nor `#getTouchPos` calls `logForDebugging` / `logError`.

**Bob's triage:** over-engineering for a touch-coord helper. The functions are pure derivations on event geometry; the appropriate place for telemetry is the calling event handler if at all. Rejecting on cost/benefit grounds — adding a log per touch event would pollute the debug log without aiding diagnosis.

**Resolution:** rejected (over-engineering).

### 327-09 — comment hygiene cluster

> **comment-analyzer I1-I5 + silent-failure-hunter I2 + type-design-analyzer I3:**
> Cluster of overlapping comment improvements:
> - Hard-coded `8 choirs`, `5 parts`, `390`, `1400x400` in `canvas.test.ts:484-485` and `:579-587` — name the config keys instead.
> - Invariant comment in `MusicCanvas.ts:571-576` says `y ∈ [0, choirs.length]` without crediting the clamp two lines above.
> - `MusicCanvas.ts:616-618` "strict-`<` semantic of `%`" claim — same theme.
> - `MusicCanvas.ts:616-618` `"see #getMousePos"` will mislead if the two formulas drift.
> - `canvas.test.ts:485` and `:542` cite `bar≈119` — true for touch, not for mouse.

**Bob's triage:** comment hygiene. Small bundle of edits. Most of these are about tightening the lower bound / preconditions that the clamp enforces. Addressing now reduces future rebase drift. Single commit.

**Resolution:** addressed (commit TBD).

## Suggestions (no resolution required)

- code-reviewer noted positive observations: math verified, type safety preserved, falsifier role retained, PR/seed sentinel pattern correctly evolved rather than deleted.
- pr-test-analyzer noted that the table-driven test correctly chose `clientY` values that land mid-row (≥ 0.3 from each boundary), so FP jitter cannot flip the assertion.
- type-design-analyzer noted that the two derivation formulae are now structurally identical between mouse and touch, modulo the `bar` asymmetry (already WB #278).
- comment-analyzer noted that no TODOs / FIXMEs / HAKs were introduced.

- Claude
