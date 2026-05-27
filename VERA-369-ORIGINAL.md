# VERA-369 Original Report (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-27 22:45

See also: [Final Synthesis (cycle 1)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)

## Raw agent reports (pass 1)

### code-reviewer

Reviewed: `index.ts`, `src/ts/MusicElement.ts`, `src/ts/MusicScore.ts`, `src/ts/common.ts` on branch `andrew/369-recording-index-type`. Type-check (`tsc --noEmit`) and `common.test.ts` (22 tests) pass.

**Critical (90-100):** None.

**Important (80-89):** None.

**Notes (suggestion-only, do not block):**

- `src/ts/common.ts:107` — `toRecordingIndex` uses an unchecked `as RecordingIndex` cast. If a non-numeric string ever reached this helper, `toNum` would return `NaN` and the cast would silently lie to TypeScript. In practice the only callers (`MusicElement.setRecording`, `index.ts setRecording`) only ever receive numeric values or numeric strings produced via `String(current.recording)` (`index.ts:479`), so this is not an observable failure during normal use. Worth a quick comment noting the precondition, or a runtime fallback to `0`, but not a Vera-blocker.
- `src/ts/common.ts:101` — pre-existing `if (max)` falsy-zero bug in `toNum` (unchanged by this ticket). With `config.recording.length - 1 = 1` it's irrelevant here. Out of scope.

No critical or important findings. The change is a clean type-narrowing that the type-checker validates end-to-end; runtime semantics for `index.ts` `setRecording` actually improve (integer truncation now applied where a float was previously possible).

### pr-test-analyzer

**Summary:** The PR introduces `RecordingIndex = 0 | 1` and a new `toRecordingIndex()` coercion helper in `src/ts/common.ts`, then narrows several call sites. The change adds a new exported function and a small but consequential behaviour change in `index.ts setRecording()` (was `toNum(r, false, 1)`, now effectively `toNum(r, true, 1)`). **No new tests were added.** Pre-existing tests at `src/test/common.test.ts` continue to pass because they only used `[0, 1] as const` for `v`, structurally compatible with the narrower type. The coverage gap is on the new helper itself, where the type contract is silently violated for several runtime inputs.

**[A] CRITICAL — `toRecordingIndex` violates its declared type for non-numeric input; no test pins the contract**

- File: `src/ts/common.ts:106-108`
- Runtime evidence: `toRecordingIndex("foo")`, `toRecordingIndex(NaN)`, `toRecordingIndex(undefined)` all return `NaN`. Verified by re-running underlying `toNum` arithmetic. The cast `as RecordingIndex` papers over this.
- Why it matters: the PR's *purpose* is to make the out-of-range-`v` case unrepresentable so `getBarFromTime`/`getTimeFromBar` can drop their unreachable-throw fallback (see the docstring at `common.ts:158-163` which explicitly references #369). If `toRecordingIndex` can return `NaN`, the type narrowing is a lie — `config.bartime[NaN]` is `undefined` and downstream calls in `MusicControls.ts:224`, `292`, `311` will throw on property access of `undefined`.
- Reachability: `MusicElement.setRecording` is called from `attributeChangedCallback` with an arbitrary string `newValue` (anything settable via `setAttribute("recording", "...")`). A test harness or future caller passing a non-numeric string takes this path.
- Required tests:
  - `toRecordingIndex("foo")` — should return `0 | 1`, not `NaN`
  - `toRecordingIndex(NaN)` — same
  - `toRecordingIndex(undefined as unknown as number)` — same
  - Happy path: `toRecordingIndex(0)`, `toRecordingIndex(1)`, `toRecordingIndex(2)` (over-max → 1), `toRecordingIndex(-1)` (under → 0), `toRecordingIndex("0")`, `toRecordingIndex("1")`.

**[B] IMPORTANT — Behaviour change in `index.ts setRecording` is untested**

- File: `index.ts:472-478` (post-diff)
- Change: previously `toNum(r, false, 1)` (non-integer; `r=1.5` → `1.5`), now `toRecordingIndex(r)` (integer; `r=1.5` → `1`). Callsites today pass integers, but the contract changed and no test pins the new behaviour.
- Suggested test: assert `setRecording(1.5)` ends with `recording === 1`. Also pin that `setRecording("1")` and `setRecording(1)` produce the same result so the string/number paths stay in sync.

**[C] IMPORTANT — HDSQTIME-induced upward rounding for fractional inputs is unpinned**

