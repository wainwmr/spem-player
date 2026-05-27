# VERA-369 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-27 22:55
Last run:  2026-05-27 23:05

See also: [Original Report (cycle 1)](https://github.com/wainwmr/spem-player/issues/369#issuecomment-4558977238)

## Summary

[Placeholder — finalised at close-out.]

## Findings

### 369-01 — critical: `toRecordingIndex` cast launders `NaN` as `RecordingIndex`

> **silent-failure-hunter, pr-test-analyzer, type-design-analyzer (concurring), common.ts:106-108:**
> `toRecordingIndex` declares return type `RecordingIndex` (= `0 | 1`) but uses an unchecked `as RecordingIndex` cast over `toNum`, which returns `NaN` for any non-numeric input (`Number("foo")`, `Number(undefined)`, `Number({})`). The cast laundered through the type system gives the compiler a guarantee the runtime cannot enforce — exactly the anti-pattern this ticket exists to eliminate.
>
> Reachability: `MusicElement.setRecording` is called from `attributeChangedCallback` with arbitrary string `newValue` (`setAttribute("recording", "foo")` is the trivial trigger). `index.ts:setRecording` accepts plain `number` with no caller-side guarantee.
>
> Concrete downstream consequence: `NaN` propagates to `config.bartime[NaN]` → `undefined`, then `undefined.length` throws unhandled `TypeError` inside an async DOM callback (`MusicControls.ts:292`).
>
> code-reviewer disagrees on severity ("not an observable failure during normal use because callers in practice pass valid numerics"). The DOM `setAttribute` reach is the deciding factor.

**Bob's triage:** real defect, address now. Type narrowing whose enforcement point is a bare `as` cast is the canonical anti-pattern. Fail-fast and explicit-over-implicit both apply. Construct-don't-cast pattern with fallback-to-0 keeps the existing clamp philosophy and bounds the user-observable impact at "you get ALC instead of whatever-was-attempted" — recoverable, not catastrophic.

**Resolution:** addressed (commit `4ce3e7d`). `toRecordingIndex` rewritten as `const n = Number(v); return n >= 1 ? 1 : 0`. NaN, negative, fractional `[0, 1)`, and non-numeric strings all map to `0` by construction. Tests added at `src/test/common.test.ts` covering happy path, over-max clamp, under-min clamp, fractional inputs, and non-numeric inputs.

### 369-02 — important: `index.ts:472` setRecording behaviour change untested

> **pr-test-analyzer, index.ts:472-478:**
> Previously `toNum(r, false, 1)` (non-integer; `r=1.5` → `1.5`). Now `toRecordingIndex(r)` (integer; `r=1.5` → `1`). Contract changed, no test pins the new behaviour. Suggested test: assert `setRecording(1.5)` ends with `recording === 1`; pin that `setRecording("1")` and `setRecording(1)` agree.

**Bob's triage:** real defect, address now. Behaviour-change pins are cheap insurance; subsumed in 369-01's test block.

**Resolution:** addressed (commit `4ce3e7d`). Tests added in the same block: `toRecordingIndex(1.5) === 1`, `toRecordingIndex(2) === 1`, `toRecordingIndex("0") === toRecordingIndex(0)`, `toRecordingIndex("1") === toRecordingIndex(1)`.

### 369-03 — important: HDSQTIME upward-rounding for fractional inputs is unpinned

> **pr-test-analyzer, common.ts:106-108:**
> `toNum`'s `Math.floor(nums + HDSQTIME)` means `toRecordingIndex(0.95)` returns `1` and `toRecordingIndex(0.94)` returns `0`. Surprising for a `0|1` domain because the near-boundary fractional input flips recordings. Inherited by `toRecordingIndex` without comment.

**Bob's triage:** real defect, address now. The construct-don't-cast fix supersedes the HDSQTIME concern entirely — `toRecordingIndex` no longer routes through `toNum`, so HDSQTIME's epsilon nudge doesn't apply. The new seam is `>= 1`, which is the sensible boundary for a `0 | 1` domain.

**Resolution:** addressed (commit `4ce3e7d`). New behaviour pinned: `toRecordingIndex(0.95) === 0` and `toRecordingIndex(0.94) === 0`. The seam moved from "HDSQTIME-fractional" to "below/above 1" — exactly the model we want.

### 369-04 — important: `RecordingIndex = 0 | 1` literal decoupled from `config.recording.length`

> **type-design-analyzer, common.ts:17:**
> Runtime clamp uses `config.recording.length - 1`; type bakes in "two recordings" as a literal. If a third recording is added the type and data drift silently.

**Bob's triage:** real defect, address now. Fail-fast: a silent drift between type and config is exactly the class of bug an import-time assertion exists to catch. Matches the existing pattern at `common.ts:110-116` for `bartime`/`barno`. Cost: 3 lines.

**Resolution:** [in progress — separate fix commit]

### 369-05 — important: Public mutable `recording` field on `MusicElement` (encapsulation note)

> **type-design-analyzer, MusicElement.ts:15:**
> The field is `public` and writable; any caller can assign without going through `setRecording` / `toRecordingIndex`. Existing convention is the same for `setChoir`, `setBar`, etc.

**Bob's triage:** defensive nit, defer. Project convention is public mutable fields with `setX` boundary functions — every other field on `MusicElement` follows the same shape. Changing the convention is a separate decision outside this ticket's scope. Defer to `wiki/refactor-MusicElement.ts.md`.

**Resolution:** deferred — entry to be added to `wiki/refactor-MusicElement.ts.md` in publish step 5 (post-merge doc prep).

### 369-06 — important: `MusicScore.recording` shadow declaration redundant

> **type-design-analyzer, MusicScore.ts:17:**
> `MusicScore extends MusicElement` and re-declares `recording: RecordingIndex = 0`. Works (same-type redeclaration), but the shadow is redundant noise.

**Bob's triage:** real defect (small), address now. Dead noise; deleting is one line, low risk, YAGNI. Inherited field works.

**Resolution:** [in progress — separate fix commit]

### 369-07 — important: `common.ts:162-163` "#369" comment now self-references this PR

> **comment-analyzer, common.ts:162-163:**
>
> ```text
> // An out-of-range `v` would land here via undefined comparisons; see
> // #369 for the type-narrowing fix that makes this case unrepresentable.
> ```
>
> Written forward-looking; this PR *is* #369, so the comment now points at itself. Should be rewritten past/present tense, and the `#369` link dropped or replaced with a merged-PR link.

**Bob's triage:** real defect (documentation drift), address now. The forward-looking framing is now actively misleading. Rewrite in past/present tense; drop the issue ref (the type signature now documents the invariant directly).

**Resolution:** [in progress — separate fix commit]

## Suggestions (non-blocking)

### 369-08 — suggestion: Redundant `// 0 = ALC, 1 = CotE` comments duplicated three places

> **comment-analyzer, common.ts:19 + MusicElement.ts:14 + MusicScore.ts:17:**
> Could hoist the label-to-meaning mapping onto the `RecordingIndex` type declaration so it lives in one place.

**Resolution:** deferred — refactor item; add to `wiki/refactor-common.ts.md` post-merge.

### 369-09 — suggestion: URL-param parsing silently lossy (pre-existing, not introduced by this diff)

> **silent-failure-hunter, index.ts:189-191:**
> Any value other than `"alc"` silently maps to `1`. Pre-existing; not blocking the gate, but the narrowing refactor is a natural moment to tighten it.

**Resolution:** deferred — pre-existing, out of ticket scope; refactor item to add to `wiki/refactor-index.ts.md` if a report exists, else file a small Workbench item.

### 369-10 — suggestion: refactor doc cross-reference at common.ts:106-109 (still accurate)

> **comment-analyzer:**
> Cross-reference accurate; flagging only because the file is now adjacent to the new `toRecordingIndex` helper.

**Resolution:** no action — comment still describes the right untracked debt.

### 369-11 — suggestion: pre-existing `if (max)` falsy-zero bug in `toNum`

> **code-reviewer + type-design-analyzer, common.ts:101:**
> `if (max)` skips clamping when `max === 0`. Latent today (`config.recording.length - 1 === 1`); real if config ever degrades to a single recording. Out of scope for this PR.

**Resolution:** deferred — pre-existing, out of scope. Note: the 369-01 fix sidesteps this latent bug for `toRecordingIndex` because the new shape doesn't route through `toNum` at all.

### 369-12 — suggestion: no tests for `toRecordingIndex`

> **type-design-analyzer:**
> The new boundary helper has no direct test coverage.

**Resolution:** addressed (commit `4ce3e7d`). Subsumed in 369-01's test block — happy path, clamps, fractional, and non-numeric all covered.

## Cross-cutting note

Three of the four type-aware agents converged on 369-01 (the cast/NaN issue) as the load-bearing finding. The pattern is paradigmatic: a type-narrowing refactor that re-introduces the same unsafety it set out to eliminate, via an unchecked cast at the boundary. The fix is small (replace `as` with a constructed return) and closes 369-01, 369-02, 369-03, and 369-12 in one change.

- Claude (Vera gate runner)
