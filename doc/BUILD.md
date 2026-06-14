# Build Instructions

## Prerequisites

- Node.js and pnpm (corepack-provided via `packageManager` in `package.json`)
- LilyPond 2.26.0 or later (only if regenerating SVG scores from source)

## Install Dependencies

```console
pnpm install
```

## Development

Start the Vite dev server:

```console
pnpm run dev
```

This serves the application locally with hot module replacement. The `--host` flag is set, so the server is accessible on the local network.

### Parallel worktrees

Multiple worktrees can run dev and preview servers simultaneously by setting
`SPEM_PORT_OFFSET` in each worktree's environment (for example, in a
`.env.local` file). The offset is added to the default ports:

| Worktree | Offset | Dev port | Preview port |
| -------- | ------ | -------- | ------------ |
| default  | 0      | 5173     | 4173         |
| vera     | 100    | 5273     | 4273         |
| kimi     | 200    | 5373     | 4373         |
| copilot  | 300    | 5473     | 4473         |
| tele     | 400    | 5573     | 4573         |

`vite.config.ts` and `playwright.config.ts` read the offset from
`worktree-ports.ts` at config-eval time.

## Build for Production

```console
pnpm run build
```

This runs `vite build` to produce a production bundle into `dist/`.

`pnpm run prebuild` runs automatically before `build` and generates the Ohm.js
grammar bundle and SVG scores from LilyPond source. The SVG files in
`packages/pwa/src/scores/` are committed source assets generated from LilyPond source.
LilyPond is required only if regenerating SVGs from source.

## Preview the Production Build

```console
pnpm run preview
```

Serves the contents of `dist/` locally.

## Regenerate SVG Scores

The SVG files in `packages/pwa/src/scores/` are generated from LilyPond source files in
`packages/scores/src/`. They are committed to git as source assets. `pnpm run build`
regenerates them automatically via the `prebuild` step when `.ly` sources are
newer than the generated SVGs.

To build scores manually:

```console
pnpm run build:scores
```

Build a single score or notation:

```console
pnpm run build:scores -- --choir="I A"
pnpm run build:scores -- --version="Hugh Keyte" --notation=early --choir="II B"
```

This iterates over matching `Choir*.ly` files under `packages/scores/src/` and runs `lilypond --svg` for each, then post-processes the generated SVG with `packages/scores/build/postprocessSvg.mjs`.

### Timing

LilyPond is the slow part: roughly 60 seconds per choir, 16 choirs across early + modern notations. When `.ly` sources are current, `pnpm run build:scores` (and the `prebuild` step inside `pnpm run build`) completes in a few seconds because `needsRebuild` compares mtimes and skips unchanged files. After a batch edit of `.ly` files — particularly shared includes (`basic.ly`, `layout.ly`) — expect the next full `pnpm run ci` to take 10+ minutes as the affected SVGs regenerate. This is a one-off; the next build after that is fast again.

To force a clean regeneration, delete the directory
(`rm -rf packages/pwa/src/scores/`) and re-run `pnpm run build:scores`.

## Quality Checks

Run the full quality gate locally (Ohm grammar bundle, unused-export check, formatting, lint, typecheck, dependency checks):

```console
pnpm run check
```

`pnpm run check` now also lints `packages/monitor` via its own `lint` script.

Fix formatting and lint issues automatically:

```console
pnpm run fix:format
pnpm run fix:lint
```

## Testing

Run the fast unit suite (excludes subprocess-heavy integration tests):

```console
pnpm run test:unit
```

Run the integration suite only:

```console
pnpm run test:lilypond
```

Run all tests (unit and integration):

```console
pnpm test
```

Run tests in watch mode:

```console
pnpm run test:watch
```

Run tests once with coverage:

```console
pnpm run test:coverage
```

Run end-to-end tests in a real browser:

```console
pnpm run e2e
```

See `doc/TESTING.md` for the unit-vs-integration split and `doc/CI.md` for how
the two suites are gated in CI.

## CI Pipeline

Run the local commit-gate pipeline (checks, build, unit tests). Mirrors what
CI's `test` job runs on every push and pull request, so it is fast:

```console
pnpm run ci
```

