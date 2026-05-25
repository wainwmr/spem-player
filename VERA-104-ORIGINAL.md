# VERA-104 Original Report (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-25 23:10

See also: [Final Synthesis (cycle 1)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)

## Raw agent reports (pass 1)

### code-reviewer

> I now have everything I need. Reviewing the changes against the project guidelines and bug-detection lens:
>
> The fix in `c:/Users/Andrew/Spem/src/ts/common.ts` correctly addresses ticket #104 (and #176): clamping at both ends, switching the interior interval to `>= && <` to catch internal boundaries, and adding a length-mismatch guard. The test additions in `c:/Users/Andrew/Spem/src/test/common.test.ts` are thorough (per-boundary loops for both ALC and CotE, both directions, plus out-of-range clamping).
>
> Findings:
>
> (suggestion) `c:/Users/Andrew/Spem/src/test/common.test.ts:35` — the diff silently removes the assertion `expect(toNum("7.2", true, 7)).toBe(7)` from the `toNum()` test. This is unrelated to ticket #104's scope and shrinks coverage of `toNum`'s `max`-clamp + integer-floor interaction. Confidence 85 (important). Restore the line, or if it was deliberately removed because the behaviour is now considered wrong, raise that as a separate ticket — do not bundle a silent test deletion into a boundary-values fix. CLAUDE.md/`doc/CONTRIBUTING.md` "Preserve existing user-facing behaviour unless the change is the point" and "Report scope creep immediately" both push the same way.
>
> (suggestion) `c:/Users/Andrew/Spem/src/ts/common.ts:106-112` — the new length-check loop runs at module load time and `throw`s on mismatch. Because `common.ts` is imported by nearly every module, a config drift will crash the whole app at import rather than degrading gracefully. That is arguably the right behaviour (fail loud at boot), but it is a meaningful behaviour change with no test asserting it and no comment explaining the choice. Confidence 80 (important). Either add a brief comment ("intentional boot-time crash if config drifts — caught by tests when present") and a unit test that exercises the guard (via a wrapped helper, since the IIFE-style top-level loop is not directly testable), or convert to a `console.error` + best-effort fallback. The refactor-common.ts.md page (lines 281-284) already flags this exact concern as untracked debt, so worth a one-line cross-reference.
>
> Both `getBarFromTime` and `getTimeFromBar` are otherwise correct: the early-return clamps for `t <= bartime[0]` and `t >= bartime[last]` make the trailing `return 0` truly unreachable for valid `v`, the `>= && <` interval logic correctly handles internal boundary points (each boundary `t == bartime[i]` is caught by interval `[i, i+1)`), and the linear-interpolation arithmetic is unchanged. The `MusicControls.ts` callers (lines 224, 253, 292, 311) all benefit from the clamping at `currentTime == 0` and at end-of-piece without further changes. Tests verify all 14 ALC boundaries and 4 CotE boundaries to 5-decimal precision, and out-of-range clamping in both directions. Conventional commit prefix (`fix:`) and ticket reference in the subject line both match `doc/CONTRIBUTING.md`. No critical issues.

### pr-test-analyzer

