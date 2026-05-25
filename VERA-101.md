# VERA-101 Review Checklist

Mode: work
Generated: 2026-05-25 08:40
Last run:  2026-05-25 08:40

Toolkit: code-reviewer, pr-test-analyzer, silent-failure-hunter,
type-design-analyzer, comment-analyzer. All five returned. Findings
deduped and re-numbered below.

## Findings

### 101-01 — [critical] Reference aliasing: `defaultColors.choir` shares array with `config.choirHues`

Agents: silent-failure-hunter, type-design-analyzer
(also flagged as `important`/`suggestion` by code-reviewer, pr-test-analyzer)
File: `src/ts/common.ts:49`
Status: open
Notes:

`choir: config.choirHues` binds the *same* array object; any caller that
mutates `colors().choir` when the fallback branch fires (e.g. `push`,
`sort`, in-place assign) silently rewrites the config singleton for
every other module. `Colors.choir` is `number[]` (not `readonly`); no
freeze, no clone. Latent global-state corruption.

Fix candidates:

- (a) Spread copy in `defaultColors`: `choir: [...config.choirHues]`.
- (b) Type `Colors.choir` as `readonly number[]` and/or `as const` the
  tuple in `config.ts` (compile-time enforcement).
- (c) `Object.freeze(config.choirHues)` at module load.

### 101-02 — [important] CSS-present branch still hardcodes eight `--color-cN` reads

Agents: code-reviewer, silent-failure-hunter
File: `src/ts/common.ts:64-72`
Status: open
Notes:

The new comment on `defaultColors` claims "Choir hues live in
`config.choirHues` so the values have one source of truth shared with
the rest of the theming system" — but the live (CSS-present) branch
still does eight literal `--color-c1`...`--color-c8` reads. In
production the CSS branch is taken, so `config.choirHues` is never
read in the happy path. Adding a 9th choir would silently desync.
The TODO comment that flagged this exact gap was deleted in the same
commit.

Fix candidates:

- (a) Drive the live branch from `config.choirHues.length`:
  `choir: config.choirHues.map((_, i) => Number(style.getPropertyValue(\`--color-c${i + 1}\`)))`.
- (b) Soften the comment to say "fallback-only single source of truth"
  and restore (or re-issue) the TODO for the live-branch consolidation.
- (c) Out-of-scope per respec; defer to follow-up ticket.

### 101-03 — [important] Silent `NaN` from missing or malformed CSS property values

Agent: silent-failure-hunter
File: `src/ts/common.ts:64-73`
Status: open
Notes:

`Number(getPropertyValue("--color-cN"))` produces `NaN` for empty or
non-numeric values. NaN flows into `hsla(NaN, 80%, 55%, 1)` at
`MusicCanvas.ts:435,473,513` and `MusicScore.ts:229`, which browsers
render as transparent with no console error. The "CSS-present" gate
only checks `--color-background`; a partial-load state can satisfy
that gate while leaving `--color-c5` empty.

Pre-existing failure mode, exposed but not introduced by this PR.

Fix candidates:

- (a) Per-hue `Number.isFinite` check, fall back to
  `config.choirHues[i]` on NaN.
- (b) `logError` + return `defaultColors` if any hue is NaN.
- (c) Out-of-scope; file a separate ticket and leave a comment here.

### 101-04 — [important] No length/range validation on `config.choirHues`

Agent: silent-failure-hunter
File: `src/ts/config.ts:16`, `src/ts/common.ts:49`
Status: open
Notes:

If a deploy ships `choirHues` with 7 entries, `colors().choir[7]` is
`undefined` → `hsla(undefined, ...)` → invalid. If 9 entries, choir 9
silently has no rendering anywhere. Out-of-range values (e.g. `400`)
are accepted with no warning. The new vitest case asserts these
invariants at test time but not at module init.

Fix candidates:

- (a) Module-init validation in `common.ts` with `logError` if
  `config.choirHues.length !== config.choirs[0].length`.
- (b) Compile-time enforcement: tuple type
  `readonly [number, number, number, number, number, number, number, number]`
  on the field (also enables `as const`).
- (c) Runtime defensive clamp.

### 101-05 — [important] Test fallback may not match the production fallback path

Agent: silent-failure-hunter
File: `src/test/common.test.ts:135-146`
Status: open
Notes:

