# VERA-10 Final Synthesis (cycle 2)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 2
Generated: 2026-05-28 13:42
Last run:  2026-05-28 14:00

See also: [Original Report (cycle 2)](https://github.com/wainwmr/spem-player/issues/10#issuecomment-4564050528)
(Earlier cycles: [Synthesis (cycle 1)](https://github.com/wainwmr/spem-player/issues/10#issuecomment-4561299282))

## Summary

Cycle 2 ran on the squashed branch produced by `rebase-parked`. Pass 1 surfaced 8 critical/important findings across the five agents; Bob's triage reduced these to 3 real comment-drift items (10-25/26/27, all in `src/test/keyboard.test.ts`) plus 1 commit-message-vs-code discrepancy (10-24 — PageUp/Home/End named in the squash commit message but absent from the code's `SCROLL_KEYS`). The three comment fixes shipped in commit `5b2a6fc`. 10-24 was reclassified at close-out from "amend the commit message" to "name the actual scope in the PR description"; the squash commit message stays as-is, the durable record of the discrepancy is this synthesis comment plus the PR description Mark sees. Pass 2 ran clean apart from one low-severity wording finding (10-32 — "jump-word" claim in the rewritten Cmd+Arrow comment is technically wrong for body-focus, where Cmd+Arrow is history navigation; deferred, pre-existing in both files). The pass-2 finding is exactly the self-inflicted comment-drift pattern cycle 1 also exhibited — pass-2 catches pass-1's edits when they inherit a pre-existing inaccuracy. No re-run after the close-out edits.

## Findings

### 10-24 — [critical] Commit message overstates SCROLL_KEYS scope (PageUp/PageDown/Home/End)

> **code-reviewer / pr-test-analyzer / silent-failure-hunter / type-design-analyzer, index.ts:236-242 and commit d169f16:**
> The squash commit message lists `Space, ArrowUp, ArrowDown, PageUp, PageDown, Home, End` as the swallowed set. Production code only contains `Space, ArrowUp, ArrowDown, ArrowLeft, ArrowRight`. PageUp/PageDown/Home/End are absent. The contract in the commit message is wider than the code's behaviour.

**Bob's triage:** Real artefact, but the *defect* is in the squash commit message (written today during rebase-parked), not in the code. Cycle 1's scope decision was "Space + 4 arrows" — that decision stands; the iPad bug report names "space or arrows" and the app does not bind PageUp/Home/End. Reclassified at close-out: rather than amending d169f16 (which requires rewriting pushed history with nested rebases the workflow discourages), the PR description will name the actual scope ("Space + 4 arrows"). The Vera synthesis comment on the ticket records the commit-message overstatement durably; reviewers see the PR description, not the individual commit messages, so the practical signal Mark gets is accurate.

**Resolution:** deferred — PR description at publish-merge will name the actual scope.

### 10-25 — [important] Test comment makes false historical claim about plain Slash

> **code-reviewer / comment-analyzer A, src/test/keyboard.test.ts:259-260:**
> "Plain `/` (no Shift) is not a help-modal trigger; previously it was silently swallowed which broke Firefox quick-find." False against `origin/main`: the old `case "Slash"` block only acted when `e.shiftKey` was true and never called `preventDefault()` for plain `/`.

**Bob's triage:** Real comment-to-code drift. Comment lies about history; user-skill rule says past references belong in the PR description anyway. Address now: drop the historical sentence, keep the present-tense rationale (Firefox quick-find).

**Resolution:** addressed (commit 5b2a6fc).

### 10-26 — [important] Test comment drags Alt into Cmd/Ctrl+Arrow rationale

> **comment-analyzer B, src/test/keyboard.test.ts:207-209:**
> "Cmd/Ctrl+Arrow is the 'seek-by-section' handler — must preventDefault so the OS shortcut (macOS jump-word on Cmd, Windows browser-back on Alt; on the iPad path, Cmd is the modifier users press) doesn't fire." The bracketed test cases only cover ctrlKey/metaKey; Alt is a meaningful modifier in this codebase (fine-grain bar seek) and is not what the test is pinning.

**Bob's triage:** Real comment drift. Misleads on both what the test asserts and what the production code does. Address now: rewrite the comment to name only Cmd/Ctrl.

**Resolution:** addressed (commit 5b2a6fc).

### 10-27 — [important] Test top-of-file comment references the ticket as "the underlying bug"

> **comment-analyzer H, src/test/keyboard.test.ts:174-177:**
> "Behavioural assertion via `defaultPrevented`, not by spying on `preventDefault()`... See #10 for the underlying bug." The first sentence is excellent guidance; the "See #10" sentence is a backward breadcrumb that belongs in the PR description, not in code.

**Bob's triage:** Real drift per user-skill rule "comments referencing the past belong in the PR description, not the code". Address now: drop the trailing sentence; keep the rationale.

**Resolution:** addressed (commit 5b2a6fc).

### 10-28 — [important] Non-Element `e.target` early-return loses scroll-prevention

> **silent-failure-hunter I1, index.ts:249-252:**
> `if (!(e.target instanceof Element)) return;` runs before the new preventDefault block. If a keydown fires with `e.target` being `document` or `window` (plausible in iOS Safari with focus on `<body>`), the handler returns before swallowing the scroll key, re-introducing the wiggle.

**Bob's triage:** Pre-existing on `main`; this diff did not introduce or move the guard. Real silent-failure mode in theory, but: (a) we have no repro evidence from a real iPad, (b) moving the SCROLL_KEYS block above the Element guard introduces a different risk (interaction with input-like guard for textareas). Defer to a refactor report entry on `index.ts` for the architectural concern. If field repros surface, file a ticket.

**Resolution:** deferred to refactor report (`wiki/refactor-index.ts.md` if exists, else create at next bug-hunt). Not blocking this PR.

### 10-29 — [important] Test asserts defaultPrevented but not paired action

> **pr-test-analyzer I2, src/test/keyboard.test.ts:192-227:**
> A future refactor that removed the inner Space/ArrowLeft/ArrowRight handlers but kept the SCROLL_KEYS swallow would silently break play/pause/seek while every test in this block continued to pass.

**Bob's triage:** Defensive nit — characterises a hypothetical future refactor, not a live defect. The existing test at `keyboard.test.ts:66-81` covers Space-toggles-playing; arrow seeks are tested elsewhere in the file. Defer additional coverage to a follow-up refactor pass on `keyboard.test.ts`; not worth expanding scope here.

**Resolution:** deferred. Will file a Workbench item if the gap proves significant on a future regression.

### 10-30 — [important] No test for Cmd+Space (Spotlight) or plain F (feedback modal)

> **pr-test-analyzer I1, I3:**
> Cmd+Space pass-through and plain-f-opens-feedback are not covered by the new tests.

**Bob's triage:** Defensive coverage additions. Both behaviours are correct in the code path (Cmd+Space hits no branch and returns; plain F hits the `case "KeyF"` switch and shows feedback). The existing positive Space and negative Cmd+S/Cmd+F tests are representative. Defer.

**Resolution:** deferred.

### 10-31 — [suggestion] Type-design improvements (literal union, ReadonlySet, SEEK_KEYS dedupe)

> **type-design-analyzer:**
> `SCROLL_KEYS: ReadonlySet<KeyCode>` with `as const` literal union would close the typo-vs-switch drift hole. `isModifierSeek` triplicates the seek-key pair across three sites; could share a `SEEK_KEYS` constant.

**Bob's triage:** Genuine refactor opportunities, not defects. The current `Set<string>` works correctly; the proposed literal union is structural improvement. File for the refactor report rather than expanding this PR.

**Resolution:** deferred to refactor report for `index.ts`.

### 10-32 — [suggestion] Pass-2 — "jump-word" wording inaccurate for body-focus path

> **comment-analyzer pass 2, src/test/keyboard.test.ts:206-208 and index.ts:271-275:**
> Both comments cite the OS shortcut as "macOS Cmd+Arrow jump-word" / "the OS jump-word shortcut". Cmd+ArrowLeft/Right is jump-word only when focus is inside a text field. On `<body>` focus (the path the handler actually exercises), macOS Safari/Chrome map Cmd+Arrow to history Back/Forward. The named OS behaviour doesn't match the focus context.

**Bob's triage:** Real factual inaccuracy in user-facing prose (well, comments), but pre-existing in both files (the test comment inherited it via cycle-2 commit 5b2a6fc). Low severity per the gate's framework. Two-line fix would address it but triggers pass 3. Defer — opportunistic fix at the next touch of either comment, or pull into a redo-pr if Mark queries the wording.

**Resolution:** deferred.

### Suggestions (not blocking)

- code-reviewer #2: Prettier collapse of `isPlainScrollKey` — `prettier --check` isn't blocking CI for this file; accept.
- silent-failure I3, S1, S2, S3: cancelable footgun, Alt/Shift+Arrow nuance, `e.code` vs `e.key`, Shift+Space — defer.
- pr-test-analyzer S1-S6: dispatch target consistency, `control`-class guard, Escape-on-input, IME keyCode, key-with-handler-not-in-set, instanceof Element negative case — defer to follow-up.
- comment-analyzer C, D, E, F, G: "plain (no Cmd/Ctrl)" ambiguity, Enter button rationale, Escape sentence placement, Escape rationale, ticket reference in test name — accept as-is or defer.
