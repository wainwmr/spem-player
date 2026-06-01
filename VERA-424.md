# VERA-424 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-06-01 01:?? GMTST
Last run:  2026-06-01 01:?? GMTST

See also: [Original Report (cycle 1)](LINK_TO_BE_FILLED_AFTER_ORIGINAL_POSTED)

## Summary

The cleanest gate of the cluster: pass 1 raised **no criticals and no importants** from any of the five
reviewers. The change follows a detailed, well-formed spec, and the discriminated-union return + temp-dir
real-file tests drew explicit praise (type-design rated the union 9/9/9, "the right call"; silent-failure
confirmed it is a clean fail-loud fix with no new hole and a strictly-smaller residual than before).

Only suggestions surfaced. Two cheap ones were actioned in-PR: an OUP (non-default `version`) unit case
that pins the `version` parameter (a hard-code mutant survived without it), and a one-word comment polish
("out of #424 scope"). The rest were noted as non-blocking. Because the only post-pass-1 change is one
additive unit test plus a comment word — no production logic touched — a five-agent re-run was not
warranted; the addition was verified locally (test green, tsc/format/lint clean, and the mutant confirmed
killed). One pass.

## Findings

No critical or important findings. Suggestions and their dispositions:

- **pr-test-analyzer — non-default `version` (OUP) unpinned [5/10]:** a mutant hard-coding "Hugh Keyte" in
  the probe paths survived the suite. **Actioned** (commit COMMIT_FIX) — added a `canaryCheck("OUP", root)`
  unit test (both OUP canaries present → `{ok:true}`); verified it fails against the version-hardcode mutant.
- **comment-analyzer — "(#424 scope)" ambiguity [trivial]:** the JSDoc used #424 for both "what we did" and
  "what we deferred". **Actioned** (commit COMMIT_FIX) — reworded to "(out of #424 scope)".
- **pr-test-analyzer — inverse partial-restore integration case [5/10]:** only modern-present is tested
  end-to-end, not early-present-only. **Noted** — the unit suite pins the modern-before-early ordering
  precisely; the integration inverse is redundant. Not added.
- **silent-failure-hunter — error message is developer- not CI-oriented [medium, "acceptable as-is"]:** the
  remedy line and the absence of a "cache may have restored partially" hint. **Noted** — the message already
  names the missing path, which points a maintainer at the partial-cache cause; left as-is to keep scope tight.
- **code-reviewer — canaryCheck ignores `--notation` [suggestion]:** a single-notation `--skip-if-missing`
  build still requires both canaries. **Noted** — not a regression (the old probe also ignored `--notation`);
  the CI/Netlify case always builds both notations. A future ticket if single-notation skip becomes a real
  workflow.
- **type-design — hand-written `.d.mts` has no compile-time conformance check [standing, pre-existing]:**
  out of #424 scope; the two-arm `toEqual` tests are the compensating control across the whole project.

## Positives (affirmed)

The both-notation probe achieves the ticket's goal (rejects half-restored trees, fail-loud); the residual
(non-canary choir missing within a present notation) is honestly documented as deferred and is strictly
smaller than the pre-#424 gap; the discriminated union makes both illegal states unrepresentable; the
`.d.mts`/`.mjs`/runtime agree with no drift; the non-skip path is byte-identical to main; no stale
single-canary prose remains anywhere in the tree.
