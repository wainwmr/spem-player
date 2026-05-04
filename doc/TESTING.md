# Testing

## Framework and Configuration

Tests use Vitest 3 with the jsdom environment. Configuration lives in `vite.config.ts`:

- `globals: true` (no need to import `describe`, `it`, `expect`)
- `environment: 'jsdom'`

`tsconfig.json` includes Vitest global types via `"types": ["vite/client", "vitest/globals"]`.

## Prerequisites

The Ohm.js grammar bundle must be built before tests can run:

```console
npm run build:ohm
```

Without this step, any test importing `src/ohmjs/ly-grammar.ohm-bundle` will fail.

## Running Tests

Watch mode:

```console
npm test
```

Single run with coverage:

```console
npm run coverage
```

Vitest UI:

```console
npm run test:ui
```

## Test File Location and Naming

Tests live in `src/test/` and follow the naming convention `*.test.ts`.

## Key Dependencies

- `jsdom`: DOM implementation for Node.js
- `canvas`: Node.js Canvas API implementation (required for `MusicCanvas` tests)
- `vitest-fetch-mock`: Fetch mocking utility
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

### Running E2E Tests

Headless run:

```console
npm run test:e2e
```

Interactive UI mode:

```console
npm run test:e2e:ui
```

View the last HTML report:

```console
npm run test:e2e:report
```

### E2E Key Dependencies

- `@playwright/test`: test runner and browser automation
- `chromium`: browser under test (installed via `npx playwright install chromium`)

## Local Tooling Tests

Python helper scripts in `scripts/` have their own test suite in `tests_local/`.
These tests use `pytest` and `unittest.mock` to mock `subprocess` calls. They are
separate from the Vitest suite and are not tracked in git.
