#!/usr/bin/env python3
"""Create a ticket on the Spem Player GitHub Project board.

Usage:
    python scripts/ticket.py "Title of the ticket" [--type bug|todo|hack|build] [--area <area>] [--body <text>]

Creates a GitHub issue, adds it to the project board, and sets Status to Todo.
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

OWNER = "wainwmr"
REPO = "spem-player"
PROJECT_NUMBER = "2"
PROJECT_ID = "PVT_kwHOAO5EQs4BWPwP"


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


def fetch_project_fields() -> dict:
    query = (
        'query { node(id: "'
        + PROJECT_ID
        + '") { ... on ProjectV2 { fields(first: 20) { nodes { '
        '... on ProjectV2SingleSelectField { id name options { id name } } '
        '... on ProjectV2Field { name } } } } } }'
    )
    result = subprocess.run(
        ["gh", "api", "graphql", "-f", "query=" + query],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Failed to fetch project fields: {result.stderr}")
    data = json.loads(result.stdout)
    fields = {}
    for field in data["data"]["node"]["fields"]["nodes"]:
        if not field or "options" not in field:
            continue
        name = field["name"].lower().replace(" ", "_")
        fields[name] = {
            "id": field["id"],
            "options": {o["name"]: o["id"] for o in field["options"]},
        }
    return fields


def create_issue(title: str, body: str) -> str:
    tmp = Path("tmp_ticket_body.md")
    tmp.write_text(body, encoding="utf-8")
    try:
        url = run([
            "gh", "issue", "create",
            "--repo", f"{OWNER}/{REPO}",
            "--title", title,
            "--body-file", str(tmp),
        ])
        return url
    finally:
        tmp.unlink(missing_ok=True)


def add_to_project(issue_url: str) -> dict:
    out = run([
        "gh", "project", "item-add", PROJECT_NUMBER,
        "--owner", OWNER,
        "--url", issue_url,
        "--format", "json",
    ])
    return json.loads(out)


def set_field(item_id: str, field_id: str, option_id: str) -> None:
    run([
        "gh", "project", "item-edit",
        "--id", item_id,
        "--field-id", field_id,
        "--project-id", PROJECT_ID,
        "--single-select-option-id", option_id,
    ])


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a ticket on the board")
    parser.add_argument("title", help="Ticket title")
    parser.add_argument("--type", choices=["bug", "todo", "hack", "build"], help="Ticket type")
    parser.add_argument("--area", help="Ticket area (e.g. UI, Score, Canvas)")
    parser.add_argument("--body", default="", help="Ticket body text")
    args = parser.parse_args()

    fields = fetch_project_fields()
    status_todo = fields["status"]["options"]["Todo"]

    body = args.body
    if not body:
        body = "(No description provided)\n"

    print(f"Creating issue: {args.title}")
    url = create_issue(args.title, body)
    print(f"  Issue: {url}")

    print("Adding to project board...")
    proj_item = add_to_project(url)
    item_id = proj_item["id"]
    print(f"  Board item: {item_id}")

    print("Setting status to Todo...")
    set_field(item_id, fields["status"]["id"], status_todo)

    if args.type:
        type_option = fields["type"]["options"].get(args.type)
        if type_option:
            print(f"Setting type to {args.type}...")
            set_field(item_id, fields["type"]["id"], type_option)

    if args.area:
        area_option = fields["area"]["options"].get(args.area)
        if area_option:
            print(f"Setting area to {args.area}...")
            set_field(item_id, fields["area"]["id"], area_option)
        else:
            print(f"  Warning: area '{args.area}' not found in board options.")
            print(f"  Available: {', '.join(fields['area']['options'].keys())}")

    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
