# Bugs, Hacks, and Technical Debt Register

This document is the canonical register of all known bugs, hacks, todos, and architectural debt in the Spem Player codebase. It is populated during Phase 1 (Discovery) and updated through Phase 2 (Assessment), Phase 3 (Specification), and Phase 4 (Implementation Planning).

Process document: `TECH_DEBT.md`

## Item Count

- Total items: 32
- Completed: 1
- Open: 31

## Awaiting Input from Mark

The following items cannot be fully specified without clarification from
Mark Wainwright:

- **TODO-UI-001**: Should clicking on the score also select the voice part
  (in addition to setting the bar)?
- **TODO-UI-003**: What visual effect should be used to highlight false
  relations, and how are they defined in this context?
- **TODO-UI-006**: Should the currently selected voice part be highlighted
  on the SVG score? If so, what style (colour, opacity, underline)?
- **TODO-UI-007**: Where do the lyrics come from (LilyPond source,
  separate file, or need to be added), and how should they be displayed?

## Items

### TODO-UI-001

- **Type**: TODO
- **Area**: UI
- **Status**: assessed
- **Priority**: P2
- **Difficulty**: M
- **Source file**: `index.ts`
- **Source line**: 44
- **First seen**: 2024-04-19 (fcbf6163)
- **Raw text**: "TODO: click on score should send you to bar.  And part?"
- **Description**: The score is already clickable (scoreClicked exists in MusicScore.ts) but only sets the bar, not the part. Clicking on a specific staff or voice part could also select that part.
- **PD required**: ask-mark
- **Recommended fix**: (pending Specification)
- **Test plan**: (pending Specification)
- **Dependencies**: (pending Specification)
- **Notes**: Requires mapping click Y-coordinate to voice part within the SVG. Mark may have a preference for whether part selection from score clicks is desirable.

### TODO-UI-002

- **Type**: TODO
- **Area**: UI
- **Status**: specified
- **Priority**: P3
- **Difficulty**: XS
- **Source file**: `index.ts`
- **Source line**: 45
- **First seen**: 2024-04-19 (fcbf6163)
- **Raw text**: "TODO: Change dark mode to moon/sun icons"
- **Description**: Replace the current dark mode toggle icon with moon/sun icons for clearer visual affordance.
- **PD required**: none
- **Recommended fix**: Create or source two minimal SVG icons (sun for light mode, moon for dark). Replace the current toggle button content in `index.html` with an `<svg>` element whose `href` or inner markup swaps based on `document.documentElement.classList.contains('dark')`. Update the click handler in `index.ts` to toggle the icon alongside the theme. Add `aria-label="Toggle dark mode"` and `role="img"`.
- **Test plan**: Playwright visual regression: screenshot the header in both modes and assert the correct icon is rendered. Assert `aria-label` is present.
- **Dependencies**: None
- **Notes**: Pure design task. Keep SVGs under 1KB each.

### TODO-UI-003

- **Type**: TODO
- **Area**: UI
- **Status**: assessed
- **Priority**: P2
- **Difficulty**: L
- **Source file**: `index.ts`
- **Source line**: 46
- **First seen**: 2024-04-19 (fcbf6163)
- **Raw text**: "TODO: Visual effect for false relations"
- **Description**: Highlight false relations (specific dissonant harmonic intervals) in the score or canvas with a visual effect. Requires detecting false relations from the parsed note data.
- **PD required**: ask-mark
- **Recommended fix**: (pending Specification)
- **Test plan**: (pending Specification)
- **Dependencies**: (pending Specification)
- **Notes**: Needs music theory domain knowledge to implement detection correctly. Ask Mark for definition of false relations in this context.

### TODO-UI-004

- **Type**: TODO
- **Area**: UI
- **Status**: specified
- **Priority**: P3
- **Difficulty**: XS
- **Source file**: `index.ts`
- **Source line**: 47
- **First seen**: 2024-04-19 (fcbf6163)
- **Raw text**: "TODO: Better font/graphic for Spem Player title"
- **Description**: Improve the title graphic or font used for "Spem Player" in the header.
- **PD required**: none
- **Recommended fix**: Source a suitable web font (e.g., Cormorant Garamond or EB Garamond for historical resonance) and self-host a WOFF2 subset containing only "Spem Player". Replace the `<h1>` text with a styled `<span>` using the font. Use `font-display: swap` to prevent layout shift.
- **Test plan**: Lighthouse audit to confirm LCP is not regressed. Visual check at multiple viewport widths.
- **Dependencies**: None
- **Notes**: Alternatively, use an SVG text lockup if font loading is problematic.

### BUG-SCORE-001

