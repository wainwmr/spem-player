# Spem Player

<img src="SpemPlayer.png" alt="Spem Player screenshot" align="right" width="400" />

Are you about to perform Thomas Tallis's 40-part motet, _Spem in alium_? Worried about your entry on the "staircase of doom"? This player helps singers practice their parts with accentuated recordings of each of the 40 voices.

**Live site:** [www.spemplayer.net](https://www.spemplayer.net)

## Recordings

Two accentuated recordings are available:

- **Andrew Leslie Cooper** — solo vocal synthesis of all 40 parts
- **Choir of the Earth** — sung by a global virtual choir ([choirofthearth.com](https://www.choirofthearth.com))

Toggle between recordings using the button in the top-right corner.

## Features

### Score View

- Displays SVG sheet music generated from LilyPond sources
- Auto-scrolls during playback
- Highlights the current bar
- Switch between **modern** and **early** notation clefs

### Canvas Overview

- Visual map of all 8 choirs × 5 parts across all 140 bars
- Colour-coded by choir (HSL palette)
- Pulse animation shows active notes during playback
- Click or tap any bar to jump directly to that position

### Audio Controls

- Play / pause with progress tracking
- Select any choir (I–VIII) and part (Soprano, Alto, Tenor, Baritone, Bass)
- Jump to any bar (0–139)
- Bar 0 is an intro bar with a shortened beat count

### Keyboard Shortcuts

| Key | Action |
| --- | ------ |
| `1` – `8` | Select choir |
| `S` | Soprano |
| `A` | Alto |
| `T` | Tenor |
| `R` | Baritone |
| `B` | Bass |
| `X` | All voice parts |
| `←` / `→` | Select bar |
| `V` | Toggle between recordings |
| `M` | Toggle modern / early notation |
| `D` | Toggle dark / light mode |
| `Enter` / `Space` | Start or stop |
| `?` | Show help panel |

Shortcuts are ignored when focus is on an input field or `<select>` element.

### Display

- **Dark / light mode** toggle (top-right moon / sun icon)
- Responsive layout for desktop and mobile
- Splitter between score and canvas allows resizing

## Tech Stack

- TypeScript (strict, ES2020, ESNext modules)
- Vite 7 + `vite-plugin-commonjs`
- SCSS with CSS custom properties for theming
- Vitest 3 + jsdom for testing
- Ohm.js for LilyPond grammar parsing
- Netlify deployment (auto-deploy on merge to `main`)

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build (includes Ohm bundle generation)
npm run build:ohm    # Regenerate Ohm grammar bundles
npm run build:scores # Regenerate SVG scores from LilyPond
npm run test         # Run tests in watch mode
npm run coverage     # Single-run tests with coverage report
```

LilyPond SVG generation uses `buildScore.sh` / `buildAllScores.sh`.

## Repository

- **Upstream:** [wainwmr/spem-player](https://github.com/wainwmr/spem-player) (Mark Wainwright)
- **Fork:** [wainwright1000/spem-player](https://github.com/wainwright1000/spem-player)