The test removes `--color-background` from `document.body.style`,
which under jsdom makes `getComputedStyle(...).getPropertyValue(...)`
return `""`. In a real browser before stylesheet load,
`getComputedStyle` may still inherit values from `<html>` or a
partially-loaded sheet. The test asserts "fallback fires when CSS
absent" but proves it for the jsdom mock specifically; the production
fallback condition (stylesheet missing or pre-load) may not produce
the same branch.

Fix candidates:

- (a) Add a Playwright pre-stylesheet test (large effort).
- (b) Accept jsdom limitation; document it in the test comment and
  leave a note on the function.
- (c) Test the realistic partial-load case (`--color-background`
  present, `--color-c3` missing) so at least the partial-CSS path
  is covered.

### 101-06 — [important] `(#101)` ticket references in new test names violate the user-skill rule

Agent: comment-analyzer
File: `src/test/common.test.ts:127, 137`
Status: open
Notes:

User-skill memory: comments must not reference the current task —
that information belongs in the PR description and rots over time.
Test names are effectively comments shown in test output. The file
already contains pre-existing `(#NNN)` references in unrelated tests,
so this is a convention violation that has propagated.

Fix candidates:

- (a) Strip `(#101)` from the two new test names; keep the
  descriptive prefix.
- (b) Leave it (matches local file convention; file a separate
  cleanup ticket).

### 101-07 — [important] Missing JSDoc/inline comment on `choirHues`

Agents: comment-analyzer, code-reviewer
File: `src/ts/config.ts:16`
Status: open
Notes:

The bare array `[360, 320, 30, 50, 110, 150, 190, 220]` does not
self-document: a future maintainer cannot tell that order is
positional (choir index → hue index), that the range is degrees
[0, 360], or that the length must equal `choirs[*].length`. The new
vitest test asserts these but it sits in a different file.

Fix candidates:

- (a) One-line JSDoc on the field, e.g.
  `/** HSL hue (0-360) per choir; index matches choirs[*]. Mirrors --color-c1..c8 in style.scss. */`.
- (b) Inline comment above the literal.

### 101-08 — [suggestion] Tighten `Colors.choir` to `readonly number[]` (or tuple of length 8)

Agent: type-design-analyzer
File: `src/ts/common.ts:32`
Status: open
Notes:

Even ignoring the aliasing concern in 101-01, the field is read-only
in practice. Tightening to `readonly number[]` documents intent and
prevents downstream mutation bugs. A length-8 tuple would also let
TypeScript check the matching 8-element literal in the CSS-present
branch.

### 101-09 — [suggestion] Test fallback depends on test ordering / `loadedColors` module state

Agents: code-reviewer, pr-test-analyzer
File: `src/test/common.test.ts:138-146`
Status: open
Notes:

`loadedColors` is module-scoped and warmed by the earlier
"CSS-present" test. The new fallback test relies on `reload=true` to
re-enter the branch, which works today but is order-fragile. A
`beforeEach` that resets the cache (and clears `--color-*` props)
would make the two `colors()` tests independent.

### 101-10 — [suggestion] Test asserts length as literal `8` rather than `config.choirs[0].length`

Agent: type-design-analyzer
File: `src/test/common.test.ts:127`
Status: open
Notes:

The "8" is the real domain invariant (count of choirs); pinning it to
a number disconnects the assertion from the domain rule. Replace with
`expect(config.choirHues).toHaveLength(config.choirs[0].length)`.

### 101-11 — [suggestion] `defaultColors` comment couples to identifier `config.choirHues`

Agent: comment-analyzer
File: `src/ts/common.ts:46-48`
Status: open
Notes:

The new comment hard-codes the field name `config.choirHues`. If
that field is ever renamed, the rename tooling will update the
reference at line 49 but is likely to miss the prose. Phrase as
"Choir hues are sourced from config" rather than naming the symbol.

### 101-12 — [suggestion] Stale `Config` type — do not extend it

Agent: type-design-analyzer
File: `src/ts/common.ts:35-42`
Status: open
Notes:

The pre-existing `Config` type does not match the actual exported
config shape (missing `recording`, `recording_label`, `intro_beats`,
`barno`, `bartime`; `choirs` typed wrong). Adding `choirHues` to it
in isolation would entrench the lie. Pragmatic options: delete it if
unused, or replace with `typeof import("./config").default` so it
auto-tracks. **Not introduced by this PR — do not action here.**

### 101-13 — [suggestion] Pre-existing `// Choir color hues` on `Colors.choir` could note "values in degrees, 0-360"

