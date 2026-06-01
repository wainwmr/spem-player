# VERA-424 Original Report (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-06-01 01:?? GMTST

See also: [Final Synthesis (cycle 1)](LINK_TO_BE_ADDED_AT_CLOSE_OUT)

## Raw agent reports (pass 1)

Five `pr-review-toolkit` agents reviewed `git diff origin/main...andrew/424-skip-if-missing-canary`
(`build/buildScores.mjs` + `.d.mts`, `src/test/buildScores.test.ts`, `src/test/integration/buildScores.test.ts`).
**No criticals, no importants from any reviewer** — the spec was followed closely and the change is
well-tested. Only suggestions follow.

### code-reviewer

> Clean at critical and important. The implementation, types, export and tests are correct and consistent;
> the both-notation probe achieves the goal of rejecting half-restored trees; appropriately scoped (the
> ticket's deferral of full inventory + cache-mechanism changes is respected). Verified: canaryCheck
> probes [modern, early] in order (modern-first-wins), `{ok:true}|{ok:false,missing}` matches the `.d.mts`
> and runtime, export/type/runtime agree, checkLilypond fails loud (exit 1, "missing pre-built SVG at
> <path>") and skips on success. Path building uses forward slashes (cross-platform), `root="."` ≡ the old
> bare relative path.
>
> Suggestions: (1) canaryCheck ignores `--notation` — a `--notation modern --skip-if-missing` build still
> requires the early canary. NOT a regression (the old single-canary probe also ignored `--notation`); for
> the CI/Netlify case both notations are always built. A one-line note or a future ticket if single-notation
> skip becomes a real workflow. (2) The unit test rebuilds the `${root}/...` path the same way the impl
> does, so a path-template bug would reproduce in both; the integration tests (real on-disk paths + literal
> "early") compensate.

### pr-test-analyzer

> Coverage is strong and adequate to ship. The 4 unit tests pin all meaningful cases (both-present,
> each-missing, both-missing) and assert the EXACT `missing` path via toEqual; `root` is exercised through
> real temp dirs. The 3 integration tests cover skip-success / fail-loud / partial-restore end-to-end via a
> fake lilypond + empty PATH. No mutant in the changed code survives EXCEPT:
>
> - **[5/10]** no non-default `version` (OUP) case — a mutant hard-coding "Hugh Keyte" in the probe paths
>   survives. Add `canaryCheck("OUP", root)` with OUP canaries present → `{ok:true}`.
> - **[5/10]** the partial-restore INTEGRATION case only tests modern-present (not the inverse early-present
>   → fail naming modern). The unit suite pins the ordering, so low priority.
> - Lower/informational: the integration "early" substring assertion is loose (unit compensates with the
>   full path); `root="."` default and version with path-significant chars unpinned (trusted-caller contract).

### silent-failure-hunter

> A clean silent-failure FIX: it converts a silent "ship incomplete scores" into a loud `exit(1)`, and
> introduces NO new silent hole. Verified: partial restore (modern present, early missing) now fails loud;
> the known residual (a tree missing a non-canary choir within a present notation still passes) is HONESTLY
> documented as deferred and is STRICTLY SMALLER than the pre-#424 gap; canaryCheck cannot throw on normal
> inputs (only template strings + non-throwing existsSync); the non-skip path is byte-identical to main.
>
> Two MEDIUM (cosmetic, "acceptable as-is"): the error message's remedy line ("Install LilyPond, or run
> without --skip-if-missing") is developer- rather than CI-oriented, and it doesn't name the cache as the
> likely cause of a partial tree. A one-line "the SVG cache may have restored partially" hint would help CI
> triage.

### type-design-analyzer

> Sound — no changes recommended. The `{ok: true} | {ok: false; missing: string}` discriminated union is
> the RIGHT call, strictly better than a boolean (which can't carry the load-bearing `missing` path) or an
> optional-field `{ok, missing?}` (which permits the illegal states `{ok:true,missing}` and `{ok:false}`).
> The union makes both illegal states unrepresentable at zero extra cost. The `.d.mts` faithfully matches
> the `.mjs` (return shape, `version: string`, `root?: string` ≡ the `root="."` default); the consumer
> narrows correctly via `!check.ok`. Ratings: Encapsulation 8, Invariant expression 9, Usefulness 9,
> Enforcement 9. Standing caveat (pre-existing, out of scope): the hand-written `.d.mts` has no compile-time
> conformance check to the `.mjs` — the two-arm `toEqual` tests are the compensating control.

### comment-analyzer

> Accurate, honest, no required corrections; all five requested checks pass. The canaryCheck JSDoc is a
> model "why over what" comment (leads with the #421 partial-restore hazard, states the both-notation
> decision, fences the residual). The skip-branch comment fully replaces the old single-canary text (no
> stale remnant) and the error string matches the test assertions. The integration + unit test comments
> match their setups/assertions. No stale single-canary prose elsewhere (BUILD.md, the workflows,
> package.json all refer to the flag generically).
>
> One trivial polish: the JSDoc attributes the deferred residual to "(#424 scope)", using #424 for both
> "what we did" and "what we deferred" — slightly ambiguous on a cold read. Consider "(out of #424 scope)".
