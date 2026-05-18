# Spem Player

## Overview

A browser-based practice tool for singers learning Thomas Tallis's 40-part motet, _Spem in alium_. It plays accentuated recordings of individual voice parts (from two sources: Andrew Leslie Cooper and Choir of the Earth) while displaying synchronised sheet music and a visual overview of all 40 parts.

## Tech Stack

- **Language:** TypeScript (strict mode, ES2020 target, ESNext modules)
- **Bundler:** Vite 7 with `vite-plugin-commonjs`
- **Styling:** SCSS (compiled by `sass-embedded`), CSS custom properties for theming
- **Testing:** Vitest 3 with jsdom, coverage via `@vitest/coverage-v8`; Playwright for end-to-end browser testing
- **Parser:** Ohm.js for LilyPond grammar parsing
- **Build scripts:** Node.js (`build/buildScores.mjs`) invoking LilyPond to generate SVG scores, then Python (`build/postprocessSvg.py`) to annotate parts and strip dimensions
- **Deployment:** Netlify (build command `npm run build`, publish directory `dist`). Automated deploy on merge to `main`. Live at [www.spemplayer.net](https://www.spemplayer.net).

## Architecture

The UI is built around five custom HTML elements extending `HTMLElement`:

- `music-score` (`MusicScore.ts`): Displays SVG sheet music, parses bar positions from LilyPond-generated SVG `<tspan>` elements, auto-scrolls during playback, and highlights the current bar.
- `music-canvas` (`MusicCanvas.ts`): Renders a Canvas 2D overview of all 8 choirs by 5 parts across 140 bars. Uses parsed LilyPond data to draw note ranges with HSL choir colours and pulse animations during playback.
- `music-controls` (`MusicControls.ts`): Audio playback control (HTML5 Audio), play/pause/loading icons, and input widgets for choir, part, and bar.
- `music-canvas-watcher` (`MusicCanvasWatcher.ts`): Footer status line showing hovered choir, part, and bar.
- `music-element` (`MusicElement.ts`): Abstract base class holding shared state (choir, part, bar, playing, recording) and custom event dispatch.

The entry point is `index.ts`, which wires up events between components, handles keyboard input, and manages global state (recording, score period, dark/light mode).

### State Management

The central `State` interface (defined in `src/ts/common.ts`) tracks:

- `recording` — 0 for ALC, 1 for CotE
- `viewmode` — `"dark"` or `"light"`
- `period` — `"modern"` or `"early"`
- `choir` — 0 to 7
- `part` — `"all"` or 0 to 4
- `bar` — 0 to 139
- `status` — `"playing"`, `"paused"`, or `"loading"`

State changes flow through `index.ts` helper functions (`setChoir()`, `setPart()`, `setBar()`), which update component attributes. Components react via `attributeChangedCallback` and fire custom events to propagate changes back to `index.ts`.

## Source Layout

- `index.html`: Single-page markup. Loads modules and defines the layout.
- `index.ts`: Application bootstrap, state management, event wiring.
- `src/ts/common.ts`: Shared types (`State`, `Position`, `Colors`), colour loading from CSS custom properties, bar/time conversion helpers.
- `src/ts/config.ts`: Static configuration, including recording metadata (ALC vs CotE), bar-to-time mappings, and choir naming conventions.
- `src/ts/lily.ts`: Ohm.js grammar setup, LilyPond parsing, and conversion into `dict` (notes per bar) and `ranges` (singing ranges per choir/part).
- `src/ts/music-classes.ts`: Domain models: `Note`, `Rest`, `Duration`, `BarLine`, `Component`.
- `src/ohmjs/ly-grammar.ohm`: Ohm grammar for a subset of LilyPond syntax.
- `src/scss/style.scss`: All styles, including dark/light theme CSS custom properties.
- `src/lilypond/`: LilyPond source files. Two editions are present: `Hugh Keyte` (used by the UI) and `OUP` (present but not wired into `MusicScore`). Each edition has `early/` and `modern/` notation variants.
- `src/scores/`: SVG scores generated from LilyPond. `Hugh Keyte/` is the active set; `OUP/` exists but is not loaded by the application.
- `public/audio/`: MP3 recordings. `ALC/` and `CotE/` each contain per-part tracks plus a `default.mp3`.
- `public/spem.json`: Runtime config consumed by the app (choir count, parts, score types, tempo).

## Build and Development

See `doc/BUILD.md` for build commands and `doc/TESTING.md` for test commands.

Agent-critical notes:

- `npm run build:ohm` is required before tests can run.
- Playwright browser binaries are not auto-installed; run `npx playwright install chromium` after `npm install`.
- `npm run build:scores` generates SVGs from LilyPond and post-processes them. Pass `--choir`, `--notation`, or `--version` flags to build a subset.
- `npm run build` automatically invokes `build:scores` via the `prebuild` step before bundling.

## Testing Conventions

See `doc/TESTING.md` for framework configuration and commands.

Agent note: modules expose internal functions and state via `exportedForTesting` for unit testing. `canvas` and `jsdom` are available in the test environment.

## Key Conventions and Quirks

- **Custom elements:** Defined via a static `define(tag)` method on each class. Tags are `music-canvas`, `music-score`, `music-controls`, `music-canvas-watcher`.
- **State propagation:** Components communicate via custom events (`music-canvas-click`, `music-controls-changed`, `music-controls-playing`, `music-controls-paused`, `music-score-click`). Attributes on custom elements are used as a reactive API.
- **Bar numbering:** Bars run from 0 to 139 (140 total, including an intro bar). Bar 0 has fewer beats depending on the recording (`intro_beats`).
- **Time mapping:** `bartime` and `barno` arrays in `config.ts` map real audio time to bar numbers for each recording, accounting for tempo changes.
- **SVG bar detection:** `MusicScore.getBars()` extracts bar positions by parsing `translate` attributes on `<g>` elements that contain numeric `<tspan>` text. It filters out values near the left edge to avoid false matches from tenor clef symbols.
- **LilyPond parsing:** Only a subset of LilyPond is supported by the Ohm grammar. The parser relies on the exact structure of `spem.ly` and its included files.
- **Version injection:** The build pipeline injects `package.json` version into `index.html` at build time. See `doc/BUILD.md`.
- **Local ignore rules:** Personal ignore patterns (IDE configs, local scripts) belong in `.git/info/exclude`, not `.gitignore`, to avoid polluting the shared file.

## Known Issues and TODOs

All known bugs, hacks, todos, and technical debt are tracked on the
**Spem Player** GitHub Project board (`https://github.com/users/wainwmr/projects/2`).
The board is the canonical register, including specifications
and the implementation roadmap. `BUGS.md` is archived.

Not every GitHub issue is a board ticket. Issues that are not on the board
(debris, hidden items, release PRs) should not be investigated or reported on
unless explicitly requested. See `doc/CONTRIBUTING.md` for the full board
workflow and ticket lifecycle.

## Process

Active work on bugs, hacks, and technical debt is managed via the
**Spem Player** GitHub Project board
(`https://github.com/users/wainwmr/projects/2`). The board is the canonical
register of all open items, including specifications and status.

`doc/CONTRIBUTING.md` documents the board workflow, ticket lifecycle, and
assessment methodology.

### Session Startup

1. Read `AGENTS-LOCAL.md` and follow its Session Startup section.

## Local Instructions

If `AGENTS-LOCAL.md` exists in this directory, read it for additional
project-specific instructions, scripts, workflows, and startup tasks.
