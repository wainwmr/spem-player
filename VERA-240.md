# VERA-240 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-29 14:25 UTC
Last run:  2026-05-29 14:25 UTC

See also: [Original Report (cycle 1)](https://github.com/wainwmr/spem-player/issues/240#issuecomment-4575682447)

## Summary

[Placeholder — finalised at close-out.]

## Findings

### 240-01 — important — Held Cmd+Arrow auto-repeat is comment-only documented

> **type-design-analyzer 240-TD-03 + pr-test-analyzer I-NEW-B + comment-analyzer (rot-risk concern):**
>
> The new guard's WHY-comment claims "held Cmd+Arrow keeps auto-repeating its seek too — same intent on a different code path." This is accurate today (Cmd/Ctrl branch unconditionally returns at line 298, before the e.repeat guard at 309). But the invariant is asserted by a comment with no test coverage. A future edit that (a) moves the e.repeat guard above the modifier branch, or (b) adds `if (e.repeat) return;` inside the modifier branch, silently breaks held Cmd+Arrow seek with no test failure. The comment becomes a quiet lie.

**Bob's triage:** Real fragility. The runtime test is cheap (one dispatch, one assertion) and pins what the comment alone is currently carrying. Address now.

**Resolution:** Addressed in commit `efc79b0`.

### 240-02 — important — Held Digit/Letter shortcuts not covered

> **silent-failure-hunter F1 (MEDIUM) + pr-test-analyzer I-NEW-A (Severity 7/10):**
>
> The production comment explicitly names "repeated Digit/Letter would race the choir/part state" as the motivating example for the guard. But the test block exercises only Space, Enter, and ArrowDown for the suppression case. PRA empirically probed by changing the guard to exempt Digit/Letter (`!e.code.startsWith("Digit") && !e.code.startsWith("Key")`) — 35/35 still pass. A future refactor that narrowed the guard to "only Space/Enter" would slip through. Held `KeyD` would silently toggle dark-mode 30 times per second on key-hold.

**Bob's triage:** Real coverage gap on the exact case the comment claims to prevent. Two tests, same pattern as held-ArrowDown. Address now.

**Resolution:** Addressed in commit `efc79b0`.

### 240-03 — important — Guard expresses exemption as inverted denylist

> **silent-failure-hunter F1 + type-design-analyzer 240-TD-02 (MEDIUM):**
>
> The guard `if (e.repeat && e.code !== "ArrowLeft" && e.code !== "ArrowRight")` is an inverted denylist. The positive form ("if e.repeat and the code is not a seek key, return") matches the comment and the natural-language invariant; the current form requires De Morgan in the reader's head. SFH-1 separately recommends a named `REPEAT_EXEMPT_KEYS` Set mirroring `SCROLL_KEYS` — makes the default-deny posture self-documenting, gives future-add-a-key contributors a discoverable home for the exemption decision.

**Bob's triage:** Real readability/structure improvement. The `SCROLL_KEYS` precedent makes this consistent rather than novel. Pre-empts the WB #274 deferred SeekKey refactor too. Address now.

**Resolution:** Addressed in commit `efc79b0`.

### 240-04 — important — Comment rough edges: "documented", "30+/s", "race the choir/part state"

> **comment-analyzer (cluster of LOWs, but they aggregate):**
>
> (a) `src/test/keyboard.test.ts:363` — "documented fast-seek gesture" overclaims. No in-app documentation of hold-to-seek exists (`index.html:100` says only "LEFT / RIGHT - select bar").
> (b) `index.ts:302` — "30+ times a second" is OS-specific (Windows ~30/s, macOS ~15/s, user-configurable).
> (c) `index.ts:303` — "race the choir/part state" is half-true: `setChoir` is async (race is fair), but `setPart` is synchronous (no race, just flood).

**Bob's triage:** All three are minor but aggregate into a "this comment doesn't quite tell the truth" feel that erodes trust on a load-bearing block. Cheap to fix while in the area. Address now.

**Resolution:** Addressed in commit `efc79b0`.

### 240-05 — suggestion — Missing WHY-comment on `setTimeout(0)` yield pattern

> **comment-analyzer (LOW):**
>
> Five new tests use `await new Promise((resolve) => setTimeout(resolve, 0))` before each assertion. The idiom (yield microtask queue so async `setChoir` flushes) is non-obvious to a reader unfamiliar with async-in-jsdom. The existing tests at the top of the file don't use it. One short WHY-comment at the top of the new describe block: "the choir-change path goes through async `setChoir`; yield once so its attribute writes flush before asserting."

**Bob's triage:** Cheap, aligns with the file's existing comment habit (cf the IME-composition test's strong WHY at line 286). Address now.

**Resolution:** Addressed in commit `efc79b0`.

### 240-06 — important — Void-fix has no regression test (C1)

> **pr-test-analyzer C1 (Severity 6/10) + silent-failure-hunter F5 (LOW):**
>
> The void-fix on `index.ts:246` (`return keyboardTapped;` → `return;`) has no test. PRA verified empirically: reverting the change keeps 35/35 passing, and neither tsc nor eslint flag it. The fix is genuinely identical at runtime — event listeners discard return values. PRA explicit recommendation: **accept the gap, document in PR description as lint-tier. Do not invent a brittle test.**

**Bob's triage:** PRA's specialism, PRA's explicit guidance. Accept the gap. Note in PR description. Reject as test-finding; the production fix itself ships.

**Resolution:** Rejected. Documented as a lint-tier fix in the PR description rather than a behaviour fix. The runtime equivalence is exactly why no test would catch a future regression non-vacuously.

## Suggestions (noted; do not block the gate)

- **240-07** — Held Alt+ArrowRight (fine-seek by 0.0625 stride) untested. CRV obs 2 + PRA Q2 + TDA 240-TD-04. Pre-existing surface area not introduced by this PR; pattern would make the test trivial to add, but defer.
- **240-08** — Q1: held Space/Enter could seed `playing = true` for symmetric coverage. Low priority; current shape catches the actual regression.
- **240-09** — ArrowLeft/Right test fragility (event-bus indirection). SFH F2/F3. Tests catch the regression empirically — defer the structural cleanup.
- **240-10** — `index.ts:309` exception order (ArrowLeft first vs ArrowRight first). CMT trivial readability point. Skip.
- **240-11** — TDA 240-TD-01 (string-literal site count widens by 2) — already covered by WB #274 deferred HandledKeyCode/SeekKey refactor.
- **240-12** — TDA 240-TD-05 (test fixture coupling to recording shape) — pre-existing, deferred.
- **240-13** — TDA 240-TD-06 (`==` vs `!==` style mix at lines 313, 317) — pre-existing.
- **240-14** — SFH F4: guard policy ("default = noisy → suppress") not stated. Folded into 240-03's REPEAT_EXEMPT_KEYS naming.

**Positive notes:**

- All Original Report cached findings from WB #274 either addressed in this PR or rejected with reasoning. Vera bias-toward-running validated again — even a 15-line diff produced 4 important findings, 3 of which had test-empirically-confirmed regression paths.
- New tests pass loud on the right regressions (PRA verified 3 fail on guard-removed, 2 fail on exemption-removed).
- Describe block name `Auto-repeat (held-key) handling` is behavioural/DAMP.
- Comment-A CLAUDE.md compliance: zero `#240` references in test code.