Agent: comment-analyzer
File: `src/ts/common.ts:32`
Status: open
Notes:

The diff is the cheap moment to clarify the type-level comment to
match the contract the new test enforces. One-line tweak.

### Summary

- 1 critical (aliasing)
- 6 important (CSS-branch hardcoding, NaN, length/range, test/prod
  fallback gap, `(#101)` refs, missing JSDoc)
- 6 suggestions (readonly type, test ordering, length-vs-domain
  assertion, comment-coupling, stale `Config` type, `Colors.choir`
  comment)

The toolkit independently flagged the aliasing bug from two different
angles (silent-failure-hunter from the mutation-of-shared-state
direction, type-design-analyzer from the missing-`readonly` direction).
Two agents also flagged the same "single source of truth claim is
half-delivered" concern about the CSS-present branch. These two
findings are the strongest signals.

## Final status — Bob's verdicts

Walked through with the user; Bob applied the four-axis triage
(real defect / defensive nit / pre-existing / not applicable) per
the updated `method-sub-vera-gate.md` step 4.

- **101-01 — addressed** (commit `7fa7331`). Real defect, caused by
  this diff. The minimal fix is the spread copy plus a regression
  guard.
- **101-02 — addressed** (commit `217093e`). Real defect (comment
  vs code drift), caused by this diff. Soften the claim, restore
  the TODO.
- **101-03 — deferred to refactor report** (`refactor-common.ts.md`).
  Pre-existing; `Number(getPropertyValue(...))` NaN path is not new.
- **101-04 — deferred to refactor report**. Defensive nit; no current
  manifestation. Would warrant a separate ticket if it ever bites.
- **101-05 — deferred to refactor report**. Pre-existing (jsdom vs
  production fallback path fidelity is an existing test-fidelity gap,
  not introduced here).
- **101-06 — rejected**. Pre-existing file convention; the user-skill
  rule predates the convention spread. Bob's defence: changing the
  two new test names while leaving the existing seven matches would
  create inconsistency without improving comprehension. A separate
  cleanup ticket covering all `(#NNN)` test names in the file is the
  right scope.
- **101-07 — addressed** (commit `16dac2d`). Real value, low cost,
  on the new field — the JSDoc records the contract the new test
  enforces.
- **101-08 — deferred to refactor report**. Pre-existing
  `Colors.choir: number[]` mutability; `readonly` tightening is a
  type-design change for a follow-up.
- **101-09 — deferred to refactor report**. Test ordering / cache
  state risk is real but pre-existing (the `loadedColors` module
  state predates the new test).
- **101-10 — deferred to refactor report**. Length-vs-domain
  assertion is a suggestion, not load-bearing.
- **101-11 — rejected**. Bob's defence: identifying `config.choirHues`
  by name in the prose is more informative than abstracting to "the
  config field". The rename-rot risk is small; the comprehension
  gain is concrete.
- **101-12 — deferred to refactor report** (the finding itself
  flagged "not introduced by this PR — do not action here").
- **101-13 — deferred to refactor report**.

Pre-existing items routed to `wiki/refactor-common.ts.md` so they
do not disperse.

## Re-run (2026-05-25)

After commits `7fa7331`, `217093e`, `16dac2d` landed, re-ran the five
agents. Three returned clean (code-reviewer, type-design-analyzer,
comment-analyzer). Two converged on a sub-finding of 101-01:

### 101-14 — [important] Fallback `colors().choir` is still a per-module-load singleton

Agents: pr-test-analyzer, silent-failure-hunter
File: `src/ts/common.ts:50, 62`
Status: addressed (commit `008057f`)
Notes:

The spread-copy fix at line 56 (`choir: [...config.choirHues]`)
allocates the copy once, at module load, into the `defaultColors`
const. Every `colors()` call that takes the fallback branch returns
the *same* `defaultColors` object — so the `choir` array is shared
across all fallback calls. A caller that mutates `colors().choir`
no longer corrupts `config.choirHues` (101-01's headline guarantee),
but they still corrupt every subsequent fallback call's view.
Asymmetric with the CSS-present branch, which builds a fresh array
literal per call.

Bob's verdict: real partial-fix of 101-01. The category 101-01
flagged was "shared mutable state escape"; closing it for
`config.choirHues` only is half-delivered. Minimal complete fix:
build a fresh array on every fallback call.