- **Type**: BUG
- **Area**: SCORE
- **Status**: specified
- **Priority**: P2
- **Difficulty**: XS
- **Source file**: `index.ts`
- **Source line**: 48
- **First seen**: 2024-04-19 (fcbf6163)
- **Raw text**: "BUG: can scroll up and down a tiny bit in score"
- **Description**: The music-score element allows slight vertical scrolling. Likely caused by the SVG container or flex layout not constraining overflow precisely after the splitter sets the height.
- **PD required**: repro
- **Recommended fix**: Add `overflow-y: hidden` to the `music-score` element or its immediate container. Alternatively, ensure the splitter sets an exact integer height (e.g., `Math.floor(newHeight)`) to prevent sub-pixel overflow causing a scrollbar.
- **Test plan**: Use Playwright to render the page at common viewport sizes and assert `scrollHeight === clientHeight` for the score container, confirming no vertical overflow.
- **Dependencies**: None
- **Notes**: The comment notes this disappears after manual height adjustment, suggesting flex: 1 initialisation is involved.

### BUG-SCORE-002

- **Type**: BUG
- **Area**: SCORE
- **Status**: specified
- **Priority**: P1
- **Difficulty**: S
- **Source file**: `index.ts`
- **Source line**: 49
- **First seen**: 2024-04-19 (fcbf6163)
- **Raw text**: "BUG: [Violation] Forced reflow while executing JavaScript took 36ms  (this doesn't happen when you have already manually adjusted the height of the score - something to do with the flex: 1 after the reload?)"
- **Description**: During initial load, JavaScript forces a layout recalculation costing 36ms. The comment indicates this is related to flex layout initialisation and does not occur after manual height adjustment. Likely caused by reading layout properties (offsetHeight, getBoundingClientRect) before the DOM has settled, or by setting styles that trigger synchronous layout.
- **PD required**: repro
- **Recommended fix**: Use Chrome DevTools Performance profiling to identify the exact line causing the forced reflow. Likely culprits are `getBoundingClientRect()` in MusicCanvas or `this.svg.getScreenCTM()` in MusicScore during connectedCallback. Defer layout-dependent initialisation using `requestAnimationFrame` or `ResizeObserver`. For MusicCanvas, defer `#calculateCanvasSize()` until after first paint. For MusicScore, defer `getBars()` or cache SVG dimensions.
- **Test plan**: Use Playwright to capture a Chrome Performance trace during initial load and assert no `[Violation] Forced reflow` warnings appear in the console. Verify that layout-dependent features (canvas sizing, bar highlighting, score scrolling) still function correctly after deferral.
- **Dependencies**: None
- **Notes**: The Performance trace will pinpoint the exact line before any code change is made.

### TODO-BUILD-001

- **Type**: TODO
- **Area**: BUILD
- **Status**: specified
- **Priority**: P3
- **Difficulty**: L
- **Source file**: `index.ts`
- **Source line**: 50
- **First seen**: 2024-04-24 (ce3d97f7)
- **Raw text**: `TODO: build: minimse SVGs using <use> and <defs> elements`
- **Description**: Post-process the LilyPond-generated SVGs to deduplicate repeated elements (clefs, noteheads, etc.) using SVG `<use>` and `<defs>`, reducing file size and network transfer.
- **PD required**: spike
- **Recommended fix**: Treat as a spike. Write a Node.js script (`scripts/dedupe-svgs.js`) that parses LilyPond SVGs with `cheerio` or `jsdom`, identifies repeated `<path>` elements by `d` attribute, moves them into a shared `<defs>` block, and replaces occurrences with `<use href="#id">`. Run it on one choir SVG and measure size reduction. If reduction is <20% or transforms break rendering, abandon as not worth the complexity.
- **Test plan**: Compare `du -b` before and after. Render before/after in a headless browser and pixel-diff to verify no visual regression.
- **Dependencies**: None
- **Notes**: LilyPond applies unique transforms to nearly every element, so deduplication may be ineffective. The spike should be time-boxed to 2 hours.

### TODO-BUILD-002

- **Type**: TODO
- **Area**: BUILD
- **Status**: specified
- **Priority**: P2
- **Difficulty**: M
- **Source file**: `index.ts`
- **Source line**: 51
- **First seen**: 2024-04-24 (ce3d97f7)
- **Raw text**: "TODO: build: generate SVG from lilypond as part of build process"
- **Description**: Integrate LilyPond SVG generation into the Vite build pipeline so `npm run build` automatically regenerates scores from source, rather than requiring a separate manual step.
- **PD required**: none
- **Recommended fix**: Create a Node.js pre-build script (`scripts/build-scores.js`) that runs `lilypond --svg` for each score and strips `height`/`width` attributes using a cross-platform regex instead of `sed`. Wire it into `vite.config.ts` via the `buildStart` hook or as an `npm run prebuild` step called before Vite. Cache outputs by comparing `.ly` file mtimes to avoid unnecessary rebuilds.
- **Test plan**: Delete `src/scores/` and run `npm run build`; assert SVGs are regenerated. Verify the build fails gracefully with a clear error if LilyPond is not on PATH.
- **Dependencies**: None
- **Notes**: The existing `buildAllScores.sh` can be ported almost verbatim to Node.js. Mark has already installed LilyPond 2.24.4 locally.

### TODO-UI-005

