# VERA-326 Original Report (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-28 20:00 UTC

See also: [Final Synthesis (cycle 1)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)

## Raw agent reports (pass 1)

### code-reviewer

> **Verdict.** No findings at or above the report threshold (confidence >= 80). The fix is minimal and targeted; the new test pins the contract the ticket establishes (touchmove does not mutate `choir` / `voicePart` / `bar`). Notes on specific concerns, below threshold:
>
> **[A] `this.draw()` still useful in `#touchMoved` — `MusicCanvas.ts:627`, suggestion (~55).** After removing `#moveToPosition`, the remaining `this.draw()` re-renders the canvas without any state change since the previous frame. The `#shouldDraw` gate only throttles during playback; outside playback `draw()` will run fully and produce a pixel-identical frame. The ticket explicitly says "Keep `this.draw()` if drag feedback is desired", so the author has made a defensible choice; the cost is one canvas redraw per `touchmove`, which is cheap.
>
> **[B] "lighter overlay highlight" not implemented — `MusicCanvas.ts:624-628`, suggestion (~40).** The ticket offers two alternatives: "Keep `this.draw()` if drag feedback is desired, OR replace it with a lighter overlay highlight". The diff takes the first option. That satisfies the ticket as written — the overlay was an alternative, not a requirement.
>
> **[C] Test uses `voicePart` not `part` — no issue (~10).** Verified against `MusicElement.ts:17` (`voicePart: PartType = "all"`) and `MusicCanvas.ts:580` (`this.voicePart = pos.part`). The HTML attribute is `part`, the instance property is `voicePart`, and `#moveToPosition` writes to `this.voicePart`. Asserting on `canvas!.voicePart` is the correct way to detect the bug.
>
> **[D] `#touchStarted` still commits, `#touchMoved` does not — no issue (~15).** The split is coherent and matches the ticket's intent. The asymmetry is intentional, not a defect.
>
> **[E] Quiet `#touchMoved` handler — `MusicCanvas.ts:624-628`, suggestion (~45).** `#touchMoved` is now reduced to `preventDefault + fireEvent + draw`. The handler's purpose is no longer obvious from reading the body — a reader has to know the history (#317, #326) to understand why the move handler does nothing local. A one-line comment explaining "touchmove deliberately does not mutate state; see #326" would help future maintainers.
>
> **[F] Test does not assert `draw()` was called — no issue (~25).** Incidental behaviour, not the contract the ticket establishes.

### pr-test-analyzer

> **Summary.** The new test pins the precise behaviour the fix introduces (touchmove no longer commits `choir`/`voicePart`/`bar`). However, it sits in isolation — there is no companion assertion that `touchstart` SHOULD commit, and no assertion of the `touchend` semantics the ticket body describes. The single touch coordinate (1200, 300) is also a weak fixture choice.
>
> **[A] No inverse contract pinning — `canvas.test.ts:463-513`, severity 9.** A future refactor that deletes `this.#moveToPosition(this.#getTouchPos(e))` from `#touchStarted` (lines 617-622) — structurally identical to the line just removed from `#touchMoved` — would not fail any test. The existing touchstart tests (lines 414-461 and 240-274) only assert that the event fires and `pos` is in range; they never read back `canvas.choir`/`voicePart`/`bar`.
>
> **[B] Coordinate not chosen to differ from seeded state — severity 8.** clientX=1200, clientY=300 is a single point. The seed (choir=0, voicePart=2, bar=50) and the `#getTouchPos` return at that coord would be `voicePart: "all"` (hard-coded), and the choir/bar derived from coord. If `#getTouchPos` ever returned `{choir:0, bar:50, part:"all"}` near that coord, the `choir`/`bar` assertions would pass even on regression. Only `voicePart=2` is guaranteed to falsify (because getTouchPos always returns `"all"`).
>
> **[C] No touchend coverage — severity 7.** The ticket body says the gesture is meant to "switch back to selected part on touchend". The test does not exercise touchend at all. If touchend semantics ever drift (mutates incorrectly, fails to restore), nothing in the suite catches it.
>
> **[D] Field name `voicePart` vs ticket's `part` — severity 6.** The class field is genuinely `voicePart`, the ticket wording is misleading. Risk: future reader writes a follow-up test against the non-existent `part` field and silently no-ops. Worth a note in the PR description.
>
> **[E] Test doesn't assert `this.draw()` was invoked — severity 5.** If `this.draw()` were removed in a future refactor, the canvas would stop repainting on drag (frozen cursor). The suite would miss it.
>
> **[F] State seeded directly, not via gesture — severity 4.** Test reaches into the instance to seed `choir`/`voicePart`/`bar` (lines 482-484). A more behavioural variant would touchstart at coord-A (asserting commit), then touchmove to coord-B (asserting no further commit), then touchend (asserting end-state). This also folds in gaps [A] and [C].

### silent-failure-hunter

