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

## Testing Internal Functions

Modules export an `exportedForTesting` object containing functions and state that are not part of the public API but require unit testing. For example, `lily.ts` exports `setupLilypondParser`, `romanise`, and parser state via this object.

## Custom Elements in Tests

The application defines custom HTML elements (`music-canvas`, `music-score`, `music-controls`, etc.). Tests that instantiate these elements must ensure they are defined in the jsdom document before assertions run. The `define(tag)` static method on each class handles registration.

## Coverage Output

Coverage reports are written to the `coverage/` directory. This directory is gitignored.

## Local Tooling Tests

Python helper scripts in the project root (`discover.py`, `publish.py`,
`sync_upstream.py`) have their own test suite in `tests_local/`. These tests
use `pytest` and `unittest.mock` to mock `subprocess` calls. They are separate
from the Vitest suite and are not tracked in git.
