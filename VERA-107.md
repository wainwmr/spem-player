# VERA-107 Review Checklist

Mode: work
Generated: 2026-05-24 19:15
Last run:  2026-05-24 19:15

## Findings

### 107-01 — [critical] canvas.test.ts references undefined `dict` global

Agent: code-reviewer + pr-test-analyzer
File: src/test/canvas.test.ts:121, 122, 125, 130, 131, 134
Status: open
Notes: Last session's rebase removed the import of `dict, ranges, barCount,
frLocations` from canvas.test.ts but left six bare `dict` references in the
two #244 regression tests. `tsc --noEmit` reports 6 TS2304 errors; the two
tests crash with `ReferenceError: dict is not defined` at runtime.
**CI is red on this branch.** Fix: change `dict[2]` → `canvas!.dict[2]`,
`dict[0]` → `canvas!.dict[0]`, `delete dict[0]` →
`delete canvas!.dict[0]`, and similar for the `saved`/restore lines.

### 107-02 — [critical] lily.test.ts imports removed exports

Agent: code-reviewer
File: src/test/lily.test.ts:3, 4, 7
Status: open
Notes: Imports `ranges`, `dict`, `frLocations` from `../ts/lily`, but the
producer dropped those exports. `tsc --noEmit` reports TS2724 and TS2305
errors. The imports resolve to `undefined` at runtime and the file shadows
them via destructuring, so vitest happens to pass — but `npm run check`
fails. Fix: remove `ranges`, `dict`, `frLocations` from the import list.

### 107-03 — [important] processLilypond throw is invisible to users

Agent: silent-failure-hunter
File: src/ts/lily.ts:283 (throw), src/ts/MusicCanvas.ts:163 (caller)
Status: open
Notes: The refactor correctly upgraded `console.error` to
`throw new Error("Lilypond parse failed: ...")`. But the only production
caller is `MusicCanvas.#init()`, invoked from `connectedCallback` as
`await this.#init()`. Nothing catches the throw. On parse failure: the
canvas is left showing the "Loading..." placeholder forever and the user
sees no error indication. The throw is improved for developers
(visible in devtools as "Uncaught (in promise)"); it is a regression in
user-visible behaviour relative to the old silent path.
Fix: wrap `processLilypond()` call in MusicCanvas#init with try/catch
that replaces the "Loading..." placeholder with an actionable error
message.

### 107-04 — [important] barCount global mutated before detectFalseRelations

Agent: silent-failure-hunter
File: src/ts/lily.ts:356-358
Status: open
Notes: The HACK comment acknowledges retaining the `barCount` global for
MusicControls. The order in `processLilypond` is:
1. `barCount = localBarCount` (line 356)
2. `frLocations = detectFalseRelations(activeNotes)` (line 357)
3. `return {...}` (line 358)

If `detectFalseRelations` throws, the global is updated to reflect the
current parse but the caller's `processLilypond()` invocation throws
before returning. MusicCanvas's fields remain stale; MusicControls reads
the new global. Partial-state bug. Currently latent (detectFalseRelations
doesn't throw today). Fix: move `barCount = localBarCount` to
immediately before `return`.

### 107-05 — [important] MusicControls races with MusicCanvas init

Agent: silent-failure-hunter
File: src/ts/MusicControls.ts:110, 162-163
Status: open
Notes: Pre-refactor, `processLilypond()` ran during app boot and mutated
`barCount` synchronously. MusicControls could rely on it being populated
by the time its own connectedCallback ran. Post-refactor,
`processLilypond` is only called inside `MusicCanvas.#init()`. If
`<music-controls>` connects before `<music-canvas>` finishes init,
MusicControls reads `barCount === 0`, sets `barinput.max="0"`, and the
bar input is silently broken for the user.
Fix: complete the migration — have MusicControls consume the return value
explicitly. Out of scope for incremental refactor; defer to a Workbench
item with clear documentation that this is a known latent issue.

## Suggestions (non-blocking)

- `lily.test.ts:79-84` "processLilypond throws on parse failure" test
  is fragile: it builds a `failedMatch` from a string that may or may
  not actually fail, then mocks it. Replace with a definitively-failing
  match (the same `\ficta` pattern already used at line 46).
- `lily.test.ts:86-93` idempotence test asserts only `length` equality.
  Add `result1 !== result2` (separate object identities) so accumulated
  state would be detected.
- `canvas.test.ts:30-37` "draw() early returns when dict/ranges empty"
  test no longer adds the canvas to DOM, so it exercises the
  `!this.canvas` guard rather than the empty-ranges guard. Original
  coverage is lost; restore by setting `canvas!.dict = []; canvas!.ranges = [];`
  on the attached canvas instead.
- No test asserts the producer/consumer boundary — that MusicCanvas's
  `dict`, `ranges`, `barCount`, `frLocations` fields actually get
  populated from the return value. One assertion would close this.
- No test verifies what happens to the canvas when parser fails (see
  107-03). Would lock in the user-visible behaviour after that fix.
