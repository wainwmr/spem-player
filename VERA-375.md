# VERA-375 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-27 00:37
Last run:  2026-05-27 00:37

See also: [Original Report (cycle 1)](https://github.com/wainwmr/spem-player/issues/375#issuecomment-4549934822)

## Summary

[Placeholder — finalised at close-out.]

## Findings

### 375-01 — important — PR body should record the root-cause delta

> **comment-analyzer pass 1 finding 2 — `src/test/canvaswatcher.test.ts`, PR description:**
> The ticket title and body both say "fake-timer leak"; Kimi's re-spec comment doubles down with the jsdom/thread story. Anyone reading the ticket in a year, or grepping for "fake timers," will reach for the wrong explanation. Recommend the PR body explicitly states: ticket diagnosis (fake timers / jsdom thread) was wrong; real cause was `MusicCanvas`'s async `connectedCallback` (`#init` → `processLilypond`) firing on every `beforeEach` DOM reset; fix is to skip upgrading the canvas in this suite.

**Bob's triage:** the ticket's diagnosis is misleading and would mislead future readers. The PR body is the right place to capture the delta — it'll appear above the merged commit message. Address at PR-open time.

**Resolution:** [open — addressed in PR body when `gh pr create` runs]

### 375-02 — suggestion — In-file comment under-attributes the cost to `connectedCallback`

> **comment-analyzer pass 1 finding 1 — `src/test/canvaswatcher.test.ts:7`:**
> Per-test arithmetic is fine (7 × ~770ms ≈ 5.4s delta), but the commit message attributes most of the cost to `processLilypond()` inside `MusicCanvas.#init()` (per Kimi's re-spec, "~0.8-1.5s per test"). Suggest tightening to "from `MusicCanvas`'s async `#init` (processLilypond)" so the next reader doesn't grep `connectedCallback` and find only the small synchronous body.

**Bob's triage:** accurate point. The async `#init` is where the cost sits. Cheap to tighten. Address now.

**Resolution:** [open]

### 375-03 — suggestion — Synthetic event detail shape should be flagged as a manual mirror

> **silent-failure-hunter pass 1 finding 1 — `src/test/canvaswatcher.test.ts:37-39, 59-61, 73-75, 89-91, 104-106, 119-121`:**
> The hand-rolled `{ detail: { position: {...} } }` is decoupled from `MusicElement.fireEvent`. If production canvas ever changes its event payload, production breaks but tests stay green because they fabricate the old shape. Pre-existing risk, not worsened by this PR.
>
> Fix: extend the comment to add "If `MusicElement.fireEvent` changes the detail shape, update the synthetic events below to match — they are a manual mirror, not a derived value."

**Bob's triage:** the synthetic-event contract is implicit and could rot silently. One-line comment addition keeps future maintainers honest. Address now.

**Resolution:** [open]

### 375-04 — suggestion — `describe` block should flag the unit-vs-integration scope

> **silent-failure-hunter pass 1 finding 2 — `src/test/canvaswatcher.test.ts` whole file:**
> Today the watcher reads nothing off the canvas object — only `e.detail.position` — so the unupgraded stand-in is correct for unit testing. But this file should not pretend to be an integration test. Rename the describe block (e.g. `describe("MusicCanvasWatcher custom element (unit, synthetic canvas events)", ...)`) so debuggers know this file will NOT catch watcher/canvas integration regressions.

**Bob's triage:** improves debugger guidance with a few characters. Address now.

**Resolution:** [open]

### 375-05 — suggestion (out of scope) — `MusicElement.define` swallows all DOMException

> **silent-failure-hunter pass 1 finding 3 — `src/ts/MusicElement.ts:103-110`:**
> The empty catch in `define()` hides any DOMException, not just `NotSupportedError` from a duplicate define. The PR's premise — that selectively not calling `define` saves time — exposes how easily a missing `define` slips by silently.
>
> Fix: out of scope. Narrow the catch to `e instanceof DOMException && e.name === "NotSupportedError"`, or check `customElements.get(tag)` first. File a follow-up ticket.

**Bob's triage:** out of scope for this PR. File as a Spem board ticket.

**Resolution:** [open — file Spem ticket]

### 375-06 — suggestion — Cross-reference Item #376 (processLilypond overhead) in PR body

> **comment-analyzer pass 1 finding 3 — PR body / `wainwmr/spem-player#376`:**
> This PR effectively absorbs `processLilypond`'s per-test cost for this suite (the canvas is no longer instantiated here). Worth a one-line note in the PR body or on #376 so #376 doesn't need to count this file when re-scoped.

**Bob's triage:** zero-cost cross-reference, helps the future #376 scope. Address in PR body when opening.

**Resolution:** [open — addressed in PR body]
