# Contributing to Spem Player

## Getting Started

See `doc/BUILD.md` for development setup, prerequisites, and build commands.

## Architecture

The UI is built around five custom HTML elements extending `MusicElement`:

- `music-score` (`src/ts/MusicScore.ts`) — SVG sheet music display, bar-position parsing, auto-scroll
- `music-canvas` (`src/ts/MusicCanvas.ts`) — Canvas 2D overview of all 8 choirs × 5 parts × 140 bars
- `music-controls` (`src/ts/MusicControls.ts`) — HTML5 Audio playback, choir/part/bar input widgets
- `music-canvas-watcher` (`src/ts/MusicCanvasWatcher.ts`) — footer status line for hovered position
- `music-element` (`src/ts/MusicElement.ts`) — abstract base class holding shared state and event dispatch

The entry point is `index.ts`, which wires events between components and manages global state.

### State

The central `State` interface (`src/ts/common.ts`) tracks:

- `recording` — `0` (ALC) or `1` (CotE)
- `viewmode` — `"dark"` or `"light"`
- `period` — `"modern"` or `"early"`
- `choir` — 0 to 7
- `part` — `"all"` or 0 to 4
- `bar` — 0 to 139
- `status` — `"playing"`, `"paused"`, or `"loading"`

State changes flow through `index.ts` helpers (`setChoir()`, `setPart()`, `setBar()`), which set
attributes on elements. Components react via `attributeChangedCallback` and fire custom events
back to `index.ts`.

## Workflow

The project uses a GitHub Project board as the canonical register of work.
See the board at `https://github.com/users/wainwmr/projects/2`.

### Board Schema

Mark's kanban workflow with explicit entry and exit criteria:

- **Todo**
  - Entry: New bug, feature, or tech debt reported
  - Exit: Type, Area, Difficulty defined; description is clear enough to act on

- **In Progress**
  - Entry: Coding started, branch created
  - Exit: Code complete, tests pass, PR opened

- **Review**
  - Entry: PR opened to `main`; awaiting Mark's review
  - Exit: Mark approves and merges the PR
  - During review Mark may leave comments, request changes, or approve.
    If changes are requested, the author pushes fixes to the same branch.
    The PR stays open. Do not close it and open a new one.

- **Done**
  - Entry: Merged to `main`; deployed or deploy pending
  - Exit: —

`main` is the production branch.

#### Type

- `bug` — defect
- `feature` — new capability
- `tech debt` — structural or maintenance improvement

#### Area

- `UI` — user interface
- `Score` — sheet music display
- `Canvas` — overview canvas
- `Lily` — LilyPond/grammar
- `Config` — configuration and constants
- `Test` — test suite
- `Tooling` — build scripts and tooling
- `Controls` — playback controls
- `Docs` — documentation
- `Audio` — playback and recordings
- `Other` — uncategorised

#### Difficulty

- `XS` — trivial
- `S` — small
- `M` — medium
- `L` — large

### Branching

- `main` — production branch.
- Feature branches are created from `origin/main`.

Name feature branches `authorname/NNN-short-description`, where `NNN` is the ticket number.

