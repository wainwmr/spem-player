# VERA-326 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-28 20:00 UTC
Last run:  2026-05-28 20:00 UTC

See also: [Original Report (cycle 1)](LINK_TO_BE_FILLED_AFTER_ORIGINAL_POSTED)

## Summary

Cycle 1, one pass. Pass 2 was skipped — the addressed-now round was a
4-line WHY comment in `#touchMoved` plus a paired touchstart-commits
test; no production behaviour changed since the original fix at
`82f685c`, so a re-run of the five agents would not surface new
behavioural defects. The cluster centre was clear from the start —
four agents flagged the absence of a comment explaining `#touchMoved`'s
deliberate omission, and the comment plus the inverse-test address both
"why does this read like a missed call site" worries simultaneously.

Pass 1 produced 15 substantive findings (1 critical, 6 important, 8
suggestions/notes). Bob's overall view: most of what Vera surfaced
was either author-choice scope (the ticket explicitly preserved
`this.draw()` and offered an OR on the overlay rewrite) or pre-existing
concerns about the `music-canvas-touchmove` event payload contract and
`#getTouchPos`'s hard-coded `"all"` (which #327 already tracks). The
findings that were load-bearing for the #326 fix — the missing scar
tissue around the deletion (326-01) and the missing inverse-test
(326-02) — are addressed in this PR.

Noteworthy: the silent-failure-hunter caught that the diff narrows the
reproduction surface for #327 (per-touchmove `"all"` flood reduced to one
write per gesture); this is **noted in the PR description** so owners of
that ticket can test the existing repro path before any follow-up fix
lands. The comment-analyzer caught two wiki-doc drifts in
`refactor-MusicCanvas.ts.md` (`#touchMoved` listed as a `moveToPosition`
caller) which are deferred to the post-merge docs Workbench item.

**Counts:** 5 addressed (326-01, 326-02, 326-03, 326-07, 326-10);
2 deferred to the post-merge docs Workbench item (326-08, 326-09); 7
rejected with defence (326-04, 326-06, 326-11, 326-12, 326-14, 326-15;
plus 326-05 and 326-13 noted in PR description rather than addressed).

## Findings

### 326-01 — important: `#touchMoved` needs a "intentionally omits commit" comment (cluster)

> **code-reviewer + silent-failure-hunter + type-design-analyzer + comment-analyzer, src/ts/MusicCanvas.ts:624-628:**
> `#touchMoved` is now structurally asymmetric with `#touchStarted` and `#touchEnded` — the line `this.#moveToPosition(this.#getTouchPos(evt))` is gone. A future maintainer reading the three handlers side-by-side will see the missing line as an oversight and "fix" the asymmetry, recreating #317/#326. The deletion is the entire contract and it leaves no scar tissue. Four agents flagged this from different angles (CR-E, SFH-3, TDA-D, CA-3).

**Bob's triage:** Real defect — the absence of code IS the contract. Without a comment, the omission reads as a missing call site. Address now with a one-line WHY anchored on the historical reason (#317/#326) and the failure mode (60+/s state churn).

**Resolution:** addressed (commit 7be11d0) — 4-line comment added above `fireEvent` in `#touchMoved` referencing #317/#326 and the `voicePart: "all"` interaction with #327.

### 326-02 — critical: no inverse-contract test pinning that `#touchStarted` commits

> **pr-test-analyzer [A], src/test/canvas.test.ts:463-513 (severity 9):**
> A future refactor that deletes `this.#moveToPosition(this.#getTouchPos(e))` from `#touchStarted` (lines 617-622) — structurally identical to the line just removed from `#touchMoved` — would not fail any test. The existing touchstart tests only assert that the event fires and `pos` is in range; they never read back `canvas.choir`/`voicePart`/`bar`. Pinning only the move side leaves the start side vulnerable to the same regression.

**Bob's triage:** Real defect. The touch trio (start/move/end) is a contract; pinning only one side leaves the other vulnerable. The fix for #326 hinges entirely on this asymmetry being load-bearing. Address now with a new test asserting that touchstart DOES mutate state.

**Resolution:** addressed (commit 9227d21) — new test `touchstart commits position (#326)` dispatches a touchstart at (1200, 300) and asserts state changed from seeded (0, 2, 50) to derived (`voicePart === "all"`, choir !== 0, bar !== 50). `voicePart === "all"` is the deterministic falsifier.

