# Testing

## Framework and Configuration

Tests use Vitest 4 with the jsdom environment. Configuration lives in `vite.config.ts`:

- `globals: true` (no need to import `describe`, `it`, `expect`)
- `environment: 'jsdom'`

`tsconfig.json` includes Vitest global types via `"types": ["vite/client", "vitest/globals"]`.

## Prerequisites

The Ohm.js grammar bundle must be built before tests can run. `npm run check` and
`npm run build` handle this automatically, but if you are running tests in
isolation you may need:

```console
npm run build:ohm
```

Without this step, any test importing `src/ohmjs/ly-grammar.ohm-bundle` will fail.

## Running Tests

Run unit tests once (excludes integration tests):

```console
npm run test:unit
```

Run integration tests once (subprocess-heavy, slower):

```console
npm run test:integration
```

Run all tests:

```console
npm test
```

Watch mode:

```console
npm run test:watch
```

Single run with coverage:

```console
npm run test:coverage
```

## Test File Location and Naming

Unit tests live anywhere under `src/test/` *except* `lilypond/test/*.integration.test.ts` and follow the naming convention `*.test.ts`. They run in-process under jsdom and should complete in under a few seconds each. In-process tests against `build/` code (for example `postprocessSvg.test.ts`) live here as unit tests because they don't spawn subprocesses; the integration suite covers the subprocess-orchestrated `buildScores` pipeline.

Integration tests live in `lilypond/test/*.integration.test.ts` and also follow `*.test.ts`. They typically spawn subprocesses (LilyPond, the build pipeline) and are substantially slower.

If a new shared fixture directory is introduced (e.g. `src/test/fixtures/`), add it to the `build-related` filter in `.github/workflows/ci.yml` so that PRs touching it exercise the integration suite.

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

The two suites run as separate jobs in `.github/workflows/ci.yml`. See `doc/CI.md` for the canonical description; in summary:

- The `test` job runs `npm run test:unit` on every push and pull request and is the required status check.
- The `integration` job runs unconditionally on push to `main` and on a nightly cron. On pull requests it is gated by `dorny/paths-filter` and runs only when the PR touches build-related paths — see `doc/CI.md` for the canonical list.

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
npm run build
```

When running e2e tests in a parallel worktree, ensure `SPEM_PORT_OFFSET` is set
so that `vite preview` and Playwright target the same non-default port. See
`doc/BUILD.md` § Parallel worktrees.

### Running E2E Tests

Headless run:

```console
npm run e2e
```

### E2E Key Dependencies

- `@playwright/test`: test runner and browser automation
- `chromium`, `firefox`, `webkit`: browsers under test (installed via `npx playwright install chromium firefox webkit`)
