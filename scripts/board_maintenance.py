#!/usr/bin/env python3
"""Board maintenance: detect changes in the GitHub Project board schema.

Compares the current board schema (fields, options, descriptions) against a
stored baseline. Reports changes and optionally updates the baseline.

Usage:
    python scripts/board_maintenance.py [--update-baseline]

Exit codes:
    0 — no changes detected (or baseline created).
    1 — changes detected.
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

PROJECT_ID = "PVT_kwHOAO5EQs4BWPwP"
BASELINE_PATH = Path(__file__).parent / "board_baseline.json"


def run(cmd: list[str]) -> str:
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Command failed: {cmd}\n{result.stderr}")
    return result.stdout.strip()


def fetch_schema() -> dict:
    """Fetch the current board schema via GraphQL."""
    query = (
        'query { node(id: "'
        + PROJECT_ID
        + '") { ... on ProjectV2 { '
        'fields(first: 20) { nodes { '
        '... on ProjectV2SingleSelectField { '
        'name options { name description color } } '
        '... on ProjectV2Field { name } } } } } }'
    )
    result = subprocess.run(
        ["gh", "api", "graphql", "-f", "query=" + query],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Failed to fetch board schema: {result.stderr}")

    data = json.loads(result.stdout)
    schema = {}
    for field in data["data"]["node"]["fields"]["nodes"]:
        if not field:
            continue
        field_name = field["name"]
        if "options" in field:
            schema[field_name] = {
                "options": {
                    o["name"]: {
                        "description": o.get("description", ""),
                        "color": o.get("color", ""),
                    }
                    for o in field["options"]
                }
            }
        else:
            schema[field_name] = {}
    return schema


def load_baseline() -> dict | None:
    if not BASELINE_PATH.exists():
        return None
    with open(BASELINE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_baseline(schema: dict) -> None:
    with open(BASELINE_PATH, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2, sort_keys=True)


def diff_schema(current: dict, baseline: dict) -> list[str]:
    """Return a list of human-readable change descriptions."""
    changes = []
    current_fields = set(current.keys())
    baseline_fields = set(baseline.keys())

    added_fields = current_fields - baseline_fields
    removed_fields = baseline_fields - current_fields

    for f in sorted(added_fields):
        changes.append(f"+ Field added: {f}")
    for f in sorted(removed_fields):
        changes.append(f"- Field removed: {f}")

    for field in sorted(current_fields & baseline_fields):
        current_opts = current[field].get("options", {})
        baseline_opts = baseline[field].get("options", {})

        added_opts = set(current_opts.keys()) - set(baseline_opts.keys())
        removed_opts = set(baseline_opts.keys()) - set(current_opts.keys())

        for o in sorted(added_opts):
            changes.append(f"+ Option added: {field} / {o}")
        for o in sorted(removed_opts):
            changes.append(f"- Option removed: {field} / {o}")

        for opt in sorted(set(current_opts.keys()) & set(baseline_opts.keys())):
            c_desc = current_opts[opt].get("description", "")
            b_desc = baseline_opts[opt].get("description", "")
            if c_desc != b_desc:
                changes.append(f"~ Description changed: {field} / {opt}")
                changes.append(f"  was: {b_desc[:80]}")
                changes.append(f"  now: {c_desc[:80]}")

            c_color = current_opts[opt].get("color", "")
            b_color = baseline_opts[opt].get("color", "")
            if c_color != b_color:
                changes.append(f"~ Color changed: {field} / {opt} ({b_color} -> {c_color})")

    return changes


def main() -> int:
    parser = argparse.ArgumentParser(description="Detect board schema changes")
    parser.add_argument(
        "--update-baseline",
        action="store_true",
        help="Update the baseline after reporting changes",
    )
    args = parser.parse_args()

    try:
        current = fetch_schema()
    except RuntimeError as e:
        print(f"Error: {e}")
        return 2

    baseline = load_baseline()

    if baseline is None:
        save_baseline(current)
        print("Board baseline established. Future runs will detect changes.")
        return 0

    changes = diff_schema(current, baseline)

    if not changes:
        print("Board schema unchanged.")
        return 0

    print("Board schema changes detected:")
    print()
    for line in changes:
        print(f"  {line}")
    print()

    if args.update_baseline:
        save_baseline(current)
        print("Baseline updated.")
        return 0

    print("Run with --update-baseline to accept these changes.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