### 326-03 — important: coordinate doesn't sufficiently differ from seeded state (PTA-B)

> **pr-test-analyzer [B], src/test/canvas.test.ts:483-484, 494-498 (severity 8):**
> clientX=1200, clientY=300 is a single point. Only `voicePart=2` is guaranteed to falsify the regression (since `#getTouchPos` always returns `"all"`); `choir=0` and `bar=50` could pass coincidentally if the touch coordinate happened to map to those values.

**Bob's triage:** Real but partially mitigated by 326-02 (the new touchstart-commits test will pin a non-seeded post-commit position derived from the coord). For the existing touchmove test, the `voicePart="all"` assertion is the load-bearing falsifier; the choir/bar checks are belt-and-braces. Address now via the 326-02 test pair: touchstart at coordA (commits to some derived position), then touchmove at coordB; expect state to stay at coordA's derived position.

**Resolution:** addressed (commit 9227d21) — the new touchstart-commits test and the renamed touchmove-no-commit test together pin the contract. Both use coord (1200, 300) which derives to choir≈6, bar≈119, voicePart="all" — distinct from the seeded (0, 2, 50). Documented inline via the "seed sentinel values" comment in each test.

### 326-04 — important: no touchend coverage (PTA-C)

> **pr-test-analyzer [C], src/test/canvas.test.ts (severity 7):**
> The ticket body mentions "switch back to selected part on touchend" semantics. The test does not exercise touchend.

**Bob's triage:** Touchend behaviour is unchanged by this PR — the `#touchEnded` handler at line 630-634 was already `preventDefault + fireEvent + draw` and the diff does not touch it. Asserting it is out of scope for #326 (it pre-dates this fix). The "switch back to part" the ticket describes is actually accomplished by `index.ts`'s `handleCanvasClick` binding to `music-canvas-touchend` — a system-integration concern, not a unit concern. Existing touchstart test at line 240-274 already verifies the touchend event fires. Reject for this PR.

**Resolution:** rejected — pre-existing scope; not changed by this diff.

### 326-05 — important: field name `voicePart` vs ticket's `part` (PTA-D) — note in PR

> **pr-test-analyzer [D], src/test/canvas.test.ts:483, 511:**
> The ticket and fix description use `part`, the class field is genuinely `voicePart`. Risk: a future reader writes a follow-up test against the non-existent `part` field.

**Bob's triage:** Real but informational, not a code change. Note in the PR description so Mark sees the inconsistency between ticket wording and code. No code-change action.

**Resolution:** noted in PR description — the field is `voicePart` in code; tests must use `canvas.voicePart` not `canvas.part`.

### 326-06 — important: test doesn't assert `this.draw()` was called (PTA-E)

> **pr-test-analyzer [E], src/test/canvas.test.ts (severity 5):**
> If `this.draw()` were removed in a future refactor the canvas would stop repainting on drag (frozen cursor).

**Bob's triage:** Incidental behaviour. The ticket explicitly preserves `this.draw()` ("Keep `this.draw()` if drag feedback is desired"), and the `requestAnimationFrame` shimmer loop independently repaints when not playing, so a missing `draw()` is largely invisible outside playback. The contract being pinned by this PR is "no mutation on touchmove", not "draw on every touchmove". Reject.

**Resolution:** rejected — incidental behaviour; not the #326 contract.

### 326-07 — suggestion: test seeds state directly rather than via gesture (PTA-F)

> **pr-test-analyzer [F], src/test/canvas.test.ts:482-484 (severity 4):**
> A behavioural variant would touchstart at coord-A (asserting commit), then touchmove to coord-B (asserting no further commit), then touchend (asserting end-state).

**Bob's triage:** This is the test shape Bob endorses for 326-02 — touchstart commits to derived position, then touchmove leaves it alone. Already folded into 326-02's resolution.

**Resolution:** addressed (commit 9227d21) — folded into 326-02; the new tests use direct seeding + dispatch + assert pattern at line ~463 and the touchstart variant at line ~513.

### 326-08 — medium: wiki/refactor-MusicCanvas.ts.md:115 drift (CA-1)

> **comment-analyzer, wiki/refactor-MusicCanvas.ts.md:115-117:**
> Entry states: *"The canvas click and touch handlers call `#moveToPosition()` before firing their own events"*. After this change, only `#canvasClicked` and `#touchStarted` call `#moveToPosition()`; `#touchMoved` no longer does. The sentence reads as if all three touch handlers commit.

