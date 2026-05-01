#!/usr/bin/env python3
"""Discovery script for the GitHub Project board.

Scans the codebase for TODO, FIXME, HACK, BUG, ARGH, and other markers,
compares against existing GitHub issues, creates new issues for new markers,
and adds them to the project board in the Todo column.
"""

import json
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Files to exclude from scanning (they contain our own metadata)
EXCLUDED_FILES = {
    "BUGS.md",
    "BUGS.md.ARCHIVED",
    "TECH_DEBT.md",
    "AGENTS.md",
    "AGENTS-LOCAL.md",
}

# Exclude all .py files in the project root (local scripts)
EXCLUDED_PATTERNS = [
    re.compile(r"^[^/\\]+\.py$"),  # *.py in root directory
]

# Marker -> Category mapping
CATEGORY_MAP = {
    "TODO": "todo",
    "FIXME": "todo",
    "HACK": "hack",
    "BUG": "bug",
    "ARGH": "hack",
    "REVIEW": "todo",
    "WORKAROUND": "hack",
    "TEMP": "hack",
    "XXX": "hack",
    "NOTE": "todo",
}

# File/path -> Area mapping (most specific first)
AREA_MAP = [
    ("src/ts/MusicScore.ts", "Score"),
    ("src/ts/MusicCanvas.ts", "Canvas"),
    ("src/ts/MusicCanvasWatcher.ts", "UI"),
    ("src/ts/MusicControls.ts", "Controls"),
    ("src/ts/MusicElement.ts", "UI"),
    ("src/ts/common.ts", "Config"),
    ("src/ts/config.ts", "Config"),
    ("src/ts/lily.ts", "Lily"),
    ("src/ts/music-classes.ts", "Lily"),
    ("src/test/", "Test"),
    ("src/scss/style.scss", "UI"),
    ("index.ts", "UI"),
    ("index.html", "Tooling"),
    ("package.json", "Tooling"),
    ("vite.config.ts", "Tooling"),
    ("tsconfig.json", "Tooling"),
    ("buildScore.sh", "Tooling"),
    ("buildAllScores.sh", "Tooling"),
]

OWNER = "wainwmr"
REPO = "spem-player"
PROJECT_NUMBER = "2"
PROJECT_ID = "PVT_kwHOAO5EQs4BWPwP"


def fetch_project_fields() -> dict:
    """Query the GitHub Project board for field IDs and option IDs.

    Returns a dict shaped like:
        {field_name: {"id": field_id, "options": {option_name: option_id}}}
    """
    query = """
    query {
      node(id: "%s") {
        ... on ProjectV2 {
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
    """ % PROJECT_ID

    result = subprocess.run(
        ["gh", "api", "graphql", "-f", f"query={query}"],
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


FIELDS = fetch_project_fields()

# Regexes for finding markers in source lines.
LINE_PATTERNS = [
    (
        re.compile(
            r"//\s*(TODO|FIXME|HACK|BUG|ARGH|REVIEW|WORKAROUND|TEMP|XXX|NOTE)\b[:.]?\s*(.*)"
        ),
        "comment",
    ),
    (
        re.compile(
            r"(?:^\s*/\*|^\s*\*)\s*(TODO|FIXME|HACK|BUG|ARGH|REVIEW|WORKAROUND|TEMP|XXX|NOTE)\b[:.]?\s*(.*)"
        ),
        "comment",
    ),
    (
        re.compile(
            r"^\s*#\s*(TODO|FIXME|HACK|BUG|ARGH|REVIEW|WORKAROUND|TEMP|XXX|NOTE)\b[:.]?\s*(.*)"
        ),
        "comment",
    ),
    (
        re.compile(
            r"<!--\s*(TODO|FIXME|HACK|BUG|ARGH|REVIEW|WORKAROUND|TEMP|XXX|NOTE)\b[:.]?\s*(.*?)-->"
        ),
        "comment",
    ),
    (
        re.compile(
            r"^\s*%\s*(TODO|FIXME|HACK|BUG|ARGH|REVIEW|WORKAROUND|TEMP|XXX|NOTE)\b[:.]?\s*(.*)"
        ),
        "comment",
    ),
    (
        re.compile(
            r'(console\.(?:log|warn|error|info)\s*\(\s*["\'][^"\']*(TODO|FIXME|HACK|BUG|ARGH|REVIEW|WORKAROUND|TEMP|XXX|NOTE)\b[^"\']*["\']?\s*\))'
        ),
        "console",
    ),
]

_COMMENT_PREFIXES = ["//", "/*", "*", "#", "%", "<!--"]


def run(cmd: list[str], check: bool = True) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=Path(__file__).parent.parent)
    if result.returncode != 0:
        if check:
            raise RuntimeError(f"Command failed: {cmd}\n{result.stderr}")
        return ""
    return result.stdout.strip()


def get_existing_issues() -> list[dict]:
    """Return all issues in the repo with their titles and bodies."""
    out = run([
        "gh", "issue", "list",
        "--repo", f"{OWNER}/{REPO}",
        "--state", "all",
        "--limit", "1000",
        "--json", "number,title,body",
    ])
    return json.loads(out)


def normalise(text: str) -> str:
    """Collapse whitespace and strip backticks for fuzzy matching."""
    text = text.strip().strip("`")
    return " ".join(text.split())


def strip_prefix(text: str) -> str:
    """Remove leading TODO:/BUG:/HACK:/build: prefix from marker text."""
    return re.sub(r"^(TODO|BUG|HACK|build)\s*[:.]?\s*", "", text, flags=re.IGNORECASE)