- **Type**: TODO
- **Area**: UI
- **Status**: specified
- **Priority**: P2
- **Difficulty**: XS
- **Source file**: `index.ts`
- **Source line**: 52
- **First seen**: 2024-04-19 (fcbf6163)
- **Raw text**: "TODO: CMD-B to type in bar number"
- **Description**: Add a keyboard shortcut (Cmd/Ctrl+B) that opens a prompt or input field allowing the user to type a bar number and jump directly to it.
- **PD required**: none
- **Recommended fix**: Add a `case 'b':` (with `e.ctrlKey || e.metaKey`) to `keyboardTapped()` in `index.ts`. Guard with the existing `isComposing` and input-focus checks. Use `window.prompt('Jump to bar (0–139):')`, validate with `Number.isInteger()` and range check against `config.maxBar`, then dispatch a `music-controls-changed` event with the new bar. Close prompt on `Escape` or invalid input.
- **Test plan**: Add tests in `src/test/keyboard.test.ts`: (1) Ctrl+B opens prompt mock, (2) valid bar number dispatches event, (3) out-of-range input is rejected, (4) prompt is blocked when an input is focused.
- **Dependencies**: None
- **Notes**: Ensure the prompt does not steal focus from the audio playback context.

### TODO-UI-006

- **Type**: TODO
- **Area**: UI
- **Status**: assessed
- **Priority**: P2
- **Difficulty**: M
- **Source file**: `index.ts`
- **Source line**: 53
- **First seen**: 2024-04-19 (fcbf6163)
- **Raw text**: "TODO: highlight part on score?"
- **Description**: When a specific voice part is selected (e.g., Soprano), highlight that part's staff or notes in the displayed SVG score.
- **PD required**: ask-mark
- **Recommended fix**: (pending Specification)
- **Test plan**: (pending Specification)
- **Dependencies**: (pending Specification)
- **Notes**: Requires identifying part-specific SVG elements. Mark may have a preference for highlight style (colour, opacity, underline).

### TODO-UI-007

- **Type**: TODO
- **Area**: UI
- **Status**: assessed
- **Priority**: P3
- **Difficulty**: M
- **Source file**: `index.ts`
- **Source line**: 54
- **First seen**: 2024-04-19 (e1d8a72f)
- **Raw text**: "TODO: Add lyrics to footer"
- **Description**: Display the lyrics (Latin text of Spem in alium) in the footer area, synchronised with the current bar or scrollable.
- **PD required**: ask-mark
- **Recommended fix**: (pending Specification)
- **Test plan**: (pending Specification)
- **Dependencies**: (pending Specification)
- **Notes**: Source of lyrics unknown (may be in LilyPond source, separate file, or needs to be added). Ask Mark for lyric source and desired display format.

### BUG-CANVAS-001

- **Type**: BUG
- **Area**: CANVAS
- **Status**: specified
- **Priority**: P1
- **Difficulty**: S
- **Source file**: `index.ts`
- **Source line**: 55
- **First seen**: 2025-09-11 (e7ec6425)
- **Raw text**: "BUG: loop() never finishes after playing to the end of spem"
- **Description**: The MusicCanvas animation loop (play() -> requestAnimationFrame(loop)) continues firing after audio playback reaches the end of the piece. This suggests the audio ended event either does not set playing=false promptly, or there is a race condition where draw() or another callback re-triggers the loop.
- **PD required**: test-gap
- **Recommended fix**: Add an `ended` event listener to the Audio element in MusicControls that sets `playing = false`, updates UI icons, and fires `music-controls-paused`. In MusicCanvas, listen for `music-controls-paused` to cancel any pending `requestAnimationFrame`. Store the rAF request ID in both components so it can be cancelled explicitly.
- **Test plan**: Mock the Audio element, dispatch an `ended` event, and verify that (a) `playing` becomes false, (b) `music-controls-paused` is fired, and (c) no further `requestAnimationFrame` callbacks occur for either MusicControls or MusicCanvas.
- **Dependencies**: None
- **Notes**: The fix addresses both the controls loop and the canvas loop. MusicControls currently has no `ended` listener at all.

### TODO-UI-008

- **Type**: TODO
- **Area**: UI
- **Status**: done
- **Priority**: unassigned
- **Difficulty**: unassigned
- **Source file**: `index.ts`
- **Source line**: 56
- **First seen**: 2026-04-29 (37e3ba12)
- **Raw text**: "TODO: Add the space bar as a play/pause toggle (but only if not focused on an input field, and not if composing text for chinese characters)"
- **Description**: Space bar handler added to keyboardTapped() with guards for input/select/textarea focus and e.isComposing.
- **PD required**: none
- **Recommended fix**: Already implemented in index.ts; tests added in src/test/keyboard.test.ts.
- **Test plan**: 4 tests covering body focus toggle and blocked input focus.
- **Dependencies**: None.
- **Notes**: Full suite passed (37 tests). See session_notes.md for details.

### BUG-UI-001

