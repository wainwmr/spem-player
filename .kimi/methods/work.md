# Method: Work

Implement an open issue from specification through merge.

## Preconditions

- The issue exists on the board.
- The issue has the `specified` label. If not, stop and run the `specify` method.
- The issue has no unresolved blockers in its Dependencies section.

## Steps

### 1. Prepare environment

```console
git checkout main
git pull
git status
```

- Working tree must be clean. If there are uncommitted changes, stop and ask Mark what to do with them.
- `main` must be up to date with `origin/main`. If not, `git pull` first.

### 2. Create branch and move issue to In Progress

Branch name: `issue-NNN-short-description`

For multiple issues in one PR, still create a branch. Use the lowest issue number in the branch name (e.g. `issue-306-buildScores-fixes`) and list every issue in the PR description with its own `Fixes #NNN` line.

```console
git checkout -b issue-NNN-short-description
```

Assign the issue to yourself and move it to **In Progress** immediately after creating the branch. Do not skip these — they signal that work has started. Use the helper script so the board transitions are reliable and do not require hand-copied project IDs:

```console
node .kimi/scripts/gh-helper.mjs assign <issue-number>
node .kimi/scripts/gh-helper.mjs status <issue-number> progress
```

### 3. Read specification

Read the issue body. Confirm it contains:
- Description
- Root cause
- Recommended fix
- Test plan

If any section is missing or unclear, stop and ask Mark.

### 4. Implement

#### 4a. Test first

Write or extend the test that reproduces the issue. Watch it fail (red). Then implement the fix (green). Then refactor if needed.

If the issue is a CI/configuration change with no testable code path, skip this step and note the reason in the commit message.

#### 4b. Code

Follow the Recommended fix section. If the implementation deviates from the spec, note the deviation and the reason before proceeding.

#### 4c. Documentation

Update any documentation affected by the change. Do not rely on memory — use the checklist below. If a file in the left column changes, the corresponding doc on the right must be reviewed (and updated if the feature, behaviour, or build steps are new or changed).

| Source files changed | Doc to check |
|---|---|
| `vite.config.ts`, `package.json` (deps, scripts, build plugins) | `doc/BUILD.md` |
| New or changed user-facing feature | `README.md` |
| CI workflow files (`.github/workflows/`) | `doc/CI.md` |
| `AGENTS.md`, `.kimi/methods/` | `AGENTS.md` (self-documenting) |
| `src/ts/config.ts`, behaviour changes | `doc/notes/` if a note exists |
| Any issue or spec explicitly references a `doc/` file | That file |

Also check:
- `AGENTS.md` if agent instructions change
- Workflow descriptions in `doc/CI.md` if CI changes

If no docs need updating, state "No doc changes required" in the PR description so the reviewer knows the checklist was run.

#### 4d. Version bump

If the PR contains user-facing changes, bump the version in `package.json` before committing:
- `feature:` → increment the minor version (e.g. `2.5.0` → `2.6.0`)
- `fix:` → increment the patch version (e.g. `2.5.0` → `2.5.1`)

Internal changes (`build:`, `ci:`, `docs:`, `refactor:`, `test:`) do not need a version bump.

Include the version bump in the same PR so the build artifacts carry the correct version and Mark can review the change.

### 5. Verify locally

```console
pnpm run check
pnpm test
```

- `pnpm test` runs unit tests and integration tests. Both must pass.
- `pnpm run check` runs lint, format check, type check, unused-export check, and dependency checks. All must pass.

If the change touches CI workflows and cannot be tested locally, skip `npm test` and note the reason. The linting check (`npm run check`) must still pass for any code change.

#### 5a. Check for new warnings

`npm run check` includes tools that report warnings while still exiting 0 (e.g. `depcruise`). A pre-existing warning baseline creates a blind spot for new ones.

Before committing, run:

```console
git stash -u
pnpm run check > /tmp/check-main.log 2>&1
git stash pop
pnpm run check > /tmp/check-branch.log 2>&1
diff /tmp/check-main.log /tmp/check-branch.log
```

