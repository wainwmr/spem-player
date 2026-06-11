# Testing

## Framework and Configuration

Tests use Vitest 4 with the jsdom environment. Configuration lives in `vite.config.ts`:

- `globals: true` (no need to import `describe`, `it`, `expect`)
- `environment: 'jsdom'`

`tsconfig.json` includes Vitest global types via `"types": ["vite/client", "vitest/globals"]`.

## Prerequisites

The Ohm.js grammar bundle must be built before tests can run. `pnpm run check` and
`pnpm run build` handle this automatically, but if you are running tests in
isolation you may need:

```console
pnpm run build:ohm
```

Without this step, any test importing `src/ohmjs/ly-grammar.ohm-bundle` will fail.

## Running Tests

Run unit tests once (excludes integration tests):

```console
pnpm run test:unit
```

Run integration tests once (subprocess-heavy, slower):

```console
pnpm run test:lilypond
```

Run all tests:

```console
pnpm test
```

Watch mode:

```console
pnpm run test:watch
```

Single run with coverage:

```console
pnpm run test:coverage
```

## Test File Location and Naming

Unit tests live under `src/test/` and `lilypond/test/` (excluding `*.integration.test.ts`) and follow the naming convention `*.test.ts`. They run in-process under jsdom and should complete in under a few seconds each. In-process tests against `lilypond/build/` code (for example `postprocessSvg.test.ts`) live in `lilypond/test/` alongside the integration suite.

Scripts in `.github/scripts/` that expose pure functions use the Node.js built-in test runner (`node:test`) rather than Vitest, and live alongside the script as `*.test.mjs`. Run the whole set with `pnpm run test:scripts` (`node --test ".github/scripts/*.test.mjs"`), or a single file directly with `node --test .github/scripts/<name>.test.mjs`. They are excluded from the Vitest config (`vite.config.ts`), so they do not appear in `pnpm run test:unit` output; instead `pnpm run test:scripts` runs them in the `test` job of `ci.yml` (and as the final step of `pnpm run ci`), so a broken assertion blocks merge — see `doc/CI.md`.

Integration tests live in `lilypond/test/*.integration.test.ts` and also follow `*.test.ts`. They typically spawn subprocesses (LilyPond, the build pipeline) and are substantially slower.

When changing integration tests, always run `pnpm run test:lilypond` locally — see § CI Behaviour below for which workflows run them in CI and the `lilypond/test/**` trigger gap (#558).

## Test Layer Decision Criteria

Choosing the right layer keeps the suite fast and deterministic.

**Unit tests** (Vitest/jsdom, `src/test/`) cover single modules in isolation:

- custom element behaviour and state helpers
- parser logic (LilyPond, Ohm grammar)
- build script logic that does not spawn subprocesses
- pure functions and domain models

**Integration tests** (Vitest/jsdom, `lilypond/test/*.integration.test.ts`) cover cross-module behaviour and subprocess orchestration:

- event flow across multiple custom elements
- build-pipeline verification that spawns Node scripts, LilyPond, or other external processes

**End-to-end tests** (Playwright, `e2e/`) cover real browser behaviour:

- real browser rendering and visual layout
- audio lifecycle and playback state
- keyboard navigation and interaction
- CSS-triggered behaviour

**What jsdom cannot reliably test:**

- `getBoundingClientRect` (always returns zero)
- `AudioContext` (not implemented)
- canvas pixel output (the `canvas` package provides the API but not pixel-perfect browser rendering)
- CSS-triggered behaviour (no layout engine)
- real timer execution inside DOM event handlers (`vi.useFakeTimers()` does not intercept `setTimeout` scheduled by jsdom's internal event loop)

If a test needs any of the above, it belongs in the E2E layer.

## CI Behaviour

See `doc/CI.md` for the canonical description; in summary:

- The required `test` job (`.github/workflows/ci.yml`) runs `pnpm run check`, `pnpm run build`, `pnpm run test:unit`, `pnpm run test:lilypond`, and `pnpm run test:scripts` on push to `main` and on pull requests targeting `main`, except changes confined to the workflow's `paths-ignore` list (see `ci.yml`; the LilyPond sources and the three build scripts, mirroring `lilypond.yml`), plus a nightly cron. It is the required status check.
- `lilypond/test/**` changes are not ignored by `ci.yml`, so they now run the required `test` job here (the #558 fix); the integration suite also runs in the Regenerate SVGs workflow (`.github/workflows/lilypond.yml`) when `lilypond/src/**` or the three build scripts change. LilyPond source-only PRs still report no required check (their only trigger is the non-required SVG workflow); that residue is tracked in #563.

## Key Dependencies

- `jsdom`: DOM implementation for Node.js
- `canvas`: Node.js Canvas API implementation (required for `MusicCanvas` tests)
- `@vitest/coverage-v8`: Coverage reporting

## Coverage Output

Coverage reports are written to the `coverage/` directory. This directory is gitignored.

## End-to-End Tests

End-to-end tests run in a real browser using Playwright. They live in `e2e/` and follow the naming convention `*.spec.ts`.

### E2E Prerequisites

The production build must exist before e2e tests run:

```console
pnpm run build
```

When running e2e tests in a parallel worktree, ensure `SPEM_PORT_OFFSET` is set
so that `vite preview` and Playwright target the same non-default port. See
`doc/BUILD.md` § Parallel worktrees.

### Running E2E Tests

Headless run:

```console
pnpm run e2e
```

### E2E Key Dependencies

- `@playwright/test`: test runner and browser automation
- `chromium`, `firefox`, `webkit`: browsers under test (installed via `pnpm exec playwright install chromium firefox webkit`)
