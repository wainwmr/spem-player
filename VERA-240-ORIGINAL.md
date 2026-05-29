# VERA-240 Original Report (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-29 14:20 UTC

See also: [Final Synthesis (cycle 1)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)

> Cycle 0 ran against a larger pre-rebase diff on 2026-05-28; not posted.
> Findings preserved in Workbench [#274](https://github.com/wainwright1000/spem-tools/issues/274).
> This cycle 1 runs on the post-#395-merge shrunk diff (15 lines in
> index.ts + 88 lines of tests).

## Raw agent reports (pass 1)

### code-reviewer

> The diff is correct, the placement of the guard is right, the comment is excellent, and the tests are well-targeted. No Critical findings, no Important findings. Three low-severity observations plus one explicit thumbs-up.
>
> **Obs 1 (low) — `index.ts:309`:** the guard uses `e.code !== "ArrowLeft" && e.code !== "ArrowRight"` rather than the SCROLL_KEYS pattern. That is the right call here — the exemption is about *seek*, not about scrolling; reusing SCROLL_KEYS would couple two unrelated concepts. Inlining is more honest than inventing a `SEEK_KEYS` set with only two members. Flagging only because a reviewer might reflexively suggest "extract a constant."
>
> **Obs 2 (low) — `index.ts:309` (Alt+Arrow nudge):** the fine-grained seek (`e.altKey` branch at lines 363/369) advances by 1/16 of a bar. With the new guard, holding Alt+ArrowRight will auto-repeat the 0.0625 nudge. That's almost certainly desirable but it's a behaviour change that wasn't called out in the comment or covered by the test suite. A third test covering held Alt+ArrowRight (5→5.0625) would pin the intended fine-seek-while-held behaviour against future regression. Not required.
>
> **Obs 3 (low) — `src/test/keyboard.test.ts:368-398` (test isolation):** the two arrow tests share state via the `music-controls` singleton (`controls.setAttribute("bar", "5")` then dispatch then read). Vitest runs `it` blocks sequentially within a describe and these two are independent of each other, so it's fine in practice. The only fragility is that if a future test inserts itself between dispatch and `await setTimeout(0)`'s `expect`, it could interleave. Hypothetical, not a defect.
>
> **Thumbs-up — `index.ts:301-308`:** the comment is doing real work and would be expensive to lose. Explains *why* (stutter, race) rather than restating what the code does. Calls out the Cmd/Ctrl+Arrow case explicitly, pre-empting a future reader. Says "same intent on a different code path" — design-level note that links two stanzas across a function. Keep. The void-fix on line 246 is straightforwardly correct — returning the function's own reference from an early-exit was nonsense and likely a paste artefact.
>
> **Tests are well-targeted.** The two arrow tests assert observed behaviour (bar advances) rather than mechanism (preventDefault called). The comment block at 362-367 explains why arrows assert bar-change rather than just defaultPrevented — load-bearing and pre-empts a future "simplify by collapsing to defaultPrevented" refactor.
>
> **Recommendation:** ship as-is. The three observations are all "nice to consider" not "must address". One cheap improvement: held Alt+ArrowRight test from Obs 2.

### pr-test-analyzer

> Empirically reverted each production change in turn. Five new tests fail loud on the right regressions (3 fail on guard-removed, 2 fail on exemption-removed). Tests are not vacuous.
>
> **C1 (Severity 6/10) — void-fix regression has no test guard.** `index.ts:246`. Reverted `return;` to `return keyboardTapped;`: 35/35 still pass. tsc and eslint don't flag it either. Runtime behaviour is genuinely identical (listener doesn't consume return value), so this is a lint-tier fix not a behaviour fix. **Recommendation: accept the gap, document in PR description as lint-tier. Do not invent a brittle test.**
>
> **I-NEW-A (Severity 7/10) — held Digit/Letter shortcuts not covered.** `src/test/keyboard.test.ts:313-400`. The production comment explicitly names "repeated Digit/Letter would race the choir/part state" as the motivating example, but the test block exercises only Space, Enter, ArrowDown for the suppression case. Probed by changing the guard to exempt Digit/Letter: 35/35 still pass. A future refactor that narrowed the guard would slip through. **Recommend adding held-Digit2 (does not change choir from seed) and held-KeyD (does not toggle dark mode) tests.** Cheap, same pattern.
>
> **I-NEW-B (Severity 5/10) — held Cmd/Ctrl+Arrow auto-repeat behaviour is intent-documented but not tested.** Production comment claims "held Cmd+Arrow keeps auto-repeating its seek too." That's the kind of subtle structural invariant (Cmd/Ctrl branch returns BEFORE the e.repeat guard) that a future reorder could break silently. **Recommend one test: set bar=5, dispatch `{code: "ArrowRight", ctrlKey: true, repeat: true}`, assert bar advanced.**
>
> **Q1 (3/10) — held Space/Enter assertions could be sharpened.** Tests seed `controls.playing = false` and assert isPlaying remains false. A regression that called `controls.pause()` unconditionally would also pass. More meaningful symmetry: seed `playing = true`, dispatch held Space, assert it stayed playing. Low-priority; current shape catches the actual regression.
>
> **Q2 (3/10) — held Alt+ArrowLeft/Right (sub-bar stride 0.0625) untested.** Pre-existing surface area; flagging only because the new test pattern would make adding a single `it.each` row trivial.
>
> **Q3 — `await new Promise(resolve => setTimeout(resolve, 0))` is the right idiom for this codebase.** No churn.
>
> **Positive:** I1 fully addressed (ArrowLeft/Right exemption tests assert bar actually advanced), I2 delivered (ArrowRight repeat-exemption covered), comment-A addressed (no `#240` in test titles), describe block name `Auto-repeat (held-key) handling` is DAMP and behavioural.
>
> **Recommended PR-level actions:** [A] held Digit + Letter tests (I-NEW-A), [B] held Cmd+ArrowRight test (I-NEW-B), [C] decide C1 — document as lint-tier in PR description.

