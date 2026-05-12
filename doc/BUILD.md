# Build Instructions

## Prerequisites

- Node.js and npm
- LilyPond (only if regenerating SVG scores from source)

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

This runs steps in sequence:

1. `npm run format:check` — verifies Prettier formatting
2. `npm run lint` — ESLint check
3. `npm run build:ohm` — generates the Ohm.js grammar bundle from `src/ohmjs/ly-grammar.ohm`
4. `vite build` — production bundle into `dist/`

## Preview the Production Build

```console
npm run preview
```

Serves the contents of `dist/` locally.

## Regenerate SVG Scores

The SVG files in `src/scores/` are generated from LilyPond source files in `src/lilypond/`. If you modify the LilyPond sources, regenerate the scores before building.

Build all scores (default: Hugh Keyte, modern notation):

```console
npm run build:scores
```

Build a single score:

```console
npm run build:scores -- --choir="I A"
npm run build:scores -- --version="Hugh Keyte" --notation=early --choir="II B"
```

This iterates over matching `Choir*.ly` files under `src/lilypond/` and runs `lilypond --svg` for each, then post-processes the generated SVG with `build/postprocessSvg.py`.

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

Run end-to-end tests in a real browser:

```console
npm run test:e2e
```

## Build Notes

### Version Injection

The build pipeline injects the version from `package.json` into `index.html` at build time. `index.html` contains the placeholder `v%VERSION%`, which is replaced by a Vite plugin (`html-version` in `vite.config.ts`). On non-main branches, the current branch name is appended (for example, `2.3.0-fix-123`).

When releasing, update `package.json` only. The build will propagate the new version into the generated HTML.

### Ohm Grammar

`npm run build` regenerates `src/ohmjs/ly-grammar.ohm-bundle.js` from `src/ohmjs/ly-grammar.ohm` via `@ohm-js/cli`. If you modify the grammar, rebuild before testing or deploying.

## Build Output

The production build writes to `dist/`:

- `dist/assets/` — bundled JavaScript and CSS
- `dist/audio/` — audio files copied from `public/`
- Other files from `public/` (favicons, manifest, etc.)

## Deployment

The project is configured for Netlify. `netlify.toml` specifies:

- Build command: `npm run build`
- Publish directory: `dist`

Deployment is automated: merging to `main` triggers a Netlify build and deploy.

**Live site:** [www.spemplayer.net](https://www.spemplayer.net)

Ensure SVG scores are up to date before deploying, as the build pipeline does not invoke LilyPond automatically.
