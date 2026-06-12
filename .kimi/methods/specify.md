# Method: Specify

Assess and specify a ticket. Run from the repository root.

## High-level flow

1. Verify the ticket exists (`gh issue view <number>`).
2. Determine if it is a fresh specification or a re-specification (check body for Description/Recommended fix/Test plan, and the `specified` label).
3. Read prior investigation (refactor reports, Architecture.md) and source code.
4. Scan for duplicates among open board items.
5. Evaluate ticket claims against source code (stale references, contradictions, scope accuracy).
6. Ensure board fields (Type, Area, Difficulty) are populated.
7. Consult Bob on root cause, test plan, scope, and minimal change.
8. Write and post the specification using the appropriate template:
   - **XS/S:** Specification Template — XS / S
   - **M/L:** Specification Template — M / L
   - **Architectural:** Specification Template — Architectural
9. Apply the `specified` label (`gh issue edit <number> --add-label specified`) and populate the board fields (Type, Area, Difficulty) using the helper script to avoid hand-copied option IDs:

   ```console
   node .kimi/scripts/gh-helper.mjs set-field <number> type <bug|feature|tech-debt|tooling-bug>
   node .kimi/scripts/gh-helper.mjs set-field <number> area <ui|score|canvas|lily|config|test|tooling|controls|docs|audio|other>
   node .kimi/scripts/gh-helper.mjs set-field <number> difficulty <xs|s|m|l>
   ```
10. Capture cross-cutting architectural knowledge if needed.
11. Post-mortem: record lessons and create Workbench items only for repeatable process gaps.
12. Tidy: delete temp files, verify working tree is clean.

## Key constraints

- Do not write the specification until investigation, evaluation, and Bob consultation are complete.
- Do not change board status; the item stays in **Todo**.
- For re-specification, post a delta comment rather than overwriting the original body.
- Update the issue title via `gh issue edit` if Step 5 flags it as poor.

## Templates

- XS / S: https://github.com/wainwmr/spem-player/wiki/Specification-Template-XS-S
- M / L: https://github.com/wainwmr/spem-player/wiki/Specification-Template-M-L
- Architectural: https://github.com/wainwmr/spem-player/wiki/Specification-Template-Architectural

## Full procedure

https://github.com/wainwmr/spem-player/wiki/Method-Specify