### silent-failure-hunter

> No CRITICAL silent-failure paths introduced. Five findings.
>
> **1 (MEDIUM) — `index.ts:309` — auto-repeat guard silently swallows held Digit/Letter shortcuts, comment under-documents the surface.** WHY comment names Space, Digit and Letter, but the actual guard suppresses everything except ArrowLeft/Right. That includes Enter, Escape, Slash, KeyM, KeyV, KeyD, KeyF, KeyX. Some absolutely should be suppressed on repeat (KeyD repeating 30/s would strobe the page). Others — Escape in particular — have semantics where held arguably should still close a modal on every fire. The comment says "most shortcuts" but does not enumerate. A future contributor adds a new key handler and never thinks about the held-key case. **Recommend expanding the comment to state the default-deny posture explicitly, OR moving the exempt list into a named `REPEAT_EXEMPT_KEYS` Set that mirrors `SCROLL_KEYS` so the surface is self-documenting.**
>
> **2 (MEDIUM) — `src/test/keyboard.test.ts:368-398` — ArrowLeft/Right "is exempt and seeks backward/forward" assertions are coincidence-prone, not causal.** Pre-seed `controls.setAttribute("bar", "5")` then assert `controls.getAttribute("bar")` ends at 4 or 6. But the keyboard handler does not read the `bar` attribute on `music-controls` — it reads `current.bar` from the closure in index.ts. The attribute write goes through `MusicControls.setBar(5)` which fires `music-controls-changed`, which fires `handleControlChange`, which calls `setBar(Number(pos.bar))` in index.ts. The test may work but by an indirect detour through the event bus. **Recommend either dispatch event explicitly, or capture `before = Number(controls.getAttribute("bar"))` after the pre-seed and assert `after === before - 1` / `before + 1`.**
>
> **3 (MEDIUM) — `src/test/keyboard.test.ts:346-360` — held-ArrowDown "does not change choir" assertion is similarly coincidence-prone.** Same root cause as 2 for `current.choir`. The test catches the regression we care about but only because of an indirect path. Same recommendation.
>
> **4 (LOW) — `index.ts:309` — guard cannot distinguish "user wants the key repeated for accessibility" from "browser autorepeat storm".** Pre-existing. No way to tell from `e.repeat` alone. The guard hardcodes ArrowLeft/Right as exempt. That is the correct decision but it is a *policy* decision the comment does not explicitly own. **Recommend a one-liner: "If you add a new key, ask: is auto-repeat useful for this action, or just noisy? Default is noisy → suppress."**
>
> **5 (LOW) — `index.ts:245-246` — void-fix has no direct regression test.** The change is pure semantic correctness. Defensible omission — listeners discard return values. **Suggest a single test with `target: null` via Object.defineProperty assertion-not-throws, OR explicitly document "this return value is intentionally void."**
>
> **6 (INFO) — Cmd/Ctrl+ArrowUp/Down coverage** pre-existing, addressed by PR #395. **Pre-existing.**
>
> **7 (INFO) — held Cmd+Arrow auto-repeats are intentional, comment addresses this** — silent-failure B fully addressed in WHY comment.
>
> **8 (INFO) — held-Space `controls.isPlaying()` assertion DOES catch a regression.** Traced through the play mock + microtask resolve order; removing the e.repeat guard makes the handler call play() which sets `playing = true` which fails the assertion. Test is sound. Same for held-Enter.

### type-design-analyzer