**Do not use a fork.** Push feature branches directly to `wainwmr/spem-player`
(Mark's repository). Pull requests are opened from branches inside the main
repository, not from a fork. This avoids Netlify's external-contributor approval
gate and enables automatic deploy previews.

### Ticket Lifecycle

1. **Create**: A new ticket is created on the board
   with Status **Todo**.
2. **Assess**: Set Type, Area, and Difficulty. Write a clear
   Description. Assessment does not change Status. The ticket stays in **Todo**.
3. **Specify**: Write Recommended fix, Test plan, and Dependencies. Add the
   `specified` label. Ticket remains in **Todo**.
4. **Assign** (optional): The ticket can be assigned to a developer.
5. **Develop**: The developer claims or is assigned the ticket, moves Status
   to **In Progress**, implements the fix on a feature branch, runs tests, and
   opens a PR against `main`.
6. **Review**: Mark reviews the PR. Status is **Review**.
   Mark may comment, request changes, or approve. If changes are requested,
   the author pushes fixes to the same branch and the PR is re-reviewed.
   The PR remains open until Mark approves and merges it.
7. **Integrate**: Mark approves and merges the PR to `main`. Mark moves the
   ticket Status to **Done**.

If a ticket is blocked by a question for Mark, add a `question` label and
@mention him, but leave Status as **Todo** until the question is resolved.
Once Mark has responded, he removes the `question` label. If the response
resolves the blocker, the ticket stays in **Todo** and specification or
development proceeds. If the response reveals the ticket needs more work or
is no longer valid, Mark updates the description or closes the ticket.

### Ticket Format

Specification depth matches ticket difficulty. Use the template that fits:

- **XS / S** — small fixes, clean-ups, and one-file changes. See the
  [XS / S template](Specification-Template-XS-S).
- **M / L** — structural changes, new features, and cross-file refactors. See
  the [M / L template](Specification-Template-M-L).
- **Architectural** — repository restructuring, build pipeline changes,
  technology choices, dependency migrations, and decisions about data ownership
  or copyright. See the
  [Architectural template](Specification-Template-Architectural).

All templates require the same rigour. An XS ticket needs precise root cause
and test plan, not a twelve-section dissertation.

A well-formed ticket body contains:

- **Type**, **Area**, **Status**, **Difficulty**
- **Source**: file path and line number
- **First seen**: date and commit hash (from `git blame`)
- **Description**: clear explanation of the problem or desired improvement
- **Recommended fix**: approach, files to change, risks (populated during
  Specification)
- **Test plan**: test cases, mocking requirements (populated during
  Specification)
- **Dependencies**: other tickets that must precede or relate to this one

### Pull Request Process

1. Create a feature branch from `origin/main`.
2. Make your changes, add tests, and update documentation.
3. Ensure tests pass:

   ```console
   npm run test
   npm run build
   npm run test:e2e
   ```

4. Check formatting, lint, and type errors:

   ```console
   npm run format:check
   npm run lint
   npx tsc --noEmit
   ```

5. Commit with a clear message referencing the ticket number.
6. Push to origin (Mark's repository).
7. Open a PR to `origin/main`.
8. Include `See #NNN` or `Fixes #NNN` in the PR description to link it to the
   board item. `Fixes` will close the ticket automatically when the PR merges
   to `main`.

### For the Maintainer

#### What has changed

- **Board columns:** `Todo`, `In Progress`, `Review`, `Done`.
- **`Specified` is a label, not a column.** Tickets stay in `Todo` after specification; the `specified` label indicates readiness.
- **Auto-close keywords:** PR descriptions may use `Fixes #NNN`, `Closes #NNN`,
  `Resolves #NNN`, or `See #NNN`. `Fixes`, `Closes`, and `Resolves` close the
  ticket on merge; `See` links the PR without closing.
- **Stale-PR checks:** the startup routine now reports any open PR with `CHANGES_REQUESTED`.
- **Linked pull requests:** Both `Fixes #NNN` and `See #NNN` link the PR to the
  board item automatically. The difference is that `Fixes` also closes the issue
  on merge; `See` does not.

#### What you do when you receive a PR

- **Approve and merge** - Submit `Approve` review, merge PR to `main` - Move ticket from `Review` to `Done`
- **Request changes** - Submit `Request changes` review - Leave ticket in `Review`; author will push fixes to the same branch
- **Reject / close without merge** - Close the PR and leave a review comment or
  PR comment explaining why. Move ticket back to `In Progress` or `Todo`.
- **Merge conflicts** - Leave a PR comment - Leave ticket in `Review`; author will rebase and push

**Do not close a PR and ask for a new one.** Keep the same PR open and request changes. Closing destroys the conversation history.

## Development Practices

### Code Style

- TypeScript strict mode.
- Meaningful variable and function names.
- JSDoc comments for public APIs.
- Keep functions focused and single-purpose.
- Explicit types where helpful.
- Prefer interfaces over types for object shapes.
- Use `const` for immutable values.
- Use `let` only when reassignment is needed.
- Avoid `any`; use `unknown` if necessary.

### Lint and Type Checking

The CI pipeline runs `npm run lint` and `npx tsc --noEmit`. Pull requests must pass both.

The project uses an ESLint flat config (`eslint.config.js`) with `typescript-eslint`. Some rules are relaxed because the codebase predates them (for example, `no-var` and `@typescript-eslint/no-explicit-any` are currently off). Follow the existing patterns in the file you are editing rather than refactoring legacy code to meet stricter rules.

The project uses **Prettier** for automatic formatting. Run `npm run format` before committing, or configure your editor to format on save. The CI pipeline runs `npm run format:check` as part of the build gate.

All `.md` files must pass `markdownlint-cli2` before a PR is opened. Run `npx markdownlint-cli2 <file>` after editing any markdown file.

### Component Conventions

All UI components are native custom elements extending `MusicElement`.

When creating or modifying a component:

1. Extend `MusicElement`.
2. Define `observedAttributes` static property.
3. Implement `attributeChangedCallback` for reactive updates.
4. Use `fireEvent()` to communicate state changes.
5. Register the element via a static `define(tag)` method.

### Key Conventions

- **Bar numbering** — bars run 0–139 (140 total). Bar 0 is an intro bar; its beat count varies
  by recording (`intro_beats` in `public/spem.json`).
- **Time mapping** — `bartime` and `barno` arrays in `src/ts/config.ts` convert between real
  audio time and bar numbers, accounting for tempo changes per recording.
- **SVG bar detection** — `MusicScore.getBars()` parses `translate` attributes on `<g>` elements
  containing numeric `<tspan>` text. Values near the left edge are filtered to avoid false matches
  from tenor clef symbols.
- **LilyPond parsing** — the Ohm grammar (`src/ohmjs/ly-grammar.ohm`) covers only the subset of
  LilyPond syntax used by `spem.ly`. Do not assume it generalises to other LilyPond files.
- **Version injection** — `package.json` version is injected into `index.html` at build time.
  Non-`main` branches append the branch name (e.g. `2.4.0-fix-123`).
- **Local ignore rules** — personal patterns (IDE configs, local scripts) belong in
  `.git/info/exclude`, not `.gitignore`, to avoid polluting the shared ignore file.

### Tracked Generated Files

Two Ohm bundle files are committed to the repository (Mark's preference) but are
regenerated locally during development:

```text
src/ohmjs/ly-grammar.ohm-bundle.js
src/ohmjs/ly-grammar.ohm-bundle.d.ts
```

Set `--skip-worktree` on these files after cloning so local rebuilds do not appear
in `git status`:

```console
git update-index --skip-worktree src/ohmjs/ly-grammar.ohm-bundle.js
git update-index --skip-worktree src/ohmjs/ly-grammar.ohm-bundle.d.ts
```

Do not commit local versions of these files. If a rebase conflict touches them,
accept the upstream version.

### Writing Tests

Unit and integration tests use Vitest 3 with the jsdom environment. End-to-end
tests use Playwright across Chromium, Firefox, and WebKit. See `doc/TESTING.md` for
commands and configuration.

#### Testing Internal Functions

Modules export an `exportedForTesting` object containing functions and state
that are not part of the public API but require unit testing. For example,
`lily.ts` exports `setupLilypondParser`, `romanise`, and parser state via this
object.

#### Custom Elements in Tests

The application defines custom HTML elements (`music-canvas`, `music-score`,
`music-controls`, etc.). Tests that instantiate these elements must ensure they
are defined in the jsdom document before assertions run. The `define(tag)`
static method on each class handles registration.

## Commit Messages

Use conventional commit format where possible:

- `feature:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `test:` — tests
- `refactor:` — code restructuring
- `build:` — build system or tooling

## Best Practices

- Incremental changes over monolithic refactors.
- Tests for new behaviour.
- Do not break the build pipeline.
- Preserve existing user-facing behaviour unless the change is the point.
- Run linters and type checks after making changes.
- Temporary working files go in `temp/` and should be deleted before committing.
- Report scope creep immediately rather than silently upgrading difficulty.
