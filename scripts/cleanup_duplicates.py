#!/usr/bin/env python3
"""Remove duplicate tickets from the GitHub Project board.

Usage:
    python scripts/cleanup_duplicates.py [--confirm]

Default is dry-run mode. Reports statistics only. Use --confirm to actually
remove duplicate tickets from the board. Underlying issues are never modified.
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

OWNER = "wainwmr"
REPO = "spem-player"
PROJECT_NUMBER = "2"


def run(cmd: list[str], check: bool = True) -> str:
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent,
    )
    if result.returncode != 0:
        if check:
            raise RuntimeError(f"Command failed: {cmd}\n{result.stderr}")
        return ""
    return result.stdout.strip()


def normalise_title(title: str) -> str:
    """Collapse whitespace and strip common prefixes for matching."""
    title = title.strip().strip("`")
    title = re.sub(r"^(TODO|BUG|HACK|build)\s*[:.]?\s*", "", title, flags=re.IGNORECASE)
    return " ".join(title.split())


def fetch_board_items() -> list[dict]:
    """Fetch all items from the project board."""
    result = subprocess.run(
        ["gh", "project", "item-list", PROJECT_NUMBER,
         "--owner", OWNER, "--limit", "100", "--format", "json"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Failed to fetch board items: {result.stderr}")
    data = json.loads(result.stdout)
    return data.get("items", [])


def remove_from_board(item_id: str) -> None:
    """Remove a ticket from the project board."""
    run([
        "gh", "project", "item-delete", PROJECT_NUMBER,
        "--owner", OWNER,
        "--id", item_id,
    ])


def main() -> int:
    parser = argparse.ArgumentParser(description="Remove duplicate tickets from the board")
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Actually remove duplicate tickets from the board",
    )
    args = parser.parse_args()

    items = fetch_board_items()
    if not items:
        print("No items found on the board.")
        return 0

    # Group by normalised title
    groups: dict[str, list[dict]] = {}
    for item in items:
        title = item.get("title", "")
        key = normalise_title(title).lower()
        if not key:
            continue
        groups.setdefault(key, []).append(item)

    duplicates = {k: v for k, v in groups.items() if len(v) > 1}

    if not duplicates:
        print("No duplicate tickets found.")
        return 0

    print(f"Found {len(duplicates)} duplicate ticket group(s):\n")

    to_remove = []
    to_review = []

    for key, group in sorted(duplicates.items()):
        # Sort by issue number ascending; lowest is the original
        group.sort(key=lambda x: x.get("content", {}).get("number", 0))
        original = group[0]
        dups = group[1:]

        orig_num = original.get("content", {}).get("number", "?")
        orig_status = original.get("status", "?")

        print(f'Group: "{key}"')
        print(f"  Original ticket: #{orig_num} (Status: {orig_status})")

        for dup in dups:
            dup_num = dup.get("content", {}).get("number", "?")
            dup_status = dup.get("status", "?")
            dup_id = dup.get("id", "")
            dup_assignees = dup.get("assignees", [])
            dup_prs = dup.get("linked_pull_requests", [])

            # Safe to remove if duplicate is in Todo and original is more advanced.
            # Flag for review only if duplicate has assignees, linked PRs,
            # or a more advanced status than the original.
            safe_to_remove = (
                dup_status == "Todo"
                and orig_status in ("Specified", "In Progress", "Ready for Main", "Done")
                and not dup_assignees
                and not dup_prs
            )

            if safe_to_remove:
                print(f"  Duplicate ticket: #{dup_num} (Status: {dup_status}) -> Remove")
                to_remove.append(dup)
            else:
                print(f"  Duplicate ticket: #{dup_num} (Status: {dup_status})")
                if dup_assignees:
                    print(f"    WARNING: assigned to {', '.join(dup_assignees)}")
                if dup_prs:
                    print(f"    WARNING: linked PRs present")
                if dup_status != "Todo" and orig_status in ("Todo", "Specified"):
                    print(f"    WARNING: duplicate has more advanced status than original")
                print(f"    -> Review manually.")
                to_review.append(dup)

        print()

    print(f"Summary: {len(to_remove)} ticket(s) to remove, {len(to_review)} to review manually.")

    if not args.confirm:
        print("\nDry run complete. Use --confirm to remove duplicates.")
        return 0

    if to_review:
        print("\nWARNING: some duplicates have board-level updates.")
        print("Review the list above before re-running with --confirm.")
        return 1

    print("\nRemoving duplicates from board...")
    for dup in to_remove:
        dup_num = dup.get("content", {}).get("number", "?")
        dup_id = dup.get("id", "")
        try:
            remove_from_board(dup_id)
            print(f"  Removed ticket #{dup_num}")
        except RuntimeError as e:
            print(f"  FAILED to remove ticket #{dup_num}: {e}")

    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