- **Type**: BUG
- **Area**: UI
- **Status**: specified
- **Priority**: P3
- **Difficulty**: XS
- **Source file**: `src/scss/style.scss`
- **Source line**: 279
- **Raw text**: "BUG: looks ugly when Bar wraps to next line"
- **Description**: The footer uses flex-wrap: wrap. On narrow viewports the Bar label and input in music-controls wrap to a second line, breaking the intended single-row footer layout.
- **PD required**: repro
- **Recommended fix**: Add `white-space: nowrap` to the `.bar-control` wrapper in `style.scss`. If the footer becomes horizontally scrollable on very narrow screens, add `flex-shrink: 0` to the label and `min-width: 0` to the input container.
- **Test plan**: Playwright: render at 375px and 320px widths. Assert the Bar label and input remain on a single line. Assert no horizontal scrollbar appears in the footer.
- **Dependencies**: None
- **Notes**: One-line CSS fix. Check that `nowrap` does not clip the input on the smallest supported viewport.

### HACK-LILY-001

- **Type**: HACK
- **Area**: LILY
- **Status**: specified
- **Priority**: P2
- **Difficulty**: XS
- **Source file**: `src/ts/lily.ts`
- **Source line**: 123
- **First seen**: 2024-04-23 (48d1ecfa)
- **Raw text**: "HACK: we're ignoring the denominator altogether.  Let's hope it's not there"
- **Description**: The fraction parser in the Ohm grammar only extracts the numerator, ignoring any denominator. This works for current LilyPond input but will silently produce wrong durations if a true fraction like "3/4" appears.
- **PD required**: none
- **Recommended fix**: Update the Ohm grammar `fraction` rule to capture both numerator and denominator (`fraction = digit+ ("/" digit+)?`). Update the `fraction` semantic action in `lily.ts` to return a ratio object `{num, den}` or a float. Update `Duration` to accept a multiplier ratio instead of a single integer.
- **Test plan**: Add parser tests for "3/4", "1/2", and plain "2" (no denominator). Assert resulting Duration multiplier is 0.75, 0.5, and 2 respectively.
- **Dependencies**: None
- **Notes**: Requires updating both the Ohm grammar (ly-grammar.ohm) and the fraction semantic action in lily.ts.

### TODO-CONFIG-001

- **Type**: TODO
- **Area**: CONFIG
- **Status**: specified
- **Priority**: P2
- **Difficulty**: S
- **Source file**: `src/ts/common.ts`
- **Source line**: 63
- **First seen**: 2024-05-08 (1dc3fc50)
- **Raw text**: "TODO: Need to use config to load the hues for each choir"
- **Description**: Choir colour hues are currently loaded from CSS custom properties (`--color-c1` to `--color-c8`). The comment suggests moving hue definitions into `config.ts` so they are centralised and theming is data-driven.
- **PD required**: none
- **Recommended fix**: Add a `choirHues: number[]` array to `config.ts` (8 values, 0–360). Update `common.ts` `colors()` to read `config.choirHues` instead of CSS custom properties. Keep CSS custom properties as a runtime override for advanced theming, but default to config values when CSS variables are missing.
- **Test plan**: Test `colors()` returns expected HSL strings for all 8 choirs when CSS custom properties are absent. Test that CSS custom properties still override config when present.
- **Dependencies**: None
- **Notes**: Resolves the root cause of HACK-CONFIG-002 (ARGH console log) because `colors()` will no longer depend on stylesheet load timing.

### HACK-CONFIG-001

- **Type**: HACK
- **Area**: CONFIG
- **Status**: specified
- **Priority**: P2
- **Difficulty**: S
- **Source file**: `src/ts/common.ts`
- **Source line**: 78
- **First seen**: 2024-05-08 (d3d89a81)
- **Raw text**: "HACK: needs to be time of a 64th note"
- **Description**: `HDSQTIME = 0.05` is a magic constant representing the duration of a 64th note (hemidemisemiquaver) in seconds. It is used for rounding in `toNum()`. It should be derived from the tempo configuration rather than hard-coded, so it remains correct if tempo changes.
- **PD required**: none
- **Recommended fix**: Calculate from tempo: `HDSQTIME = 60 / (tempo_BPM * 16)` where 16 is the number of 64th notes in a quarter note. Expose this as a function or derive it from the `config.bartime` / `config.barno` arrays at load time.
- **Test plan**: Test `toNum()` with known inputs at different tempos. Assert that HDSQTIME scales inversely with BPM. Test that rounding behaviour is consistent across tempo changes.
- **Dependencies**: None
- **Notes**: Used in bar/time quantisation. Incorrect value could cause subtle sync drift.

### HACK-CONFIG-002

- **Type**: HACK
- **Area**: CONFIG
- **Status**: specified
- **Priority**: P2
- **Difficulty**: XS
- **Source file**: `src/ts/common.ts`
- **Source line**: 56
- **First seen**: 2024-05-09 (74c07308)
- **Raw text**: `console.log("ARGH")`
- **Description**: When CSS custom properties are not available (e.g., in jsdom tests or before stylesheet loads), `colors()` logs "ARGH" and returns default colours. This debug statement pollutes test output and browser consoles. It should be removed or replaced with a proper warning.
- **PD required**: none
- **Recommended fix**: Delete the `console.log("ARGH")` line in `common.ts` `colors()`. If a warning is genuinely needed for missing CSS custom properties, replace it with a single-fire `console.warn` guarded by `typeof window !== 'undefined' && process.env.NODE_ENV !== 'test'`.
- **Test plan**: Run `npm run coverage` and assert zero "ARGH" strings in stdout/stderr. Verify `colors()` still returns sensible defaults when called in jsdom (where CSS variables are absent).
- **Dependencies**: None
- **Notes**: This is a one-line deletion. If TODO-CONFIG-001 is implemented first, this hack becomes moot because `colors()` will source from config.

