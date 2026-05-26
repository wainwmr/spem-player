# VERA-375 Original Report (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-27 00:37

See also: [Final Synthesis (cycle 1)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)

## Raw agent reports (pass 1)

### code-reviewer

> **Verdict: clean.**
>
> The change is correct and the comment is accurate.
>
> - **Correctness.** `MusicCanvasWatcher.connectedCallback` only does `document.querySelectorAll("music-canvas")` and binds a `music-canvas-hover` listener — it does not touch any MusicCanvas API or instance state. `handleCanvasHover` reads `e.detail.position`, which every test supplies synthetically. An unupgraded `<music-canvas>` element is still a valid `EventTarget`, so `dispatchEvent` and listener attachment work identically. Empirically: 7/7 tests pass.
> - **Comment accuracy.** "synthetic detail objects" matches the test bodies. The "~500-700ms per test" and "~7s file" figures match the commit message. "unupgraded HTMLElement" is the correct term.
> - **Convention.** `darkmode.test.ts`, `feedback.test.ts`, `keyboard.test.ts`, `setbar.test.ts` all import `MusicCanvasWatcher` without importing `MusicCanvas` while still using `<music-canvas>` in DOM fixtures — i.e. the "tag-name-only target, no upgrade" pattern is already established project convention. `MusicElement.define` swallows duplicate registrations, so even tests that *do* still call `MusicCanvas.define` coexist safely.
>
> No critical, important, or suggestion findings. Ship it.

### pr-test-analyzer

> **Verdict: clean, ship it.**
>
> The 7 tests do not rely on any real MusicCanvas behaviour: they all construct synthetic `CustomEvent`s and dispatch directly on the unupgraded `<music-canvas>` element. Every assertion targets the watcher's own state. The watcher's `querySelectorAll("music-canvas")` is a pure tag-name match in jsdom and works on both upgraded and unupgraded elements.
>
> No coverage gap. The "real MusicCanvas actually fires `music-canvas-hover`" contract is already covered by `src/test/canvas.test.ts:173` ("canvas mousemove fires music-canvas-hover event"), so the watcher tests are correctly scoped to the watcher only.
>
> Fake-timer/jsdom-version brittleness risk is low: `vi.useFakeTimers()` + `vi.advanceTimersByTime` is a stable Vitest API independent of jsdom's timer implementation.
>
> One suggestion (non-blocking): the file still relies on the literal `"music-canvas"` selector. If `MusicCanvasWatcher.ts` ever changes that selector, the tests will silently stop attaching the listener and still pass the connection-shape assertions but fail the hover assertions — loud failure mode, no fix needed.

### silent-failure-hunter

> **Overall: clean with two suggestions worth recording.**
>
> Vitest defaults to per-file isolation (fresh jsdom + module graph per file) and the project's `vite.config.ts` does not override `isolate`/`pool`, so `<music-canvas>` is genuinely unupgraded inside `canvaswatcher.test.ts`'s jsdom regardless of what other test files do. The speedup is real for both isolated runs and full-suite runs. The synthetic event shape matches `MusicElement.fireEvent`'s production output, so it is a faithful stand-in.
>
> **1. Severity: suggestion.** Hand-rolled synthetic event shape `{ detail: { position: {...} } }` is decoupled from `MusicElement.fireEvent`. If the production canvas ever changes its event payload, production breaks but these tests stay green because they fabricate the old shape. Pre-existing risk, not worsened by this PR, but worth calling out in the in-file comment so future maintainers keep the synthetic shape in sync.
>
> Fix: extend the comment with "If `MusicElement.fireEvent` changes the detail shape, update the synthetic events below to match — they are a manual mirror, not a derived value."
>
> **2. Severity: suggestion.** The unupgraded element is strictly safer for the assertions made here but strictly less representative as an integration testbed. Today the watcher reads nothing off the canvas object — only `e.detail.position` — so no current load-bearing upgrade. This is a unit test, not an integration test, and the file should not pretend otherwise.
>
> Fix: rename or comment the describe block (e.g. `describe("MusicCanvasWatcher custom element (unit, synthetic canvas events)", ...)`) so debuggers know this file will NOT catch a watcher/canvas integration regression and look elsewhere (canvas.test.ts / e2e).
>
> **3. Severity: suggestion (out of scope).** `MusicElement.define` swallows all errors from `customElements.define` with an empty catch and a "may already be defined" comment. This pattern would also hide a genuine name collision, a malformed-tag error, or any other DOMException. The PR doesn't touch this code, but its premise — that selectively not calling `define` saves time — exposes how easily a missing `define` slips by silently. Worth a follow-up ticket.

### type-design-analyzer

> Type check passes clean.
>
> 1. Removing `MusicCanvas` import — no TS/lint impact. `noUnusedLocals`/`@typescript-eslint/no-unused-vars` would only have complained if `MusicCanvas` were left unused; removing it is the correct response. No shape inference depends on it. `tsc --noEmit` clean.
> 2. `<music-canvas>` as unupgraded element — correctly typed. `document.querySelector("music-canvas")` returns `Element | null` (no custom `HTMLElementTagNameMap` entry registers `MusicCanvas` for the tag globally). jsdom treats unknown tags as plain `HTMLElement`. No type narrowing was lost.
>
> Nothing of substance — the surface is genuinely tiny and the change is clean. The explanatory comment is appropriately load-bearing (documents *why* the seemingly-missing `define` is intentional), which prevents a future contributor from "fixing" it and re-introducing the 7s test slowdown.
>
> Recommend: approve and merge.

### comment-analyzer

> **1. suggestion** — `src/test/canvaswatcher.test.ts:7` — "~500-700ms per test from the canvas's connectedCallback (the previous behaviour that made this file take ~7s)". Per-test arithmetic is fine (7 × ~770ms ≈ 5.4s of the ~5.4s delta from 6.85s to 1.48s), but the commit message attributes most of the cost to `processLilypond()` inside `MusicCanvas.#init()` (per Kimi's re-spec, "~0.8-1.5s per test"). Suggest tightening to "from `MusicCanvas`'s async `#init` (processLilypond)" so the next reader doesn't grep `connectedCallback` and find only the small synchronous body. Not blocking.
>
> **2. important** — PR body should record the root-cause delta. The ticket title and body both say "fake-timer leak"; Kimi's re-spec comment doubles down with the jsdom/thread story. Anyone reading the ticket in a year, or grepping for "fake timers," will reach for the wrong explanation. Recommend the PR body explicitly states: ticket diagnosis (fake timers / jsdom thread) was wrong; real cause was `MusicCanvas`'s async `connectedCallback` (`#init` → `processLilypond`) firing on every `beforeEach` DOM reset; fix is to skip upgrading the canvas in this suite. Then close #375 with a comment pointing at the PR rather than letting the stale spec linger.
>
> **3. suggestion** — Ticket comment on #375 also references Ticket #376 (processLilypond overhead). Worth a one-line note in the PR or on #376 confirming this PR effectively absorbs that cost for this suite (the canvas is no longer instantiated here), so #376 doesn't need to count this file when re-scoped.
>
> No other test file or doc references the "fake-timer leak" framing. No stale comments downstream.
