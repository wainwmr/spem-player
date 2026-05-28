# VERA-356 Final Synthesis (cycle 1)

Mode: work (Vera ran during initial development, before PR open)
Cycle: 1
Generated: 2026-05-28 21:50 UTC
Last run:  2026-05-28 22:15 UTC

See also: [Original Report (cycle 1)](https://github.com/wainwmr/spem-player/issues/356#issuecomment-4568649676)

## Summary

Cycle 1 took two passes. Pass 1 surfaced 8 important findings across five agents on a 2-file, 60-line diff — heavier than the diff size predicts. Three were addressed in-line: 356-01 (test fixture rewrite that pins AC #2 and AC #3 by renaming fixture variables to match the production `notePattern` and adding an exactly-one-`data-part="0"` cardinality assertion), 356-02 (WHY comment on the catch's fall-through), and 356-03 (parameter-less `catch`). Two were rejected: 356-05 (`instanceof URIError` narrowing, defensive against speculative future code) and 356-07 (in-band null sentinel critique, discharged-in-spirit by the WHY comment per Bob). Three were deferred to Workbench items #282 (observability cluster: 356-04 silent-swallow + 356-06 unobservable null-href unwrap) and #283 (loop-split refactor: 356-08). Pass 2 cleared with zero new critical or important findings; all five agents independently concurred on gate-pass. Notable: silent-failure-hunter recorded continued disagreement that "WHY comment ≠ observability" — accepted with Bob's no-workflow-today rationale, captured in #282's brief. Type-design ratings on the `href: string | null` post-condition moved encapsulation 4→5 and invariant expression 3→6 with the WHY comment in place.

## Findings

### 356-01 — important — Test under-asserts AC #2 and AC #3

> **pr-test-analyzer + silent-failure-hunter + type-design-analyzer + comment-analyzer, `src/test/postprocessSvg.test.ts:54-87`:**
>
> Cluster spanning PRA F1/F2/F3/F4, SFH F5, TDA F6, CMT F2. The new test asserts no-throw and a global `not.toMatch(/<a/)`, but does NOT verify the acceptance criteria as written:
>
> - AC #2 second clause ("malformed anchors receive no `data-part` attribute") — never asserted on the malformed `<text>malformed</text>` child.
> - AC #3 ("well-formed anchors continue to be processed correctly") — the fixture uses `notesSoprano` / `wordsSoprano` which do NOT match the production `notes(?:I{1,3}|IV)[AB]<part>` pattern, so `noteMap`/`wordsMap` are empty, `findPartIndex` returns `null`, and the well-formed anchor deterministically gets no `data-part`. The test's own comment apologises for this ("may or may not depending on whether the href matches a variable range"). The unwrap assertion is global, so a future regression where neither anchor is processed at all would pass the test.
>
> Fix: rename fixture variable to `notesIASoprano` (and `wordsIASoprano`), tighten the well-formed anchor's href to fall inside that range, assert `data-part="0"` on the well-formed `<text>` element, assert absence of `data-part` on the malformed `<text>` element, and delete the rot-prone explanatory comment.

**Bob's triage:** Real defect in the test. The test makes assertions the production code can satisfy by accident (zero processed anchors), so it would pass a future regression where neither anchor reaches the unwrap step. Fix is surgical: rename fixture variables to match `notes(?:I{1,3}|IV)[AB]<part>`, assert exactly one `data-part="0"` (proves well-formed processed), assert malformed text has no `data-part`. Rename test title to describe the behavioural contract. Address now.

**Resolution:** Addressed in commit `e9b1efa`. Fixture variables renamed to `notesIASoprano` / `wordsIASoprano` so `parseVariables` populates `noteMap`. Test asserts exactly one `data-part="0"` in output, that the well-formed `<text>` carries that attribute, and that the malformed `<text>` does not. Test title rewritten to describe the behavioural contract.

### 356-02 — important — Missing WHY comment on `href = null` decision

> **comment-analyzer, `build/postprocessSvg.mjs:198-200`:**
>
> The catch block has no comment explaining why the decision is to set `href = null` rather than `continue` (skip the anchor) or re-throw. A future maintainer reading "set href to null on decode failure" will reasonably ask "why not just skip this anchor?" — and the answer (the anchor still needs to be unwrapped at lines 232-238 so the SVG remains well-formed) is not visible from the code. This is exactly the kind of non-obvious WHY-decision CLAUDE.md says SHOULD be commented. Highest rot risk in the diff: the next person reading this will not know whether "fall through and unwrap anyway" is intentional or a bug.

**Bob's triage:** Real defect at the comment-rot level. The choice of `href = null` over `continue` is not obvious; the unwrap-must-still-run rationale lives only in the author's head. CLAUDE.md says comment when the WHY is non-obvious; this qualifies. One-line addition. Address now.

**Resolution:** Addressed in commit `ad95d0e` (combined with 356-03). Catch block now carries a comment naming the trade-off: skip classification but fall through so the anchor still gets unwrapped.

### 356-03 — important — `catch (e)` binds an unused error

> **code-reviewer + comment-analyzer + type-design-analyzer, `build/postprocessSvg.mjs:198`:**
>
> Cluster: CRV F1, CMT F6, TDA F7. The catch parameter `e` is named but unused. The parameter-less `catch { ... }` form (ES2019, already used elsewhere in the file ecosystem) more honestly signals "we deliberately discard this" and avoids the linter friction. The named-but-unused binding subtly invites a future maintainer to think there is something to do with `e` when in fact the decision is to silently swallow.

**Bob's triage:** Defensive nit but it pairs with 356-02 mechanically — same lines, same scope. Parameter-less `catch { ... }` is cleaner and more honest about intent. Trivial. Address now, paired with 356-02.

**Resolution:** Addressed in commit `ad95d0e` (combined with 356-02). `catch (e)` becomes parameter-less `catch`.

### 356-04 — important — Silent swallow lacks any log/warn

> **silent-failure-hunter, `build/postprocessSvg.mjs:198-200`:**
>
> The catch swallows the URIError with no `console.warn`, no `console.error`, no telemetry. A malformed `xlink:href` is by the ticket's own framing a signal of upstream corruption — a LilyPond bug, an unexpected percent sequence in a path, a mangled textedit URI. As written, the build completes "successfully" and no developer breadcrumb survives for the next time this happens. Recommendation: `console.warn` carrying svgPath, raw pre-decode href, and the error message.

**Bob's triage:** Defensive nit. The build output is already noisy; a `console.warn` adds value only if the team has a workflow to act on it. Adding it now is solution-looking-for-problem. Defer to a Workbench item so the option is preserved if observability becomes a real need.

**Resolution:** Deferred to Workbench item [#282](https://github.com/wainwright1000/spem-tools/issues/282) (observability cluster, paired with 356-06).

### 356-05 — important — Broad catch could swallow non-URIError

> **silent-failure-hunter, `build/postprocessSvg.mjs:198`:**
>
> `decodeURIComponent` is documented to throw only `URIError`. The catch is shaped to also swallow `TypeError` (e.g. if `href` somehow became `undefined` between the truthy guard at line 194 and the call at line 197 — impossible today, but a future edit could break the invariant) and any other thrown value. The narrower form is `catch (e) { if (e instanceof URIError) { href = null; } else { throw e; } }`.

**Bob's triage:** Defensive nit against a hypothetical refactor that doesn't exist. The try block contains one operation with one documented throw type, on a string already truthy-guarded. The `instanceof URIError` check adds friction now for zero current benefit. Reject.

**Resolution:** Rejected. At a single call site with one operation whose throw shape is documented, narrowing to `URIError` adds reading cost without changing observable behaviour.

### 356-06 — important — Unwrap-on-null-href is unobservable at build time

> **silent-failure-hunter, `build/postprocessSvg.mjs:219-238`:**
>
> Originally framed critical, downgraded to important. The unwrap step runs unconditionally even when `href` is `null` (the ticket's intended behaviour — "malformed anchors are unwrapped but receive no `data-part`"). But the resulting SVG looks indistinguishable from one whose anchors were well-formed but pointed outside variable ranges. If a future LilyPond upgrade silently starts producing thousands of malformed hrefs per build, nothing notices. Add a counter and `console.warn` at end of `postprocessSvg` if non-zero.

**Bob's triage:** Defensive nit, observability-flavoured, naturally pairs with 356-04. Defer to the same Workbench item as 356-04.

**Resolution:** Deferred to Workbench item [#282](https://github.com/wainwright1000/spem-tools/issues/282) (observability cluster, paired with 356-04).

### 356-07 — important — In-band `null` sentinel for `href` is unnamed

> **type-design-analyzer, `build/postprocessSvg.mjs:199`:**
>
> The "decode failed" state is represented by mutating the same `let href` binding from `string` to `null`. The failure mode is not a separate variable, not a wrapped result. Ratings: encapsulation 4/10, invariant expression 3/10, usefulness 7/10, enforcement 5/10. The cleanest fix here would be `continue`-in-catch except the unwrap step must still run — that fact alone is a design smell worth surfacing (see also 356-08).

**Bob's triage:** Real concern but its mitigation overlaps with 356-02 (WHY comment) and 356-03 (cleaner catch). With those addressed, the sentinel's intent is documented at the call site. A wrapped `tryDecodeURIComponent` helper at one call site is YAGNI per code-reviewer's own assessment. Reject as addressed-in-spirit by 356-02 + 356-03; revisit if a second call site appears.

**Resolution:** Rejected. Sentinel intent is documented by 356-02 (WHY comment in catch). Helper extraction is YAGNI at one call site.

### 356-08 — important — Loop body conflates classification + unwrap

> **type-design-analyzer, `build/postprocessSvg.mjs:191-239`:**
>
> The loop does two unrelated things per anchor: (a) compute partIndex from href, (b) unwrap the anchor. Because they share an iteration, a `continue` on decode failure would skip the unwrap, forcing the `string | null` sentinel. Splitting into two passes (first pass: collect `{aElem, partIndex}` pairs, where decode failures yield no entry; second pass: unwrap all anchors) would let the decode-failure case be expressed without a sentinel. Bigger refactor than #356 calls for.

**Bob's triage:** Real structural debt, larger refactor than #356 calls for, no current defect from it (the in-band sentinel works once 356-02 + 356-03 land). Defer to a Workbench item — separate from 356-04/06 because this is structural, not observability.

**Resolution:** Deferred to Workbench item [#283](https://github.com/wainwright1000/spem-tools/issues/283) (loop-split refactor for postprocessSvg).

## Suggestions (noted; do not block the gate)

- **356-09** — Shadowed locals `tmpSvg`/`tmpSpem`/`tmpWords` in new `it` block (CRV F3). Rename to `malformedSvg` etc.
- **356-10** — No per-test cleanup; `afterAll` sweeps but a third test could see artefacts (CRV F4).
- **356-11** — Add negative-control comment/ticket reference (CRV F5). REJECTED per CLAUDE.md "Don't reference the current task, fix, or callers".
- **356-12** — Pre-existing: `spem%20words.ly` branch slightly less reachable after the diff (CRV F6, pre-existing, no action).
- **356-13** — Only `%ZZ` malformed encoding tested (PRA F5). Lone `%`, trailing `%`, unpaired surrogate are realistic alternatives.
- **356-14** — Missing fixture variations: malformed-only SVG; well-formed-then-malformed ordering (PRA F6).
- **356-15** — No XML well-formedness round-trip assertion on output (PRA F8).
- **356-16** — Missing timeout argument on `it(...)` (PRA F9). Sibling test has `15000`.
- **356-17** — Test title describes implementation not contract (PRA F10).
- **356-18** — Pre-existing: `parseVariables` silently produces `partIndex = undefined` for unknown part suffix → writes `data-part="undefined"` (SFH F6, pre-existing).
- **356-19** — Pre-existing: `buildScores.mjs:156-160` empty catch on `rmSync` (SFH F7, pre-existing).
- **356-20** — Pre-existing: `readFileSync(svgPath, "utf-8")` at line 184 unguarded (SFH F8, pre-existing, caller handles).
- **356-21** — No wrapped `tryDecodeURIComponent` helper (TDA F3). Would name the operation and document nullability.
- **356-22** — `let href` declaration misleadingly carries two state-spaces (TDA F4). Distinct `const` bindings would help.
- **356-23** — JSDoc gives no contract for the new "malformed hrefs are silently skipped" behaviour (TDA F5).
- **356-24** — Low-value "Both anchors should be unwrapped" comment in test (CMT F4). Consistent with house style; not actively wrong.

**Positive notes:**

- Fix correctly diverges from the ticket's suggested `if (!href) continue;` to use `if (href) { ... }` around match blocks — preserves the unwrap step for malformed anchors as AC #2 requires.
- Surviving `// Check words first since "spem words.ly" contains "spem.ly"` comment (CMT F3) is a legitimate WHY-comment, correctly placed after the re-indentation.
- No ticket-number references in code (CMT F5) — CLAUDE.md compliance.
- No PR conflicts with the four open Review PRs (#395, #396, #399, #400) — disjoint file footprints (PRA confirmation).

## Pass 2 notes

All five agents independently judged gate-pass. No critical, no important. Suggestion-grade observations recorded here for the future:

- **CRV (P2-1):** test title "preserves processing of well-formed anchors when an *earlier* anchor has a malformed href" hints at symmetric coverage (later-malformed) that the fixture does not provide. Cosmetic. No action.
- **PRA (P2-5):** fixture rename couples the test to the production `notePattern`/`wordsPattern` regex shape. Comment at test lines 65-67 documents the coupling; principled fix (export the patterns) is wider than warranted. Recorded as known coupling cost.
- **PRA (P2-6):** well-formed-then-malformed ordering coverage gap (originally PRA F6, suggestion 356-14) still unaddressed; deferred. Risk is low because the loop body is per-anchor and stateless across iterations.
- **SFH (P2-1):** WHY comment improves reviewability but does not convert the swallow into a runtime-observable event. Accepts the disposition for #282 given Bob's no-workflow-today rationale; flagged so the synthesis does not silently retire SFH F1 as "addressed by comment".
- **SFH (P2-2):** the comment's "Malformed URI" wording asserts a diagnosis the catch does not enforce — defensible while the `try` body stays a single `decodeURIComponent` call; would mislead if anything else is inlined into the `try`. Treat the one-line `try` body as a maintenance constraint.
- **SFH (P2-4):** test does not (and should not) assert no-warn — that would lock in the deferred disposition. A `vi.spyOn(console, "warn")` hook would be a cheap scaffold for when #282 lands; not done now.
- **TDA (P2-N2):** the negative-lookahead regex `/<text(?![^>]*data-part)[^>]*>malformed/` is fragile under serialiser changes; the exact-equality cardinality assertion is the robust backstop and is doing the load-bearing work.
- **TDA (P2-N3):** fixture-variable / production-regex coupling is noted in #283's brief as the natural trigger condition for the helper extraction (TDA F3) — if a second `decodeURIComponent` call site ever appears, the YAGNI argument flips.
- **CMT (P2-2/5/6):** suggested tighter wordings for the catch comment ("the unwrap below" rather than "broken `<a>` wrapper") and the test fixture comment ("notePattern / wordsPattern in postprocessSvg.mjs" rather than identifier names) — minor rot-risk reductions. Left as-is; current wordings are accurate and small.