### BUG-CONFIG-001

- **Type**: BUG
- **Area**: CONFIG
- **Status**: specified
- **Priority**: P1
- **Difficulty**: S
- **Source file**: `src/ts/common.ts`
- **Source line**: 86
- **First seen**: 2025-09-16 (edb3624c)
- **Raw text**: (documented in AGENTS.md) "The `getBarFromTime` / `getTimeFromBar` tempo calculation may fail at boundaries if `bartime`/`barno` arrays are out of sync."
- **Description**: Both getBarFromTime and getTimeFromBar use interval-based linear interpolation. At exact boundary values (where t equals a bartime entry or b equals a barno entry), the strict inequality checks can miss the correct segment and return the fallback value 0. Additionally, there is no bounds checking for array length mismatch or accessing index+1 beyond the array.
- **PD required**: test-gap
- **Recommended fix**: Change strict inequalities to inclusive ones (`>=` and `<=`). Add explicit bounds checks: if input is before the first element return the first mapped value; if after the last element return the last mapped value. Add a debug-mode assertion that `bartime[v]` and `barno[v]` arrays have equal length. Consider replacing the linear scan with binary search for clarity and performance.
- **Test plan**: Test exact boundary values (t equals every bartime entry, b equals every barno entry). Test out-of-range values (t < 0, t > max, b < 0, b > 139). Test with intentionally mismatched array lengths to verify assertion fires. Compare interpolated values against known correct pairs.
- **Dependencies**: None
- **Notes**: No inline comment in source; issue surfaced in AGENTS.md.

### HACK-CANVAS-001

- **Type**: HACK
- **Area**: CANVAS
- **Status**: specified
- **Priority**: P2
- **Difficulty**: M
- **Source file**: `src/ts/MusicCanvas.ts`
- **Source line**: 17
- **First seen**: 2024-05-06 (5eabce67)
- **Raw text**: "HACK: bad name and data type"
- **Description**: `dict: Dictionary[][]` has a vague name and an opaque nested-array type. It stores note data indexed by quantised bar position, but the type signature does not make this clear.
- **PD required**: none
- **Recommended fix**: Rename to `notesByQuant` or similar and replace `Dictionary[][]` with a `Map<number, NoteEvent[]>` or a typed array interface. Document that the key is a quantised bar position (bar * 16) and the value is an array of note events with choir, part, and note details.
- **Test plan**: Verify existing canvas tests still pass after renaming. Add a type-level test (TypeScript compilation) to ensure the new type is used consistently.
- **Dependencies**: HACK-CANVAS-003
- **Notes**: Refactoring this is easier if processLilypond() returns a structured object rather than mutating a global.

### HACK-CANVAS-002

- **Type**: HACK
- **Area**: CANVAS
- **Status**: specified
- **Priority**: P2
- **Difficulty**: M
- **Source file**: `src/ts/MusicCanvas.ts`
- **Source line**: 18
- **First seen**: 2024-05-06 (5eabce67)
- **Raw text**: "HACK: bad data type"
- **Description**: `ranges: Range[][][]` is a deeply nested array type representing singing ranges per choir per part. The triple-nested array is hard to reason about and lacks semantic naming.
- **PD required**: none
- **Recommended fix**: Replace with `Map<string, Range>` where the key is `"choir-part"` (e.g., "0-2"), or define a proper class `SingingRange` with methods `get(choir, part)`. Update `draw()` to use the new interface.
- **Test plan**: Verify canvas tests pass after refactoring. Add tests that verify every choir/part combination has a defined range.
- **Dependencies**: HACK-CANVAS-003
- **Notes**: Same structural issue as HACK-CANVAS-001. Both should be refactored together.

### HACK-CANVAS-003

- **Type**: HACK
- **Area**: CANVAS
- **Status**: specified
- **Priority**: P2
- **Difficulty**: M
- **Source file**: `src/ts/MusicCanvas.ts`
- **Source line**: 68
- **First seen**: 2024-05-10 (39877893)
- **Raw text**: "HACK: can't these just be returned from processLilypond()?"
- **Description**: `processLilypond()` mutates global variables `dict` and `ranges` instead of returning them as a structured result. This makes the function impure, harder to test, and creates hidden coupling between lily.ts and MusicCanvas.
- **PD required**: none
- **Recommended fix**: Change `processLilypond()` to return `{notesByQuant, singingRanges}` (or better names). Remove the global `dict` and `ranges` exports from `lily.ts`. Update `MusicCanvas.#init()` to destructure the return value. Update any tests that relied on the global exports.
- **Test plan**: Verify `spem.test.ts` and `canvas.test.ts` pass after refactoring. Add a unit test that calls `processLilypond()` and asserts the returned object contains expected keys and data types.
- **Dependencies**: None
- **Notes**: Refactoring this unlocks fixes for HACK-CANVAS-001 and HACK-CANVAS-002. Do this first.

