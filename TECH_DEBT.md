# Technical Debt Methodology

## Context

The Spem Player codebase contains scattered TODOs, BUGs, HACKs, and ARGHs across TypeScript, SCSS, HTML, and build scripts. This document describes the systematic methodology used to inventory, assess, specify, and schedule remediation work. The methodology was applied to establish the **Spem Player** GitHub Project board, which is now the canonical register of all items. This document remains as reference material for the naming convention, tools, and best practices.

## Deliverables

- The **Spem Player** GitHub Project board (`https://github.com/users/wainwmr/projects/2`):
  the canonical register of all items. `BUGS.md` is archived.

## Naming Convention

Every item receives a unique identifier:

```text
[CATEGORY]-[AREA]-[NNN]
```

- **CATEGORY**: `BUG` (defect), `HACK` (workaround), `TODO` (planned improvement), `ARCH` (architectural debt), `BUILD` (build/pipeline issue).
- **AREA**: `UI`, `CANVAS`, `SCORE`, `AUDIO`, `LILY` (LilyPond/grammar), `BUILD`, `CONFIG`, `TEST`.
- **NNN**: Zero-padded sequential number (001, 002, ...).

Example: `BUG-SCORE-001` for the scroll-up issue in `index.ts`.

## Issue Schema

Board items are represented as GitHub issues. The body follows a definition-list format:

```markdown
### BUG-SCORE-001

- **Type**: BUG
- **Area**: SCORE
- **Status**: discovered
- **Priority**: unassigned
- **Difficulty**: unassigned
- **Source file**: `index.ts`
- **Source line**: 48
- **First seen**: YYYY-MM-DD (git commit hash)
- **Raw text**: "BUG: can scroll up and down a tiny bit in score"
- **Description**: (populated in Assessment)
- **PD required**: (populated in Assessment)
- **Recommended fix**: (populated in Specification)
- **Test plan**: (populated in Specification)
- **Dependencies**: (populated in Specification)
- **Closed**: YYYY-MM-DD (when the item was resolved; leave blank until done)
- **Resolution**: Brief note or PR/commit reference (e.g., "Fixed in PR #52", "Won't fix: deprecated")
- **Notes**: (free form)
```

Priority scale: `P0` (critical), `P1` (high), `P2` (medium), `P3` (low).
Difficulty scale: `XS`, `S`, `M`, `L`, `XL`.
Status values: `discovered`, `assessed`, `specified`, `ready`, `in-progress`, `done`, `wontfix`, `deferred`.

## Tools and Capabilities

