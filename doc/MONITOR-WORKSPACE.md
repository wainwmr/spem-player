# Monitor Workspace Migration Plan

## Context

The Spem Player repository currently contains three largely independent concerns:

1. **Spem Player PWA** (`src/`, `index.html`, Vite build, Vitest tests).
2. **LilyPond score pipeline** (`lilypond/`, SVG generation).
3. **Build-resource monitor** (`.github/scripts/monitor-resources.mjs`, `.github/scripts/render-burndown.mjs`, chart tests).

The PWA and monitor share a single root `package.json`. This forces the PWA CI to install `canvas` (a heavy native dependency used only by the monitor's chart renderer) and makes branch-protection rules such as "require `test` to pass" apply to changes that do not touch the PWA at all. Path filters in GitHub Actions are the only thing preventing unnecessary builds, and they are duplicated and easy to get wrong.

This document proposes moving the monitor into its own workspace package as the first step toward proper separation. The LilyPond score pipeline is intentionally out of scope for this migration; see [Future phases](#future-phases).

## Workspaces and monorepos

A **monorepo** is a single version-control repository that contains multiple distinct projects or packages.

A **workspace** is the package-manager feature that makes a monorepo practical. It lets each project have its own `package.json`, dependencies, and scripts while the package manager links them together and maintains a single lockfile.

- **Monorepo** = organisational choice (one repo, many projects).
- **Workspace** = tooling choice (`pnpm workspaces`, `npm workspaces`, `yarn workspaces`) that implements the monorepo.

Workspaces do not require you to publish packages or share code between them. They simply give each concern its own dependency graph and its own lifecycle.

## Proposed layout

This migration moves the PWA into `packages/pwa/` and the monitor into `packages/monitor/`. The LilyPond score pipeline stays in `lilypond/` and remains a future extraction.

```text
spem-player/
├── package.json                      # workspace root, no runtime deps
├── pnpm-workspace.yaml               # declares workspace packages
├── pnpm-lock.yaml                    # single lockfile for all packages
├── packages/
│   ├── pwa/                          # Spem Player PWA (moved from root)
│   │   ├── package.json
│   │   ├── index.html
│   │   ├── index.ts
│   │   ├── vite.config.ts
│   │   ├── src/
│   │   ├── e2e/
│   │   └── ...
│   └── monitor/                      # new workspace package
│       ├── package.json
│       ├── monitor-resources.mjs
│       ├── render-burndown.mjs
│       ├── monitor-resources.test.mjs
│       ├── render-burndown.test.mjs
│       └── icons/
│           ├── github.png
│           ├── netlify.png
│           └── fire.png
├── lilypond/                         # SVG score pipeline (out of scope)
└── doc/
```

## Why pnpm workspaces

npm has had workspaces since v7, but pnpm is preferred here because:

- It keeps dependencies strictly per-package. The PWA will not install `canvas` just because the monitor needs it.
- `pnpm --filter <package>` is built in and flexible.
- It uses a content-addressed store, so disk usage and install time are lower.
- Its stricter hoisting avoids "phantom dependencies" — a package can only use what it declares.

## Migration steps

### 1. Create workspace root files

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
```

Root `package.json` becomes a thin orchestrator:

```json
{
  "name": "spem-player",
  "private": true,
  "version": "2.8.3",
  "type": "module",
  "scripts": {
    "dev": "pnpm --filter pwa dev",
    "build": "pnpm --filter pwa build",
    "test": "pnpm --filter pwa test",
    "test:unit": "pnpm --filter pwa test:unit",
    "test:monitor": "pnpm --filter @spem/monitor test",
    "e2e": "pnpm --filter pwa e2e",
    "check": "pnpm --filter pwa check",
    "ci": "pnpm run check && pnpm run build && pnpm run test:unit"
  },
  "devDependencies": {},
  "packageManager": "pnpm@11.5.3"
}
```

The root no longer declares `canvas`.

### 2. Move monitor files into `packages/monitor/`

Move these files from the repository root into `packages/monitor/`:

- `.github/scripts/monitor-resources.mjs`
- `.github/scripts/monitor-resources.test.mjs`
- `.github/scripts/render-burndown.mjs`
- `.github/scripts/render-burndown.test.mjs`
- `.github/scripts/icons/github.png`
- `.github/scripts/icons/netlify.png`
- `.github/scripts/icons/fire.png`

`packages/monitor/package.json`:

```json
{
  "name": "@spem/monitor",
  "private": true,
  "version": "2.8.3",
  "type": "module",
  "scripts": {
    "test": "node --test monitor-resources.test.mjs render-burndown.test.mjs"
  },
  "devDependencies": {
    "canvas": "^3.2.0"
  }
}
```

Update internal import paths inside `monitor-resources.mjs` and `render-burndown.mjs` so icon paths resolve from the new location.

### 3. Move PWA dependencies into `packages/pwa/`

Move the existing root `package.json` (minus monitor scripts and `canvas`) to `packages/pwa/package.json`. Keep the PWA package name as `spem-player` so published artefacts are unchanged.

`packages/pwa/package.json` retains all current PWA dependencies and scripts such as `build`, `test`, `check`, `ci`, `e2e`.

### 4. Update workflow files

`.github/workflows/monitor-resources-test.yml` changes from:

```yaml
- run: pnpm install
- run: node --test .github/scripts/monitor-resources.test.mjs .github/scripts/render-burndown.test.mjs
```

to:

```yaml
- run: pnpm install --filter monitor
- run: pnpm --filter @spem/monitor test
```

`.github/workflows/monitor-resources.yml` changes from:

```yaml
- run: pnpm install --frozen-lockfile
- run: node .github/scripts/monitor-resources.mjs
```

to:

```yaml
- run: pnpm install --frozen-lockfile --filter monitor
- run: pnpm --filter @spem/monitor exec node monitor-resources.mjs
```

`.github/workflows/ci.yml` can drop the long `paths-ignore` list for monitor files because the `test` job in that workflow will run `pnpm --filter pwa test`, which no longer sees the monitor package. The path filter can be simplified to ignore only markdown and LilyPond files.

### 5. Update repository scripts

Root scripts delegate to the relevant workspace:

| Old root script | New root script |
|---|---|
| `pnpm run test` | `pnpm --filter pwa test` |
| `pnpm run test:monitor` | `pnpm --filter @spem/monitor test` |
| `pnpm run check` | `pnpm --filter pwa check` |
| `pnpm run ci` | `pnpm run check && pnpm run build && pnpm run test:unit` |

### 6. Migrate `.github/monitor-series.json`

The series file stays in `.github/monitor-series.json` because it is consumed by the workflow, not by the monitor package at install time. The monitor package writes it via the workflow step. No change is needed unless we later move the monitor to its own repository.

### 7. Update branch protection

Once CI is scoped, the branch-protection rule can require the PWA `test` job only when PWA-relevant files change. Because the PWA workflow's own path filter drives this, GitHub's "required status checks" will skip the check for monitor-only PRs rather than block them.

## CI outcomes after migration

| Change | Workflows that run | Workflows that skip |
|---|---|---|
| PWA code (`packages/pwa/`, `public/`, etc.) | PWA CI, e2e | Monitor tests |
| Monitor code (`packages/monitor/`) | Monitor Resources Tests | PWA CI |
| LilyPond code (`lilypond/`) | Regenerate SVGs | PWA CI, Monitor tests |
| Documentation only | None (or docs check) | All heavy builds |

## Future phases

After the monitor and PWA are in workspace packages, the remaining concern is the LilyPond score pipeline. It is deliberately not part of #599 because it introduces a cross-package artifact relationship: the pipeline produces the SVGs that the PWA consumes.

A future issue (#600) will move the score pipeline into its own workspace package, for example `packages/scores/`:

```text
spem-player/
├── packages/
│   ├── pwa/
│   ├── monitor/
│   └── scores/                    # future — LilyPond → SVG pipeline
│       ├── package.json
│       ├── build/
│       │   ├── buildScores.mjs
│       │   └── postprocessSvg.mjs
│       ├── src/
│       │   ├── Hugh Keyte/
│       │   └── OUP/
│       ├── test/
│       └── output/                # generated SVGs consumed by PWA
├── .github/workflows/
│   ├── ci.yml
│   ├── monitor-resources.yml
│   ├── monitor-resources-test.yml
│   └── lilypond.yml               # triggers on packages/scores/**
└── ...
```

That issue will need to resolve:

- **Artifact ownership.** Do generated SVGs live in `packages/scores/output/` and get copied/symlinked into `packages/pwa/public/` at build time, or does the PWA import them directly from the workspace?
- **Vite config changes.** The PWA precache manifest and asset handling must know where the SVGs are.
- **CI trigger separation.** The existing `.github/workflows/lilypond.yml` runs only when `.ly` files or build scripts change; it must be retargeted to `packages/scores/**`.
- **External binary dependency.** The score pipeline needs the `lilypond` binary on the runner, unlike the monitor's `canvas` or the PWA's Node toolchain.
- **Package naming.** Whether to split source (`.ly` files), build scripts, and generated output into sub-packages or keep them together.

Because the PWA and monitor share no artifacts, the #599 migration is straightforward. The LilyPond extraction is the next natural step, but it deserves its own ticket and design discussion.

## Risks and considerations

- **Path updates.** The monitor scripts resolve icons relative to `__dirname`. Moving them to `packages/monitor/` requires updating those paths once.
- **Lockfile.** pnpm will regenerate `pnpm-lock.yaml` to include both packages. This is a one-time large diff.
- **Netlify build.** Netlify currently runs `pnpm run build` from the root. The root script can delegate to `pnpm --filter pwa build`, but Netlify may need its build command updated to `pnpm --filter pwa build` directly.
- **E2E tests.** E2E depends on the production build. It should remain a separate workflow that runs only when PWA-relevant files change.
- **Future extraction.** Because the monitor will already be a self-contained package, promoting it to its own repository later is straightforward: move `packages/monitor/` to a new repo, update workflow paths, and point `.github/monitor-series.json` at the new repo.

## Next steps

1. Agree the layout (this document).
2. Create a ticket/PR for the workspace migration (#599).
3. Implement file moves and root/package `package.json` changes.
4. Update workflows and Netlify build command.
5. Verify each workflow runs only for its own scope.
6. Create a separate ticket for the LilyPond workspace extraction (see #600).
