# Build Instructions

## Prerequisites

- Node.js and npm
- LilyPond (only if regenerating SVG scores from source)
- A POSIX shell such as Bash (for `buildScore.sh` and `buildAllScores.sh`)

## Install Dependencies

```console
npm install
```

## Development

Start the Vite dev server:

```console
npm run dev
```

This serves the application locally with hot module replacement. The `--host` flag is set, so the server is accessible on the local network.

## Build for Production

```console
npm run build
```

This runs two steps in sequence:

1. `npm run build:ohm` (generates the Ohm.js grammar bundle from `src/ohmjs/ly-grammar.ohm`)
2. `vite build` (production bundle into `dist/`)

## Preview the Production Build

```console
npm run preview
```

Serves the contents of `dist/` locally.

## Regenerate SVG Scores

The SVG files in `src/scores/` are generated from LilyPond source files in `src/lilypond/`. If you modify the LilyPond sources, regenerate the scores before building.

Build a single score:

```console
bash buildScore.sh "src/lilypond/Hugh Keyte/modern/Choir I A.ly"
```

Build all scores:

```console
npm run build:scores
```

This iterates over all `Choir*.ly` files under `src/lilypond/Hugh Keyte/` and runs `lilypond --svg` for each. It then strips `height` and `width` attributes from the first line of each generated SVG.

### Platform Note for Score Generation

`buildScore.sh` uses `sed -i ''`, which is macOS syntax. On Linux or Windows with GNU sed, change the last line to:

```bash
sed -i -E '1,1s/ height="[0-9.]+[a-zA-Z]*"//g; 1,1s/ width="[0-9.]+[a-zA-Z]*"//g' "$svg"
```

## Testing

Run tests in watch mode:

```console
npm test
```

Run tests once with coverage:

```console
npm run coverage
```

Open the Vitest UI:

```console
npm run test:ui
```

## Build Notes

### Version Synchronisation

The application version is hardcoded in `index.html` (`v2.1.0`) and is not derived from `package.json` (`2.0.0`). When releasing, update both files manually. If you want automated injection, add a `define` block to `vite.config.ts` referencing `JSON.stringify(process.env.npm_package_version)` or `import { version } from './package.json'`.

### Ohm Grammar

`npm run build` regenerates `src/ohmjs/ly-grammar.ohm-bundle.js` from `src/ohmjs/ly-grammar.ohm` via `@ohm-js/cli`. If you modify the grammar, rebuild before testing or deploying.

## Deployment

The project is configured for Netlify. `netlify.toml` specifies:

- Build command: `npm run build`
- Publish directory: `dist`

Deployment is automated: merging to `main` triggers a Netlify build and deploy.

**Live site:** [www.spemplayer.net](https://www.spemplayer.net)

Ensure SVG scores are up to date before deploying, as the build pipeline does not invoke LilyPond automatically.
