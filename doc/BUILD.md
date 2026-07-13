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

Multiple worktrees can run dev and preview servers at once without colliding.
Each declares a port offset, added to the base ports (dev 5173, preview 4173).
`worktree-ports.ts` resolves it in order: `SPEM_PORT_OFFSET` if set, otherwise a
gitignored `.worktree-offset` file (just the number) at the worktree root,
found by walking up from the module. A checkout with neither (CI, a fork, the
main checkout) gets offset 0 and the base ports. Each checkout keeps its own
offset locally in its gitignored `.worktree-offset`; there is no central registry.

`vite.config.ts` and `playwright.config.ts` read the resolved offset from
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
`packages/scores/src/` and committed to git as source assets. Regenerate them with
`pnpm run build:scores` locally, or let the **Scores CI** workflow
(`.github/workflows/scores-ci.yml`) rebuild and commit them when a push changes
`packages/scores/**`. The app build (`pnpm run build`, and Netlify) uses the committed
SVGs and does not regenerate them.

To build scores manually:

```console
pnpm run build:scores
```

Build a single score or notation:

```console
pnpm run build:scores -- --choir="I A"
pnpm run build:scores -- --version="Hugh Keyte" --notation=early --choir="II B"
```

This iterates over matching `Choir*.ly` files under `packages/scores/src/`, runs `lilypond --svg` for each in a small parallel pool, and post-processes each render with `packages/scores/build/postprocessSvg.mjs`. The raw LilyPond render is kept alongside the final SVG under a gitignored `.raw/` directory, so a change to the postprocessor re-applies by re-postprocessing the kept raw in seconds instead of re-running LilyPond.

LilyPond is invoked via the `execFile` family (no shell) — promisified `execFile` for each render, `execFileSync` for the `--version` probe — so no option value — `--version`, `--notation`, `--outDir`, the resolved `.ly` path, or `LILYPOND_CMD` — can inject shell commands: each is passed as a literal argument. Separately, `--version` and `--notation` are whitelisted to their known values because they become output-directory path segments. By default the `lilypond` binary on `PATH` is used; set the `LILYPOND_CMD` environment variable to a JSON array to point at a wrapped install — for example `LILYPOND_CMD='["flatpak","run","org.lilypond.LilyPond"]'` or `LILYPOND_CMD='["wsl","lilypond"]'` (POSIX shell syntax; in PowerShell use `$env:LILYPOND_CMD='[...]'`). The array is `[binary, ...prefixArgs]`; the build appends LilyPond's own arguments.

### Timing

LilyPond is the slow part: roughly 60 seconds per choir, 16 choirs across early + modern notations, run in a bounded parallel pool (`availableParallelism()`, capped). When `.ly` sources are current, `pnpm run build:scores` completes in a few seconds because it compares mtimes and skips unchanged renders. A change to `postprocessSvg.mjs` alone re-postprocesses the kept `.raw/` renders (seconds) rather than re-running LilyPond. After a batch edit of `.ly` sources — particularly shared includes (`basic.ly`, `layout.ly`) — a full `pnpm run build:scores` (or the Scores CI rebuild) re-renders the affected SVGs; expect several minutes. This is a one-off; the next build is fast again.

The kept-raw fast path is local-only: `.raw/` is gitignored, so a fresh checkout (including every Scores CI run) has none. CI still skips scores whose sources and the postprocessor are unchanged (the skip compares the committed SVG), and renders only the affected ones — but a change to `postprocessSvg.mjs` re-renders every score on CI, since there is no kept raw to re-postprocess from.

To force a clean regeneration, delete the directory
(`rm -rf packages/pwa/src/scores/`) and re-run `pnpm run build:scores`.

## Quality Checks

Run the full quality gate locally (Ohm grammar bundle, unused-export check, formatting, lint, typecheck, e2e-spec typecheck, dependency checks):

```console
pnpm run check
```

`pnpm run check` now also lints `packages/monitor` via its own `lint` script.

Fix formatting and lint issues automatically in the PWA package:

```console
pnpm --filter @spem/pwa fix:format
pnpm --filter @spem/pwa fix:lint
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

`pnpm run build:ohm` first normalises `packages/pwa/src/ohmjs/ly-grammar.ohm` to LF (via `packages/pwa/build/build-ohm.mjs`), then regenerates `packages/pwa/src/ohmjs/ly-grammar.ohm-bundle.js` and `packages/pwa/src/ohmjs/ly-grammar.ohm-bundle.d.ts` from it via `@ohm-js/cli`. If you modify the grammar, rebuild before testing or deploying.

`ly-grammar.ohm` is pinned to LF by `.gitattributes` (`*.ohm text eol=lf`) so `build:ohm` is deterministic across platforms. Without the rule, a Windows checkout (e.g. with `core.autocrlf=true`) writes the grammar with CRLF and `build:ohm` bakes those CRLFs into the `source` string literal of the generated bundle, producing a phantom diff on every Windows build, even from a clean tree (#611). The bundle file's own line endings are already LF via the existing `*.js` rule; the `*.ohm` rule is what stops CRLF being baked into that literal. The `.gitattributes` rule only fixes *fresh* checkouts, though: a worktree that already held a CRLF `ly-grammar.ohm` keeps it (git reads it clean against the LF blob, so `git checkout --` never rewrites it). So `build:ohm` also normalises the grammar to LF itself before generating (`packages/pwa/build/build-ohm.mjs`), making the build deterministic regardless of the working copy's line endings (#648).

## Build Output

The production build writes to `dist/`:

- `dist/assets/` — bundled JavaScript and CSS
- `dist/audio/` — audio files copied from `public/`
- Other files from `public/` (favicons, manifest, etc.)

## Build Architecture

### PWA

The build uses `vite-plugin-pwa` to generate a service worker and configure Workbox caching. The plugin is registered in `vite.config.ts` with:

- `registerType: "prompt"` — new service workers wait in the background; the app surfaces a toast for the user to refresh.
- `injectRegister: false` — registration is imported manually from `virtual:pwa-register` in `packages/pwa/src/ts/pwa-update.ts` rather than injected into `index.html`.
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
