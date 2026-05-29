# VERA-388 Original Report (cycle 2)

Mode: redo-pr (Vera re-ran after PR rework, before re-publish)
Cycle: 2
Generated: 2026-05-29 23:25

See also: [Final Synthesis (cycle 2)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)
(Earlier cycles: [Synthesis (cycle 1)](https://github.com/wainwmr/spem-player/issues/388#issuecomment-4570234906))

## Raw agent reports (pass 1)

### code-reviewer

> **Clean — no critical/important findings.** Cycle 2 is a strict superset of cycle 1: the production fix is unchanged, and the only new work (commit 4410de1) is the mechanical fixture extension required by PR #400's tests, applied correctly without altering their assertions.
>
> Verified:
> - `#getTouchPos` reads `e.changedTouches[0]`. Per the WHATWG/W3C touch-events spec, `changedTouches` is guaranteed non-empty for touchstart/touchmove/touchend/touchcancel — the change is the right shape.
> - Only call site of `#getTouchPos` is `#touchStarted` (line 626). No other `targetTouches`/`changedTouches` consumers in `src/ts`.
> - The two #400 tests (`touchstart commits position (#326)` at line 588, `touchmove does not commit position (#326)` at line 653) build their `touch` fixture and dispatch the synthetic event using only `targetTouches`. Once `#getTouchPos` reads `changedTouches[0]`, those events would throw `TypeError`. Adding `changedTouches: [touch]` (same object, same coordinates) is the minimal correct fix; load-bearing intent preserved.
> - Cycle-1 tests still genuine falsifiers — they set `targetTouches: []` and rely on `changedTouches` resolution, so reverting the production change would time them out.

### pr-test-analyzer

> **[A] (Important, rating 7)** — `src/test/canvas.test.ts:344` (test `"touchmove resolves a position when the touch is not in targetTouches"`).
>
> The test claims to exercise `#getTouchPos` on a touchmove with empty `targetTouches`. But post-#326 (in `MusicCanvas.ts:631-640`), `#touchMoved` does not call `#getTouchPos` — it only calls `evt.preventDefault()` and `fireEvent("music-canvas-touchmove")`.
> - The `changedTouches: [touch]` fixture is not load-bearing; removing it leaves the test passing.
> - The assertion `expect(moveEvent.detail.position.bar).toBe(9)` passes only because `canvas!.bar` was set to 9 by the immediately preceding touchstart #388 test via state leak across the `beforeAll`-scoped singleton canvas. The detail.position comes from `fireEvent`'s fallback in `MusicElement.ts:92-99` reading current canvas state, not from `#getTouchPos`.
> - A future refactor that re-introduces `#getTouchPos` into `#touchMoved` would crash production but the test would still pass for the wrong reason.
> - Suggested fix: delete this test (or seed `canvas!.bar = 0` at the top to break the state-leak coincidence).
>
> **[B] (Important, rating 5)** — `src/test/canvas.test.ts:697-698`.
>
> The new comment "Mirror `targetTouches` — see the touchstart counterpart above" implies the `changedTouches` fixture is needed to prevent a TypeError, as it is for the touchstart counterpart. But `#touchMoved` does not read `changedTouches`, so the fixture is defensive scaffolding, not a crash-avoidance requirement. Reword to clarify defensive-not-load-bearing.
>
> **[C] (Test quality, out of scope)** — State leakage across the singleton canvas shared by every test. The #326 tests defensively seed sentinel values; the new #388 tests do not.

### silent-failure-hunter

> **Clean — no new findings introduced by the diff.**
>
> The production swap (`targetTouches[0]` → `changedTouches[0]`) preserves the same throw-loudly-on-empty failure shape as before. The diff neither adds nor removes silent fallbacks. The test additions include explicit falsifier reasoning, positive controls that prevent vacuous passes, and citation comments tying the `changedTouches` mirror back to #388. Symmetric empty-`changedTouches` concern is the WB #294 coord-helper defensive-hardening scope — out of scope here.

### comment-analyzer

> **Critical** — `src/test/canvas.test.ts:634-638` (and the back-reference at line 697).
>
> The justification comment says "the synthetic touchstart this test dispatches has empty `targetTouches` in some browsers". That is not what is happening in this test. Line 633 explicitly sets `targetTouches: [touch]` (non-empty). The real reason the `changedTouches` fixture is required is unconditional: post-#388, `#getTouchPos` reads `changedTouches[0]` directly and ignores `targetTouches` entirely, so any synthetic TouchEvent that omits `changedTouches` will crash with `TypeError: Cannot read properties of undefined` regardless of browser. The "in some browsers" phrasing imports the production rationale from the `#getTouchPos` block comment into a test-fixture comment where it does not belong, and misleads a future maintainer into thinking the fixture is defensive (only sometimes needed) rather than load-bearing (always needed in the test runner).
>
> Suggested replacement: "Mirror `targetTouches`. Post-#388, `#getTouchPos` reads `changedTouches[0]` unconditionally (see #388 for why), so synthetic TouchEvents in tests must populate `changedTouches` or the getter throws `TypeError: Cannot read properties of undefined`."

- Claude
