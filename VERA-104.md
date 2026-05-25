# VERA-104 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-25 23:35
Last run:  2026-05-25 23:50

See also: [Original Report (cycle 1)](https://github.com/wainwmr/spem-player/issues/104#issuecomment-4537557250)

## Summary

[Placeholder — finalised at close-out per method-sub-vera-gate.md step 7.]

## Findings

### 104-01 — critical Comment typo: "temp" → "tempo"

> **comment-analyzer, src/ts/common.ts:121 and :142:**
> the comment `// calculate temp (bars per second)` is a typo for "tempo" that predates this PR but is now actively misleading in context. The variable on the next line is `currenttempo`, confirming intent, and `(barno_next - barno) / (bartime_next - bartime)` is bars-per-second, i.e. tempo. "Temp" reads as "temporary" to a cold reader. Fix to `// calculate tempo (bars per second)`. Since the surrounding code was just edited, this PR is the natural moment to correct it.

**Bob's triage:** Pre-existing nit on a touched file; cheap one-line fix is proportional to the moment. Address now.

**Resolution:** addressed (commit de2adea)

### 104-02 — critical Trailing `return 0` unreachable and misleading

> **comment-analyzer, src/ts/common.ts:135 and :149** (with concurring findings from silent-failure-hunter, type-design-analyzer, pr-test-analyzer):
> the trailing `return 0;` is now provably unreachable (the two new clamp guards at the top of each function cover every `t`/`b` value, and the interior loop covers all interior intervals). It has no comment. A future maintainer will either (a) wonder whether 0 is a meaningful sentinel and preserve it defensively, or (b) read the old behaviour "returns 0 if out of range" into it. Either add `// unreachable: clamps above cover all inputs` or delete the line. Leaving it bare is the worst option.

**Bob's triage:** Caused by this diff (clamps make the trailing return unreachable). Own the mess: replace the silent `return 0` with an explicit `throw` so the unreachability is enforced rather than implicit. Address now.

**Resolution:** addressed (commit 962527e). Replaced `return 0` with `throw new Error("getBarFromTime: unreachable")` / `getTimeFromBar`, plus an explanatory comment above each. Note: makes NaN inputs throw rather than silently return 0 — see 104-07 below.

### 104-03 — important Silent removal of `toNum` test assertion

> **code-reviewer, src/test/common.test.ts:35:**
> the diff silently removes the assertion `expect(toNum("7.2", true, 7)).toBe(7)` from the `toNum()` test. This is unrelated to ticket #104's scope and shrinks coverage of `toNum`'s `max`-clamp + integer-floor interaction. Restore the line, or if it was deliberately removed because the behaviour is now considered wrong, raise that as a separate ticket — do not bundle a silent test deletion into a boundary-values fix.

**Bob's triage:** Real regression. Scope creep that shrinks coverage silently. The line belongs back. Address now.

**Resolution:** addressed (commit 740d5fb). `expect(toNum("7.2", true, 7)).toBe(7);` restored after the matching `false`-mode assertion at line 34.

### 104-04 — important Module-load `throw` lacks rationale

> **code-reviewer + comment-analyzer, src/ts/common.ts:105-111:**
> the new length-check loop runs at module load time and `throw`s on mismatch. Because `common.ts` is imported by nearly every module, a config drift will crash the whole app at import rather than degrading gracefully. That is arguably the right behaviour (fail loud at boot), but it is a meaningful behaviour change with no test asserting it and no comment explaining the choice. Add a brief comment ("Fail fast at import time: mismatched lengths would silently corrupt `getBarFromTime`/`getTimeFromBar` interval lookups."). The `wiki/refactor-common.ts.md` page (lines 281-284) already flags this exact concern as untracked debt, so worth a one-line cross-reference.

**Bob's triage:** Doc-only, cheap, the throw really is a meaningful behaviour change worth flagging in-code. Address now.

**Resolution:** addressed (commit 2022fb8). Comment explains: fail fast at import time prevents silent corruption of interval lookups; intentional whole-app crash on bad config; cross-reference to the refactor report.

### 104-05 — important Missing just-inside-boundary test

> **pr-test-analyzer:**
> there is no test for the *just-inside-boundary* case that the change to `>=` was intended to fix in tandem with the clamp. The loop hits exact boundary values (e.g. `t = 234.3`), but a value a hair above an internal boundary (e.g. `t = 234.3 + 1e-9` for ALC index 2) exercises a different branch of the new `if (t >= ... && t < ...)`. A regression that flipped `>=` back to `>` would still pass every current test. Add one value strictly between two internal boundaries per recording.

**Bob's triage:** Test gap that directly weakens the new logic's regression coverage. Cheap additive test. Address now.

**Resolution:** addressed (commit 96cab42). New test `getBarFromTime() interpolates strictly between internal boundaries` probes the midpoint between `bartime[v][2]` and `bartime[v][3]` for both ALC and CotE, asserting the interpolated bar number matches the expected linear midpoint.

### 104-06 — important Clamped-value identity not pinned

> **pr-test-analyzer:**
> the time->bar tests don't pin the *clamped value's identity*. `getBarFromTime(600, 0)` returning `config.barno[0][last]` (=139) only proves clamping; a probe at `t = config.bartime[0][last] - epsilon` would prove the final interval still interpolates rather than snapping. Same in reverse for `getTimeFromBar`.

**Bob's triage:** Same shape as 104-05: cheap test that pins a seam in the new logic. Address now.

**Resolution:** addressed (commit 96cab42). New test `getBarFromTime() interpolates just below the final boundary, not snapping to clamp` probes `bartime[last] - 0.5` for both recordings and asserts the result is the interpolated value (not the clamp).

### 104-07 — important NaN inputs silently return 0

> **silent-failure-hunter, src/ts/common.ts (also flagged by pr-test-analyzer):**
> In the new `getBarFromTime`, if `t` is `NaN`, all three comparisons (`t <= bartime[0]`, `t >= bartime[lastIdx]`, and the loop's `t >= ... && t < ...`) evaluate `false`, so execution falls through to `return 0`. Same for `getTimeFromBar` with `b = NaN`. `MusicControls.ts:253` passes `self.audio.currentTime` straight in — `HTMLMediaElement.currentTime` can be `NaN` before metadata loads. The user sees the playhead silently jump to bar 0 with no log, no Sentry id, no user feedback.

**Bob's triage:** Real defect (observable: playhead snap on initial load) but pre-existing. NaN was returning 0 before this PR too — the diff doesn't change the behaviour. **However**, the 104-02 fix replaced the silent `return 0` with a `throw`, so the symptom changed: NaN now throws uncaught in the `requestAnimationFrame` loop. **That makes 104-07 newly urgent** — but the fix is a semantic call (clamp / throw / log) that deserves its own ticket and spec. Defer to a new Spem ticket, not bundled into the boundary PR.

**Resolution:** deferred to board ticket [#368](https://github.com/wainwmr/spem-player/issues/368) (`common.ts: NaN inputs to getBarFromTime/getTimeFromBar silently return 0 (then throw post-#104)`).

### 104-08 — important Empty `bartime[v]` / `barno[v]` silent `undefined` propagation

> **silent-failure-hunter:**
> The new code reads `config.bartime[v][0]` and `config.bartime[v][lastIdx]` unconditionally. If either inner array is empty, `lastIdx = -1`, both reads return `undefined`, the `t <= undefined` comparison is `false`, the loop runs zero times, and the function returns `0`. The module-load validator only checks equal length — equal lengths of zero pass. Strengthen the validator to require `>= 1` (or `>= 2`).

**Bob's triage:** Defensive nit. Config never has empty bartime arrays in practice; this is a class-of-bug worry. Defer to the refactor report; do not expand scope here.

**Resolution:** deferred to `wiki/refactor-common.ts.md` item 15.

### 104-09 — important Invalid `v` throws opaque TypeError far from call site

> **silent-failure-hunter, src/ts/MusicControls.ts:253:**
> Callers in `MusicControls.ts` pass `this.recording` directly. If `this.recording` is ever out of range, `config.bartime[v]` is `undefined`, and `.length` throws `TypeError: Cannot read properties of undefined`. There is no try/catch around the calls (lines 224, 253, 292, 311); the error surfaces as an uncaught exception in `requestAnimationFrame` with no error id, no logError, no user message — the playback loop simply dies.

**Bob's triage:** Defensive nit. `State.recording` is bounded by the toNum clamp at `MusicElement.ts:78`; callers can't pass invalid `v` in practice. The right fix is type narrowing (104-10), which makes this defect unrepresentable. Defer.

**Resolution:** deferred to `wiki/refactor-common.ts.md` item 16; cross-references board ticket [#369](https://github.com/wainwmr/spem-player/issues/369) (type narrowing).

### 104-10 — important `v: number` could be `0 | 1`

> **type-design-analyzer:**
> `v: number` is unnecessarily wide. The recording index has exactly two valid values (0 = ALC, 1 = CotE), already comment-documented at `src/ts/common.ts:19` and `src/ts/MusicScore.ts:17`. Replacing with `type RecordingIndex = 0 | 1` (and tightening `State.recording`) would make `config.bartime[v]` provably in-bounds and eliminate the silent `undefined.length` crash from #104-09. The `toNum(v, true, config.recording.length-1)` clamp at `MusicElement.ts:78` already enforces this at the boundary, so the narrowing is honest.

**Bob's triage:** Genuine type-safety improvement but cross-cutting: touches `State` interface, `MusicControls.ts`, `MusicScore.ts`, `MusicElement.ts`. Out of scope for #104's "boundary clamping" thesis. Defer to a new board ticket.

**Resolution:** deferred to board ticket [#369](https://github.com/wainwmr/spem-player/issues/369) (`common.ts: narrow v parameter from number to RecordingIndex (0 | 1)`).

### 104-11 — important Missing `TempoMap` pair type

> **type-design-analyzer:**
> The pair `config.bartime[v]` / `config.barno[v]` is a missing type. They always travel together, have a same-length invariant enforced at module load, and are indexed in lockstep on every line of both functions. A `TempoMap = { bars: number[]; times: number[] }` (or readonly equivalent) would make the invariant unrepresentable to violate and let `getBarFromTime` / `getTimeFromBar` take a `TempoMap` rather than reach into `config` by index. The module-load `throw` is a runtime patch over a structural weakness.

**Bob's triage:** Refactor, not a defect. Touches `config.ts` shape and both function signatures. Pairs naturally with 104-10 if done as a single typing pass. Defer.

**Resolution:** deferred to `wiki/refactor-common.ts.md` item 17.

### 104-12 — important JSDoc missing on exported functions

> **comment-analyzer, src/ts/common.ts (also implied by type-design-analyzer):**
> Per `doc/CONTRIBUTING.md:217-223` ("JSDoc comments for public APIs", "Explicit types where helpful"), `getBarFromTime` and `getTimeFromBar` are exported and consumed elsewhere — they qualify as public APIs and currently have zero JSDoc. The PR also doesn't add a return-type annotation. Adding a brief JSDoc block documenting the clamping semantics, the `v` recording index (0=ALC, 1=CotE), and the half-open interval convention `[bartime[i], bartime[i+1])` would lock the new behaviour in.

**Bob's triage:** Locks in the new contract (clamping semantics) at the type-doc level. Cheap. Address now.

**Resolution:** addressed (commit 6fc55b3). Each function gets a JSDoc block: purpose, clamping behaviour, `v` recording index meaning, half-open interval convention, return contract (no more `0` sentinel).

## Suggestions (informational, do not block the gate)

- **104-13** *(type-design)* return type `number` is wider than the contract; a `@returns` JSDoc line stating the clamped range would help. *Partly addressed by 104-12: the JSDoc adds the range, though no branded return type.*
- **104-14** *(type-design)* `config.bartime` / `config.barno` are exposed as mutable arrays; `readonly` (or `Object.freeze`) would prevent post-load mutation invalidating the just-asserted invariant. *Noted; not addressed.*
- **104-15** *(type-design)* the two functions are textually duplicated inverses; once a `TempoMap` exists, an `interpolate(map, x, axis)` helper would remove the duplication. *Pairs with 104-11; noted.*
- **104-16** *(test)* mixing `toBe` for exact boundary lookups and `toBeCloseTo` for interpolated values would document intent. *Noted; deferred — the every-boundary loops would need restructuring.*
- **104-17** *(comment)* `"clamps out-of-range time values"` could be `"clamps out-of-range time values to first/last bar"` for self-documentation. *Pedantic; noted.*
- **104-18** *(comment)* `expect(result).toBeTypeOf("number")` assertions at lines :48 and :95 are unexplained leftover guards from the old `return 0` ambiguity. *Noted; could drop these in a follow-up.*