- File: `src/ts/common.ts:106-108`
- Behaviour: because `toNum` does `Math.floor(nums + HDSQTIME)`, `toRecordingIndex(0.95)` returns `1` and `toRecordingIndex(0.94)` returns `0` (verified). Shared with `toNum` but inherited without comment by the new helper. Surprising in a `0 | 1` setting because the same coercion applied to ALC vs CotE means a near-boundary fractional input flips recordings.
- Suggested test: `expect(toRecordingIndex(0.95)).toBe(1)` and `expect(toRecordingIndex(0.94)).toBe(0)` to pin the seam so a future refactor of `toNum` doesn't silently change recording selection.

**Test Quality Issues:** None. Existing `common.test.ts` is well-structured.

**Positive Observations:**

- `src/test/common.test.ts:81, 97, 118, 128` already iterate `[0, 1] as const`, so `getBarFromTime`/`getTimeFromBar` boundary, midpoint, seam, and non-finite coverage extends automatically.
- The unreachable-throw at `common.ts:164, 202` remains protected by existing tests.
- `config.test.ts:26-27` already asserts `config.barno.length === config.recording.length === config.bartime.length`.

**Recommendation:** Block on **[A]**. The fix is likely a one-line change in `toRecordingIndex` (e.g. `return Number.isFinite(n) ? n : 0` before the cast) plus 3-4 test cases. **[B]** and **[C]** can be added in the same test block (~10 lines total). Together, ~15 lines of tests close the gap.

### silent-failure-hunter

**Vera Gate Error-Handling Audit — Ticket #369**

**Branch:** `andrew/369-recording-index-type`
**Files in scope:** `index.ts`, `src/ts/MusicElement.ts`, `src/ts/MusicScore.ts`, `src/ts/common.ts`

**[IMPORTANT] `toRecordingIndex` lies about its return type when input is non-numeric**

File: `src/ts/common.ts:106-108`

```ts
export function toRecordingIndex(v: string | number): RecordingIndex {
  return toNum(v, true, config.recording.length - 1) as RecordingIndex;
}
```

How the failure stays silent: `toNum` returns `NaN` for any input that `Number(s)` cannot parse (e.g. `Number("foo")`, `Number(undefined)`, `Number({})`). Trace: `Number("foo")` → `NaN`; `max = 1` is truthy, so `nums = Math.min(Math.max(0, NaN), 1)` → `Math.min(NaN, 1)` → `NaN`; returns `Math.floor(NaN + HDSQTIME)` → `NaN`.

The `as RecordingIndex` cast then launders `NaN` as a `0 | 1` value. The type system now believes an invariant the runtime cannot guarantee — precisely the anti-pattern this ticket exists to *eliminate*. The new function silently re-introduces the problem one level up.

Downstream consequence (concrete): `MusicControls.setRecording` calls `getTimeFromBar(this.bar, this.recording)` (`MusicControls.ts:292`). With `this.recording = NaN`, `getBarFromTime`/`getTimeFromBar` execute `config.bartime[NaN]` → `undefined`, then `undefined.length` throws `TypeError: Cannot read properties of undefined` from inside an async DOM-attribute callback. That throw is unhandled — exactly the "hard-to-trace runtime divergence" comment at `common.ts:107-108` warns about, now reachable via a typed path the compiler endorses.

Also note an unrelated bug in `toNum` that this refactor inherits: `if (max)` is falsy when `max === 0`, so callers using `max=0` get no clamping. Not directly in scope.

Recommendation: validate the result before casting. Either return a documented fallback with audit trail, or throw — preferable for a narrowing refactor — since the type now claims this case is unrepresentable.

**[IMPORTANT] `index.ts:472` `setRecording` lost its `toNum` clamp; now passes raw user input straight to `toRecordingIndex`**

File: `index.ts:472-475`

Before the refactor, this function ran `r = toNum(r, false, config.recording.length - 1)` (non-integer clamp) before assigning. After the refactor, it goes straight through `toRecordingIndex`, which inherits the `NaN` problem above.

Caller `index.ts:196` is `setRecording(r)` where `r` comes from URL-parameter parsing (`index.ts:189-191`). The URL-param branch is hard-coded to set `r` to `0` or `1`, so today this entry point is safe in *practice*. But the function signature is `(r: number)`, and any future caller passing an arbitrary number (or a programmatic `Number(searchParams.get("recording"))` which can be `NaN`) will silently get `NaN` written into `current.recording`. Then `config.recording_label[NaN]` returns `undefined`, and `recordinglabel.textContent = undefined` displays the literal string `"undefined"` in the UI with no error logged anywhere.

Recommendation: fix the root cause in `toRecordingIndex` (above) and this site becomes safe automatically.

**[SUGGESTION] `index.ts:189-191` URL-param parsing is silently lossy (pre-existing)**

