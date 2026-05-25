# Build Instructions

## Prerequisites

- Node.js and npm
- LilyPond 2.26.0 or later (only if regenerating SVG scores from source)

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

This runs `vite build` to produce a production bundle into `dist/`.

`npm run prebuild` runs automatically before `build` and generates the Ohm.js
grammar bundle and SVG scores from LilyPond source. SVG generation is skipped
if LilyPond is not installed (uses committed SVGs).

## Preview the Production Build

```console
npm run preview
```

Serves the contents of `dist/` locally.

## Regenerate SVG Scores

The SVG files in `src/scores/` are generated from LilyPond source files in `src/lilypond/`.
`npm run build` automatically regenerates them via the `prebuild` step.

To build scores manually:

```console
npm run build:scores
```

Build a single score or notation:

```console
npm run build:scores -- --choir="I A"
npm run build:scores -- --version="Hugh Keyte" --notation=early --choir="II B"
```

This iterates over matching `Choir*.ly` files under `src/lilypond/` and runs `lilypond --svg` for each, then post-processes the generated SVG with `build/postprocessSvg.mjs`.

## Quality Checks

Run the full quality gate locally (Ohm grammar bundle, unused-export check, formatting, lint, typecheck, dependency checks):

```console
npm run check
```

Fix formatting and lint issues automatically:

```console
npm run fix:format
npm run fix:lint
```

## Testing

Run tests:

```console
npm test
```

Run tests in watch mode:

```console
npm run test:watch
```

Run tests once with coverage:

```console
npm run test:coverage
```

Run end-to-end tests in a real browser:

```console
npm run e2e
```

## CI Pipeline

Run the full local CI pipeline (checks, build, and tests):

```console
npm run ci
```

## Build Notes

### Version Injection

The build pipeline injects the version from `package.json` into `index.html` at build time. `index.html` contains the placeholder `v%VERSION%`, which is replaced by a Vite plugin (`html-version` in `vite.config.ts`). On non-main branches, the current branch name is appended (for example, `2.3.0-fix-123`).

When releasing, update `package.json` only. The build will propagate the new version into the generated HTML.

### Ohm Grammar

`npm run build:ohm` regenerates `src/ohmjs/ly-grammar.ohm-bundle.js` and `src/ohmjs/ly-grammar.ohm-bundle.d.ts` from `src/ohmjs/ly-grammar.ohm` via `@ohm-js/cli`. If you modify the grammar, rebuild before testing or deploying.

## Build Output

The production build writes to `dist/`:

- `dist/assets/` — bundled JavaScript and CSS
- `dist/audio/` — audio files copied from `public/`
- Other files from `public/` (favicons, manifest, etc.)

## Deployment

The project is configured for Netlify. `netlify.toml` specifies:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

Deployment is automated: merging to `main` triggers a Netlify build and deploy.

**Live site:** [www.spemplayer.net](https://www.spemplayer.net)

`npm run build` invokes LilyPond automatically via the `prebuild` step when available. In CI environments without LilyPond (including Netlify), the `prebuild` step skips gracefully and uses the committed SVGs in `src/scores/`.