**Bob's triage:** Real wiki drift. But wiki edits do not ship in this PR (per `method-publish.md` step 5 — "Do not edit the wiki here"). Defer to the post-merge documentation Workbench item for this ticket.

**Resolution:** deferred — captured in the post-merge docs Workbench item (filed during publish step 5 of this PR).

### 326-09 — medium: wiki/refactor-MusicCanvas.ts.md:258 drift (CA-2)

> **comment-analyzer, wiki/refactor-MusicCanvas.ts.md:258-270:**
> The "Resolved 2026-05-28" analysis lists *"The callers (`#canvasClicked()`, `#touchStarted()`, `#touchMoved()`) immediately fire …"*. `#touchMoved` should be removed from the callers list.

**Bob's triage:** Same family as 326-08.

**Resolution:** deferred — captured in the post-merge docs Workbench item (filed during publish step 5 of this PR).

### 326-10 — suggestion: test name "does not mutate canvas internal state" is broader than asserted (CA-4)

> **comment-analyzer, src/test/canvas.test.ts:463:**
> "Internal state" is broader than the three properties actually asserted. Tighten to: `"touchmove does not commit position (#326)"`.

**Bob's triage:** Real, cheap. Address now per DAMP-test-name convention (name pins the #326 contract, not the broader claim).

**Resolution:** addressed (commit 9227d21) — test renamed to `"touchmove does not commit position (#326)"`.

### 326-11 — note: `this.draw()` redraws unchanged scene (SFH-1)

> **silent-failure-hunter, src/ts/MusicCanvas.ts:624-628 (HIGH):**
> `draw()` re-runs the full pipeline at 60+/s during a drag, every input unchanged. Wasted CPU/GPU on touch devices.

**Bob's triage:** Real performance concern but the ticket explicitly preserves it ("Keep `this.draw()` if drag feedback is desired"). The `requestAnimationFrame` shimmer loop already paints when not playing, so most outside-playback redraws are independently scheduled. Removing `draw()` here is scope creep — the ticket gave the author the choice and they chose to keep it. Note in PR description; do not change.

**Resolution:** rejected — author choice per ticket; will note in PR description as scope-out.

### 326-12 — note: `music-canvas-touchmove` event has no payload (SFH-2)

> **silent-failure-hunter, src/ts/MusicCanvas.ts:626 (MEDIUM):**
> The event is fired into the void — no production listener, no payload. Future listeners that assume "touchmove gives me a position" will silently get nothing.

**Bob's triage:** Pre-existing event contract — the event already fired with no payload before this diff. Changing the contract (removing the event or adding a payload) is out of scope and risks third-party breakage. Reject.

**Resolution:** rejected — pre-existing contract; not introduced by this diff.

### 326-13 — note: removing the call masks #327's surface (SFH-4)

> **silent-failure-hunter, src/ts/MusicCanvas.ts:610-614, 619 (HIGH):**
> Before this diff, every touchmove flooded `voicePart = "all"` 60+/s. After, it's written only once per gesture (in `#touchStarted`). The latent `"all"` issue tracked by #327 is now harder to reproduce.

**Bob's triage:** Real observation but the right action is to alert Mark in the PR description, not to expand #326's scope to also fix #327. #327 is its own ticket; the user-visible fix it tracks is independent of #326's per-touchmove churn fix. Note in PR description.

**Resolution:** noted in PR description — #326's fix narrows the reproduction surface for #327; #327 remains open as a separate ticket.

### 326-14 — suggestion: `this.draw()` is wasted work (CR-A)

> **code-reviewer (~55 below threshold), src/ts/MusicCanvas.ts:627:**
> Same observation as 326-11.

**Bob's triage:** Same as 326-11.

**Resolution:** rejected — same as 326-11.

### 326-15 — suggestion: "lighter overlay highlight" not implemented (CR-B)

> **code-reviewer (~40 below threshold), src/ts/MusicCanvas.ts:624-628:**
> The ticket offered "Keep `this.draw()` OR replace it with a lighter overlay highlight". The diff took the first option.

**Bob's triage:** Author choice per the ticket's OR. Reject.

**Resolution:** rejected — ticket said OR; author chose to keep `draw()`.

- Claude