```ts
} else if (parm[0] == "recording") {
  if (parm[1] == "alc") r = 0;
  else r = 1;
}
```

Any value other than `"alc"` — including `"cote"`, `"ALC"`, `""`, garbage — silently maps to `1`. Not new in this diff, so it does not block the gate, but the narrowing refactor is a natural moment to tighten it.

**Summary:** Two **important** findings, both rooted in the same defect: `toRecordingIndex` uses a bare `as RecordingIndex` cast on a value that can be `NaN`. Fixing `toRecordingIndex` to validate-then-cast (or validate-then-throw) closes both findings in one change. No critical findings. No catch-block, optional-chain, or promise-rejection issues in this diff.

### type-design-analyzer

**Type: `RecordingIndex` (= `0 | 1`)**

**Invariants Identified:**

- The recording index is a member of `{0, 1}` — a valid index into the parallel arrays `config.recording`, `config.recording_label`, `config.barno`, `config.bartime`, `config.choirs`.
- All consumers must receive a value that indexes those arrays without producing `undefined`.
- All values entering this type from outside (URL params, DOM attributes, user input, JSON) must be narrowed at the boundary.

**Ratings:**

- **Encapsulation: 5/10** — The literal-union type itself is not encapsulated, but that's standard TS. There is exactly one narrowing function (`toRecordingIndex`), which is good. But `MusicElement.recording` is `public` and writable, so any caller can do `elem.recording = (3 as RecordingIndex)` with a cast and bypass narrowing. No `readonly`, no private setter.
- **Invariant Expression: 7/10** — Clean compile-time expression at the narrowest practical form. However, the type is **coupled by a magic number** to `config.recording.length`. If a third recording is added, the type and data drift silently.
- **Invariant Usefulness: 7/10** — Real and helpful. Eliminates "unreachable" defensive throws in `getBarFromTime`/`getTimeFromBar` for any caller with a `RecordingIndex`. Catches genuine slip-throughs from `number`. Modest but real.
- **Invariant Enforcement: 3/10** — The weak point. The narrowing function is a thin wrapper over `toNum` plus an unchecked cast. Two failure modes yield non-`RecordingIndex` values still wearing the type:
  1. `NaN` flows through (`toRecordingIndex("foo")` → `NaN as RecordingIndex`)
  2. `if (max)` skips clamping when `max === 0` — latent today, real if config degrades to single recording

**Findings:**

**CRITICAL — `toRecordingIndex` does not actually enforce `RecordingIndex`**

File: `src/ts/common.ts:106-108`. The same `NaN`-laundering issue (see silent-failure-hunter / pr-test-analyzer). Reachable from `MusicElement.attributeChangedCallback` and `index.ts:setRecording`.

Suggested shape:

```ts
export function toRecordingIndex(v: string | number): RecordingIndex {
  const n = Number(v);
  if (n >= 1) return 1;
  return 0; // NaN, negative, and [0,1) all map here
}
```

Eliminates `NaN`, eliminates dependence on `if (max)`, eliminates the `HDSQTIME` epsilon trick (not needed for a two-element domain), produces a `RecordingIndex` by construction rather than by cast.

**IMPORTANT — Hard-coded `0 | 1` is decoupled from `config.recording.length`**

File: `src/ts/common.ts:17`. The runtime clamp uses `config.recording.length - 1`, but the type bakes in "two recordings" as a literal. The two will drift without warning. At minimum, add an import-time assertion matching the existing `bartime`/`barno` pattern at `common.ts:110-116`:

```ts
if (config.recording.length !== 2) {
  throw new Error(`RecordingIndex assumes config.recording.length === 2, got ${config.recording.length}`);
}
```

**IMPORTANT — Public mutable field on `MusicElement`/`MusicScore`**

Files: `MusicElement.ts:15`, `MusicScore.ts:17`. The field is `public` and writable. Any caller can assign without going through `setRecording` / `toRecordingIndex`. Existing convention is the same for `setChoir`, `setBar`, etc. — acceptable, but worth flagging because the `RecordingIndex` literal makes the violation route easier to find.

**IMPORTANT — `MusicScore.recording` is shadowed but never re-narrowed**

File: `MusicScore.ts:17`. `MusicScore extends MusicElement` and re-declares `recording: RecordingIndex = 0`. Works (same-type redeclaration), but the shadow is redundant noise. Either delete it or document why.

**SUGGESTION — `setRecording(r: number)` in `index.ts` could take `RecordingIndex`**

Caller `toggleRecording` computes `(current.recording + 1) % config.recording.length` which widens to `number`. The parameter type `number` is correct — `setRecording` is the boundary. Acceptable as-is.

**SUGGESTION — No tests for `toRecordingIndex`**

