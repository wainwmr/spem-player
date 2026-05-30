# VERA-327 Original Report (cycle 3)

Mode: redo-pr (Vera re-ran after PR rework, before re-publish)
Cycle: 3
Generated: 2026-05-30 23:42

See also: [Final Synthesis (cycle 3)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)
(Earlier cycles:
[Synthesis (cycle 1)](https://github.com/wainwmr/spem-player/issues/327#issuecomment-4568029898),
[Synthesis (cycle 2)](https://github.com/wainwmr/spem-player/issues/327#issuecomment-4580022057))

Context: cycle 3 was triggered by the rebase of `andrew/327-touch-part-selection`
onto current `main` (picking up #388/#406's `changedTouches` substrate) plus a
post-gate test-fix commit. PR #405 (cycle 2's PR) was closed; this gate
re-validates the branch tip before re-publish.

## Raw agent reports (pass 1)

### code-reviewer

> **Review of ticket #327 — Touch part selection (`andrew/327-touch-part-selection`)**
>
> Reviewed the diff `origin/main...andrew/327-touch-part-selection` — two files:
> `src/ts/MusicCanvas.ts` (`#getTouchPos`, `#touchMoved` comment) and
> `src/test/canvas.test.ts` (new table-driven test, two updated #326 tests).
> Independently re-derived the part arithmetic in Node against the real config
> (`parts.length=5`, `choirs[0].length=8`, `canvasPadding=5`) and the 1400×400
> mock. The fix and the test table are arithmetically correct.
>
> **No blocking issues found.** The fix correctly mirrors `#getMousePos`'s part
> derivation, the type system already accommodates a numeric `part`
> (`PartType = "all" | number`), and the new test's expected values all match
> the arithmetic exactly. The jitter-safety claim ("≥ 0.3 from the nearest
> boundary") is accurate — fractional offsets are 0.51/0.54/0.56/0.59/0.62.
>
> 1. **Suggestion — duplication-vs-helper.** YAGNI is the right call; the
>    in-code "keep them in sync" comment is the correct mitigation. The two
>    methods are *not* fully identical: the `bar` formula diverges
>    (`#getMousePos` uses `clampedX * 140`, `#getTouchPos` uses
>    `(clampedX - canvasPadding) * 140`). So only the `y`/`choir`/`part` lines
>    are genuine duplication. No change needed; flagging so a future reader
>    doesn't extract a helper assuming the methods are wholly parallel.
> 2. **Suggestion — the new table test asserts committed state, not the getter
>    directly.** It asserts `event.detail.position.part`, but `#touchStarted`
>    fires with no explicit pos, so `fireEvent` rebuilds position from
>    `this.voicePart` after `#moveToPosition` committed it. The test validates
>    "touchstart commits the derived part" rather than "`#getTouchPos` returns
>    part N" in isolation — arguably the more behaviour-oriented assertion, so
>    fine — but the test name "getTouchPos returns part %i" slightly overstates
>    what is directly asserted. Optional: rename to "touchstart at clientY=%i
>    selects part %i".
> 3. **Suggestion — `#getMousePos` lacks the explanatory no-clamp comment that
>    `#getTouchPos` carries (pre-existing; mouse code untouched).** The two are
>    now asymmetric. Minor; consider a one-line back-reference on the mouse side.
>
> Points checked and cleared: part arithmetic and all six derived values
> (correct); `y % 1` for non-negative `y` (no clamp needed); type safety
> (numeric `part` valid for `Position.part`); `#touchMoved` comment update
> (accurate); the two updated #326 tests (`toBe("all")` → `not.toBe(2)`
> preserves the load-bearing falsifier); UK English (clean; `color`/`colors`
> are identifier names). I'd ship it.

### pr-test-analyzer

> **Test Coverage Analysis — Ticket #327**
>
> The new table-driven test is well-constructed and correct. Verified all five
> rows independently against the real config: each `[clientY, expectedPart]`
> pair matches, and every sample lands ≥0.38 of a part-slot from the nearest
> boundary, so floating-point jitter cannot flip an assertion. The
> `changedTouches` population is correct and load-bearing (production reads
> `changedTouches[0]` at `MusicCanvas.ts:603`). Coverage of the *happy path* is
> adequate. However, the test covers only the easy middle of every row in a
> single choir and omits the two clamp/boundary interactions that the
> production comment itself flags as the subtle part of the change.
>
> 1. **[important] bottom-edge clamp (`part=0` collapse) is untested, and it is
>    the one case the code comment explicitly calls out.** The `it.each` table
>    tops out at `clientY=50` (choir 0). For `clientY ≥ 395` the clamp pins
>    `clampedY=395`, giving `y=8.0` exactly, `y % 1 === 0`, so `part=0` while
>    `choir` is clamped to 7. A regression that added a `+1` or changed the
>    clamp ceiling would silently change `part` at the bottom edge and no test
>    would catch it. Add a row exercising `clientY=395`+ asserting
>    `part===0, choir===7`.
> 2. **[important] the part-4→next-choir-part-0 transition is untested.** The
>    table demonstrates parts 0–4 *within* choir 0 but never crosses a choir
>    boundary. Verifying part 4 of one choir is adjacent to part 0 of the next
>    (not part 5 or a clamp artefact) is the natural complement and guards the
>    `y % 1` wrap. One extra row asserting both `part` and `choir` across that
>    step would close it.
> 3. **[suggestion] no exact-row-boundary case (`frac === 0`).** The table's
>    lowest sample is `clientY=10` (frac 0.10). A `clientY=5`/`0` row asserting
>    `part===0` would pin the lower boundary. Lower priority.
> 4. **[suggestion] table is silent on the off-target-finger path for the part
>    value.** The line-279 test proves `#getTouchPos` survives empty
>    `targetTouches` via `changedTouches[0]` but only range-checks `choir`/`bar`,
>    not `part`. A single off-target row asserting a specific `part` would tie
>    the two fixes together. Low severity (shared path, already proven
>    non-throwing).
> 5. **[suggestion/informational] `toBe("all")` → `not.toBe(2)` still tests
>    something meaningful — not tautological.** At `(1200,300)` the derived part
>    is `0` ≠ seed `2`; a failure-to-commit leaves `voicePart=2` and fails.
>    Caveat: the seed `2` is coupled to the derived value by an implicit "must
>    differ" invariant; if the coordinate ever derived part 2 the test would
>    falsely fail. Optional: seed an impossible value (`"all"`/`-1`). Minor.
>
> Bottom line: no critical gaps; the fix is correctly tested for the common
> case. Findings #1 (bottom-edge clamp) and #2 (choir-boundary wrap) are the
> genuinely subtle behaviours the change introduced, both cheap to add, both
> currently unguarded.

### silent-failure-hunter

> **Silent-failure hunt: ticket #327**
>
> Scope: the diff plus every downstream consumer of `Position.part` from the
> touch path (`#moveToPosition` → `voicePart` setter, `MusicCanvasWatcher`,
> `MusicScore.renderPartHighlight`, the canvas `draw()` hot-spot logic,
> `MusicElement.fireEvent`).
>
> 1. **[suggestion] No new silent-failure defect is introduced by this diff.**
>    The two risks the ticket flagged are both genuinely mitigated:
>    - Negative `part` from `y % 1 < 0` — not reachable; `clampedY ≥ canvasPadding`
>      ⟹ `y ≥ 0` ⟹ `%` yields `[0,1)` ⟹ `part ∈ [0, parts.length)`. The in-code
>      comment correctly scopes the residual risk to a *future* refactor and
>      tells the maintainer what to restore.
>    - NaN/Infinity if `rect.height == 2*canvasPadding` — **pre-existing**: the
>      identical denominator already exists in `#getMousePos` on `origin/main`;
>      the diff copies, does not introduce, it. Requires a 10px canvas; not a
>      real runtime state. Out of scope.
> 2. **[suggestion] Unclamped `part` vs clamped `choir` asymmetry is safe.**
>    `choir` is wrapped because `Math.floor(y)` can reach `choirs.length` at the
>    bottom edge; `part` needs no clamp because `y % 1 ∈ [0,1)`. Verified the
>    bottom-edge case (`y=8.0` → `part=0`, `choir` saturates to 7). Correct, and
>    the comment explains why.
> 3. **[suggestion] Bottom-edge visual mismatch is pre-existing, not introduced
>    here.** At the exact bottom pixel `choir` clamps to 7 while `part` resolves
>    to 0, so the committed part can differ slightly from the tapped pixel, with
>    no feedback. Already governs mouse clicks via the identical `#getMousePos`;
>    touch now inherits it. Single-pixel cosmetic; no feedback machinery
>    warranted.
> 4. **[important — informational, resolved] Removing the `"all"` fallback
>    removes no downstream safety net.** Traced every consumer that branches on
>    `part === "all"`: `MusicCanvasWatcher` (hover/mouse only, never on touch
>    path); `MusicScore:356,397` (treat `"all"` as the *less* specific case);
>    `draw()` hot-spot logic (uses `"all"` only to widen the highlight). No
>    consumer relied on receiving `"all"` from touch as a safety net — `"all"`
>    was the bug. The `PartType` union still permits `"all"` from other sources.
> 5. **[suggestion] Stale comment in `#touchMoved` correctly cleaned up.** The
>    diff removes the now-false "silently switching to `voicePart: 'all'` /
>    `#getTouchPos` hard-codes 'all'" claim; the replacement is accurate.
>    Leaving it would itself have been a documentation-level silent-failure trap.
>
> Verdict: no silent-failure, inadequate-error-handling, or
> inappropriate-fallback defects introduced. The one theoretical NaN path is
> pre-existing in `#getMousePos` and out of scope. Recommend it passes the
> silent-failure gate.

### type-design-analyzer

> **Type-design analysis — ticket #327**
>
> The change is sound and a net improvement to the type story. It removes a
> genuine inconsistency rather than introducing one.
>
> Invariants: `Position.part` when numeric must be in `0..parts.length-1`; the
> string arm `"all"` is a separate "no specific part" mode. `#getTouchPos` and
> `#getMousePos` must return the same `Position` shape for the same geometry.
> The range invariant is enforced only by arithmetic + the `clampedY` clamp; it
> is **not** expressed in the type.
>
> 1. **[suggestion] Consistency between the two getters is now correct — the
>    core win.** Pre-change, `#getTouchPos` returned `part: "all"` while
>    `#getMousePos` returned the numeric arm — two methods with identical
>    `: Position` return type and identical `y` derivation diverging on one
>    field. The fix makes them genuinely produce the same `Position`. Net
>    improvement, no action.
> 2. **[suggestion] The `"all" | number` union is still the right model;
>    #327 does not expose it as doing too much.** `"all"` is a real first-class
>    mode (whole-choir selection) reachable from `MusicControls`, defaults,
>    `index.ts`, consumed at `MusicScore:356` and `MusicCanvas:548`. The pre-#327
>    touch code *misused* `"all"` as "touch doesn't pick a part"; #327 removes
>    exactly that misuse. No separate "no specific part" representation
>    warranted. Do not refactor the union for this PR.
> 3. **[important] The numeric invariant `part ∈ 0..parts.length-1` is expressed
>    nowhere in the type and is enforced only by arithmetic — and `part` is
>    subtly less defended than `choir`.** `choir` is clamped on both sides;
>    `part` has no clamp, relying on the algebra. The added comment documents
>    this well and names the failure mode. The upper-edge case it glosses: at
>    `clampedY = height - padding`, `y === choirs.length`, `y % 1 === 0`, so
>    `part === 0` — the bottom edge wraps to part 0 of a non-existent next row.
>    `choir`'s `Math.min` catches the analogous case; `part` has no equivalent
>    guard. This is a **pre-existing** property of `#getMousePos` that #327 now
>    imports into `#getTouchPos` — the PR doesn't worsen it but doubles the
>    surface. Recommendation (proportionate): leave as-is for this bug-fix PR;
>    consider a deferrable suggestion to extract the derivation. Not a blocker.
> 4. **[suggestion] The invariant is load-bearing in tests but the table is
>    config-coupled and self-documents that fragility.** Existing tests assert
>    `pos.part >= 0 && pos.part < config.parts.length`; the new table hard-codes
>    `[0..4]` and documents the regeneration caveat. Acceptable for a bug-fix;
>    the coupling is deliberate.
> 5. **[suggestion/deferrable] Extract a shared `#derivePosition` helper — but
>    not in this PR.** A single private helper owning the `y` math, part
>    derivation, and one clamp would make the invariant enforced in one place
>    and the two getters provably consistent. Larger than a one-line bug fix;
>    flag as a follow-up ticket. (Also: the magic `140` bar constant differs
>    between the two methods — pre-existing, capture in the same follow-up.)
> 6. **[suggestion] Comment churn in `#touchMoved` is correct and removes a
>    now-false statement.** No leftover references to the old `"all"`
>    hard-coding remain in production code.
>
> Ratings (for `Position.part` as modified): Encapsulation 6/10; Invariant
> expression 4/10 (the union can't express 0..4 — pre-existing); Invariant
> usefulness 8/10 (the `"all" | number` distinction is genuinely meaningful and
> #327 routes touch onto the right arm); Invariant enforcement 6/10
> (construction-time derivation guarantees in-range by algebra; no explicit
> `part` clamp; tests compensate). Verdict: the change **improves** the type
> story. No blockers. The substantive design debts are all pre-existing and
> out of scope — capture as a single follow-up refactor (extract
> `#derivePosition`).

### comment-analyzer

> **Comment analysis: ticket #327**
>
> Reviewed the five comment changes against the post-rebase branch code, the
> config values they depend on (8 choirs, 5 parts, padding 5), and the
> derivation arithmetic (verified numerically). The production-code comments are
> accurate, the stale "hard-codes all" note is correctly gone from production
> code, the test-derivation arithmetic matches the literal table.
>
> 1. **[critical — flagged with uncertainty] possible stale `toBe("all")` and
>    "hard-codes all" comments at `canvas.test.ts:566-567` and `:601-603` on the
>    branch tip.** The agent read via `git show` (not a checkout) and warned the
>    diff and branch tip might disagree; it explicitly said "if the diff is
>    authoritative, ignore this finding" and recommended re-running the diff and
>    `npm test` on the actual checkout to settle it.
>    *(Vera-gate resolution: verified false positive — see synthesis 327-01.)*
> 2. **[suggestion] "textually duplicated / keep in sync" comment is honest but
>    flags a refactor that should arguably happen instead.** Accurate as
>    documentation; the `y`/`choir`/`part` lines are byte-identical between the
>    two methods. A private helper would eliminate the sync risk; the `bar`
>    formulas genuinely differ, so a helper would cover only the choir/part
>    portion. Correct interim mitigation; flag as a follow-up candidate, not a
>    blocker.
> 3. **[suggestion] the conditional "restore the clamp" note is useful,
>    defensible guidance, not speculative noise.** Verified: `clampedY <
>    canvasPadding` ⟹ negative `y % 1` ⟹ negative `part` — a genuine
>    out-of-range bug the upstream clamp currently prevents. The contrast it
>    draws with `choir` (verified `y = 8` exactly at the bottom edge) is correct.
>    Keep it. Borderline long (8 lines) but justified.
> 4. **[suggestion] test-derivation rot warning is present and adequate.** The
>    long comment states the formula, names the config dependence, includes the
>    "regenerate if those change" caveat. Verified the arithmetic and the "≥ 0.3
>    from the nearest boundary" claim (actual min distance 0.385). Residual rot
>    risk: the prose hard-codes "8 choirs, 5 parts" alongside the symbolic
>    `config.*.length` references; optional to drop the parenthetical prose copy.
>    No change required.
> 5. **[pass] `#touchMoved` rewrite is correct and the stale note is properly
>    gone.** The `#317`/`#326` cross-references remain correct. Good edit.
> 6. **[important] the `it.each` title `%i`/`%i` tokens are transposed.** Title
>    `"getTouchPos returns part %i for clientY=%i"` with rows `[clientY,
>    expectedPart]` renders row `[10,0]` as "part 10 for clientY=0" — values
>    swapped, claims a non-existent part 10. The assertion itself is correct
>    (uses the bound variable); only the displayed test name is misleading. Fix:
>    reorder the title tokens to match array order, or use the function-name form.
>
> Net: production-code comments pass. The two strongest findings are about the
> test file — finding 1 (the diff-vs-branch-tip discrepancy, must be reconciled)
> and finding 6 (transposed test-title labels). Findings 2–5 are suggestions/
> passes.

- Claude