### HACK-CANVAS-004

- **Type**: HACK
- **Area**: CANVAS
- **Status**: specified
- **Priority**: P3
- **Difficulty**: XS
- **Source file**: `src/ts/MusicCanvas.ts`
- **Source line**: 163
- **First seen**: 2024-05-10 (9abaa133)
- **Raw text**: "HACK: throttle"
- **Description**: The draw() loop uses a crude throttle (`secondsPassed < 0.01 return`) to limit frame rate. requestAnimationFrame already fires at display refresh rate; the throttle adds unnecessary complexity and can cause frame drops.
- **PD required**: none
- **Recommended fix**: Remove the `if (secondsPassed < 0.01) return` guard in `MusicCanvas.draw()`. `requestAnimationFrame` already caps at display refresh rate. If profiling reveals frame drops on low-end hardware, reintroduce delta-time smoothing instead of a crude throttle.
- **Test plan**: Profile `draw()` call frequency during playback using `performance.now()` in a test stub. Assert it is called at roughly 60fps (±5fps). Assert canvas animation remains smooth after removal.
- **Dependencies**: None
- **Notes**: Deletion is the correct first step. Only add complexity back if there is measurable evidence of a problem.

### BUG-CANVAS-002

- **Type**: BUG
- **Area**: CANVAS
- **Status**: specified
- **Priority**: P2
- **Difficulty**: XS
- **Source file**: `src/ts/MusicCanvas.ts`
- **Source line**: 285
- **First seen**: 2024-05-06 (5eabce67)
- **Raw text**: "BUG: what happens if you click in the canvas padding?"
- **Description**: Clicks within the 5px canvas padding area produce incorrect position calculations in getMousePos(). If offsetY < canvasPadding, y becomes negative, which can yield invalid part values. The bar calculation also does not account for horizontal padding.
- **PD required**: test-gap
- **Recommended fix**: In `#getMousePos`, clamp `e.offsetX` and `e.offsetY` to the drawable area before calculating position: `const drawableX = Math.max(canvasPadding, Math.min(offsetX, rect.width - canvasPadding))` and similarly for Y. Use the clamped values in the choir/part/bar formulae.
- **Test plan**: Unit tests for `#getMousePos` simulating clicks at all padding corners, edges, and centre. Assert choir is in [0,7], part is in [0,4], and bar is in [0,139] for every input.
- **Dependencies**: None
- **Notes**: Edge case. Normal user clicks are likely inside the drawable area, but touch events or mis-clicks could hit the padding.

### TODO-CANVAS-001

- **Type**: TODO
- **Area**: CANVAS
- **Status**: specified
- **Priority**: P3
- **Difficulty**: XS
- **Source file**: `src/ts/MusicCanvas.ts`
- **Source line**: 304
- **First seen**: 2024-05-06 (5eabce67)
- **Raw text**: "TODO: combine canvasClicked and Hovered?"
- **Description**: `canvasClicked` and `canvasHovered` share logic (`getMousePos`, `moveToPosition`). They could be refactored into a single handler or a shared helper to reduce duplication.
- **PD required**: none
- **Recommended fix**: Extract shared logic into a private `#updateFromMouse(event: MouseEvent, action: 'click' | 'hover')` method in `MusicCanvas.ts`. It computes `{choir, part, bar}` from `getMousePos()`, validates bounds, and returns the position. `canvasClicked` calls it with `'click'` and dispatches `music-canvas-click`. `canvasHovered` calls it with `'hover'` and updates `music-canvas-watcher` attributes.
- **Test plan**: Refactor and verify all existing canvas tests pass. Add a unit test for `#updateFromMouse` simulating a click at a known coordinate and asserting the correct position object is returned.
- **Dependencies**: None
- **Notes**: Keep the public method signatures unchanged to avoid breaking callers.

### HACK-UI-001

- **Type**: HACK
- **Area**: UI
- **Status**: specified
- **Priority**: P2
- **Difficulty**: XS
- **Source file**: `src/ts/MusicControls.ts`
- **Source line**: 95
- **First seen**: 2024-05-10 (cd62154c)
- **Raw text**: "HACK : 138"
- **Description**: The bar input field has its max attribute hard-coded to 138. Config defines 140 bars (0-139), so the maximum should be 139 and derived from config to avoid drift.
- **PD required**: none
- **Recommended fix**: In `MusicControls.ts`, replace `this.barinput.setAttribute("max", "138")` with `this.barinput.setAttribute("max", String(config.barno[0].length - 1))` (or expose `config.maxBar = 139`). Ensure the min attribute is set to `"0"` explicitly.
- **Test plan**: Unit test that `barinput.max === "139"` after construction. Test that entering 139 is accepted and 140 is rejected by the browser's native range validation.
- **Dependencies**: None
- **Notes**: One-line change. Best done alongside any other MusicControls refactors to avoid churn.

