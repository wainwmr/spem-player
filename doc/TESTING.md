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

Run tests once:

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

Tests live in `src/test/` and follow the naming convention `*.test.ts`.

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

### Running E2E Tests

Headless run:

```console
npm run e2e
```

### E2E Key Dependencies

- `@playwright/test`: test runner and browser automation
- `chromium`, `firefox`, `webkit`: browsers under test (installed via `npx playwright install chromium firefox webkit`)