Before pushing, run the full suite (`pnpm test` — unit and integration) so
locally you exercise everything CI eventually runs. The integration suite is
gated by paths on PRs (see `doc/CI.md`), but running it always before push is
the simpler rule and the cost is small.

## Build Notes

### Version Injection

The build pipeline injects the version from `package.json` into `index.html` at build time. `index.html` contains the placeholder `v%VERSION%`, which is replaced by a Vite plugin (`html-version` in `vite.config.ts`). On non-main branches, the current branch name is appended (for example, `2.3.0-fix-123`).

When releasing, update `package.json` only. The build will propagate the new version into the generated HTML.

### Ohm Grammar

`pnpm run build:ohm` regenerates `src/ohmjs/ly-grammar.ohm-bundle.js` and `src/ohmjs/ly-grammar.ohm-bundle.d.ts` from `src/ohmjs/ly-grammar.ohm` via `@ohm-js/cli`. If you modify the grammar, rebuild before testing or deploying.

`ly-grammar.ohm` is pinned to LF by `.gitattributes` (`*.ohm text eol=lf`) so `build:ohm` is deterministic across platforms. Without the rule, a Windows checkout (e.g. with `core.autocrlf=true`) writes the grammar with CRLF and `build:ohm` bakes those CRLFs into the `source` string literal of the generated bundle, producing a phantom diff on every Windows build, even from a clean tree (#611). The bundle file's own line endings are already LF via the existing `*.js` rule; the `*.ohm` rule is what stops CRLF being baked into that literal.

## Build Output

The production build writes to `dist/`:

- `dist/assets/` — bundled JavaScript and CSS
- `dist/audio/` — audio files copied from `public/`
- Other files from `public/` (favicons, manifest, etc.)

## Build Architecture

### PWA

The build uses `vite-plugin-pwa` to generate a service worker and configure Workbox caching. The plugin is registered in `vite.config.ts` with:

- `registerType: "prompt"` — new service workers wait in the background; the app surfaces a toast for the user to refresh.
- `injectRegister: false` — registration is imported manually from `virtual:pwa-register` in `src/ts/pwa-update.ts` rather than injected into `index.html`.
- `manifest: false` — the manifest is a static file (`public/site.webmanifest`) rather than generated by the plugin.

**Precaching.** The app shell is precached at build time. `workbox.globPatterns` matches `**/*.{js,css,html,svg,png,ico,json,webmanifest}` in `dist/`. Audio files are excluded from precaching.

**Runtime caching.** Three runtime caches are configured:

| Cache                 | Pattern                | Strategy               | Notes                                                                                    |
| --------------------- | ---------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| `audio-cache`         | `\.(mp3\|ogg\|wav)$`   | `CacheFirst`           | Audio files are cached on first play, not bulk-downloaded. Up to 200 entries, no expiry. |
| `google-fonts-cache`  | `fonts.googleapis.com` | `StaleWhileRevalidate` | Google Fonts CSS                                                                         |
| `google-fonts-static` | `fonts.gstatic.com`    | `CacheFirst`           | Google Fonts font files                                                                  |

**Manifest version injection.** A custom Vite plugin (`manifest-version` in `vite.config.ts`) reads the version from `package.json` and writes it into `dist/site.webmanifest` at build time. This lets the installed PWA report its version independently of the HTML shell.

### Caching

Two independent caches speed up CI and deploy:

| Cache    | What                 | Key                      |
| -------- | -------------------- | ------------------------ |
| pnpm     | pnpm global store    | `pnpm-lock.yaml` hash    |
| LilyPond | `~/.local/lilypond/` | `lilypond-2.26.0-{os}`   |

### Concurrency

GitHub Actions `concurrency` with `cancel-in-progress: true` ensures only the
latest commit deploys. If two pushes to `main` happen in quick succession, the
first deploy is cancelled.

## Deployment

Production deploys and PR previews are handled by Netlify's native git
integration. Netlify builds automatically on every push to `main` and on
every pull request update.

- `.github/workflows/pwa-ci.yml` — builds the site and runs tests on every push
  and pull request.
- Netlify — deploys production from `main` and generates preview builds for
  open pull requests.

PR preview URLs follow the pattern
`https://deploy-preview-<number>--spemplayer.netlify.app`.

**Live site:** [www.spemplayer.net](https://www.spemplayer.net)
