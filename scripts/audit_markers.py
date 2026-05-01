#!/usr/bin/env python3
"""Audit codebase markers against the GitHub Project board.

Scans tracked files for TODO, FIXME, HACK, BUG, ARGH, and other markers,
compares them against a local JSON registry, and reports unmatched markers
for human judgment.

Usage:
    python scripts/audit_markers.py [--interactive] [--prune] [--strict]

Exit codes:
    0 — all markers are mapped or explicitly marked as ok.
    1 — unmapped markers found (or --strict is set and pending markers exist).
"""

import argparse
import hashlib
import json
import re
import subprocess
import sys
from difflib import SequenceMatcher
from pathlib import Path

# Files to exclude from scanning (they contain our own metadata)
EXCLUDED_FILES = {
    "BUGS.md",
    "BUGS.md.ARCHIVED",
    "TECH_DEBT.md",
    "AGENTS.md",
    "AGENTS-LOCAL.md",
}

# Exclude local scripts, tests, and build artifacts (not application source)
EXCLUDED_PATTERNS = [
    re.compile(r"^[^/\\]+\.py$"),  # *.py in root directory
    re.compile(r"^scripts/"),  # local helper scripts
    re.compile(r"^tests_local/"),  # local Python tests
    re.compile(r"\.ohm-bundle\."),  # Ohm generated bundles
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
    ("src/ohmjs/", "Lily"),
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
    ("scripts/", "Tooling"),
    ("tests_local/", "Test"),
]

OWNER = "wainwmr"
REPO = "spem-player"
PROJECT_NUMBER = "2"

REGISTRY_PATH = Path(__file__).parent / "marker_registry.json"

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


def compute_hash(filepath: str, raw_text: str) -> str:
    """Return a stable hash for a marker based on file path and normalised text."""
    key = f"{filepath}|{normalise(raw_text)}"
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:6]


def load_registry() -> dict:
    """Load the marker registry from JSON."""
    if not REGISTRY_PATH.exists():
        return {"markers": {}}
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_registry(registry: dict) -> None:
    """Save the marker registry to JSON."""
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, sort_keys=True)


