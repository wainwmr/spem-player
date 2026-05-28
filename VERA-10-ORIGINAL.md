# VERA-10 Original Report (cycle 2)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 2
Generated: 2026-05-28 13:35

See also: [Final Synthesis (cycle 2)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)
(Earlier cycles: [Synthesis (cycle 1)](https://github.com/wainwmr/spem-player/issues/10#issuecomment-4561299282))

## Raw agent reports (pass 1)

### code-reviewer

> ## Review summary
>
> Files reviewed:
> - `c:/Users/Andrew/Spem/index.ts` (lines 225-374 — keyboard event handler + new SCROLL_KEYS set)
> - `c:/Users/Andrew/Spem/src/test/keyboard.test.ts` (lines 173-312 — new "Keyboard event swallowing for iPad page-wiggle" suite)
>
> Verification run: 30 tests pass; `npx tsc --noEmit` and `npx eslint` clean on both files.
>
> This is a tight, narrow fix. The semantic shift from "swallow everything in the handler" to "swallow only scroll-causing keys" is correctly implemented and well-tested (positive and negative cases, modifier combinations, IME, input-focused).
>
> The PR description mentions `PageUp/PageDown/Home/End` in the swallow set, but the code includes only `Space` and the four arrow keys. The code's narrower set is the right call; consider tightening the PR description so reviewers don't go looking for the extra keys.
>
> ### Critical: None.
>
> ### Important
>
> **1. Misleading test comment — "previously silently swallowed" is factually wrong** (confidence 82)
> - File: `c:/Users/Andrew/Spem/src/test/keyboard.test.ts:259-260`
> - The comment reads: *"Plain `/` (no Shift) is not a help-modal trigger; previously it was silently swallowed which broke Firefox quick-find."* This is incorrect — on `origin/main`, the `case "Slash"` block only acts when `e.shiftKey` is true and never called `preventDefault()` for plain `/`. The pre-fix code did NOT swallow plain Slash.
> - Fix: rewrite the comment to describe the actual invariant being pinned. The test itself is still valuable (it guards against a future widening of `SCROLL_KEYS`); only the historical claim is wrong.
>
> ### Suggestions
>
> **2. Prettier formatting nit on `isPlainScrollKey`** (confidence 70)
> - File: `c:/Users/Andrew/Spem/index.ts:279-280`
> - `prettier --check` collapses these two lines into one.
>
> **3. PR description says `PageUp/PageDown/Home/End`; the code does not include them** (confidence 75 — process / description issue)
> - File: `c:/Users/Andrew/Spem/index.ts:236-242`
> - Recommend: amend the PR description.

### pr-test-analyzer

> ## Summary
>
> The test file is meaningfully scoped: it asserts the user-visible contract (`defaultPrevented`) rather than spying on `preventDefault`, parametrises positive and negative cases, and pins a non-obvious ordering invariant (IME composition before swallow).
>
> However, there is a **material contradiction between the ticket description and the implementation** that the tests do not catch.
>
> ### Critical
>
> **[C1] Severity 9 — Ticket claims `PageUp/PageDown/Home/End` are swallowed; the code does not, and no test asserts either way.**
>
> - Production code at `c:/Users/Andrew/Spem/index.ts:236-242`:
>   ```
>   const SCROLL_KEYS = new Set([
>     "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
>   ]);
>   ```
>   `PageUp`, `PageDown`, `Home`, and `End` are absent.
> - The parametrised positive table at `keyboard.test.ts:192-205` mirrors the implementation rather than the ticket. If the ticket description is authoritative, the bug is unfixed.
>
> **Recommended action:** Either (a) add `PageUp`, `PageDown`, `Home`, `End` to `SCROLL_KEYS` and extend the test table, or (b) update the ticket and the PR description if these were deliberately deferred.
>
> ### Important
>
> **[I1] Severity 7 — No test covers Space *with* a modifier (Cmd+Space / Ctrl+Space).** Cmd+Space behaviour (Spotlight on macOS) must not be swallowed and must not toggle play/pause. The desired behaviour is entirely untested.
>
> **[I2] Severity 7 — Tests assert `defaultPrevented` but never assert that the action *also* fired (or didn't).** If a future refactor removed the `if (e.code == "Space")` branch entirely, the swallow would still fire and the test would still pass — but play/pause would be broken.
>
> **[I3] Severity 6 — `KeyF` lost its `preventDefault` — no test that plain `f` (no modifier) actually opens the feedback modal *and* doesn't trigger any browser default.**
>
> ### Suggestions
>
> **[S1] Inconsistent dispatch target in negative tests.**
>
> **[S2] The `control`-class guard at `index.ts:263` is not exercised.**
>
> **[S3] Escape-on-input is documented but not tested.** The actual new code path — Escape *on a focused textarea* — is untested.
>
> **[S4] `e.keyCode === 229` IME branch only partially covered.**
>
> **[S5] `defaultPrevented` for keys-that-are-handled-but-not-in-SCROLL_KEYS could be pinned.** (KeyD, KeyM, etc.)
>
> **[S6] Early returns at `index.ts:245-252` are dead-code-ish but untested.**
>
> ### Recommendation for the Vera gate
>
> **Do not pass cycle 2 until [C1] is resolved** — either the missing keys are added, or the ticket scope is explicitly narrowed in the PR description.

### silent-failure-hunter

> ## CRITICAL
>
> ### C1. `SCROLL_KEYS` set does not match the commit message / ticket scope — silent omission
>
> **Location:** `c:/Users/Andrew/Spem/index.ts:236-242` and commit `d169f16`
>
> The commit message states the swallow set is "scroll-causing keys only (Space, ArrowUp, ArrowDown, **PageUp, PageDown, Home, End**)". The actual `SCROLL_KEYS` set is Space + 4 arrows.
>
> This is the textbook silent-failure pattern: the contract written in the commit message is *wider* than the code's behaviour, with no test, log, or comment acknowledging the gap.
>
> **Recommendation:** either (a) add the four missing keys to `SCROLL_KEYS` *and* add `it.each` rows for them, or (b) rewrite the commit/PR description to truthfully name "Space and Arrow keys only", and explicitly document why PageUp/Home/End were ruled out.
>
> ## IMPORTANT
>
> ### I1. Silent early-return on non-Element target loses scroll-prevention
>
> **Location:** `c:/Users/Andrew/Spem/index.ts:249-252`. If a keydown fires with `e.target` being `document` or `window` (which can happen in iOS Safari with focus on `<body>`), the handler returns before swallowing the scroll key — re-introducing the wiggle. Worth verifying on a real iPad or adding a test that dispatches keydown directly to `document`.
>
> ### I2. `isInputLike` guard at line 263-265 silently swallows scroll-key preventDefault for input-focused users
>
> Intentional, pinned by test. But the block comment doesn't mention that scroll-key preventDefault is also bypassed for input-like targets — a future reader chasing I1 will silently break textarea typing. One-sentence comment addition recommended.
>
> ### I3. Test helper `dispatchKeydown` silently ignores `cancelable` override
>
> The spread-after-defaults pattern silently accepts a `cancelable: false` override. Low-grade footgun, not a defect.
>
> ## SUGGESTION
>
> ### S1. `isModifierSeek` accepts Alt/Shift+Arrow as a "plain scroll key" — not what the comment promises
>
> `isPlainScrollKey` requires only `!metaKey && !ctrlKey` — it permits `altKey` or `shiftKey`. The block comment says "only when no modifier is held", which is broader than the code.
>
> ### S2. `KeyboardEvent.code` is the only branch key — non-physical-keyboard input is silently uncategorised
>
> On iPad with software keyboards, autocorrect-injected events, and accessibility switch input can dispatch keydown events with `e.code === ""` and only `e.key` populated. Such events are silently let through.
>
> ### S3. No coverage of `Shift+Space` (page-up scroll on desktop browsers)
>
> ## SUMMARY
>
> One **critical** issue: `SCROLL_KEYS` is missing `PageUp`/`PageDown`/`Home`/`End` per the commit message. Two **important** issues around order-sensitivity of guards. Three **suggestions** about comment/code drift, `e.code` vs `e.key`, and missing test rows.

### type-design-analyzer

> ## Type: `SCROLL_KEYS` (file: `c:/Users/Andrew/Spem/index.ts:236-242`)
>
> ### Invariants identified
>
> - [A] Membership: each element should be a valid `KeyboardEvent.code` value.
> - [B] Scope: every member is a key whose browser default scrolls the page.
> - [C] Read-only: the set is constructed at module load and never mutated.
> - [D] Single source of truth: any key that needs `preventDefault` for scroll-suppression should appear here exactly once.
> - [E] Disjoint-with-shortcut policy: the set is consulted only on the `!metaKey && !ctrlKey` path.
>
> ### Ratings
>
> - **Encapsulation: 7/10** — `Set<string>` exposes the full mutating API. `ReadonlySet<string>` annotation would close the gap.
> - **Invariant Expression: 5/10** — the *type* says `Set<string>`; any string is admitted. There is no compile-time link between the set's members and the `e.code` literals used in the switch statements. A typo (`"Spcae"`) would compile and silently fail.
> - **Invariant Usefulness: 6/10** — the set captures the bug fix's intent. **But** the set is incomplete relative to the ticket description (PageUp/PageDown/Home/End absent).
> - **Invariant Enforcement: 6/10** — no enforcement that the set's members match the `case` labels in the switch below, nor that the codes are real DOM `code` values.
>
> ### Concerns
>
> **Important — ticket scope mismatch.** PageUp/PageDown/Home/End not in code. Either the set is incomplete or the scope was deliberately narrowed.
>
> **Important — `SCROLL_KEYS` is typed `Set<string>`.** The natural type is `ReadonlySet<KeyCode>` where `KeyCode` is the literal union of the actual members.
>
> **Suggestion — `isModifierSeek` duplicates membership logic.** Three sites hard-code the seek-key pair. A second small constant `SEEK_KEYS = new Set(["ArrowLeft", "ArrowRight"])` would dedupe.
>
> **Suggestion — `Set<string>` is overkill for five items.** Array + `.includes` + `as const` produces a literal-union type for free.
>
> **Suggestion — `dispatchKeydown` helper has a too-wide return type.**
>
> **Suggestion — `it.each` tuples are `string[][]` not `[KeyCode][]`.**
>
> ### Recommended improvements
>
> ```ts
> const SCROLL_KEYS = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"] as const;
> type ScrollKey = typeof SCROLL_KEYS[number];
> const SCROLL_KEY_SET: ReadonlySet<string> = new Set(SCROLL_KEYS);
> ```
>
> A literal union usable in the `case` labels closes the drift hole; `ReadonlySet` removes the mutation surface.

### comment-analyzer

> ## Summary
>
> Cycle 1 caught most drift but two pieces of residual drift remain — one factually wrong claim about historical behaviour, and one misleading reference to modifier keys that don't apply to the test.
>
> ## Critical Issues
>
> **[A] `c:/Users/Andrew/Spem/src/test/keyboard.test.ts:259-260` — incorrect claim about past behaviour**
>
> ```
> // Plain `/` (no Shift) is not a help-modal trigger; previously it was
> // silently swallowed which broke Firefox quick-find. Must pass through.
> ```
>
> Checked against `origin/main:index.ts` — plain `Slash` was never `preventDefault`'d. The "previously it was silently swallowed" claim is false.
>
> Suggestion: drop the historical sentence entirely. Replace with present-tense rationale only.
>
> **[B] `c:/Users/Andrew/Spem/src/test/keyboard.test.ts:207-209` — irrelevant Alt reference**
>
> ```
> // Cmd/Ctrl+Arrow is the "seek-by-section" handler — must preventDefault
> // so the OS shortcut (macOS jump-word on Cmd, Windows browser-back on
> // Alt; on the iPad path, Cmd is the modifier users press) doesn't fire.
> ```
>
> The bracketed test cases below cover `ctrlKey` and `metaKey` only — there is no `altKey` test. Worse, Alt is a meaningful modifier in this codebase (fine-grain bar seek). Dragging Alt into this comment misleads.
>
> ## Important
>
> **[C] `c:/Users/Andrew/Spem/index.ts:229-235` — "plain (no Cmd/Ctrl)" is ambiguous re: Alt**
>
> The word "plain" naturally reads as "no modifier at all", but the code treats Alt-held keys as "plain". Alt+ArrowLeft will be `preventDefault`'d.
>
> **[D] `c:/Users/Andrew/Spem/src/test/keyboard.test.ts:247-248` — Enter test description mis-attributes the contract**
>
> The assertion is correct (Enter is not `preventDefault`'d), but the rationale obscures a real side effect: pressing Enter on document with focus on a `<button>` ALSO triggers `controls.pause()/play()`.
>
> ## Suggestions
>
> **[E] `c:/Users/Andrew/Spem/index.ts:254-257` — Escape sentence documents pre-existing behaviour.**
>
> **[F] `c:/Users/Andrew/Spem/src/test/keyboard.test.ts:267-269` — Escape rationale doesn't fit the scenario.**
>
> **[G] `c:/Users/Andrew/Spem/src/test/keyboard.test.ts:173,191,199` — ticket reference in test name and headers.** Borderline.
>
> **[H] `c:/Users/Andrew/Spem/src/test/keyboard.test.ts:174-177` — "See #10 for the underlying bug" is a backwards reference.** Per the rule that comments referencing the past belong in the PR description, drop the last sentence.
>
> ## Positive findings
>
> - Present-tense rationale in `index.ts:271-275` is a good model.
> - The IME comment at `keyboard.test.ts:299-301` calls out the failure mode a future refactor would silently introduce.
> - The `SCROLL_KEYS` constant with attached comment block is well-placed.
>
> ## Was all drift caught from cycle 1?
>
> Partially. Two pieces remain: [A] factual error about historical behaviour; [B] off-topic modifier reference. Plus the softer "looking backward" breadcrumb at [H].