> **240-TD-01 (low, within deferred scope) — `index.ts:309`.** The new guard adds a third and fourth string-literal site for "ArrowLeft"/"ArrowRight" in keyboardTapped (alongside ~5-6 existing sites). This is exactly the duplication WB #274 already flagged for the deferred HandledKeyCode union + SeekKey subset refactor. Widens existing tally by two sites. No new kind of type concern.
>
> **240-TD-02 (medium) — `index.ts:309`.** Guard expresses seek-exempt set as inverted denylist (`!== "ArrowLeft" && !== "ArrowRight"`) rather than the positive SeekKey subset. The positive form ("if e.repeat and code is not a seek key, return") matches the comment and the natural-language invariant. Current form requires the reader to invert De Morgan in their head. When the deferred SeekKey subset lands, this becomes `if (e.repeat && !SEEK_KEYS.has(e.code)) return;`. Until then, denylist form is a candidate for the same "small literal set used inverted" smell.
>
> **240-TD-03 (medium — invariant — undocumented coupling) — `index.ts:309` vs `285-299`.** Guard relies on implicit ordering invariant: must sit AFTER the metaKey/ctrlKey branch (which returns unconditionally) so that held Cmd/Ctrl+Arrow continues to auto-repeat its seek. Comment at 305-308 acknowledges this but the invariant is enforced only by line order, not by structure. If a future edit hoists the e.repeat guard above the modifier branch, OR removes the unconditional return at 298, held Cmd+Arrow silently stops fast-seeking with no test failure — existing held-arrow tests dispatch without metaKey/ctrlKey. **Recommendation: add one test that dispatches `{code: "ArrowRight", ctrlKey: true, repeat: true, bubbles: true}` and asserts the bar advanced — pins the invariant the comment is currently carrying alone.**
>
> **240-TD-04 (low — invariant — silent permissiveness).** Exemption is keyed on `e.code` alone, not `e.altKey`. Non-repeat path at 363/369 treats Alt+Arrow as a finer seek (±0.0625). Holding Alt+ArrowLeft currently fast-seeks at fine granularity — likely intended, but unspecified anywhere. Worth a sentence in the comment block.
>
> **240-TD-05 (low — test invariant — reliance on a magic neighbour).** Seek-exempt tests assert bar moves from "5" to "4"/"6". Assumes bars 4, 5, 6 exist and seek is integer-step on plain Arrow. If a future fixture shrinks the recording or moves starting bar near boundary, tests fail for reasons unrelated to the guard. Low priority — consistent with surrounding test style.
>
> **240-TD-06 (very low — style).** Lines 313, 317 use `==` while new guard at 309 uses `!==`. Pre-existing inconsistency.
>
> **Summary:** The new guard does not introduce new type-design concerns beyond WB #274. Substantive finding is 240-TD-03: the new code path carries an implicit ordering invariant about held Cmd+Arrow asserted only in a comment with no test coverage — a cheap test would lock it down.

### comment-analyzer

> Both new comment blocks well-positioned, well-aimed at non-obvious decisions, broadly accurate. Two factual rough edges, one nit on durability, one observation about surrounding code.
>
> **No ticket-number references in code — clean against CLAUDE.md guidance. No restated-code comments. No TODOs/FIXMEs introduced.**
>
> **LOW — `src/test/keyboard.test.ts:363` — "documented fast-seek gesture" overclaims.** The in-app help (`index.html:100`) documents `LEFT / RIGHT - select bar` and says nothing about holding-to-seek. No other user-facing documentation. The word "documented" is aspirational. **Suggestion: drop "documented" OR add the help-text entry.**
>
> **LOW — `index.ts:303` — "race the choir/part state" is half-true.** `setChoir` (line 110) is async — race is fair. `setPart` (line 129) is synchronous and re-entrant-safe — no race, just flood of redundant attribute writes. **Suggestion: soften to "thrash the choir/part state (and setChoir is async, so the writes can interleave)" — or leave; not load-bearing.**
>
> **LOW — `index.ts:306-308` — "Cmd+Arrow keeps auto-repeating its seek too" is correct but fragile.** Accurate today, but the claim is fragile to refactors:
> 1. Someone moves the e.repeat guard above the modifier branch
> 2. Someone adds `if (e.repeat) return;` inside the modifier branch
>
> Either change silently invalidates the last three lines of the comment without producing a test failure. **Two options: trim the comment, OR add a test that asserts held Cmd+ArrowRight still advances by section. Recommend the durable option — pins the claim to a runtime check.**
>
> **LOW — `index.ts:302-303` — "30+ times a second" is unverifiable concrete number.** Browser key-repeat depends on OS (Windows ~30/s, macOS ~15/s, user-configurable). **Optional: soften to "tens of times" or "many times".**
>
> **LOW — `src/test/keyboard.test.ts:326, 342, 358, 380, 396` — `await new Promise(setTimeout, 0)` pattern is repeated five times with no explanation.** This idiom (yield microtask queue) is non-obvious to readers unfamiliar with async-in-jsdom. **Suggestion: one short WHY-comment at the top of the describe block: "the choir-change path goes through async setChoir; yield once so its attribute writes flush before asserting."**
>
> **LOW — `index.ts:309` — order of exceptions.** Trivial readability: ArrowRight is almost certainly more common gesture (scrubbing forwards). If the comment is being rewritten this is a chance to flip the order. Skip if not touching.
>
> **Positive findings:**
> - `index.ts:301-308` — production comment correctly positioned and aimed. Explains why, why exceptions, why test order matters.
> - `src/test/keyboard.test.ts:362-367` — test comment explains intentional asymmetry between "nothing changed" and "bar moved by 1" assertions. Right comment in right place.
> - Stylistic consistency — WHY-focused, no ticket refs, em-dash continuation matches surrounding blocks.