def fetch_board_issues() -> list[dict]:
    """Fetch issues linked to the project board.

    Returns only issues that are actually on the board, ignoring orphaned
    repo issues created by failed discover.py runs.
    """
    result = subprocess.run(
        ["gh", "project", "item-list", PROJECT_NUMBER,
         "--owner", OWNER, "--limit", "200", "--format", "json"],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Failed to fetch board items: {result.stderr}")

    raw = result.stdout
    if raw.startswith("\ufeff"):
        raw = raw[1:]
    data = json.loads(raw)

    issues = []
    for item in data.get("items", []):
        content = item.get("content", {})
        num = content.get("number")
        title = content.get("title")
        if num and title:
            issues.append({"number": num, "title": title})
    return issues


def find_candidates(marker: dict, issues: list[dict], top_n: int = 3) -> list[dict]:
    """Return the top N candidate board issues for a marker based on title similarity."""
    marker_text = normalise(strip_prefix(marker["raw"]))
    scored = []
    for issue in issues:
        issue_title = normalise(strip_prefix(issue["title"]))
        score = SequenceMatcher(None, marker_text.lower(), issue_title.lower()).ratio()
        if score > 0.3:  # minimum threshold
            scored.append((score, issue))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [issue for _score, issue in scored[:top_n]]


def report_markers(known: list[dict], unknown: list[dict], candidates_map: dict) -> None:
    """Print a human-readable report of marker status."""
    if known:
        print(f"\nKNOWN MARKERS ({len(known)}):")
        for item in known:
            marker = item["marker"]
            entry = item["entry"]
            status_label = entry.get("status", "mapped")
            ticket_info = f" -> #{entry['ticket']}" if entry.get("ticket") else ""
            print(f"  {item['hash']}  {marker['file']}:{marker['line']}  [{marker['type']}] {marker['raw'][:60]}{ticket_info}  ({status_label})")

    if unknown:
        print(f"\nUNKNOWN MARKERS ({len(unknown)}):")
        for item in unknown:
            marker = item["marker"]
            h = item["hash"]
            print(f"\n  {h}  {marker['file']}:{marker['line']}  [{marker['type']}] {marker['raw'][:60]}")
            candidates = candidates_map.get(h, [])
            if candidates:
                print("    Candidates:")
                for c in candidates:
                    print(f"      #{c['number']}  {c['title'][:70]}")
            else:
                print("    (no candidates found)")


def interactive_review(unknown: list[dict], candidates_map: dict, registry: dict) -> None:
    """Prompt the user for actions on unknown markers."""
    for item in unknown:
        marker = item["marker"]
        h = item["hash"]
        print(f"\n{h}  {marker['file']}:{marker['line']}")
        print(f"  [{marker['type']}] {marker['raw']}")

        candidates = candidates_map.get(h, [])
        if candidates:
            print("  Candidates:")
            for i, c in enumerate(candidates, 1):
                print(f"    [{i}] #{c['number']} {c['title']}")

        action = input(
            "  Action: [m]ap to ticket / [n]ew ticket / [o]k no ticket / [s]kip / [q]uit ? "
        ).strip().lower()

        if action == "q":
            break
        elif action == "o":
            registry["markers"][h] = {
                "file": marker["file"],
                "type": marker["type"],
                "text": normalise(strip_prefix(marker["raw"])),
                "ticket": None,
                "status": "ok",
            }
        elif action == "m":
            ticket_num = input("  Ticket number: ").strip()
            if ticket_num.isdigit():
                registry["markers"][h] = {
                    "file": marker["file"],
                    "type": marker["type"],
                    "text": normalise(strip_prefix(marker["raw"])),
                    "ticket": int(ticket_num),
                    "status": "mapped",
                }
        elif action == "n":
            registry["markers"][h] = {
                "file": marker["file"],
                "type": marker["type"],
                "text": normalise(strip_prefix(marker["raw"])),
                "ticket": None,
                "status": "pending",
            }
        # 's'kip does nothing


def prune_registry(registry: dict, markers: list[dict]) -> dict:
    """Remove registry entries whose markers no longer exist in the codebase."""
    active_hashes = {compute_hash(m["file"], m["raw"]) for m in markers}
    removed = []
    for h in list(registry.get("markers", {}).keys()):
        if h not in active_hashes:
            removed.append(h)
            del registry["markers"][h]
    return removed


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit codebase markers against the board")
    parser.add_argument("--interactive", action="store_true", help="Prompt for actions on unknown markers")
    parser.add_argument("--prune", action="store_true", help="Remove registry entries for markers no longer in code")
    parser.add_argument("--strict", action="store_true", help="Exit with error if any marker is unmapped or pending")
    args = parser.parse_args()

    files = get_git_files()
    markers = discover_markers(files)
    registry = load_registry()

    if args.prune:
        removed = prune_registry(registry, markers)
        if removed:
            print(f"Pruned {len(removed)} stale registry entries.")
            save_registry(registry)
        else:
            print("No stale registry entries to prune.")

    known = []
    unknown = []
    for marker in markers:
        h = compute_hash(marker["file"], marker["raw"])
        if h in registry.get("markers", {}):
            known.append({"hash": h, "marker": marker, "entry": registry["markers"][h]})
        else:
            unknown.append({"hash": h, "marker": marker})

    candidates_map = {}
    if unknown:
        try:
            issues = fetch_board_issues()
        except RuntimeError as e:
            print(f"Warning: could not fetch issues: {e}")
            issues = []

        for item in unknown:
            h = item["hash"]
            candidates = find_candidates(item["marker"], issues)
            if candidates:
                candidates_map[h] = candidates

    report_markers(known, unknown, candidates_map)

    if unknown and args.interactive:
        interactive_review(unknown, candidates_map, registry)
        save_registry(registry)
        # Re-evaluate after interactive review
        pending = [
            item for item in unknown
            if compute_hash(item["marker"]["file"], item["marker"]["raw"]) in registry.get("markers", {})
            and registry["markers"][compute_hash(item["marker"]["file"], item["marker"]["raw"])].get("status") == "pending"
        ]
        still_unknown = [
            item for item in unknown
            if compute_hash(item["marker"]["file"], item["marker"]["raw"]) not in registry.get("markers", {})
        ]
    else:
        pending = [
            item for item in known
            if item["entry"].get("status") == "pending"
        ]
        still_unknown = unknown

    if still_unknown:
        print(f"\n{len(still_unknown)} unmapped marker(s). Run with --interactive to review.")
        return 1

    if pending and args.strict:
        print(f"\n{len(pending)} marker(s) with status 'pending'. Run with --interactive to resolve.")
        return 1

    total = len(markers)
    mapped = sum(1 for k in known if k["entry"].get("status") == "mapped")
    ok = sum(1 for k in known if k["entry"].get("status") == "ok")
    pending_count = sum(1 for k in known if k["entry"].get("status") == "pending")
    print(f"\nDone. {total} markers: {mapped} mapped, {ok} ok, {pending_count} pending.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