> I have everything I need. Here is the analysis.
>
> The PR's coverage of the two new clamp paths (below first boundary and above last boundary, both directions, both recordings) is solid: there are explicit assertions for negative-input clamp and over-range clamp in all four combinations. The two new per-boundary loops also do the heavy lifting that the old "final bar" tests only gestured at - every entry in `config.bartime[v]` and `config.barno[v]` is now exercised in both directions, which catches the original #104 bug (the old `t > ...&& t < ...` skipped exact internal boundaries).
>
> Critical: none.
>
> Important: there is no test for the *just-inside-boundary* case that the change to `>=` was intended to fix in tandem with the clamp. The loop hits exact boundary values (e.g. `t = 234.3`), but a value a hair above an internal boundary (e.g. `t = 234.3 + 1e-9` for ALC index 2) exercises a different branch of the new `if (t >= ... && t < ...)`. A regression that flipped `>=` back to `>` would still pass every current test because the exact-boundary case is now handled by the early clamp checks plus the `<=` on the first comparison; only an off-boundary probe distinguishes the loop's `>=` from `>`. Add one value strictly between two internal boundaries per recording.
>
> Important: the time->bar tests don't pin the *clamped value's identity*. `getBarFromTime(600, 0)` returning `config.barno[0][last]` (=139) only proves clamping; a probe at `t = config.bartime[0][last] - epsilon` would prove the final interval still interpolates rather than snapping. Same in reverse for `getTimeFromBar`. This is the "gap between final boundary tests and clamp tests" you flagged.
>
> Suggestion: tolerance. `toBeCloseTo(x, 5)` = within 0.5e-5. For boundaries that are exact array lookups (no arithmetic), this is loose - those could be `toBe`. For interpolated values, 5dp is fine; the arithmetic is one multiply and one add on doubles around magnitudes ~1e2, so error is ~1e-13. No change needed, but mixing `toBe` for exact returns and `toBeCloseTo` for interpolation would document intent.
>
> Suggestion: no test pins the new top-level `throw` for length-mismatched config arrays (lines added at the top of `common.ts`). Hard to test without module re-import, low value, leave it.
>
> Suggestion: negative zero, NaN, Infinity inputs are not covered. `getBarFromTime(NaN, 0)` will fall through both clamp checks (NaN comparisons are false) and through the loop, returning the stray `0` sentinel - a silent wrong answer. Worth either a guard or an explicit test pinning current behaviour. Low likelihood in production but cheap to lock down.
>
> Suggestion / pre-existing: the `return 0` sentinel at the end of both functions is now unreachable for finite inputs given the clamps. Could be replaced with `throw new Error("unreachable")` while this PR is open - removes a silent-failure mode and is in the same spirit as the length-mismatch guard already added.

### silent-failure-hunter

