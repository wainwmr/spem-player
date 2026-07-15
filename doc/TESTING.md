# Testing

## Framework and Configuration

Tests use Vitest 4 with the jsdom environment. Configuration lives in `vite.config.ts`:

- `globals: true` (no need to import `describe`, `it`, `expect`)
- `environment: 'jsdom'`

`tsconfig.json` includes Vitest global types via `"types": ["vite/client", "vitest/globals"]`.

## Prerequisites

The pwa test suite reads the committed precomputed note data
(`packages/scores/src/lily/lilyData.json`) and needs no build step. The
`@spem/scores` suite exercises the LilyPond parser directly, which imports the
generated Ohm grammar bundle; the committed bundle is normally current, so this
is only needed after editing the grammar:

```console
pnpm run build:ohm
```

Without it, a scores parser test importing
`packages/scores/src/lily/ly-grammar.ohm-bundle` will fail.

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

Unit tests live under `packages/pwa/src/test/` and `packages/scores/test/` (excluding `*.integration.test.ts`) and follow the naming convention `*.test.ts`. They run in-process under jsdom and should complete in under a few seconds each. In-process tests against `packages/scores/build/` code (for example `postprocessSvg.test.ts`) live in `packages/scores/test/` alongside the integration suite.

Scripts in `packages/monitor/` that expose pure functions use the Node.js built-in test runner (`node:test`) rather than Vitest, and live alongside the script as `*.test.mjs`. Run them directly with `pnpm --filter monitor test` and lint them with `pnpm --filter @spem/monitor lint`. These files are excluded from the Vitest config (`packages/pwa/vite.config.ts`) and do not appear in `pnpm run test:unit` output.

Integration tests live in `packages/scores/test/*.integration.test.ts` and also follow `*.test.ts`. They typically spawn subprocesses (LilyPond, the build pipeline) and are substantially slower.