def guess_area(filepath: str) -> str:
    """Map a file path to an area code."""
    for prefix, area in AREA_MAP:
        if filepath.startswith(prefix) or filepath == prefix:
            return area
    if filepath.startswith("src/ts/"):
        return "UI"
    if filepath.startswith("src/scss/"):
        return "UI"
    if filepath.startswith("src/lilypond/"):
        return "LILY"
    if filepath.startswith("src/scores/"):
        return "Score"
    if filepath.startswith("public/"):
        return "Other"
    if filepath.startswith("src/"):
        return "UI"
    return "Build"


def git_blame(filepath: str, line: int) -> tuple[str, str]:
    """Return (date_str, short_commit) for the given file/line."""
    try:
        result = subprocess.run(
            ["git", "blame", "-L", f"{line},{line}", "--porcelain", filepath],
            capture_output=True,
            text=True,
            check=True,
        )
        commit = None
        author_time = None
        for out_line in result.stdout.splitlines():
            if commit is None and not out_line.startswith("\t"):
                parts = out_line.split()
                if parts:
                    commit = parts[0]
            if out_line.startswith("author-time "):
                try:
                    author_time = int(out_line.split()[1])
                except (IndexError, ValueError):
                    pass
        if author_time and commit:
            dt = datetime.fromtimestamp(author_time, tz=timezone.utc)
            return dt.strftime("%Y-%m-%d"), commit[:8]
    except (subprocess.CalledProcessError, Exception):
        pass
    return "unknown", "unknown"


def strip_comment_prefix(raw: str) -> str:
    """Remove leading comment delimiters and trailing HTML close from a match."""
    raw = raw.strip()
    for prefix in _COMMENT_PREFIXES:
        if raw.startswith(prefix):
            raw = raw[len(prefix):].strip()
            break
    if raw.endswith("-->"):
        raw = raw[:-3].strip()
    return raw


def discover_markers(files: list[str]) -> list[dict]:
    """Scan files for markers and return a list of marker dicts."""
    markers = []
    for filepath in files:
        p = Path(filepath)
        if not p.is_file():
            continue
        try:
            content = p.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue

        for line_no, line in enumerate(content.splitlines(), start=1):
            for pattern, match_type in LINE_PATTERNS:
                m = pattern.search(line)
                if not m:
                    continue
                if match_type == "comment":
                    marker_type = m.group(1)
                    raw = strip_comment_prefix(m.group(0))
                else:  # console
                    raw = m.group(1).strip()
                    marker_type = m.group(2)

                markers.append({
                    "file": filepath,
                    "line": line_no,
                    "type": marker_type,
                    "raw": raw,
                })
                break  # Only report first match per line
    return markers


def create_issue(title: str, body: str) -> str:
    tmp = Path("tmp_discover_body.md")
    tmp.write_text(body, encoding="utf-8")
    try:
        return run([
            "gh", "issue", "create",
            "--repo", f"{OWNER}/{REPO}",
            "--title", title,
            "--body-file", str(tmp),
        ])
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


def _is_excluded(filepath: str) -> bool:
    """Check if a file matches an excluded pattern or is in the exclusion set."""
    if filepath in EXCLUDED_FILES:
        return True
    for pattern in EXCLUDED_PATTERNS:
        if pattern.match(filepath):
            return True
    return False


def get_git_files() -> list[str]:
    """Return tracked files under git."""
    try:
        tracked = (
            subprocess.check_output(["git", "ls-files"], text=True)
            .strip()
            .split("\n")
        )
    except subprocess.CalledProcessError:
        tracked = []

    return [f for f in tracked if f and not _is_excluded(f)]


def main() -> int:
    print("Fetching existing issues from GitHub...")
    existing_issues = get_existing_issues()
    existing_raws = {
        normalise(strip_prefix(i["title"]))
        for i in existing_issues
    }
    print(f"Found {len(existing_issues)} existing issues.")

    files = get_git_files()
    markers = discover_markers(files)
    print(f"Discovered {len(markers)} markers.")

    created = 0
    skipped = 0

    for marker in markers:
        category = CATEGORY_MAP.get(marker["type"], marker["type"])
        area = guess_area(marker["file"])
        raw_normalised = normalise(marker["raw"])

        # Skip if an issue with this raw text already exists
        if raw_normalised in existing_raws:
            skipped += 1
            continue

        title = strip_prefix(marker["raw"])
        date_str, commit = git_blame(marker["file"], marker["line"])

        body = (
            f"**Type:** {category}\n"
            f"**Area:** {area}\n"
            f"**Status:** todo\n"
            f"**Priority:** unassigned\n"
            f"**Difficulty:** unassigned\n"
            f"\n"
            f"**Source:** `{marker['file']}`:{marker['line']}\n"
            f"**First seen:** {date_str} ({commit})\n"
            f"\n"
            f"**Description:** (auto-discovered; needs assessment)\n"
            f"\n"
            f"## Question\n"
            f"{marker['raw']}\n"
        )

        print(f"Creating: {title[:60]}")
        try:
            url = create_issue(title, body)
        except RuntimeError as e:
            print(f"  Failed to create issue: {e}")
            continue

        print(f"  Issue: {url}")
        try:
            proj_item = add_to_project(url)
        except RuntimeError as e:
            print(f"  Failed to add to project: {e}")
            continue

        item_id_proj = proj_item["id"]
        set_field(item_id_proj, FIELDS["status"]["id"], FIELDS["status"]["options"]["todo"])
        set_field(item_id_proj, FIELDS["type"]["id"], FIELDS["type"]["options"][category])
        set_field(item_id_proj, FIELDS["area"]["id"], FIELDS["area"]["options"][area])

        created += 1
        existing_issues.append({"title": title})
        existing_raws.add(raw_normalised)
        time.sleep(0.5)

    print(f"\nDone. Created {created} issues, skipped {skipped} duplicates.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
