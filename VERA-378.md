# VERA-378 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-27 01:30
Last run:  2026-05-27 01:30

See also: [Original Report (cycle 1)](https://github.com/wainwmr/spem-player/issues/378#issuecomment-4550197499)

## Summary

[Placeholder — finalised at close-out.]

## Findings

### 378-01 — important — `adoptedCallback` not-throw assertion is unfalsifiable on an empty body

> **silent-failure-hunter finding 1; pr-test-analyzer finding 2 — `src/test/musicelement.test.ts`:**
> `adoptedCallback` is empty. `not.toThrow()` catches only the case where future code makes it throw. Subtle mutations (silent side-effects like `this.bar = 99`) pass silently. Add a state snapshot before/after.

**Bob's triage:** valid weakness. Cheap to fix: snapshot the same five state fields used in the unknown-attribute test before/after the call, assert unchanged. Address now.

**Resolution:** [open]

### 378-02 — important — Unknown-attribute snapshot test cannot catch side effects outside five fields

> **silent-failure-hunter finding 2; pr-test-analyzer finding 1 — `src/test/musicelement.test.ts`:**
> The default branch is a bare `break`, so the five-field equality check is tautological today. If the default branch ever gains a side effect that doesn't touch those properties (event dispatch, DOM mutation, helper-method call), the test still passes. Add `vi.spyOn(elem, "fireEvent")` and assert not called — covers the most likely accidental side effect (the existing setters all call `fireEvent`).

**Bob's triage:** valid weakness. The fireEvent spy is the right backstop because every legitimate dispatch path goes through it. Address now.

**Resolution:** [open]

### 378-03 — suggestion — Short-circuit test couples to dispatch mechanism

> **silent-failure-hunter finding 3 — `src/test/musicelement.test.ts`:**
> `vi.spyOn(elem, "setChoir")` couples to the current dispatch mechanism. A future refactor that moves dispatch out of the switch could make the spy fire (or not fire) for the wrong reason. Also assert `elem.choir` is unchanged after the same-value call as a refactor-proof observable check.

**Bob's triage:** the spy catches the current mechanism; the observable-state check catches the higher-level contract. Belt-and-braces. Cheap. Address now.

**Resolution:** [open]

### 378-04 — suggestion — `define` catch-block test doesn't verify the catch fired

> **silent-failure-hunter finding 4 — `src/test/musicelement.test.ts`:**
> `not.toThrow()` passes equally if the catch swallowed a real `NotSupportedError`, if `customElements.define` became idempotent, or if the second call was skipped. Pin the actual contract: assert `customElements.get("test-control-duplicate")` is still the original class after the redefine attempt.

**Bob's triage:** the observable contract is "first class wins on duplicate define". Asserting via `customElements.get` checks that directly without depending on whether `define` threw or no-op'd internally. Cheap. Address now.

**Resolution:** [open]

### 378-05 — suggestion — `(elem as any)` casts framed as "protected" but methods are public

> **type-design-analyzer finding 1 — `src/test/musicelement.test.ts`:**
> The casts paper over `document.createElement`'s base-`HTMLElement` return type, not access-modifier restrictions. The lifecycle methods (`adoptedCallback`, `attributeChangedCallback`) are public on `MusicElement`. Either drop the casts (the existing `as MusicElement` already exposes them) or retire the "protected" framing in the comments.

**Bob's triage:** drop unnecessary casts where the typed `MusicElement` reference already has the method. The existing `elem` variable is already typed `as MusicElement`. Address now.

**Resolution:** [open]

### 378-06 — suggestion — PR body should surface the diagnosis-delta

> **comment-analyzer finding 3 — PR body:**
> Spec asked for `console.log`/`console.warn` spies; code emits neither. State this once in the PR description so a future reader doesn't reach for the wrong assumption.

**Bob's triage:** already planned for the PR body when `gh pr create` runs. Cheap, important for the audit trail.

**Resolution:** [open — scheduled for PR body at publish step 8]
