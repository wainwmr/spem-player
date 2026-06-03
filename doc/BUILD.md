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
grammar bundle and SVG scores from LilyPond source. The SVG files in
`src/scores/` are committed source assets generated from LilyPond source.
LilyPond is required only if regenerating SVGs from source. The
`--skip-if-missing` flag in `prebuild` skips the score build when SVGs are
already present and LilyPond is unavailable.

## Preview the Production Build

```console
npm run preview
```

Serves the contents of `dist/` locally.

## Regenerate SVG Scores

The SVG files in `src/scores/` are generated from LilyPond source files in
`src/lilypond/`. They are committed to git as source assets. `npm run build`
regenerates them automatically via the `prebuild` step when `.ly` sources are
newer than the generated SVGs.

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

### Timing

LilyPond is the slow part: roughly 60 seconds per choir, 16 choirs across early + modern notations. When `.ly` sources are current, `npm run build:scores` (and the `prebuild` step inside `npm run build`) completes in a few seconds because `needsRebuild` compares mtimes and skips unchanged files. After a batch edit of `.ly` files — particularly shared includes (`basic.ly`, `layout.ly`) — expect the next full `npm run ci` to take 10+ minutes as the affected SVGs regenerate. This is a one-off; the next build after that is fast again.

To force a clean regeneration, delete the directory
(`rm -rf src/scores/`) and re-run `npm run build:scores`.

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

Run the fast unit suite (excludes subprocess-heavy integration tests):

```console
npm run test:unit
```

Run the integration suite only:

```console
npm run test:integration
```

Run all tests (unit and integration):

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

See `doc/TESTING.md` for the unit-vs-integration split and `doc/CI.md` for how
the two suites are gated in CI.

## CI Pipeline

Run the local commit-gate pipeline (checks, build, unit tests). Mirrors what
CI's `test` job runs on every push and pull request, so it is fast:

```console
npm run ci
```

Before pushing, run the full suite (`npm test` — unit and integration) so
locally you exercise everything CI eventually runs. The integration suite is
gated by paths on PRs (see `doc/CI.md`), but running it always before push is
the simpler rule and the cost is small.

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

## Build Architecture

### Caching

Two independent caches speed up CI and deploy:

| Cache | What | Key |
| --- | --- | --- |
| npm | `node_modules` | `package-lock.json` hash |
| LilyPond | `~/.local/lilypond/` | `lilypond-2.26.0-{os}` |

### Concurrency

GitHub Actions `concurrency` with `cancel-in-progress: true` ensures only the
latest commit deploys. If two pushes to `main` happen in quick succession, the
first deploy is cancelled.

### Deploy safety

- Deploy only triggers after CI passes (`workflow_run`).
- Deploy checks out the exact commit SHA that CI validated (`head_sha`), not
  the latest `main`.
- The bypass for direct pushes to `main` is restricted to non-code changes.

## Deployment

Production deploys are handled by GitHub Actions, not Netlify auto-builds.
Netlify is the host only.

Pipeline:

```text
merge to main → CI workflow (build + test) → on success
  → Deploy workflow (Netlify CLI) → production
```

- `.github/workflows/ci.yml` — builds the site and runs tests on every push
  and pull request.
- `.github/workflows/deploy-production.yml` — triggered by `workflow_run`
  after CI succeeds on `main`. Downloads the `dist/` artefact from CI and
  deploys to Netlify production via `netlify deploy --prod`.
- `.github/workflows/netlify-preview.yml` — builds and deploys PR previews to
  Netlify aliases (`pr-NUMBER`).

Netlify is unlinked from the git repository. `netlify.toml` contains
`ignore = "exit 0"` as a fail-safe in case the repository is ever re-linked
by mistake.

**Live site:** [www.spemplayer.net](https://www.spemplayer.net)