> **Finding 1 — `this.draw()` redraws unchanged scene every touchmove — `MusicCanvas.ts:624-628`, HIGH.** After the diff, `#touchMoved` mutates no canvas state before calling `this.draw()`. `draw()` re-runs the full pipeline at 60+/s during a drag, and every input it reads is unchanged from the last paint. **The redraw is silently wasted CPU/GPU on touch devices** (precisely the platform that can least afford it), and the fact that the user sees *something* on screen will mask the absence of the drag-overlay feedback they expect. There is no overlay-position state being updated to follow the finger. Either delete `this.draw()` from `#touchMoved` (it's provably a no-op given the shimmer loop), or introduce an explicit hover-style ghost cursor.
>
> **Finding 2 — `music-canvas-touchmove` consumers may rely on committed state — `MusicCanvas.ts:626`, MEDIUM.** Production code in `index.ts` only binds `music-canvas-touchstart` (line 545) and `music-canvas-touchend` (line 549). **`music-canvas-touchmove` has no production listener at all**, and `fireEvent("music-canvas-touchmove")` is now called with no payload. The event is fired into the void. Any future listener (or third-party embedder) that assumes "touchmove gives me a position" will silently get nothing.
>
> **Finding 3 — Asymmetry between `#touchStarted` and `#touchMoved` is undocumented — `MusicCanvas.ts:617-628`, MEDIUM.** Post-diff, the three touch handlers have inconsistent behaviour with no comments explaining why. **Nothing in `MusicCanvas.ts` says "do not call `#moveToPosition` here — that's #317/#326's whole point".** A future change to make touch feel "more responsive" will almost certainly re-add the line. The deletion is the entire fix and it leaves no scar tissue. Add: `// #317/#326: do NOT mutate state here — touchmove fires 60+/s and would thrash bar/choir/part.`
>
> **Finding 4 — Removing the call masks #327's discoverability — `MusicCanvas.ts:610-614 / 619`, HIGH.** `#getTouchPos` hard-codes `part: "all"` (line 612). Before this diff, every touchmove called `#moveToPosition(#getTouchPos(evt))` which set `this.voicePart = "all"` 60+/s — flooding the `"all"` value continuously. **The diff does not fix the `part: "all"` issue — it only reduces the frequency at which it manifests.** Any latent bug in handling `"all"` (which #327 is reportedly tracking) is now harder to reproduce.

### type-design-analyzer

> **Verdict.** No new type-design findings on the diff. The test's casting and property-attach patterns are appropriate to the jsdom environment, the field-naming choices match the existing class shape, and the slimmed-down `#touchMoved` signature still expresses its contract correctly.
>
> **[A] `as DOMRect` cast — no finding.** The cast supplies every property of the lib.dom `DOMRect` interface. `tsc --noEmit` runs clean. `as any` would be strictly worse; `Partial<DOMRect>` would be a lie.
>
> **[B] `Object.defineProperty(touchMove, "targetTouches", …)` — no finding.** jsdom does not ship a `TouchEvent` constructor. Falling back to `new Event(...)` plus `defineProperty` is the standard workaround.
>
> **[C] `voicePart` vs `Position.part` — no finding.** The class field is deliberately named `voicePart: PartType` on `MusicElement`, distinct from the HTML observed-attribute `"part"` and from the `Position.part` DTO field.
>
> **[D] `#touchMoved(evt: TouchEvent)` signature — minor.** After the deletion, the body no longer reads `targetTouches` or any geometry. The signature is still right (`preventDefault` is the load-bearing reason). Worth a one-line comment along the lines of "Body intentionally does not consult event geometry — see #326".

### comment-analyzer

> **Summary.** One genuine wiki-doc drift, one borderline-load-bearing missing comment in `#touchMoved`, and one test-name framing concern. No drift in the source file's own comments (there are none on the touch handlers).
>
> **Finding 1 — `wiki/refactor-MusicCanvas.ts.md:115-117`, MEDIUM.** Entry for `#moveToPosition()` states: *"The canvas click and touch handlers call `#moveToPosition()` before firing their own events"*. After this change, only `#canvasClicked` and `#touchStarted` call `#moveToPosition()`; `#touchMoved` no longer does. The sentence reads as if all three touch handlers commit, which is precisely the symmetry assumption #326 broke. Suggest: *"The canvas click handler and `#touchStarted` call `#moveToPosition()` before firing their own events…"*.
>
> **Finding 2 — `wiki/refactor-MusicCanvas.ts.md:258-270`, MEDIUM.** The "Resolved 2026-05-28" analysis of `#moveToPosition` state desync lists *"The callers (`#canvasClicked()`, `#touchStarted()`, `#touchMoved()`) immediately fire …"*. Both passages now describe a code path that no longer exists for `#touchMoved`. Remove `#touchMoved()` from the callers list. (This bullet is wiki-native — confirmed no `tests-local/` source — so edit in place is appropriate.)
>
> **Finding 3 — `src/ts/MusicCanvas.ts:624`, LOW.** `#touchMoved` is now structurally asymmetric with `#touchStarted` and `#touchEnded`. A maintainer reading the three handlers side-by-side will see the missing line as an oversight and "restore" it — exactly the regression #326 (and #317 before it) prevents. Add: `// Intentionally does NOT commit position — see #317/#326. Per-touchmove commits caused 60+/s state churn during drag.`
>
> **Finding 4 — `src/test/canvas.test.ts:463`, LOW.** The test name `"touchmove does not mutate canvas internal state"` describes the intended invariant accurately, but the body asserts only that `choir`, `voicePart`, and `bar` are unchanged. "Internal state" is broader than three properties. Tighten to: `"touchmove does not commit position (choir/voicePart/bar unchanged)"`, or simply `"touchmove does not commit position (#326)"`.
>
> **Positive findings.** The e2e test `e2e/touch-drag.spec.ts` has an exemplary docstring explaining *why* the regression matters. The new unit test should aim for that level of "why".

- Claude
