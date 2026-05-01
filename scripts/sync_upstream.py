#!/usr/bin/env python3
"""Sync local branch with Mark's upstream dev branch.

Fetches upstream/dev, reports Mark's recent commits and open PRs,
rebases the current branch onto upstream/dev, and optionally pushes
to origin.

Usage:
    python sync_upstream.py [--push]

If uncommitted changes exist, they are stashed before rebase and
restored after.  If the rebase hits conflicts, the stash is left
in place; resolve the conflicts, run `git rebase --continue`, then
`git stash pop` manually.
"""

import argparse
import subprocess
import sys
from pathlib import Path

UPSTREAM_REPO = "wainwmr/spem-player"
UPSTREAM_DEFAULT = "upstream/dev"


def run(cmd, check=True, capture_output=False, text=True):
    result = subprocess.run(
        cmd,
        shell=isinstance(cmd, str),
        check=False,
        capture_output=capture_output,
        text=text,
    )
    if check and result.returncode != 0:
        print(f"Error: command failed with code {result.returncode}")
        print(f"  {' '.join(cmd) if isinstance(cmd, list) else cmd}")
        if result.stderr:
            print(result.stderr)
        sys.exit(result.returncode)
    return result


def get_current_branch() -> str:
    return run(["git", "branch", "--show-current"], capture_output=True).stdout.strip()


def verify_remotes():
    result = run(["git", "remote", "-v"], capture_output=True)
    remotes = result.stdout
    if "upstream" not in remotes:
        print("Error: no 'upstream' remote found.", file=sys.stderr)
        print("Add it with:", file=sys.stderr)
        print(
            "  git remote add upstream https://github.com/wainwmr/spem-player.git",
            file=sys.stderr,
        )
        sys.exit(1)
    if "origin" not in remotes:
        print("Error: no 'origin' remote found.", file=sys.stderr)
        sys.exit(1)


def verify_gh_auth():
    result = subprocess.run(
        ["gh", "auth", "status"], capture_output=True, text=True
    )
    if result.returncode != 0 or "github.com" not in result.stdout:
        print("Error: gh CLI is not authenticated for github.com.", file=sys.stderr)
        sys.exit(1)


def has_uncommitted_changes() -> bool:
    result = run(["git", "status", "--porcelain"], capture_output=True)
    return bool(result.stdout.strip())


def get_uncommitted_files() -> list[str]:
    result = run(["git", "status", "--porcelain"], capture_output=True)
    files = []
    for line in result.stdout.strip().splitlines():
        if line:
            files.append(line)
    return files


def report_mark_commits(base_ref: str):
    result = run(
        ["git", "log", "--oneline", f"HEAD..{base_ref}"],
        capture_output=True,
    )
    commits = result.stdout.strip()
    if commits:
        print(f"\nMark's commits on {base_ref} not yet in your branch:")
        for line in commits.splitlines():
            print(f"  {line}")
    else:
        print(f"\nNo new commits on {base_ref}.")


def report_prs():
    result = subprocess.run(
        [
            "gh",
            "pr",
            "list",
            "--repo",
            UPSTREAM_REPO,
            "--state",
            "open",
            "--author",
            "@me",
            "--json",
            "number,title,url,updatedAt",
            "--jq",
            ".[] | \"#\\(.number) \\(.title) (updated \\(.updatedAt[:10]))\"",
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode == 0 and result.stdout.strip():
        print("\nYour open PRs to Mark's repo:")
        for line in result.stdout.strip().splitlines():
            print(f"  {line}")
    else:
        print("\nNo open PRs from you to Mark's repo.")


def report_branch_status(branch: str):
    result = run(
        ["git", "rev-list", "--left-right", f"origin/{branch}...{branch}"],
        capture_output=True,
    )
    lines = result.stdout.strip().splitlines()
    ahead = sum(1 for l in lines if l.startswith(">"))
    behind = sum(1 for l in lines if l.startswith("<"))
    if ahead or behind:
        print(f"\nBranch '{branch}' vs origin: {ahead} ahead, {behind} behind")
    else:
        print(f"\nBranch '{branch}' is up to date with origin.")


def main():
    parser = argparse.ArgumentParser(
        description="Sync current branch with Mark's upstream dev."
    )
    parser.add_argument(
        "--push",
        action="store_true",
        help="Always push to origin after rebase, even if uncommitted changes were stashed.",
    )
    parser.add_argument(
        "--base",
        default=UPSTREAM_DEFAULT,
        help="Upstream ref to rebase onto (default: upstream/dev).",
    )
    args = parser.parse_args()

    verify_remotes()
    verify_gh_auth()

    branch = get_current_branch()
    if not branch:
        print("Error: not on a branch (HEAD is detached).", file=sys.stderr)
        sys.exit(1)

    print(f"Current branch: {branch}")

    uncommitted = has_uncommitted_changes()
    if uncommitted:
        files = get_uncommitted_files()
        print(f"\nUncommitted changes ({len(files)} files):")
        for f in files:
            print(f"  {f}")
        print("\nThese will be stashed before rebase.")
    else:
        print("\nWorking tree is clean.")

    print(f"\nFetching upstream and origin...")
    run(["git", "fetch", "upstream"])
    run(["git", "fetch", "origin"])

    base_ref = args.base
    report_mark_commits(base_ref)
    report_prs()
    report_branch_status(branch)

    stash_ref = None
    if uncommitted:
        print("\nStashing uncommitted changes...")
        result = run(
            ["git", "stash", "push", "-m", "sync_upstream auto-stash"],
            capture_output=True,
        )
        stash_ref = result.stdout.strip()
        print(f"  {stash_ref}")

    print(f"\nRebasing {branch} onto {base_ref}...")
    rebase_result = subprocess.run(
        ["git", "rebase", base_ref],
        capture_output=True,
        text=True,
    )

    if rebase_result.returncode != 0:
        print("\nRebase failed — conflicts detected.")
        print("Resolve the conflicts, then run:")
        print("  git rebase --continue")
        if stash_ref:
            print("Then restore your stashed changes:")
            print("  git stash pop")
        sys.exit(1)

    print("Rebase complete.")

    if not uncommitted or args.push:
        print(f"\nPushing {branch} to origin...")
        run(["git", "push", "origin", branch])
    else:
        print(
            "\nSkipped push to origin because uncommitted changes were stashed."
        )
        print("Commit or discard those changes, then push manually.")

    if stash_ref:
        print("\nRestoring stashed changes...")
        run(["git", "stash", "pop"])

    print("\nDone.")


if __name__ == "__main__":
    main()
