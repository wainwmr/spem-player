# VERA-378 Original Report (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-27 01:30

See also: [Final Synthesis (cycle 1)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)

## Raw agent reports (pass 1)

### code-reviewer

> **Findings: none at critical or important severity.**
>
> **Suggestion** — `define catches duplicate registration` redefines `test-control-duplicate` against the same `TestControl` class. The assertion `not.toThrow()` is meaningful but doesn't prove the catch fired — a no-throw underlying registry would also pass. A stronger pin would be to redefine with a different class for the same tag (which jsdom reliably throws on). Matches the original test's intent and ticket scope, so not blocking.
>
> **Focus answers:**
>
> - Assertions meaningful — yes. The short-circuit test would catch removal of the `oldValue == newValue` guard. The define test would fail if the try/catch were removed.
> - Deviation justified — yes. `adoptedCallback()` is empty; default branch is a bare `break`. Adding logging would be a production-code change outside ticket scope.
> - Convention/style — consistent with the rest of the suite.
>
> Clean to merge.

### pr-test-analyzer

> **Verdict: clean with one weakness worth naming.** Three of the four tests are mutation-sensitive; one is partially tautological but still pins a useful boundary.
>
> 1. **suggestion** — the state-snapshot assertions in "attributeChangedCallback ignores unknown attribute names" are partially tautological under the current code shape. `MusicElement.ts:48-49` is literally `default: break;` — no code path inside the switch can touch `recording`/`choir`/`voicePart`/`bar`/`playing` when name is `"badattr"`. Only the `not.toThrow()` line has present-tense mutation-sensitivity. Either accept as a regression-pin or strengthen by also spying on `fireEvent` and asserting it was not dispatched.
>
> 2. **suggestion** — "adoptedCallback can be called without error" is a no-throw pin on an empty body. It would not catch a mutation that adds a silent side-effect (e.g. `this.bar = 99`). Snapshotting state around the call would close the gap.
>
> 3. **No issue** — the spy-based short-circuit test is strong. Removing the `oldValue == newValue` guard makes the first call dispatch and the `not.toHaveBeenCalled()` fails. The sanity second-call catches a "blanket return" mutation.
>
> 4. **No issue** — removing the `try/catch` makes the second `define` throw a `NotSupportedError`, tripping `not.toThrow()`.
>
> Spec deviation fair. Recommended action: merge as-is; optionally tighten test 2 with a `fireEvent` spy.

### silent-failure-hunter

> 1. **important** — `adoptedCallback` not-throw assertion is essentially unfalsifiable. Empty body cannot throw, so `not.toThrow()` is tautological. Subtle bugs (wrong state mutation, missing side effect, async rejection) all pass. Add a comment-anchored assertion that snapshots state before/after the call.
>
> 2. **important** — snapshot test cannot catch side effects outside the five tracked properties. If the default branch ever fires an event, calls a setter, mutates DOM, or sets a new property, all five snapshot equality checks still pass. Add `const fireSpy = vi.spyOn(elem, "fireEvent");` before the call and assert not called — covers the most likely accidental side effect.
>
> 3. **suggestion** — `spyOn(elem, "setChoir")` couples the test to the dispatch mechanism. If dispatch moves to a strategy map or external handler, the spy may fire for the wrong reason or not fire despite correct behaviour. Also assert `elem.choir` is unchanged after the same-value call as a refactor-proof observable.
>
> 4. **suggestion** — `define` catch-block test does not verify the catch actually fired. `not.toThrow()` passes equally if the catch swallowed a real `NotSupportedError`, if `customElements.define` became idempotent, or if the second call was skipped. Spy on `window.customElements.define` and assert called twice; or assert `customElements.get(...)` is still the original class.
>
> 5. **suggestion** — spec deviation justified, but consider a `TODO(#xxx)` if a logging ticket is anticipated.
>
> Verdict: no criticals. Findings 1 and 2 worth fixing before merge.

### type-design-analyzer

> 1. **Low** — the `(elem as any)` casts are framed in the comment as accessing "protected/intentionally-untyped lifecycle methods", but `adoptedCallback` and `attributeChangedCallback` are public on `MusicElement` — no access modifier, no escape needed. The cast is just papering over `document.createElement` returning the base `HTMLElement` type. Drop the casts or retire the "protected" framing.
>
> 2. **Info** — `vi.spyOn(elem, "setChoir")` is correctly typed.
>
> No production-type changes warranted. Only the comment-vs-reality mismatch in finding 1 is worth a touch-up.

### comment-analyzer

> All comment claims check out against the code.
>
> 1. **Suggestion** — claim "no-op default case" slightly under-specifies; the early-return on `oldValue == newValue` also produces no log. Optional belt-and-braces note.
>
> 2. **Suggestion** — "pins that boundary so future contributors notice if they accidentally make the implementation throw." Catches only synchronous throws. If anyone later marks `adoptedCallback` `async` and rejects, `not.toThrow()` won't catch it. Future-proofing only.
>
> 3. **Suggestion** — PR body / ticket close should surface the diagnosis-delta (spec asked for log spies; code emits neither).
