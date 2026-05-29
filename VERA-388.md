# VERA-388 Final Synthesis (cycle 2)

Mode: redo-pr (Vera re-ran after PR rework, before re-publish)
Cycle: 2
Generated: 2026-05-29 23:30
Last run:  2026-05-29 23:30

See also: [Original Report (cycle 2)](https://github.com/wainwmr/spem-player/issues/388#issuecomment-4580308952)
(Earlier cycles: [Synthesis (cycle 1)](https://github.com/wainwmr/spem-player/issues/388#issuecomment-4570234906))

## Summary

[To be finalised at close-out.]

## Findings

### 388-cycle2-01 — critical Misleading "in some browsers" justification in WB #289 fixture comment

> **comment-analyzer, `src/test/canvas.test.ts:634-638`:**
> The new comment "the synthetic touchstart this test dispatches has empty `targetTouches` in some browsers" is inaccurate — line 633 explicitly sets `targetTouches: [touch]`. The real reason `changedTouches` is required is unconditional: post-#388, `#getTouchPos` reads `changedTouches[0]` and ignores `targetTouches`, so any synthetic TouchEvent that omits `changedTouches` will throw `TypeError` regardless of browser. The "in some browsers" phrasing imports production rationale into a test-fixture comment where it does not apply.

**Bob's triage:** real defect — comment misrepresents why the fixture is needed. Caused by my cycle-2 commit `4410de1` (the WB #289 fixture-mirror commit). Small fix: rewrite the comment to state the unconditional test-runner reason.

**Resolution:** addressed.

### 388-cycle2-02 — important Touchmove fixture comment overclaims load-bearing role

> **pr-test-analyzer [B], `src/test/canvas.test.ts:697-698`:**
> The comment "Mirror `targetTouches` — see the touchstart counterpart above" implies the `changedTouches` fixture is needed to prevent a TypeError. But `#touchMoved` does not read `changedTouches` (post-#326, `#touchMoved` does not call `#getTouchPos`), so the fixture is defensive scaffolding rather than crash-avoidance.

**Bob's triage:** real defect of similar shape to 388-cycle2-01 — same commit, same drift pattern. Rewrite to state "defensive mirror, not load-bearing".

**Resolution:** addressed.

### 388-cycle2-03 — important Touchmove `#388` test no longer exercises `#getTouchPos`

> **pr-test-analyzer [A], `src/test/canvas.test.ts:348` (test `"touchmove resolves a position when the touch is not in targetTouches"`):**
> The test claims to exercise `#getTouchPos` on touchmove with empty `targetTouches`. But post-#326 (`MusicCanvas.ts:631-640`), `#touchMoved` no longer calls `#getTouchPos` — it only fires the event. The assertion `expect(moveEvent.detail.position.bar).toBe(9)` passes only because `canvas!.bar` was set to 9 by the immediately preceding touchstart `#388` test via state leak across the singleton canvas. A future refactor that re-introduces `#getTouchPos` into `#touchMoved` would crash production but the test would still pass for the wrong reason.

**Bob's triage:** real defect — exposed by the rebase, but introduced by PR #400 (`#326`) merging into `main` while this branch was parked. The cycle-1 test was a legitimate regression test when written; `#326` invalidated it without it being noticed. The touchstart `#388` test fully covers the production surface (post-`#326`, only `#touchStarted` calls `#getTouchPos`). Keeping the misleading touchmove test in place degrades the test suite's signal. Cleanest fix: delete it.

**Resolution:** addressed.

### 388-cycle2-04 — out of scope State leakage across singleton canvas

> **pr-test-analyzer [C], `src/test/canvas.test.ts:6-13`:**
> The `beforeAll` block creates a single `<music-canvas>` element shared by every test in the describe block. Tests mutate `canvas!.bar`, `canvas!.choir`, `canvas!.voicePart` without resetting. The #326 tests defensively seed sentinel values; the new #388 tests do not.

**Bob's triage:** pre-existing test-architecture concern, out of scope for #388. Resolving 388-cycle2-03 (deleting the misleading touchmove test) removes the most visible symptom in this PR. Wider fix is a separate cleanup task — flagged in the existing canvas-coverage Workbench item.

**Resolution:** noted; sub-issue of the wider singleton-canvas pattern. Not filed separately (would duplicate the spirit of existing coverage work).

## Suggestions (no resolution required)

- code-reviewer noted the production fix shape is correct per W3C touch-events spec (`changedTouches` non-empty for touchstart/move/end/cancel) and the WB #289 fixture mirror is the minimal correct fix that preserves #400's load-bearing assertions.
- silent-failure-hunter noted the diff neither adds nor removes silent fallbacks; the empty-`changedTouches` defensive concern is covered by deferred WB #294.
- comment-analyzer noted the `#getTouchPos` block comment in MusicCanvas.ts is accurate and references the ticket cleanly.

- Claude
