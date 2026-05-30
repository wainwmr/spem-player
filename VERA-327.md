# VERA-327 Final Synthesis (cycle 3)

Mode: redo-pr (Vera re-ran after PR rework, before re-publish)
Cycle: 3
Generated: 2026-05-30 23:43
Last run:  2026-05-30 23:43

See also: [Original Report (cycle 3)](https://github.com/wainwmr/spem-player/issues/327#issuecomment-4585062533)
(Earlier cycles:
[Synthesis (cycle 1)](https://github.com/wainwmr/spem-player/issues/327#issuecomment-4568029898),
[Synthesis (cycle 2)](https://github.com/wainwmr/spem-player/issues/327#issuecomment-4580022057))

## Summary

Cycle 3 was a rebase-revalidation: the branch was rebased onto current `main`
(picking up #388/#406's `changedTouches` substrate) and gained a post-gate
test-fix commit since cycle 2's pass, so the cycle-2 certification was stale.
One pass of all five agents. No critical or blocking defect: every agent
independently re-derived the part arithmetic against the real config and
confirmed the fix is correct. The single `critical` flag (a suspected stale
`toBe("all")` assertion) was a false positive — the flagging agent read via
`git show`, distrusted its own line numbers, and asked for verification; the
branch tip has `not.toBe(2)` and zero `toBe("all")`/`hard-codes` strings.
Three `important` findings addressed (a transposed `it.each` title and two
boundary-coverage gaps the production comment itself flags as subtle); the
remaining `important` finding (the part/choir clamp asymmetry) is pre-existing
in `#getMousePos` and deferred. A final re-run was performed (pass 2) on the
test-only changes — see step 6 note.

## Findings

### 327-01 — [critical → dismissed] Suspected stale `toBe("all")` assertion

> **comment-analyzer, canvas.test.ts:566-567 / :601-603:** the branch tip may
> still contain `expect(canvas!.voicePart).toBe("all")` and two "hard-codes all"
> comments the diff was supposed to remove — flagged with explicit uncertainty
> ("if the diff is authoritative, ignore this finding"), read via `git show`
> without a checkout.

**Bob's triage:** not applicable — false positive. Verified the branch tip
directly: `git show andrew/327-touch-part-selection:src/test/canvas.test.ts`
has `not.toBe(2)` at line 609 and `toBe(2)` at line 672 (the touchmove test,
correctly unchanged); zero `voicePart).toBe("all")` assertions and zero
`hard-codes` strings in either file. The agent confused itself on post-merge
line numbers.

**Resolution:** rejected — verified false positive. No code change.

### 327-02 — [important] Transposed `it.each` title tokens

> **comment-analyzer, canvas.test.ts:696:** title `"getTouchPos returns part %i
> for clientY=%i"` with rows `[clientY, expectedPart]` renders row `[10,0]` as
> "part 10 for clientY=0" — values swapped, names a non-existent part 10. The
> assertion is correct; only the displayed test name misleads.

**Bob's triage:** real defect (in test-output labelling, not behaviour).
Vitest substitutes `%i` positionally in array order, so the title must order
its tokens `clientY` then `part`. Address now; folds in code-reviewer's point
that the name should describe what is actually asserted (a touchstart
selection, not `getTouchPos` in isolation).

**Resolution:** addressed (commit RESOLUTION_HASH) — retitled to
`"touchstart at clientY=%i selects part %i (#327)"`.

### 327-03 — [important] Bottom-edge clamp (`part=0` collapse) untested

> **pr-test-analyzer, canvas.test.ts (table):** the table tops out at
> `clientY=50`; for `clientY ≥ 395` the clamp pins `clampedY=395`, `y=8.0`,
> `y % 1 === 0`, so `part=0` while `choir` clamps to 7. A clamp-ceiling
> regression would change part/choir here silently. It is the exact asymmetry
> the new code comment reasons about.

**Bob's triage:** real coverage gap on behaviour this diff introduces and the
code's own comment calls out as subtle. Address now; cheap.

**Resolution:** addressed (commit RESOLUTION_HASH) — new boundary `it.each`
row `[399, 7, 0]` asserting `choir===7, part===0`.

### 327-04 — [important] Choir-boundary part-wrap untested

> **pr-test-analyzer, canvas.test.ts (table):** the table covers parts 0–4
> within choir 0 but never crosses a choir boundary. The `y % 1` wrap that
> resets part to 0 in the next choir is unverified.

**Bob's triage:** real coverage gap, the natural complement to the in-row
table. Address now; close together with 327-03 in one boundary test.

**Resolution:** addressed (commit RESOLUTION_HASH) — boundary `it.each` rows
`[49, 0, 4]` (last part of choir 0) and `[59, 1, 0]` (first part of choir 1),
asserting both `choir` and `part`.

### 327-05 — [important] `part` has no clamp; range invariant not in the type

> **type-design-analyzer, MusicCanvas.ts:618-620:** `choir` is clamped both
> sides; `part` relies on the algebra (`y % 1 ∈ [0,1)`), with no explicit
> clamp. The `0..parts.length-1` invariant is invisible at the type level. The
> bottom edge wraps `part` to 0 silently.

**Bob's triage:** pre-existing — this is exactly the shape of `#getMousePos`
on `origin/main`; the diff imports it into `#getTouchPos`, doubling the
surface but not worsening the property. Out of scope for a one-line bug fix.
The added in-code comment already documents the precondition and the restore-
the-clamp guidance. Defer.

**Resolution:** deferred — refactor report for `MusicCanvas.ts` (capture with
327-06).

### 327-06 — [suggestion] Extract a shared `#derivePosition` helper

> **code-reviewer / type-design-analyzer / comment-analyzer:** the `y` formula
> and the `choir`/`part` derivation are textually duplicated across
> `#getMousePos` and `#getTouchPos`, mitigated only by a "keep in sync"
> comment. A private helper owning the math + a single clamp would enforce the
> range invariant in one place and make the two getters provably consistent.
> (The `bar` formula genuinely differs between the two — `clampedX * 140` vs
> `(clampedX - padding) * 140` — so a helper covers only the choir/part part.)

**Bob's triage:** legitimate refactor, larger than this bug-fix PR should
carry. The "keep in sync" comment is the correct interim mitigation. Defer to
a follow-up; do not expand scope here.

**Resolution:** deferred — refactor report for `MusicCanvas.ts` (a future
`#derivePosition` extraction also resolves 327-05 and the magic-`140`
divergence).

### 327-07 — [suggestion] Test name overstates what is asserted

> **code-reviewer, canvas.test.ts (table):** the table asserts committed state
> (`event.detail.position.part`, rebuilt by `fireEvent` from `this.voicePart`),
> not `#getTouchPos` in isolation; the "getTouchPos returns part" name overstates.

**Bob's triage:** valid; resolved as a by-product of the 327-02 rename to
"touchstart at clientY=%i selects part %i".

**Resolution:** addressed (folded into 327-02).

### 327-08 — [suggestion] `#getMousePos` lacks the no-clamp comment

> **code-reviewer, MusicCanvas.ts:** the no-clamp explanatory comment is
> asymmetric between the two methods.

**Bob's triage:** rejected — the explanation lives on `#getMousePos` (where the
diff added it) and `#getTouchPos` cross-references it ("see that method for the
invariant"). The single-source-plus-reference pattern is sound; comment-analyzer
concurred it is the correct mitigation. No change.

**Resolution:** rejected — cross-reference pattern is correct as written.

### 327-09 — [suggestion] No exact-row-boundary (`frac === 0`) case

> **pr-test-analyzer:** the table's lowest sample is `clientY=10` (frac 0.10);
> an exact `frac===0` case would pin the lower boundary.

**Bob's triage:** partially addressed — the bottom-edge clamp row `[399,7,0]`
added for 327-03 exercises `y % 1 === 0` exactly. A separate top-edge `frac===0`
case is low value given the clamp tests already cover the boundary arithmetic.

**Resolution:** addressed (subsumed by the 327-03 boundary row).

### 327-10 — [suggestion] Off-target-finger part path not asserted

> **pr-test-analyzer:** the off-target test (empty `targetTouches`, populated
> `changedTouches`) only range-checks `choir`/`bar`, not `part`.

**Bob's triage:** low value — the code path is shared with the on-target path
(already proven), and the off-target derivation uses the identical arithmetic.
Defer.

**Resolution:** deferred — noted; not worth a dedicated row this cycle.

### 327-11 — [suggestion] `#326` seed-coupling robustness

> **pr-test-analyzer:** the weakened `not.toBe(2)` assertions couple the seed
> `2` to the derived value (`0`) by an implicit "must differ" invariant; a
> coordinate change that derived part 2 would falsely fail.

**Bob's triage:** acceptable — the analyst confirmed the assertion still
catches the #326 regression it exists for, and the coordinate is fixed. Not
worth re-seeding this cycle.

**Resolution:** rejected — current assertion is sound; no change.

### 327-12 — [suggestion] NaN propagation at a 10px canvas

> **silent-failure-hunter:** `rect.height == 2*canvasPadding` would make the
> shared `y` denominator zero and propagate NaN into `part`.

**Bob's triage:** rejected — pre-existing in `#getMousePos` (identical
denominator on `origin/main`), requires a 10px-tall canvas which is not a real
runtime state. Out of scope.

**Resolution:** rejected — pre-existing, not a real runtime condition.

- Claude
