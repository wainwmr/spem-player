# VERA-261 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-28 14:35
Last run:  2026-05-28 14:35

See also: [Original Report (cycle 1)](https://github.com/wainwmr/spem-player/issues/261#issuecomment-4564263429)

## Summary

[To be finalised at close-out.]

## Findings

### 261-01 — [critical] Shebang on buildScores.mjs breaks Vitest import

> **code-reviewer:** `npx vitest run src/test/buildScores.test.ts` fails with `RolldownError: Parse failure: Invalid Character "!"` at the `#!/usr/bin/env node` shebang on line 1. Vite's SSR transform does not strip shebangs. `npm run test:unit` is broken on this branch — the PR's own tests don't run.

**Bob's triage:** Real defect, blocking. The test gate was clearly skipped during development. Fix: remove the shebang. The script is invoked via `node build/buildScores.mjs ...` in `package.json`; doesn't need to be directly executable (matches `postprocessSvg.mjs` pattern). Address now.

**Resolution:** addressed (commit d372937).

### 261-02 — [important] Dead alias `const args = argv;`

> **code-reviewer #3, comment-analyzer #5:** `function parseArgs(argv = process.argv.slice(2)) { const args = argv; ...` — pure alias kept to minimise diff. Reads as "what's the difference between argv and args?" to future readers.

**Bob's triage:** Real cosmetic defect. Rename the parameter to `args` and drop the alias line. Address now.

**Resolution:** addressed (commit d372937).

### 261-03 — [important] `.d.mts` types misrepresent runtime guarantees

> **type-design L2/L3/L5, silent-failure S1:**
> - `version?: string` — version is always present (seeded by defaults); should be `version: string`.
> - `notation?: string | null` — same; should be `notation: string | null`.
> - `"skip-if-missing"` consumed as boolean at `buildScores.mjs:174` but absorbed by the index signature; should be named `"skip-if-missing"?: boolean`.

**Bob's triage:** Real type defect. The `.d.mts` is new in this PR; fixing it now costs five lines. Does not touch parser behaviour (no scope creep). Address now.

**Resolution:** addressed (commit d372937).

### 261-04 — [important] parseArgs has no JSDoc

> **comment-analyzer #1:** Newly promoted from internal helper to public export, gained optional `argv` parameter. Future maintainers can't tell whether `argv` should include node/script-name entries (it shouldn't), whether unknown flags are validated (no), etc.

**Bob's triage:** Real documentation gap; the test file is doing the documentation work today via test names. Add a JSDoc block naming the contract. Address now.

**Resolution:** addressed (commit d372937).

### 261-05 — [important] buildPattern has no JSDoc

> **comment-analyzer #2:** Extracted to make it testable; encodes non-obvious filename convention (`Choir ` prefix with literal space mirrored to on-disk layout).

**Bob's triage:** Add one-line JSDoc. Address now.

**Resolution:** addressed (commit d372937).

### 261-06 — [important] `.d.mts` has no header comment

> **comment-analyzer #3:** Only `.d.mts` in `build/`; future maintainer running TS migration has no way to know it must be kept in sync manually.

**Bob's triage:** Add 2-3 line header. Address now.

**Resolution:** addressed (commit d372937).

### 261-07 — [important] isMain guard has no comment

> **comment-analyzer #6, silent-failure I4:** `process.argv[1] && resolve(process.argv[1]) === resolve(__filename)` is the standard ESM "am I main?" idiom but not self-evident; the `__filename` declaration in an `.mjs` file shadows the CJS global it imitates.

**Bob's triage:** Add a one-line comment naming the guard's purpose. Address now.

**Resolution:** addressed (commit d372937).

### 261-08 — [important] Unknown flags silently accepted (CLUSTER)

> **silent-failure C1, type-design L5:** No allowlist. `--notatoin=early` (typo) silently accepted; downstream produces unnecessary rebuild without signal. The PR ratifies this without flagging it.

**Bob's triage:** Real silent-failure mode, but **scope creep** — fixing requires adding an allowlist + raising errors, which changes parser behaviour beyond "add tests for current behaviour". File a separate parser-hardening ticket.

**Resolution:** deferred to Workbench Item #270 (parser hardening).

### 261-09 — [important] Missing-value detection (CLUSTER)

> **silent-failure C2, pr-test-analyzer A:** `parseArgs(["--choir", "--version", "OUP"])` silently yields `{choir: true, version: "OUP"}`. The parser can't distinguish "boolean flag" from "value-expecting flag with missing value".

**Bob's triage:** Same cluster as 261-08. Requires per-flag arity table — parser redesign. Defer to follow-up ticket.

**Resolution:** deferred to Workbench Item #270.

### 261-10 — [important] Empty values silently accepted

> **silent-failure I1, pr-test-analyzer C:** `parseArgs(["--version="])` → `{version: ""}`. Downstream confusion.

**Bob's triage:** Same cluster. Defer.

**Resolution:** deferred to Workbench Item #270.

### 261-11 — [important] Repeated flag last-wins unpinned

> **silent-failure I2, pr-test-analyzer B:** `parseArgs(["--version=A", "--version=B"]).version === "B"`. Behavioural contract unstated.

**Bob's triage:** Could be pinned with a single test (cheap), but doing so requires deciding whether last-wins is the intended contract or whether repeated flags should error. That decision belongs in the parser-hardening ticket. Defer.

**Resolution:** deferred to Workbench Item #270.

### 261-12 — [important] choir type vs runtime mismatch (CLUSTER)

> **silent-failure I3, type-design L4:** `.d.mts` types `choir: string | undefined`. Runtime accepts `true` (see 261-09), 0, etc. Type declaration lies.

**Bob's triage:** Same cluster as 261-08/09 — fixing means the parser enforces "choir requires value". Defer to ticket. (Note: 261-03 doesn't touch choir to avoid scope creep into the parser-hardening domain.)

**Resolution:** deferred to Workbench Item #270.

### 261-13 — [important] Key containing `=` after the first

> **pr-test-analyzer D:** `indexOf("=")` finds the FIRST equals. `--filter=a=b` → `filter: "a=b"`. Unstated contract.

**Bob's triage:** Cluster. Defer.

**Resolution:** deferred to Workbench Item #270.

### 261-14 — [important] buildPattern shell-meta values

> **pr-test-analyzer E:** `--choir "*"` → `Choir *.ly`. Glob meta passes through.

**Bob's triage:** Cluster. Defer.

**Resolution:** deferred to Workbench Item #270.

### 261-15 — [suggestion] Test description on line 44 too narrow

> **comment-analyzer #4:** "does not treat a following --arg as a value for the previous key" — but the test also asserts `options.version === "OUP"`, demonstrating the second property.

**Bob's triage:** Cheap rename of the test name. Address now (one-line change).

**Resolution:** addressed (commit d372937).

### Suggestions (not blocking; not addressed)

- code-reviewer #2: test gate skipped — the act of the Vera gate IS the gate, finding 261-01 is the symptom.
- pr-test-analyzer F/G/H: forward-slash naming, hardcoded defaults coupling, no argv-default test — defensive coverage; defer.
- comment-analyzer #7/#8: test file header, choir-undefined assertion comment — cosmetic; accept as-is.
- type-design suggestions: closed-record interface, narrow index signature — refactor opportunity; defer to refactor report for `build/buildScores.mjs`.
