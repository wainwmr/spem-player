# VERA-298 Review Checklist
Mode: work
Generated: 2026-05-24 16:00
Last run:  2026-05-24 16:00

## Findings

### 298-01 — [critical] hPosMask is not stripped from clef overlay clone
Agent: code-reviewer + pr-test-analyzer + silent-failure-hunter + type-design-analyzer
File: src/ts/MusicScore.ts:418 (selector); :201 (mask prepend)
Status: open
Notes: `#createClefOverlay()` calls `this.svg.cloneNode(true)` and then strips
`#hPos, #hBar, #hPart, #part-dim-style` from the clone. The new
`<mask id="hPosMask">` is NOT in the strip list, so the cloned overlay
contains a duplicate `id="hPosMask"` element — an HTML/SVG spec violation
that makes `url(#hPosMask)` lookups behaviourally unstable across browsers.
Fix: add `#hPosMask` to the selector at line 418.

### 298-02 — [important] highlightMask children accessed by positional index
Agent: code-reviewer + pr-test-analyzer + silent-failure-hunter + type-design-analyzer
File: src/ts/MusicScore.ts:193, 197, 275, 276, 280
Status: open
Notes: The mask's child rect and line are referenced as
`this.highlightMask.children[0]` and `[1]`. Order is fixed by the two
`appendChild` calls at lines 74-75, but any reorder/insertion silently
breaks the five call sites. `.children[i]` returns `Element`, losing
SVGRectElement/SVGLineElement typing.
Fix: declare named class fields (`maskRect: SVGRectElement`,
`maskLine: SVGLineElement`) and use them throughout.

### 298-03 — [important] Mask rect width hardcoded to 7, decoupled from indicatorWidth
Agent: code-reviewer + type-design-analyzer
File: src/ts/MusicScore.ts:62
Status: open
Notes: `maskRect.setAttribute("width", "7")` is a magic number. The
indicator's width is `svgWidth / 600` (line 211). For modern scores
≈3, so the 7-unit mask is wider and works by accident. For wider
SVGs (e.g. early score), `svgWidth/600` may exceed 7 and the mask
would clip the right side of the playhead. Resurrects the exact
magic `7` that PR #112 worked to eliminate.
Fix: compute the mask width from the same source as the indicator,
e.g. set it alongside `indicatorWidth` in `#loadScore()` (line ~211).

### 298-04 — [important] #drawBarHighlight guard misaligned with new centring at boundary
Agent: silent-failure-hunter
File: src/ts/MusicCanvas.ts:341
Status: open
Notes: Guard `if (this.bar <= 0 || this.bar > barCount) return;` was
correct when drawing at `bar * barWidth`. New code draws at
`(bar + 0.5) * barWidth`, so at `bar === barCount` the playhead
renders half a bar beyond the music area into right padding
(~14px). Visually benign because music has ended, but the guard
is inconsistent with the new draw.
Fix: align guard with new draw, e.g. `if (this.bar < 1 || this.bar > barCount) return;`
or document the intent.

### 298-05 — [important] No test coverage for centring or mask behaviour
Agent: pr-test-analyzer
Files: src/test/canvas.test.ts, src/test/score.test.ts
Status: open
Notes: The diff adds three behavioural changes with no direct tests:
(a) canvas playhead shifted by `+0.5 * barWidth`,
(b) `<mask id="hPosMask">` added to SVG on score load,
(c) mask geometry tracks `highlightPosition.x` during playback.
Highest priority test: `clef overlay does not contain #hPosMask`
(would have caught 298-01). Other tests: mask present on load
(catches 298-01 and 298-02 ordering), mask rect/line geometry
tracks highlightPosition during playback, canvas `+0.5` centring
via `ctx.moveTo` spy.
Fix: add tests alongside the code fixes for 298-01 to 298-04.

## Suggestions (non-blocking)

- Magic numbers in mask construction (`"2 2"` dash pattern, `"0.75"`
  stroke width) — fine, cosmetic.
- Mask id `"hPosMask"` repeated as a magic string at two sites — single
  `static readonly POS_MASK_ID` constant would eliminate.
- Missing WHY comment for the `+ 0.5` centring offset in
  MusicCanvas.ts:345/349 (non-obvious invariant).
- Append `<mask>` to a `<defs>` block rather than directly to SVG
  (conventional, no behavioural change).
- Consider grouping all four highlight elements into a
  `PlayheadHighlight` helper type to encapsulate the cross-element
  geometry invariants (refactor; over-engineering for current scope).
