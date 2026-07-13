#!/usr/bin/env bash
# Push the current HEAD commit to main with bounded rebase-retry (#727).
#
# A bot commit step regenerates a file, commits it, and pushes to main. A bare
# `git push` from a checkout that has fallen behind origin/main fails
# non-fast-forward whenever another push landed in between -- non-fast-forward is
# a property of the ref, not the file. The symptom is a spurious red CI run; the
# data still lands via the winning run.
#
# This helper makes the push converge: on a rejection it replays our commit onto
# the freshly-fetched main and retries, bounded.
#
# Caller contract: HEAD is the single commit to push (already `git add` +
# `git commit`ed). Run it in place of the final `git push`:
#
#     bash .github/scripts/push-with-rebase.sh
#
# Why rebase, not `git reset --soft origin/main`: reset would re-stage our whole
# tree, which still holds the OLD version of any file another push changed in
# parallel -- re-committing that would silently REVERT their change. Rebase
# replays only our commit's delta, so concurrent changes to other files are
# preserved.
#
# Why `-X theirs`: the only files that can conflict are the one(s) our commit
# rewrote (when a parallel run rewrote them too). `-X theirs` resolves that
# conflict deterministically in favour of the commit being replayed -- ours -- so
# the push always converges with no manual step. ("theirs" in a rebase means the
# commit being replayed, i.e. ours.) Picking ours is last-writer-wins on the
# file's contents; the consequence differs by caller:
#   - The score SVGs (scores-ci) are fully derived from source, so a dropped
#     parallel regeneration is re-created by a later source-driven build: it
#     self-heals. (The score build is mtime-incremental and the bot's SVG commit
#     does not re-trigger scores-ci, so the catch-up is the next build that
#     rebuilds the affected score, not necessarily the immediate next run.)
#   - The monitor series (.github/monitor-series.json) is accumulated, NOT
#     regenerated -- each run upserts only today's entry. Last-writer-wins would
#     overwrite a richer entry with a poorer one (a merge-time refresh writing
#     mergedPRs:0 over the daily run's real count), so this path is bound to the
#     `monitor-series` merge driver (.gitattributes + the monitor workflows'
#     `git config merge.monitor-series.driver`), which reconciles the rebase by
#     keeping the larger per-day mergedPRs -- last-writer-wins no longer applies
#     to this file (#728).
#
# Why FETCH_HEAD, not origin/main: actions/checkout fetches with a narrow refspec
# that need not update the origin/main remote-tracking ref, so rebasing onto
# origin/main can replay onto a stale tip and never converge in CI though it
# passes locally. FETCH_HEAD is whatever `git fetch origin main` just fetched, so
# it is always the live tip.
#
# Why --autostash: a non-frozen `pnpm install` earlier in the job can leave the
# tree dirty (e.g. a lockfile touch), which would abort the rebase; --autostash
# stashes and restores it around the replay.
#
# Scope of the retry: only `git push` is retried. A fetch or rebase failure (a
# real delete/modify conflict, a network error) is a hard error -- set -e exits
# with git's own code, surfacing loudly rather than looping. Correct on an
# ephemeral runner.
#
# Bounded: after PUSH_RETRIES attempts we fail loudly. A persistent rejection is
# a real problem (protected branch, permissions), not the spurious flake this
# fixes, and must surface as a red run rather than loop forever.
set -euo pipefail

retries="${PUSH_RETRIES:-5}"
# Normalise then floor. A non-integer PUSH_RETRIES would slip past the numeric
# floor (the `[` test errors on it, and set -e ignores that as the left of an &&
# list), leaving a bad value: a non-numeric string makes `seq` yield nothing so
# the loop never runs and the script exits 1 without pushing, and a float like 3.5
# would run the wrong number of times. The regex rejects both. The floor likewise
# stops PUSH_RETRIES=0 skipping the loop. Both guards ensure at least one attempt
# runs; the failure they remove is a guaranteed red run that never attempts a push.
[[ "$retries" =~ ^[0-9]+$ ]] || retries=5
[ "$retries" -lt 1 ] && retries=1

for attempt in $(seq 1 "$retries"); do
  if git push; then
    exit 0
  fi
  # No rebase after the final failed attempt: we are about to fail loudly.
  if [ "$attempt" -lt "$retries" ]; then
    echo "push rejected (attempt ${attempt}/${retries}); rebasing our commit onto fetched main and retrying"
    git fetch origin main
    git rebase --autostash -X theirs FETCH_HEAD
  fi
done

echo "push to main still rejected after ${retries} attempts; failing loudly" >&2
exit 1