When changing integration tests, always run `pnpm run test:lilypond` locally — see § CI Behaviour below for which workflows run them in CI and the `packages/scores/test/**` trigger gap (#558).

## Test Layer Decision Criteria

Choosing the right layer keeps the suite fast and deterministic.

**Unit tests** (Vitest/jsdom, `packages/pwa/src/test/`) cover single modules in isolation:

- custom element behaviour and state helpers
- pure functions and domain models

The LilyPond parser, Ohm grammar, and build-script logic are tested in the
`@spem/scores` suite (Vitest/node, `packages/scores/test/`), where that code now
lives (#693).

**Integration tests** (Vitest/jsdom, `packages/scores/test/*.integration.test.ts`) cover cross-module behaviour and subprocess orchestration:

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
- computed CSS properties and cascade effects (specificity, inheritance, `!important`) — jsdom stores inline style strings but does not compute the cascade, so `style.*` can pass while the rendered result is wrong; use Playwright `getComputedStyle` / `elementFromPoint` / `toHaveCSS`
- real timer execution inside DOM event handlers (`vi.useFakeTimers()` does not intercept `setTimeout` scheduled by jsdom's internal event loop)

If a test needs any of the above, it belongs in the E2E layer. For the computed-CSS / cascade case, the reusable assertions in `packages/pwa/e2e/helpers/computed-style.ts` (`expectComputedStyle`, `expectElementFromPointStyle`, `assertReadableInMode`) are the test-of-record pattern — import them rather than re-deriving the `getComputedStyle` boilerplate.

## CI Behaviour

The two suites run in separate workflows. See `doc/CI.md` for the canonical description; in summary:

- PWA CI (`.github/workflows/pwa-ci.yml`) runs `pnpm run check`, `pnpm run build`, and `pnpm run test:unit` on push/PR to `main` when PWA-relevant paths change (`packages/pwa/**`, root workspace files, and the workflow file), plus a nightly cron. It is one source of the required `test` status check.
- The integration suite (`pnpm run test:lilypond`) runs in the Scores CI workflow (`.github/workflows/scores-ci.yml`) when anything under `packages/scores/**` changes. Its `test` job reports the required `test` status check for scores-only PRs.
- For PRs that change only unrelated paths (docs, other workflow files, etc.), `.github/workflows/test-noop.yml` reports a passing `test` status check.

## Key Dependencies

- `jsdom`: DOM implementation for Node.js
- `canvas`: Node.js Canvas API implementation (required for `MusicCanvas` tests)
- `@vitest/coverage-v8`: Coverage reporting

## Coverage Output

Coverage reports are written to the `coverage/` directory. This directory is gitignored.

## End-to-End Tests

End-to-end tests run in a real browser using Playwright. They live in `e2e/` and follow the naming convention `*.spec.ts`.

### Page-error capture

Every spec imports `test` and `expect` from `e2e/helpers/page-errors.ts`, not
from `@playwright/test` (enforced by a scoped ESLint `no-restricted-imports`
rule). That module wraps `test` with an automatic per-test fixture that
collects uncaught page exceptions and unhandled rejections (`pageerror`),
console errors, and `/audio/` requests that fail, return >=400, or whose 2xx
response lacks an `audio/*` content-type (SPA hosting serves a missing file as
200 text/html, so content-type, not status, is the reliable signal), and fails
the test at
teardown if any arrived. Playwright's default semantics ignore all three
channels, so without the fixture a test can pass while the page under it is
broken. `e2e/page-errors.spec.ts` is the fixture's self-test: each positive
case injects one error class and polls the capture array, and a final
`test.fail()`-annotated case pins that a non-empty capture fails at teardown.
If a spec legitimately produces a captured message, add a narrow, commented entry
to the module's `ALLOWLIST` rather than reverting the import. The current entries
cover third-party script hosts that are absent or DNS-blocked in test
environments, and the feedback submit handler's `console.error` on a failed send
(#798), which is an expected byproduct of the failure path
`e2e/feedback-modal.spec.ts` drives; that log is asserted in
`src/test/feedback.test.ts`, not in the spec. Service workers are blocked
suite-wide (`playwright.config.ts`) so page-level network events stay observable.

#### Injecting a failure: which technique, and why they differ

Two specs inject failures and appear to reach opposite conclusions about
`route.abort()`. They are not in conflict. The question is not whether aborting is
allowed; it is **what is actually failing**.

**Simulating an app-level network call: stub `fetch`, do not abort the route.**
Here the *call* is what must fail, and the browser's own resource error is an
artefact of the injection rather than part of the failure. `route.abort()` makes
the browser log `Failed to load resource: net::ERR_FAILED`, which the fixture
captures. Allowlisting it means adding an entry for a failed load of the site root
`/`, and the fixture's convention is to keep an entry as narrow as the URL: that
URL is the port-dependent `baseURL` (`worktree-ports.ts` gives each worktree its
own offset), so a conforming entry is not portable, and the broad text-only
alternative would mask a genuine failure to load the document itself. Reject the
call in the page instead (`page.addInitScript` replacing `window.fetch`, bound to
`window`), which issues no request and raises the same `TypeError` a genuinely
offline fetch raises. `failTheSend` in `e2e/feedback-modal.spec.ts` is the
implementation; it points here for the reason rather than restating it.

**Injecting a failed resource load: intercept the route.** Here the *resource* is
what fails, so there is nothing to stub, and the browser's resource error is part
of the condition rather than an artefact. Intercept it: `route.abort()` for a
request that never arrives, or `route.fulfill()` with a bad body for one that
arrives wrong. `e2e/fouc-fallback.spec.ts` (#801) does both, because a stylesheet
can fail in either shape and they take different paths through the fix.

**Escape to the spec's own page when the expected errors cannot be allowlisted
narrowly.** This is a separate decision from the one above, and it is easy to get
the reason wrong. It is not simply "because the browser logs a resource error": the
#801 backstop case fulfils a valid 200 and produces no resource error at all, and
it still needs the escape, because on that path *the app itself* deliberately logs
a `console.error`. Allowlisting either message suite-wide would blind every other
spec to a real regression on it. So open the page with `context.newPage()` and keep
the expected noise off the shared capture.

An escaped page inherits none of the fixture's listeners, nor its `auto` teardown
assertion, so it is not a free pass. Put a comment at the open site saying why the
page escapes, and re-attach the channels the spec still needs.

**Filter the console channel; do not drop it.** Dropping it wholesale is the easy
mistake, and it blinds the one page in the suite whose whole purpose is to exercise
the failing path. Re-attach `pageerror` and `console`, then assert positively: the
message the failure is *supposed* to produce must be present, the injection's own
resource error is allowed by URL, and anything else fails the test. A deliberate
diagnostic then cannot be deleted without a test going red, and an unrelated error
cannot hide. `e2e/fouc-fallback.spec.ts` shows the pattern
(`expectOnlyTheFoucDiagnostic`). Its injection pages do **not** re-attach the two
`/audio/` listeners, because they never touch audio and every other spec covers
that channel; drop a channel only when you can say that of it.

The fixture's *routes* (the Cloudflare beacon stub) are registered on the context,
not the page, so another page in the same context does still inherit those; only
the listeners are lost.

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

### E2E Type-Checking

E2e specs are type-checked separately from the app and unit-test code via
`pnpm run check:types:e2e` (`tsc --noEmit -p tsconfig.e2e.json`), which
`pnpm run check` runs as part of the CI gate. The e2e program uses its own
`packages/pwa/tsconfig.e2e.json`. It sets `types` to `@playwright/test` only,
dropping the base config's Vitest and Vite ambient globals: a spec that relied
on a Vitest global instead of importing `test`/`expect` from `@playwright/test`
now fails the typecheck, catching at the gate what would otherwise be a runtime
error.

The e2e program type-checks only `e2e/`; `playwright.config.ts` stays under the
base `pnpm run check:types`. The two `include` sets are disjoint by design — keep
every e2e spec under `e2e/` so the gate covers it.

### E2E Key Dependencies

- `@playwright/test`: test runner and browser automation
- `chromium`, `firefox`, `webkit`: browsers under test (installed via `pnpm exec playwright install chromium firefox webkit`)
