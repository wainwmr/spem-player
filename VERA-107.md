# VERA-107 Review Checklist

Mode: work
Generated: 2026-05-24 19:15
Last run:  2026-05-24 20:18

## Findings

### 107-01 — [critical] canvas.test.ts references undefined `dict` global

Agent: code-reviewer + pr-test-analyzer
File: src/test/canvas.test.ts:121, 122, 125, 130, 131, 134
Status: addressed
Notes: Fixed in commit `5063f24`. The six bare `dict` references in the
two #244 regression tests now use `canvas!.dict[...]`. Verified: tsc
clean, both #244 tests pass.

### 107-02 — [critical] lily.test.ts imports removed exports

Agent: code-reviewer
File: src/test/lily.test.ts:3, 4, 7
Status: addressed
Notes: Fixed in commit `5063f24`. Removed `ranges`, `dict`, `frLocations`
from the import list. `barCount` retained (still exported per the HACK
comment). Verified: tsc clean.

### 107-03 — [important] processLilypond throw is invisible to users

Agent: silent-failure-hunter
File: src/ts/lily.ts:283 (throw), src/ts/MusicCanvas.ts:163 (caller)
Status: deferred
Notes: Real defect but pre-existing in weaker form (old `console.error`
path was also silent to users). Deferred to Workbench Item #230
(Post-#107: surface parse errors + complete barCount migration).

### 107-04 — [important] barCount global mutated before detectFalseRelations

Agent: silent-failure-hunter
File: src/ts/lily.ts:356-358
Status: deferred
Notes: Latent partial-state hazard (detectFalseRelations doesn't throw
today). Tracked in Workbench Item #230. Will be eliminated by completing
the barCount migration there.

### 107-05 — [important] MusicControls races with MusicCanvas init

Agent: silent-failure-hunter
File: src/ts/MusicControls.ts:110, 162-163
Status: deferred
Notes: Acknowledged in the in-source HACK comment as an explicit
incremental-refactor decision. Tracked in Workbench Item #230 for the
full migration. Out of scope for #107 itself.

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