- **Diagnostics MCP**: VS Code workspace diagnostics via `get_all_diagnostics`, `get_errors`, `get_warnings`, `get_info`.
- **OpenAlex MCP**: Academic works search (email configured: `akw37@bath.ac.uk`).
- **Playwright**: Chromium, Firefox, WebKit installed at `C:\Users\Andrew\AppData\Local\ms-playwright\`. Use for headless DOM inspection, CSS debugging, and reproduction of layout or interaction bugs.
- **Git**: Full git history available; `git blame`, `git log -S`, and credential fill tested.
- **Vitest + jsdom**: Existing test suite (37 tests, 8 files). `canvas` package available for Canvas API tests.
- **Vite dev server**: `npm run dev` for live reproduction.
- **Node / npm**: Standard build and test toolchain.
- **Ohm language support for VS Code**: Syntax highlighting for `.ohm` grammar files.
- **LilyPond local install**: Required if regenerating SVG scores from source. Currently handled by shell scripts, but a local install enables verification during assessment and testing.

## Phase 1: Discovery (Inventory)

**Goal**: Produce/maintain a complete, unfiltered list of every item that indicates work is needed.

**Activities**:

1. Run exhaustive `grep` searches across the codebase for markers:
   - Primary: `TODO`, `FIXME`, `HACK`, `BUG`, `ARGH`, `REVIEW`, `WORKAROUND`, `TEMP`.
   - Secondary: descriptive comments signalling debt (e.g. "hard-coded", "bad name", "bad data type", "ignoring", "duplicated", "never finishes", "looks ugly when").
2. Cross-reference with `AGENTS.md` Known Issues and `BUILD.md` Build Notes to capture issues documented there but not inline (e.g. version drift, `getBarFromTime` boundary failure).
3. Record file path, line number, raw comment text, and surrounding context (5 lines).
4. Run `git blame` or `git log -S` on each location to estimate the first commit where the marker appeared. Record the commit hash, date, and author.
5. Create issues on the **Spem Player** GitHub Project board, assigning
   IDs and setting Status to **Todo**.
6. Mark any already-resolved items as **Done**.
7. Run `python discover.py` at the start of each session to catch new
   markers added by other contributors. The script scans source files
   and creates new issues on the board in the **Todo** column.

**Constraints**:

- No code changes.
- No test changes.
- Temporary helper scripts may be created in `temp/` for batch processing; delete them after the phase.

**Output and resumability**:

- After every item is documented, output a visible summary to the user before moving to the next item. The summary must include the item ID, file, line, and a one-line characterisation. Do not rely on Thinking blocks; the user cannot see them.

**Checkpoint**: End of Phase 1. Update the user with item count and any patterns observed.

## Phase 2: Assessment (Triage)

**Goal**: Understand what each item means and what pre-development work (PD) is required before it can be fixed.

**Activities**:

For each item on the board, in ID order (or grouped by file if more convenient):

1. **Interpret the description**: Read the source code around the marker. Determine whether the comment is still accurate or stale.
2. **Determine PD required**:
   - `none`: Sufficient context exists to specify the fix.
   - `repro`: Need to reproduce in browser or dev server.
   - `test-gap`: Need to write tests to understand behaviour or prevent regression.
   - `playwright`: Need DOM/layout inspection via headless browser.
   - `ask-mark`: Need clarification from Mark (ambiguous intent, historical context).
   - `spike`: Need a time-boxed technical investigation.
3. **Assign initial Priority** (P0–P3) based on user impact and frequency.
4. **Assign initial Difficulty** (XS–XL) based on complexity and blast radius.
5. **Update the issue** with the above fields. Move Status to **Todo**.

**Constraints**:

- No code changes.
- No test changes.
- Temporary files (e.g. a scratchpad note, a reproduction HTML file) are permitted in `temp/` only; delete them before concluding the phase.
- If an item is found to be already fixed or obsolete during assessment, mark it `wontfix` or `done` with explanation.

**Output and resumability**:

- After each item is assessed, output a visible summary to the user: item ID, priority, difficulty, PD required, and a one-sentence rationale.

**Checkpoint**: End of Phase 2. The board should show every item as **Todo**.

## Phase 3: Specification

**Goal**: For each open item, define either the recommended fix or the test suite tests required to support a future fix.

**Activities**:

Process items in priority order (P0 first, then P1, etc.):

1. For items marked `test-gap` or `spike` in Assessment, refine the test plan:
   - Identify which existing test files to extend or which new files to create.
   - Define test cases, inputs, and expected outputs.
   - Note any mocking requirements (jsdom, canvas, audio, fetch).
2. For items with sufficient context, write a concise recommended fix:
   - Describe the approach.
   - Identify files to change.
   - Note risks or side effects.
   - Flag if the item should be grouped with others for an architectural change.
3. Record dependencies between items (e.g. fixing `HACK-CANVAS-003` may unblock `BUG-CANVAS-005`).
4. **Update the issue** with `Recommended fix`, `Test plan`, and `Dependencies`. Move Status to **Specified**.

**Constraints**:

- No code changes.
- No test changes.
- Use `temp/` for scratch work only; delete before phase end.

**Output and resumability**:

- After each item is specified, output a visible summary to the user: item ID, recommended fix or test plan headline, and any dependencies flagged.
- If interrupted, record the last completed ID in `session_notes.md`. Resume from the next item in priority order.

**Checkpoint**: End of Phase 3. Every open item is `specified`.

## Phase 4: Implementation Planning

**Goal**: Step back from individual items and produce a coherent, incremental roadmap.

**Activities**:

1. **Thematic grouping**: Cluster items by architectural area (e.g. Canvas rendering, Audio timing, Build pipeline, SVG generation).
2. **Dependency mapping**: Use the `Dependencies` field from Phase 3 to sequence work. Identify items that must precede others.
3. **Batch design**: Propose 3–5 incremental batches. Each batch should:
   - Be independently mergeable.
   - Not break existing tests or functionality.
   - Preferably address a coherent theme (easier review, lower cognitive load).
4. **Architectural opportunities**: Flag any changes that address multiple items simultaneously (e.g. refactoring `processLilypond()` return type to eliminate three HACKs). Present these as explicit trade-offs against pure incrementalism.
5. **Risk and rollback**: For each batch, note the risk level and how to roll back (git revert scope).
6. **Update documentation**:
   - Write the roadmap into the project board description or a pinned issue.
   - Update `AGENTS.md` Known Issues to reference the board and remove duplicated detail.
   - Update `session_notes.md` with the plan summary.

**Constraints**:

- No code changes yet.
- The plan must respect Mark's preference for incremental changes; architectural proposals must be justified with a clear payoff.

**Output and resumability**:

- After each batch is drafted, output a visible summary to the user before drafting the next.

**Checkpoint**: End of Phase 4. A documented roadmap exists and has been presented to the user for approval before any coding begins.

## General Best Practices Across All Phases

1. **Visible output rule**: After every item or batch is processed, write a brief summary as visible text in the response before moving on. Thinking blocks are invisible; never use them as a substitute for user-facing status.
2. **Documentation hygiene**: Update the board immediately after finishing any item's section.
3. **Diagnostics discipline**: Run `get_all_diagnostics` after any file write. Fix errors before proceeding.
4. **Git archaeology**: Use `git log -S "marker text" --source --all -- <file>` or `git blame -L <line>,<line> <file>` to find first occurrence. Record the earliest commit hash and date.
5. **Temporary files**: Any scratch files created for PD go in `temp/` and must be deleted before the phase concludes. Do not leave debris.
6. **Devil's advocate**: At the start of each phase, briefly challenge the approach. Is the phase too large? Are we missing a category of debt? Is a batch proposal too risky?
7. **No silent pivots**: If during Assessment or Specification the scope of an item turns out to be much larger than expected, report it immediately rather than silently upgrading its difficulty.
8. **Mark's preferences**: Incremental over monolithic. Tests for new behaviour. No build pipeline breakage. Preserve existing user-facing behaviour unless the change is the point.