### HACK-SCORE-001

- **Type**: HACK
- **Area**: SCORE
- **Status**: specified
- **Priority**: P2
- **Difficulty**: XS
- **Source file**: `src/ts/MusicScore.ts`
- **Source line**: 30
- **First seen**: 2024-05-10 (634d4dfd)
- **Raw text**: "HACK: hard-coded!"
- **Description**: The highlight position indicator width is hard-coded to 7px. It should be calculated from the SVG viewBox or bar spacing so it scales correctly with different SVG sizes.
- **PD required**: none
- **Recommended fix**: Calculate width from bar spacing after `getBars()` runs. Use `this.bars[1] - this.bars[0]` (first bar width) or a fixed proportion of `svgWidth / 140` bars. Set dynamically in `setBar()` or `#loadScore()` rather than in `connectedCallback`.
- **Test plan**: Mock SVG with different viewBox widths and verify highlight width scales proportionally. Test with multiple choirs (different SVG files may have different dimensions).
- **Dependencies**: None
- **Notes**: (none)

### HACK-SCORE-002

- **Type**: HACK
- **Area**: SCORE
- **Status**: specified
- **Priority**: P2
- **Difficulty**: XS
- **Source file**: `src/ts/MusicScore.ts`
- **Source line**: 31
- **First seen**: 2024-05-10 (634d4dfd)
- **Raw text**: "HACK: need to calc actual height of SVG"
- **Description**: The highlight position rectangle height is hard-coded to 200px. It should derive its height from the loaded SVG viewBox height.
- **PD required**: none
- **Recommended fix**: After loading the SVG in `#loadScore()`, parse the viewBox height (`Number(viewBoxString.split(" ")[3])`) and call `this.highlightPosition.setAttribute("height", svgHeight)`.
- **Test plan**: Mock SVG elements with varying viewBox heights and assert highlightPosition height matches each time.
- **Dependencies**: None
- **Notes**: (none)

### HACK-SCORE-003

- **Type**: HACK
- **Area**: SCORE
- **Status**: specified
- **Priority**: P2
- **Difficulty**: XS
- **Source file**: `src/ts/MusicScore.ts`
- **Source line**: 39
- **First seen**: 2024-05-10 (634d4dfd)
- **Raw text**: "HACK: need to calc actual height of SVG"
- **Description**: The highlight bar rectangle height is hard-coded to 200px. Same root cause as HACK-SCORE-002: should derive from SVG viewBox height.
- **PD required**: none
- **Recommended fix**: Apply the same fix as HACK-SCORE-002. Extract a private helper `#setHighlightHeight(svgHeight: number)` that updates both `highlightPosition` and `highlightBar` heights, called from `#loadScore()`.
- **Test plan**: Same as HACK-SCORE-002. A single test can verify both elements are updated.
- **Dependencies**: HACK-SCORE-002
- **Notes**: Fix both together.

### HACK-TEST-001

- **Type**: HACK
- **Area**: TEST
- **Status**: specified
- **Priority**: P3
- **Difficulty**: XS
- **Source file**: `src/test/score.test.ts`
- **Source line**: 6
- **First seen**: 2024-05-24 (b209c71e)
- **Raw text**: "HACK: duplicated with controls.test.ts"
- **Description**: The `waitForEvent` helper function is duplicated between `score.test.ts` and `controls.test.ts`. It should be extracted to a shared test utility module.
- **PD required**: none
- **Recommended fix**: Create `src/test/helpers.ts`, move `waitForEvent` there, and update imports in `score.test.ts` and `controls.test.ts` to `import { waitForEvent } from './helpers'`. If other shared utilities exist (e.g., DOM setup helpers), move them too.
- **Test plan**: Run full test suite. Verify `score.test.ts` and `controls.test.ts` still pass. Add a trivial test in `helpers.test.ts` that asserts `waitForEvent` resolves when the event fires.
- **Dependencies**: None
- **Notes**: Future test files should import shared utilities from `helpers.ts` rather than duplicating them.

### TODO-BUILD-003

- **Type**: TODO
- **Area**: BUILD
- **Status**: specified
- **Priority**: P3
- **Difficulty**: XS
- **Source file**: `index.html`
- **Source line**: 124
- **First seen**: 2024-03-14 (a6c8e292)
- **Raw text**: "TODO: Needs auto-increasing version somehow"
- **Description**: The version string in index.html is hard-coded. It should be injected automatically from package.json during build to prevent version drift (already noted as BUILD-001).
- **PD required**: none
- **Recommended fix**: Add `define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version) }` to `vite.config.ts`. Replace the hard-coded version in `index.html` with `<script>document.getElementById('version').textContent = __APP_VERSION__;</script>` (or use a build-time HTML plugin). Delete the TODO comment in `index.ts`.
- **Test plan**: Run `npm run build` and assert `dist/index.html` contains the version string from `package.json`. Test that `__APP_VERSION__` is defined in the built bundle.
- **Dependencies**: BUILD-001
- **Notes**: Resolving BUILD-001 closes this item automatically.

