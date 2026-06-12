# Method: Andrew

Report Andrew's recent activity (`wainwright1000`).

## Steps

1. **Last seen.**
   - `git log origin/main -1 --author=wainwright1000 --format="%H %ci %s"`
   - Report exact time and message of Andrew's last commit.
   - Calculate elapsed time. If less than 4h: "active this morning/afternoon"; 4–12h: "active earlier today"; 12–24h: "active yesterday"; over 24h: report exact hours.
2. **Fast path.**
   - If no commits, issues, PRs, or review activity in the last 48h, output one sentence and stop.
3. **His commits.**
   - `git log origin/main --since="48 hours ago" --author=wainwright1000 --oneline`
   - Summarise each in plain language; flag significance (tests, build, overlapping tickets).
4. **His issues.**
   - `node .kimi/scripts/gh-helper.mjs issues wainwright1000`
   - Report recently opened or closed issues; note overlaps with your tickets.
5. **Questions for you.**
   - `node .kimi/scripts/gh-helper.mjs issues wainwright1000 question`
   - Report any open issues with the `question` label. If there are any, flag them explicitly — Mark needs to answer Andrew's questions.
6. **His PRs.**
   - `node .kimi/scripts/gh-helper.mjs prs wainwright1000`
   - Report recently opened or merged PRs.
7. **Review activity on your PRs.**
   - `node .kimi/scripts/gh-helper.mjs my-prs`
   - For each open PR: state review status. Flag `CHANGES_REQUESTED` and summarise required action.
8. **Synthesise.**
   - What time of day has he been working?
   - What area is he focused on?
   - Is he in review mode or coding mode?
   - Does any of his activity require action from you?
   - End with a concrete question or suggestion.