If the diff shows **new** warnings, fix them before pushing. If a new warning is unavoidable and intentional (e.g. a temporary orphan during a refactor), note it in the PR description with the reason.

The current known baseline on main (do not reproduce):
- `depcruise`: `warn no-orphans: src/ts/escapeHtml.ts`

### 6. Commit and push

```console
git add -A
git commit -m "<type>: <description> (#NNN)"
git push -u origin issue-NNN-short-description
```

Commit message format:
- Subject: `<type>: <description> (#NNN)`
- Body: include `Fixes #NNN` for each issue so GitHub auto-closes on merge

For multiple issues in one commit:
```text
<type>: <description> (#NNN, #MMM)

Fixes #NNN
Fixes #MMM
```

Type prefixes:
- `fix:` — bug fix
- `feature:` — new capability
- `docs:` — documentation
- `test:` — tests
- `refactor:` — code restructuring
- `build:` — build system or tooling

**Never push direct to `main`.** All coding work goes through a branch and PR. The only exception is a trivial one-line fix that Mark explicitly approves in advance. If Mark says "push" or "commit" without mentioning a branch, stop and confirm whether to create a PR or push to main.

**Why `Fixes` matters:** GitHub only auto-closes issues when a commit on the default branch (or a merged PR description) contains a closing keyword (`Fixes`, `Closes`, `Resolves`) directly before the issue number. A bare `(#NNN)` reference or a bullet like `- #NNN` is not enough.

### 7. Open pull request and move issue to Review

Create a PR to `main`. Include `Fixes #NNN` in the description.

Immediately move the issue to **Review** on the board. This transition is not optional — it signals that the code is in review and awaiting merge.

```console
node .kimi/scripts/gh-helper.mjs status <issue-number> review
```

### 8. Monitor CI

Wait for the PR CI checks to complete. Report:
- `test` job result
- `integration` job result
- `deploy-preview` result (if applicable)

If any check fails, report the failure and do not merge.

### 9. Request review and wait for explicit approval

Present the PR to Mark. Include:
- A summary of the changes
- The PR link
- CI status
- The Netlify deploy preview link: `https://deploy-preview-<number>--spemplayer.netlify.app`

**Do not merge until Mark explicitly approves.** This is the mandatory review checkpoint. If Mark requests changes, apply them, push, and return to this step.

### 10. Merge

**Only merge after Mark has explicitly approved the PR.** Use squash merge. The commit subject should reference the issue number.

### 11. Close and move to Done

If the issue was not auto-closed by the PR merge, close it with a comment referencing the PR. Then move it to **Done** on the board:

```console
node .kimi/scripts/gh-helper.mjs close <issue-number> "Closed by #<pr-number>."
node .kimi/scripts/gh-helper.mjs status <issue-number> done
```

### 12. Tidy

Delete the merged branch locally and remotely:

```console
git checkout main
git pull
git branch -d issue-NNN-short-description
git push origin --delete issue-NNN-short-description
```

If the branch deletion fails because the remote branch does not exist (already deleted by GitHub settings), the local deletion still proceeds.

## Responsibilities

| Concern | Owner |
|---------|-------|
| Spec completeness | Fred (before Work method starts) |
| Implementation | Bob (TDD discipline, scope adherence) |
| Local verification | Agent (runs `pnpm run check` and `pnpm test` before every push) |
| CI monitoring | Automated (daily resource report posts to Telegram). Mark reviews only on alert. |
| Merge decision | Mark |
| Board hygiene | Agent (status transitions on project board) |

## When to abort

Abort the method and return to Mark if:
- The issue is not specified (no `specified` label).
- The issue has unresolved dependencies.
- `npm test` fails and the cause is not obvious after 10 minutes of investigation.
- The spec's Recommended fix contradicts the codebase or requires architectural changes not mentioned in the spec.
- Mark does not explicitly approve the PR after review.
