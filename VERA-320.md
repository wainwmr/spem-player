# VERA-320 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-28 16:25 UTC
Last run:  2026-05-28 16:25 UTC

See also: [Original Report (cycle 1)](LINK_TO_BE_FILLED_AFTER_ORIGINAL_POSTED)

## Summary

[Placeholder — finalised at close-out. Cycle 1; pass 1 produced 21 findings
(1 critical, 6 important, 14 suggestions) across all five agents. The
critical and most of the important findings cluster on the same design
weakness — `bars: number[]` does not encode the structural invariants the
new line now relies on. Bob's overall view: most are pre-existing or
defensive nits relative to the scope of a 2-line intro-bar fix; a handful
of comment + test gaps are worth addressing now to make the fix legible.]

## Findings

### 320-01 — critical: bars[1] undefined when bars.length < 2

> **code-reviewer / silent-failure-hunter / pr-test-analyzer, src/ts/MusicScore.ts:154:**
> `this.bars[1]` will be `undefined` if `bars.length < 2`. `cursorpt.x < undefined` is `false`, so the ternary silently selects `idx` — i.e. the intro-bar fix mutely reverts on a degenerate `bars`. No log, no warning. (code-reviewer and silent-failure-hunter graded this critical; pr-test-analyzer raised the same point as their item [C] at "important".)

**Bob's triage:** Defensive nit; not caused by this diff. `getBars()` always returns a `bars` array of length ≥ 2 (it does `unshift(0)` and `push(svgWidth)` unconditionally). The new read of `bars[1]` is no more brittle than the pre-existing reads of `bars[length-1]` and `bars[length-2]` in `scrollSmooth` (lines 264, 266). A length guard would be a real change in shape and a stylistic mismatch with the rest of the file. Defer — file a Workbench Spem item for the broader hardening of `bars` access (covers 320-01, 320-11, 320-12).