> I have enough to assess. Findings on the diff between `origin/main` and `andrew/104-fix-boundary-values` for `c:/Users/Andrew/Spem/src/ts/common.ts`:
>
> **MEDIUM - NaN inputs silently return 0.** In the new `getBarFromTime`, if `t` is `NaN`, all three comparisons (`t <= bartime[0]`, `t >= bartime[lastIdx]`, and the loop's `t >= ... && t < ...`) evaluate `false`, so execution falls through to `return 0`. Same for `getTimeFromBar` with `b = NaN`. `MusicControls.ts:253` passes `self.audio.currentTime` straight in — `HTMLMediaElement.currentTime` can be `NaN` before metadata loads. The user sees the playhead silently jump to bar 0 (or time 0 on the inverse call at line 224/292/311) with no log, no Sentry id from `constants/errorIds.ts`, and no user feedback. Recommend an explicit `if (Number.isNaN(t)) { logError("ERR_BARTIME_NAN", ...); return config.barno[v][0]; }` (or whatever the spec dictates) at the top of both functions so the silent zero-jump cannot recur.
>
> **MEDIUM - Unreachable `return 0` misleads readers.** With the new early-return guards `t <= bartime[0]` and `t >= bartime[lastIdx]`, plus the loop covering `[bartime[index], bartime[index+1])` across every adjacent pair, the only remaining path that reaches the trailing `return 0` is `NaN`. A reader will reasonably assume the sentinel is for some legitimate out-of-range case (because it was, before this PR) and may build new logic around it. Either delete the trailing `return 0` and replace it with an explicit `throw new Error("getBarFromTime: unreachable - NaN input?")`, or convert it to the NaN-handler suggested above. The same applies to `getTimeFromBar`'s trailing `return 0`.
>
> **MEDIUM - Empty `bartime[v]` / `barno[v]` produces silent `undefined` propagation.** The new code reads `config.bartime[v][0]` and `config.bartime[v][lastIdx]` unconditionally. If either inner array is empty, `lastIdx = -1`, both reads return `undefined`, the `t <= undefined` comparison is `false`, the loop runs zero times, and the function returns `0`. The module-load-time validator added at line 105 only checks that the two arrays have equal length — equal lengths of zero pass. Strengthen the validator to also require `config.bartime[v].length >= 1` (or >= 2, since the tempo formula needs two points) and include `v` and the length in the error message.
>
> **MEDIUM - Invalid `v` throws an opaque TypeError far from the call site.** Callers in `MusicControls.ts` pass `this.recording` directly. If `this.recording` is ever out of range, `config.bartime[v]` is `undefined`, and `.length` throws `TypeError: Cannot read properties of undefined`. There is no try/catch around the calls at lines 224, 253, 292, 311, so the error surfaces as an uncaught exception in `requestAnimationFrame` (line 253) with no error id, no `logError`, no user message — the playback loop simply dies. Add a defensive `if (!config.bartime[v]) { logError("ERR_INVALID_RECORDING_INDEX", { v }); return config.barno[0]?.[0] ?? 0; }` or validate `v` at the top with a thrown `Error` carrying context.
>
> **LOW - Behavioural change: callers no longer distinguish "out of range" from "at boundary".** Pre-PR, `getBarFromTime(-1)` returned `0`, which was the same value as a legitimate in-range `t = bartime[0]`. So no caller could have been relying on `0` as an out-of-range sentinel — the old behaviour was already ambiguous. The risk is therefore low, but `MusicControls.setBar` at line 304 (`c:/Users/Andrew/Spem/src/ts/MusicControls.ts`) now silently clamps out-of-range bar inputs from the bar input box to the last bar. A user typing "9999" into the bar input will see playback jump to the final bar with no explanation — no `logForDebugging`, no UI feedback that the input was clamped. Consider surfacing the clamp via `logForDebugging` plus a UI hint.
>
> **Positive - module-load validator is good practice.** The new `throw new Error("config.bartime[${v}] and config.barno[${v}] must have equal length")` at module top-level fails loudly at startup with context. This is the right pattern; just extend it to cover the empty-array case noted above.

### type-design-analyzer

> I have enough context to evaluate. Here are the findings.
>
> [medium] `v: number` is unnecessarily wide. The recording index has exactly two valid values (0 = ALC, 1 = CotE), already comment-documented at `src/ts/common.ts:19` and `src/ts/MusicScore.ts:17`. Replacing with `type RecordingIndex = 0 | 1` (and tightening `State.recording`) would make the array-index access `config.bartime[v]` provably in-bounds, eliminate the silent `undefined.length` crash when a caller passes `2`, and propagate the constraint to the four call sites in `src/ts/MusicControls.ts`. The `toNum(v, true, config.recording.length-1)` clamp at `MusicElement.ts:78` already enforces this at the boundary, so the narrowing is honest.
>
> [medium] The pair `config.bartime[v]` / `config.barno[v]` is a missing type. They always travel together, have a same-length invariant that is now enforced at module load (good), and are indexed in lockstep on every line of both functions. A `TempoMap = { bars: number[]; times: number[] }` (or even a `readonly Array<{bar: number; time: number}>` so the invariant is structural, not asserted) would make the invariant unrepresentable to violate and would let `getBarFromTime` / `getTimeFromBar` take a `TempoMap` rather than reach into `config` by index. The module-load `throw` is a runtime patch over a structural weakness.
>
> [low] The return type `number` is also wider than the contract. `getBarFromTime` returns a bar number bounded by `[barno[v][0], barno[v][last]]`; `getTimeFromBar` returns a non-negative time. Branding (`type BarNumber = number & {__bar:true}`) is over-engineering for this codebase, but a JSDoc `@returns` line stating the clamped range is cheap and matches the new contract introduced by this PR.
>
> [medium] The return-contract change (was: `0` sentinel on miss; now: always a valid clamped value) is currently invisible at the type level and uncommented. The unreachable `return 0` at the tail of both functions is now dead code that misleads readers into thinking the sentinel still exists. Either delete it (the early-clamp branches make the loop exhaustive) or, if kept defensively, add `// unreachable: clamps above cover all inputs`.
>
> [low] Parameter-name asymmetry (`t, v` vs `b, v`) is fine — `t` and `b` correctly signal domain. The deeper asymmetry worth flagging is that the two functions are textually duplicated inverses; once a `TempoMap` type exists, a single `interpolate(map, x, axis)` helper would remove the duplication and the matching `lastIdx` boilerplate.
>
> [low] Encapsulation: `config.bartime` / `config.barno` are exposed as mutable arrays. Marking them `readonly` (or freezing at load alongside the new length check) would prevent post-load mutation from invalidating the just-asserted invariant.

### comment-analyzer

> Findings on the diff for `c:/Users/Andrew/Spem/src/ts/common.ts` and `c:/Users/Andrew/Spem/src/test/common.test.ts`:
>
> (critical) `src/ts/common.ts:121` and `src/ts/common.ts:142` — the comment `// calculate temp (bars per second)` is a typo for "tempo" that predates this PR but is now actively misleading in context. The variable on the next line is `currenttempo`, confirming intent, and `(barno_next - barno) / (bartime_next - bartime)` is bars-per-second, i.e. tempo. "Temp" reads as "temporary" to a cold reader. Fix to `// calculate tempo (bars per second)`. Since the surrounding code was just edited, this PR is the natural moment to correct it.
>
> (critical) `src/ts/common.ts:135` and `src/ts/common.ts:149` — the trailing `return 0;` is now provably unreachable (the two new clamp guards at the top of each function cover every `t`/`b` value, and the interior loop covers all interior intervals). It has no comment. A future maintainer will either (a) wonder whether 0 is a meaningful sentinel and preserve it defensively, or (b) read the old behaviour "returns 0 if out of range" into it. Either add `// unreachable: clamps above cover all inputs` or delete the line. Leaving it bare is the worst option.
>
> (important) `src/ts/common.ts:105-111` — the new top-level validation block has a single-line comment but no explanation of *why* it runs at module load. Suggest: "Fail fast at import time: mismatched lengths would silently corrupt `getBarFromTime`/`getTimeFromBar` interval lookups." Also worth noting that `throw` at module scope will break the whole app on bad config — that's intentional but worth signalling.
>
> (important) Per `doc/CONTRIBUTING.md:217-223` ("JSDoc comments for public APIs", "Explicit types where helpful"), `getBarFromTime` and `getTimeFromBar` are exported and consumed elsewhere — they qualify as public APIs and currently have zero JSDoc. The PR also doesn't add a return-type annotation (both return `number`). Adding a brief JSDoc block documenting the clamping semantics, the `v` recording index (0=ALC, 1=CotE, matching the `State.recording` comment at line 22), and the half-open interval convention `[bartime[i], bartime[i+1])` would lock the new behaviour in.
>
> (suggestion) The new test names ("returns correct bar at every ALC boundary", "clamps out-of-range time values") read well as intent documentation. Good. Minor: "clamps out-of-range time values" doesn't say *to what* — "clamps out-of-range time values to first/last bar" would be a touch more self-documenting, but this is borderline pedantic.
>
> (suggestion) `src/test/common.test.ts:48` and `:95` — the new `expect(result).toBeTypeOf("number")` assertions are unexplained. They look like leftover guards against the old `return 0` ambiguity (where 0 might mean "real bar 0" or "out of range"). Either drop them now that clamping makes the type uninteresting, or add a one-line comment explaining what regression they pin.
>
> (positive) The new boundary-sweep tests are self-documenting through their loop structure and use of `config.bartime`/`config.barno` directly — a reader can see at a glance that "every boundary" means every entry in the mapping arrays. No comment needed.
>
> No stale "returns 0 if out of range" comment survives in the diff — that's good; the risk was that one existed elsewhere and I checked, none does in `common.ts`.