### BUILD-001

- **Type**: BUILD
- **Area**: BUILD
- **Status**: specified
- **Priority**: P3
- **Difficulty**: XS
- **Source file**: `package.json` / `index.html`
- **Source line**: n/a
- **First seen**: 2024-03-14 (a6c8e292 for index.html version tag; package.json version added earlier)
- **Raw text**: (documented in AGENTS.md and BUILD.md) "package.json declares version 2.0.0; index.html displays 2.1.0"
- **Description**: Version number is manually maintained in two places (package.json and index.html) and has drifted (2.0.0 vs 2.1.0). Should be auto-injected during build.
- **PD required**: none
- **Recommended fix**: Add `define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version) }` to `vite.config.ts`. Replace the hard-coded version span in `index.html` with a `<span id="version"></span>` and a small inline script that sets `textContent = __APP_VERSION__`. Remove the TODO-BUILD-003 comment from `index.ts`.
- **Test plan**: Run `npm run build` and assert `dist/index.html` contains the exact version string from `package.json`. Add a Playwright test that reads `#version` textContent and asserts it matches a semver regex.
- **Dependencies**: None
- **Notes**: Resolving this closes TODO-BUILD-003. Align package.json and index.html version strings as part of the same commit.

## Implementation Roadmap

### Batch 1: Config Centralisation

- **Items**: HACK-CONFIG-002, TODO-CONFIG-001, HACK-CONFIG-001, HACK-UI-001, BUG-CONFIG-001
- **Theme**: Move magic values into `config.ts` and fix boundary bugs.
- **Risk**: Low. All changes are data-driven or defensive checks; no UI behaviour changes.
- **Rollback**: Revert single commit.
- **Dependencies**: None.

### Batch 2: Canvas Interaction & Loop

- **Items**: BUG-CANVAS-001, HACK-CANVAS-004, BUG-CANVAS-002, TODO-CANVAS-001
- **Theme**: Fix the animation loop and canvas click handling.
- **Risk**: Low–medium. BUG-CANVAS-001 adds an `ended` event listener; if mishandled, playback might stop prematurely.
- **Rollback**: Revert single commit.
- **Dependencies**: None.

### Batch 3: Score Display Fixes

- **Items**: BUG-SCORE-002, BUG-SCORE-001, HACK-SCORE-001, HACK-SCORE-002, HACK-SCORE-003, BUG-UI-001
- **Theme**: Eliminate forced reflow on load and hard-coded SVG highlight dimensions.
- **Risk**: Low. CSS and SVG attribute changes; visual regression tests cover the risk.
- **Rollback**: Revert single commit.
- **Dependencies**: None.

### Batch 4: Canvas Architecture

- **Items**: HACK-CANVAS-003, HACK-CANVAS-001, HACK-CANVAS-002
- **Theme**: Refactor `processLilypond()` to return values instead of mutating globals, then fix the data types in `MusicCanvas`.
- **Risk**: Medium. Changes the interface between `lily.ts` and `MusicCanvas`; tests must verify canvas rendering still works.
- **Rollback**: Revert single commit.
- **Dependencies**: None (can be done in parallel with Batch 2, but doing it after reduces cognitive load).

### Batch 5: Build, Version & Grammar

- **Items**: BUILD-001, TODO-BUILD-003, HACK-TEST-001, TODO-BUILD-002, HACK-LILY-001, TODO-BUILD-001
- **Theme**: Auto-inject version, deduplicate test helpers, integrate LilyPond into the build pipeline, and fix the fraction grammar.
- **Risk**: Low–medium. TODO-BUILD-002 touches the build pipeline; if it breaks, `npm run build` fails.
- **Rollback**: Revert single commit.
- **Dependencies**: None.

### Batch 6: UI Enhancements

- **Items**: TODO-UI-005, TODO-UI-002, TODO-UI-004
- **Theme**: Keyboard shortcut, dark mode icons, title font.
- **Risk**: Low. All additive features with existing patterns.
- **Rollback**: Revert single commit.
- **Dependencies**: None.

### Architectural Trade-off

**Batch 4 (Canvas Architecture)** is the only non-incremental proposal. It changes `processLilypond()` from a side-effecting function to a pure return function, which ripples into `MusicCanvas` and `lily.ts` tests. The payoff is fixing three items in one commit instead of three separate, conflicting refactors. It is kept as a standalone batch so it can be reviewed and reverted independently.

### Ordering Rationale

1. **Batch 1** first because it establishes config-driven patterns other batches can reuse.
2. **Batch 2** next because BUG-CANVAS-001 is P1 and wastes CPU after playback ends.
3. **Batch 3** next because BUG-SCORE-002 is P1 and affects initial load performance.
4. **Batch 4** after Batch 2 so the simpler canvas fixes are already stable before the refactor.
5. **Batch 5** can land anytime; it is build-side only.
6. **Batch 6** last because it is lowest priority (P3 features).
