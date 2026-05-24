# VERA-298 Review Checklist

Mode: work
Generated: 2026-05-24 16:00
Last run:  2026-05-24 18:14

## Findings

### 298-01 — [critical] hPosMask is not stripped from clef overlay clone

Agent: code-reviewer + pr-test-analyzer + silent-failure-hunter + type-design-analyzer
File: src/ts/MusicScore.ts:418 (selector); :201 (mask prepend)
Status: addressed
Notes: Fix in commit `0ca7d5d`. Added `[id='hPosMask']` to the strip
selector. Regression test added to `src/test/score.test.ts` in the
existing `clef overlay does not contain highlight elements` test.
Note: `querySelector("#hPosMask")` returns null in jsdom even when the
element is present (SVG `<mask>` id-selector quirk); attribute selector
`[id='hPosMask']` is the reliable form.

### 298-02 — [important → reclassified suggestion] mask children positional index

Agent: code-reviewer + pr-test-analyzer + silent-failure-hunter + type-design-analyzer
File: src/ts/MusicScore.ts:193, 197, 275, 276, 280
Status: deferred
Notes: Reclassified as refactor (not defect) on Bob method-mode re-eval.
The pattern works correctly today; it's a maintainability concern, not a
visible bug. Deferred to Workbench Item #226 (Post-#298 cleanup).

### 298-03 — [important] Mask rect width hardcoded to 7, decoupled from indicatorWidth

Agent: code-reviewer + type-design-analyzer
File: src/ts/MusicScore.ts:62 (initial), :211 (load-time)
Status: addressed
Notes: Fix in commit `87801f1`. Mask rect width now set from
`indicatorWidth = svgWidth / 600` alongside `highlightPosition.width`
in `#loadScore`. Confirmed via probe: every Hugh Keyte score has
`svgWidth/600` between 7.380 and 7.720, so the hardcoded "7" was
clipping the playhead's rightmost 0.38-0.72 units on every score.
Regression test added: `mask rect width matches highlightPosition width`
in `src/test/score.test.ts`.

### 298-04 — [important → reclassified suggestion] drawBarHighlight guard

Agent: silent-failure-hunter
File: src/ts/MusicCanvas.ts:341
Status: deferred
Notes: Reclassified as refactor on Bob method-mode re-eval — the
overshoot occurs only after music has ended and is not visibly wrong.
Guard inconsistency is logical, not behavioural. Deferred to Workbench
Item #226 (Post-#298 cleanup).

### 298-05 — [important] No test coverage for centring or mask behaviour

Agent: pr-test-analyzer
Files: src/test/canvas.test.ts, src/test/score.test.ts
Status: addressed
Notes: Two regression tests added inline with the fixes — one for the
clef overlay strip (298-01) and one for the mask rect width tracking
(298-03). Other suggested tests (mask present on load, mask geometry
during playback, canvas `+0.5` via `ctx.moveTo` spy) are deferred along
with the refactor in Workbench Item #226 — once the mask children are
named fields, those tests become trivial to express.

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