**Resolution:** deferred (Workbench Item #275 — `scoreClicked` silent-failure surface + `bars[]` invariant hardening; covers 320-01, 320-07, 320-08, 320-09, 320-11, 320-12, 320-16, 320-17, 320-18, 320-20).

### 320-02 — important: test doesn't exercise the bug's edges

> **code-reviewer + silent-failure-hunter, src/test/score.test.ts:393–429:**
> The test sets `bars=[0,100,200,300]` and clicks at `x=50` — well inside the intro region. It doesn't pin `x=0`, `x` just under `bars[1]`, or `x === bars[1]`. A reviewer reading only the test would conclude the fix is covered; the test seam (direct `elem.bars` assignment) bypasses real `getBars()` shapes.

**Bob's triage:** Real defect. A regression test for the off-by-one bug needs to pin both endpoints of the "intro" interval — `x=0` and `x` just under `bars[1]` — and the boundary exact-equality at `x === bars[1]` to lock the strict-`<` semantic. Address now; cheap test additions.

**Resolution:** addressed (commit 35ffb29) — extended test pins `x=0`, `x=50`, `x=99` (intro region → bar 0) and `x=100` (boundary, strict-< → bar 2). `x=150` continues to be covered by the sibling test at line 355.

### 320-03 — important: magic bars[1] needs a WHY comment

> **code-reviewer + comment-analyzer, src/ts/MusicScore.ts:154:**
> The cut-off `this.bars[1]` is a load-bearing magic relationship with no comment. The future reader must derive from `getBars()` (300 lines down) that `bars[0]` is the intro left-edge and `bars[1]` is bar 1's left-edge. The clarity gap is exactly the bug's centre of gravity — the method has been wrong since written because the relationship between `find((x) => x > cursorpt.x)` and the intro region was implicit.

**Bob's triage:** Real defect — comment debt. The whole point of this PR is to make the intro semantic explicit; leaving the cut-off uncommented would invite the same off-by-one back in next time. Address now with a one-line WHY anchored on intent, not mechanics.

**Resolution:** addressed (commit 29ee6e9) — WHY comment added above the `bars[1]` cut-off referencing the `bars` field JSDoc.

### 320-04 — important: missing boundary test at cursorpt.x === bars[1]

> **pr-test-analyzer [A] + code-reviewer, src/ts/MusicScore.ts:154 / src/test/score.test.ts:**
> The fix uses strict `<`. No test pins `cursorpt.x === bars[1]`. A future refactor flipping `<` to `<=` would change selection on the boundary silently.

**Bob's triage:** Same family as 320-02. Address now.

**Resolution:** addressed (commit 35ffb29) — folded into the 320-02 test extension; `x=100` (boundary) pinned at `bar=2`.

### 320-05 — important: bar 1 region behaviour (PTA [B])

> **pr-test-analyzer [B], src/test/score.test.ts:393:**
> No coverage of click in the region `[bars[1], bars[2])`. The fix makes bar 1 unreachable by click — `cursorpt.x < bars[1]` forces bar 0, and clicks `>= bars[1]` follow `find` to bar 2 (pre-existing off-by-one). Worth confirming with the ticket: does bar 1 still get a clickable region?

**Bob's triage:** Pre-existing behaviour explicitly preserved by the ticket — acceptance criterion 2: "Clicking on numbered bars continues to work as before." The off-by-one for numbered bars is intentional scope-out, and Mark's app may rely on it. Document the decision in the PR description so review knows; the existing test at line 355 already pins the bar=2 mapping for click at x=150. No code change.

**Resolution:** rejected for this PR — Mark's acceptance criterion preserves current numbered-bar mapping; PR description will note the scope boundary. Track separately if Mark wants to revisit.

### 320-06 — important: JSDoc on bars field

> **comment-analyzer + code-reviewer + type-design-analyzer, src/ts/MusicScore.ts:18:**
> The field `bars: number[] = []` has no JSDoc. After this fix `bars` is semantically structured: `bars[0] === 0`, `bars[last] === svgWidth`, interior values are tspan x-coordinates from `getBars()`, and `bars[1]` is load-bearing for click semantics.

**Bob's triage:** Real defect — same family as 320-03 (comment debt). One short JSDoc anchored on the data invariant gives both `scoreClicked` and `scrollSmooth` a shared reference. Address now.

**Resolution:** addressed (commit 29ee6e9) — JSDoc added on `bars` field stating the invariant (`bars[0] === 0`, `bars[length-1] === svgWidth`, intro region is `[0, bars[1])`).

### 320-07 — important (pre-existing): click-past-last-bar silent no-op

> **silent-failure-hunter + code-reviewer + pr-test-analyzer [G], src/ts/MusicScore.ts:151-156:**
> When `cursorpt.x >= bars[last]`, `find` returns `undefined`, `if (result)` is false, no `music-score-click` event. No log. User clicks and nothing happens.

**Bob's triage:** Pre-existing. Real defensive nit — the original code already had this and the ticket explicitly says "Clicking on numbered bars continues to work as before". Out of scope for #320. Worth its own ticket if it bothers anyone.

**Resolution:** deferred — file a board ticket separately for "scoreClicked silently drops far-right clicks" if/when prioritised; not in this PR.

### 320-08 — important (pre-existing): getScreenCTM can return null

> **silent-failure-hunter, src/ts/MusicScore.ts:148-149:**
> `getScreenCTM()` returns `DOMMatrix | null`; `m?.inverse()` passes `undefined` to `matrixTransform`, producing `NaN` coordinates that silently swallow the click.

**Bob's triage:** Pre-existing. Not introduced or made worse by this diff. Worth a separate board ticket for "MusicScore.scoreClicked silently drops clicks when getScreenCTM() returns null"; out of scope here.

**Resolution:** deferred — Workbench Spem item for the broader silent-failure surface in `scoreClicked` (CTM null + far-right + negative-x clicks).

### 320-09 — suggestion: negative-x conflation (SFH-03)

> **silent-failure-hunter, src/ts/MusicScore.ts:154:**
> `cursorpt.x < bars[1]` also captures negative-x clicks if a misbehaving CTM produces them; both collapse silently to `setBar(0)`.

**Bob's triage:** Theoretical defensive nit; depends on the CTM-null cluster (320-08). Defer to the same Workbench item.

**Resolution:** deferred (same item as 320-08).

### 320-10 — suggestion: indexOf(-1) TOCTOU (SFH-06)

> **silent-failure-hunter, src/ts/MusicScore.ts:153-154:**
> `indexOf(result)` returning `-1` would propagate `setBar(-1)` silently. The diff doubles the TOCTOU surface by adding `bars[1]` read.

**Bob's triage:** Defensive nit; not realistic in single-threaded JS. Reject.

**Resolution:** rejected — pre-existing, no manifestation, not introduced by this diff.

### 320-11 — suggestion: bars: number[] lacks invariants (TDA-A)

> **type-design-analyzer, src/ts/MusicScore.ts:18:**
> `bars: number[]` doesn't encode `bars[0]===0`, `bars[last]===svgWidth`, monotonic ordering, or `length >= 2`. A branded type would document the contract.

**Bob's triage:** Refactor candidate, disproportionate to a 2-line bug fix.

**Resolution:** deferred — same Workbench item as 320-01 (bars hardening).

### 320-12 — suggestion: two indexing sites suggest extraction (TDA-B)

> **type-design-analyzer, src/ts/MusicScore.ts:151-156 / 264, 299-301:**
> `scoreClicked` and `scrollSmooth` both index `bars` with hard-coded offsets. Centralising as `BarRanges` would consolidate the invariants.

**Bob's triage:** Same family as 320-11.

**Resolution:** deferred — same Workbench item.

### 320-13 — suggestion: setBar conflates domains (TDA-C)

> **type-design-analyzer, src/ts/MusicScore.ts:236:**
> `setBar(b: string | number)` accepts both integer indices and fractional bar positions in the same parameter.

**Bob's triage:** Pre-existing.

**Resolution:** rejected for this PR — pre-existing API; out of scope.

### 320-14 — suggestion: test name doesn't pin the bug (PTA-D)

> **pr-test-analyzer [D], src/test/score.test.ts:393:**
> The convention in this repo is to suffix regression tests with `(#NNN)`. The new test name doesn't.

**Bob's triage:** Real, cheap, address now per convention.

**Resolution:** addressed (commit 35ffb29) — test renamed to `"scoreClicked routes intro region to bar 0 and pins boundary at bars[1] (#320)"`.

### 320-15 — suggestion: direct mutation of elem.bars (PTA-E)

> **pr-test-analyzer [E], src/test/score.test.ts:378, 416:**
> Both tests overwrite `elem.bars` directly. Worth a comment explaining why.

**Bob's triage:** Test-level pragmatism is fine; a one-line comment is cheap.

**Resolution:** addressed (commit 35ffb29) — comment added above the `elem.bars` stub explaining why the test bypasses `getBars()`.

### 320-16 — suggestion: tests share heavy setup (PTA-F + CR-07)

> **pr-test-analyzer [F] + code-reviewer, src/test/score.test.ts:355, 393:**
> Two `scoreClicked` tests share ~30 lines of setup. Parameterising via `it.each` would let new edge cases be added cheaply.

**Bob's triage:** Refactor candidate; not in scope. The new tests added in 320-02/04 will live with the duplication for now; future test refactor can fold.

**Resolution:** deferred — note in PR description; pairs naturally with whoever next touches this test file.

### 320-17 — suggestion: click past last bar uncovered (PTA-G)

> **pr-test-analyzer [G], src/test/score.test.ts:**
> No test asserts the no-event behaviour when `cursorpt.x >= bars[last]`.

**Bob's triage:** Same scope concern as 320-07.

**Resolution:** deferred — captured in the same Workbench item as 320-07/08.

### 320-18 — suggestion: far-right click no-op (CR-05)

> Same as 320-07 (cross-listed by code-reviewer).

**Resolution:** deferred (320-07).

### 320-19 — suggestion: inline ternary obscures intent (CR-06)

> **code-reviewer, src/ts/MusicScore.ts:153-154:**
> Early-return `if (cursorpt.x < this.bars[1]) { ... return; }` or comment improves readability.

**Bob's triage:** The WHY comment (320-03) addresses the clarity gap. Refactoring to early-return is style preference; the ternary is fine when commented.

**Resolution:** rejected — addressed by 320-03 comment.

### 320-20 — suggestion: getScreenCTM mock duplicated (CR-07)

> Same as 320-16 (cross-listed by code-reviewer).

**Resolution:** deferred (320-16).

### 320-21 — suggestion: preserves non-intro by accident (CR-08)

> **code-reviewer, src/ts/MusicScore.ts:154:**
> The fix preserves non-intro behaviour by happenstance of `bars[0]===0`. A comment locking the invariant would help.

**Bob's triage:** Addressed by 320-06 JSDoc on `bars` field + 320-03 WHY comment on the cut-off.

**Resolution:** rejected — covered by 320-03 + 320-06.

- Claude
