# VERA-261 Original Report (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-28 14:30

See also: [Final Synthesis (cycle 1)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)

## Raw agent reports (pass 1)

### code-reviewer

> ### Critical
>
> **1. Tests fail to load — Vite/Rolldown rejects the shebang in the imported module.** Confidence: 100.
> - File:line — `src/test/buildScores.test.ts:2` (the new import) and `build/buildScores.mjs:1` (the pre-existing `#!/usr/bin/env node`).
> - `npx vitest run src/test/buildScores.test.ts` produces `RolldownError: Parse failure: Parse failed with 1 error: Invalid Character "!"` at the shebang. The full unit suite reports `Test Files 1 failed | 19 passed (20)` — the new test file is the only failure. **`npm run test:unit` is broken on this branch.**
> - Why missed today: nothing else imports `build/buildScores.mjs` from inside Vite's module graph. Node strips shebangs at runtime, so direct execution and subprocess spawning are unaffected. Vite's SSR transform does not strip them.
> - Violates `doc/CONTRIBUTING.md` "Do not break the build pipeline" and "Ensure tests pass".
> - Fix: remove the shebang from `buildScores.mjs` (it's invoked via `node build/buildScores.mjs ...` in `package.json`, doesn't need to be directly executable; `postprocessSvg.mjs` has no shebang and works the same way).
>
> ### Important
>
> **2. `package.json` test scripts not run before publishing.** The single failing test file shows the gate was skipped.
>
> ### Suggestion
>
> **3. Dead local rename in parseArgs.** `function parseArgs(argv = ...) { const args = argv; ...` — `args` is just `argv` under a different name. Either rename the parameter to `args` and drop line 19, or use `argv` directly.

### pr-test-analyzer

> ### Important
>
> **[A] Positional (non-`--`) argument is silently dropped — rating 7.** `if (arg.startsWith("--"))` has no `else`. A bare argument like `OUP` or `-version` (single dash) is silently discarded.
>
> **[B] Repeated flag — last-wins is unpinned — rating 6.** `parseArgs(["--version=A", "--version=B"])` → `B`. CI-script consumers rely on this; not tested.
>
> **[C] Empty-value cases — rating 6.** `parseArgs(["--version="])` → `{version: ""}`. Not pinned.
>
> **[D] Key containing `=` after the first `=` — rating 5.** `indexOf("=")` finds the FIRST equals; `--filter=a=b` → `filter: "a=b"`. Unstated contract.
>
> **[E] buildPattern quoting / shell-meta values — rating 5.** `--choir "*"` produces `Choir *.ly`. No test or comment.
>
> ### Test quality
>
> **[F] buildPattern test path uses forward slashes only — rating 4.**
> **[G] Hard-coded default values couple tests to defaults block — rating 3.**
> **[H] No test for the `argv` default parameter — rating 3.**
>
> ### Recommended action
>
> Add tests for [A] (positional drop) and [B] (repeated flag last-wins) before merge — both are real behaviours future refactors could silently flip.

### silent-failure-hunter

> ### CRITICAL
>
> **C1. Unknown flags silently accepted as truthy state.** `parseArgs` has no allowlist. `--frobnicate`, `--notatoin=early` (typo), `--version-x=OUP` all parse cleanly. Downstream `main()` reads only `version/notation/choir/skip-if-missing` — every other key, including misspellings, silently discarded. User impact: `npm run build:scores -- --notatoin=early` silently builds **both** notations using defaults, producing minutes of unnecessary rebuild with no signal. The PR promotes "unknown flags silently ignored" from accident-of-implementation to tested contract.
>
> **C2. Test "does not treat a following --arg as a value" locks in a real bug.** `parseArgs(["--choir", "--version", "OUP"])` silently yields `{choir: true, version: "OUP"}`. The parser can't distinguish "boolean flag" from "value-expecting flag with missing value"; the test cements that indistinguishability.
>
> ### IMPORTANT
>
> **I1. Empty string values silently accepted.** `parseArgs(["--version="])` returns `{version: ""}`. Downstream: `lyDir = "src/lilypond//early"`, glob returns `[]`, user sees confusing path.
>
> **I2. Repeated flags silently last-wins.** Neither code nor any test states it.
>
> **I3. buildPattern accepts non-string choir without complaint.** The `.d.mts` types `choir` as `string | undefined`. Runtime accepts `true` (see C2), 0, any falsy → wildcard branch; any truthy non-string interpolates via `${choir}` and produces garbage filenames. **The type declaration claims a contract the implementation does not enforce.**
>
> **I4. isMain guard fails open on falsy `process.argv[1]`.** Safe direction but no comment explains the guard's purpose.
>
> ### SUGGESTION
>
> S1. The `.d.mts` `[key: string]: string | boolean | null | undefined` index signature normalises C1 in types. TypeScript consumers get no warning that `options.notatoin` exists at runtime.

### type-design-analyzer

> ### Type: parseArgs return shape (`build/buildScores.d.mts:1-6`)
>
> - **Encapsulation: 4/10** — Index signature leaks the entire internal bag.
> - **Invariant Expression: 3/10** — `version?: string` misrepresents always-present. `choir?: string` excludes the `true` value the parser produces. Index signature swallows misspellings.
> - **Invariant Usefulness: 4/10** — Type forces consumers through `string | boolean | null | undefined`; no compile-time link to the closed set of known flags.
> - **Invariant Enforcement: 2/10** — Nothing distinguishes always-present from sometimes-present; nothing constrains `version` to known values.
>
> ### Important findings on `.d.mts`
>
> - **L2:** `version?: string` should be `version: string` (defaults seed it).
> - **L3:** `notation?: string | null` should be `notation: string | null` (also seeded).
> - **L4:** `choir?: string` excludes `true` that parser can produce.
> - **L5:** Index signature swallows misspellings.
>
> ### Suggestions
>
> - `"skip-if-missing"?: boolean` should be a named slot.
> - `null` is over-included in the index-signature union.
>
> ### buildPattern signature: small, total, well-scoped. Encapsulation 9/10. No concerns.

### comment-analyzer

> ### Important
>
> **1. parseArgs has no JSDoc.** Promoted from internal helper to public export, gained optional `argv` parameter with `process.argv.slice(2)` default. None documented. Add JSDoc naming the contract the tests pin.
>
> **2. buildPattern has no JSDoc and no rationale.** Extracted purely to make it testable; encodes non-obvious filename convention (`Choir ` prefix with literal space).
>
> **3. `.d.mts` has no header comment.** Only `.d.mts` in `build/`; future maintainer running TS migration has no way to know it must be kept in sync manually.
>
> **4. Test description on line 44 is narrower than what the test demonstrates.** "does not treat a following --arg as a value for the previous key" — but the test also asserts `options.version === "OUP"`, demonstrating the second property.
>
> ### Suggestions
>
> **5. `const args = argv;` adds nothing — pure alias.**
> **6. isMain guard has no comment.**
> **7. Test file has no header.**
> **8. `expect(options.choir).toBeUndefined();` pins contract that choir is not defaulted, but reads as trivial.**
>
> No critical drift. No backward references. No stale TODOs.
