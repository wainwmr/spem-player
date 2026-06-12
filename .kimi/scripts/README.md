# Kimi GitHub helper

`gh-helper.mjs` wraps repetitive `gh` CLI and GitHub Projects v2 operations used by the methods in `.kimi/methods/`. It hardcodes the Spem Player project and board field IDs so method steps do not need to copy project IDs or option IDs by hand.

## Usage

```console
node .kimi/scripts/gh-helper.mjs <command> [args]
```

## Commands

| Command | Args | Description |
|---|---|---|
| `item-id` | `<issue>` | Print the project item ID for an issue. |
| `status` | `<issue> <todo\|progress\|review\|done>` | Move an issue to a board status. |
| `assign` | `<issue>` | Assign an issue to `@me`. |
| `close` | `<issue> [comment]` | Close an issue with an optional comment. |
| `pr-checks` | `<pr>` | Print PR merge state and checks as JSON. |
| `set-field` | `<issue> <field> <option>` | Set a board field (`type`, `area`, `difficulty`, `category`). |
| `issues` | `<author> [label]` | List issues by author, optionally filtered by label. |
| `prs` | `<author>` | List PRs by author. |
| `my-prs` |  | List your open PRs with review decisions. |

## Examples

```console
node .kimi/scripts/gh-helper.mjs assign 558
node .kimi/scripts/gh-helper.mjs status 558 progress
node .kimi/scripts/gh-helper.mjs status 558 review
node .kimi/scripts/gh-helper.mjs status 558 done
node .kimi/scripts/gh-helper.mjs close 564 "Superseded by #581."
node .kimi/scripts/gh-helper.mjs set-field 581 type tooling-bug
node .kimi/scripts/gh-helper.mjs set-field 581 area tooling
node .kimi/scripts/gh-helper.mjs set-field 581 difficulty s
```

## Updating hardcoded IDs

If the GitHub project or board fields are recreated, update the constants at the top of `gh-helper.mjs`. Run `gh project field-list 2 --owner wainwmr --format json` to discover current field and option IDs.