File: `src/test/common.test.ts`. No entries for `toRecordingIndex`. Given the `NaN` hole, should be tested explicitly.

**Strengths:** Single named boundary function. Type matches existing literal-union patterns. Narrowing pays off immediately at `config.choirs[this.recording]` (`MusicScore.ts:161`). Diff is appropriately small. Author noticed link to unreachable throws in `getBarFromTime` (`common.ts:163`) — good system awareness.

**Concerns:** The narrowing function uses `as` rather than a constructed-value approach. The literal-union value is hard-coded while runtime data is config-driven; no assertion ties them together.

**Recommended Improvements (concrete):**

1. Rewrite `toRecordingIndex` to construct, not cast (4 lines).
2. Add an import-time assertion that `config.recording.length === 2` (3 lines).
3. Add a `common.test.ts` block for `toRecordingIndex` (~12 lines).
4. Delete the redundant `recording` field redeclaration in `MusicScore.ts:17`.

### comment-analyzer

**Scope:** 4 files (`index.ts`, `src/ts/common.ts`, `src/ts/MusicElement.ts`, `src/ts/MusicScore.ts`). Each comment touching or adjacent to a refactored signature reviewed against the post-refactor code.

**Summary:** One important finding (a self-referential "unreachable" comment that the refactor was supposed to close), plus two suggestions. No critical drift. The bulk of comments (`// 0 = ALC, 1 = CotE` field markers, `@param v Recording index` doc blocks) survive the refactor cleanly because they always described the semantic invariant the type now encodes.

**IMPORTANT — Stale forward-reference to the very ticket this PR closes**

File: `src/ts/common.ts:162-163`.

```text
// An out-of-range `v` would land here via undefined comparisons; see
// #369 for the type-narrowing fix that makes this case unrepresentable.
```

Code it sits above: `throw new Error("getBarFromTime: unreachable");`. Function signature is now `getBarFromTime(t: number, v: RecordingIndex = 0)`.

This comment was written *forward-looking* — it told the reader "the out-of-range-`v` path will be made unrepresentable in #369". With this PR, #369 *is the fix*. The comment is no longer pointing at future work, it's pointing at itself. Should be rewritten in past/present tense (e.g. "An out-of-range `v` cannot occur: the parameter is `RecordingIndex` (`0 | 1`), narrowed at the boundary by `toRecordingIndex`."), and the `#369` link dropped — or replaced with a link to the merged PR.

The symmetric reference in `getTimeFromBar` (`common.ts:200-201`) just says *"see `getBarFromTime` for full rationale; same coverage applies symmetrically."* — that one is fine; it inherits whatever wording you choose for the primary block.

**SUGGESTION — Redundant inline comment now duplicated by the type**

Files: `src/ts/MusicElement.ts:14`, `src/ts/MusicScore.ts:17`.

```ts
recording: RecordingIndex = 0; // 0 = ALC, 1 = CotE
```

The `// 0 = ALC, 1 = CotE` gloss was load-bearing when the field was `recording: number`. Now `RecordingIndex = 0 | 1` carries the cardinality, the comment is borderline. Could consider hoisting the label-to-meaning mapping onto the `RecordingIndex` type declaration in `common.ts:17` so it lives in exactly one place. The same gloss currently appears in *three* spots (`common.ts:19`, `MusicElement.ts:14`, `MusicScore.ts:17`).

**SUGGESTION — Comment references "refactor-common.ts.md for the related untracked-debt discussion"**

File: `src/ts/common.ts:106-109`. The refactor doc at `wiki/refactor-common.ts.md` lists `getBarFromTime`/`getTimeFromBar` boundary work and the HDSQTIME tempo hardcoding (Item #130) as remaining debt — none addressed by this PR. Cross-reference still accurate. No change required; flagging because the file is now adjacent to the new `toRecordingIndex` helper.

**Positive findings:**

- The `@param v Recording index: 0 = ALC, 1 = CotE. Matches State.recording.` blocks at `common.ts:138` and `common.ts:179` aged through this refactor cleanly — they describe the semantic contract, and "Matches `State.recording`" is now *strengthened* by the shared `RecordingIndex` alias.
- The fail-fast import-time check comment at `common.ts:105-109` correctly remains the explanation for *configuration* drift (mismatched `bartime[v].length` vs `barno[v].length`), which is orthogonal to the `v`-parameter type narrowing.
- The new `toRecordingIndex` helper is uncommented. Defensible — the name plus the one-line body is self-explanatory.

**Bottom line:** one important fix (the `#369` self-reference at `common.ts:162-163`). Everything else is suggestion-grade.

- Claude (Vera gate runner)
