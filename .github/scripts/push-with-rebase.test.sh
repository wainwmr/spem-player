#!/usr/bin/env bash
# Regression test for push-with-rebase.sh (#727).
#
# Pure bash + git sandbox, no network. Reproduces the concurrent-push race the
# helper absorbs and asserts: (1) same-file conflict converges with ours winning,
# (2) a concurrent change to another file is preserved, (3) a persistently
# rejected push fails loudly after exactly the retry bound, (4) it rebases onto
# FETCH_HEAD so it converges even when the origin/main ref is stale (the core
# fix), (5) --autostash lets it converge with a dirty working tree, (6) a floored
# PUSH_RETRIES=0 still attempts one push, and (7) a non-integer PUSH_RETRIES
# normalises rather than falling through to a no-push.
#
# Run by .github/workflows/push-helper-test.yml on any change under
# .github/scripts/, and locally with:
#
#     bash .github/scripts/push-with-rebase.test.sh
set -euo pipefail

HELPER="$(cd "$(dirname "$0")" && pwd)/push-with-rebase.sh"
[ -f "$HELPER" ] || { echo "helper not found: $HELPER" >&2; exit 1; }

# Provide a committer identity so the helper's plain `git rebase` is hermetic: the
# sandbox `ci` clone configures none and the helper sets none, so without this the
# test would rely on the runner auto-deriving user@host.
export GIT_AUTHOR_NAME=ci GIT_AUTHOR_EMAIL=ci@test
export GIT_COMMITTER_NAME=ci GIT_COMMITTER_EMAIL=ci@test

ROOT="$(mktemp -d)"
trap 'rm -rf "$ROOT"' EXIT

pass=0
fail=0
ok()  { echo "ok   - $1"; pass=$((pass + 1)); }
bad() { echo "FAIL - $1" >&2; fail=$((fail + 1)); }

# Run git with a fixed identity so the sandbox never reads the caller's config.
git_q() { git -c user.email=ci@test -c user.name=ci -c init.defaultBranch=main "$@"; }

# Seed a bare origin (main = regenerated.txt:v0 + sibling.txt:s0) and a "ci"
# checkout cloned from it. Echoes the sandbox dir; all git noise is suppressed so
# only the path reaches stdout.
setup() {
  local d="$ROOT/$1"
  rm -rf "$d"; mkdir -p "$d"
  git_q init -q --bare "$d/origin.git" >/dev/null 2>&1
  git_q clone -q "$d/origin.git" "$d/seed" >/dev/null 2>&1
  (
    cd "$d/seed"
    echo v0 > regenerated.txt
    echo s0 > sibling.txt
    git_q add -A
    git_q commit -qm seed
    git_q push -q origin HEAD:main
  ) >/dev/null 2>&1
  git_q clone -q "$d/origin.git" "$d/ci" >/dev/null 2>&1
  echo "$d"
}

# Land a concurrent commit on origin/main from a throwaway clone. $1 dir $2 file $3 content.
concurrent_push() {
  local d="$1" file="$2" content="$3"
  rm -rf "$d/other"
  git_q clone -q "$d/origin.git" "$d/other" >/dev/null 2>&1
  (
    cd "$d/other"
    echo "$content" > "$file"
    git_q add -A
    git_q commit -qm "concurrent $file"
    git_q push -q origin HEAD:main
  ) >/dev/null 2>&1
}

origin_show() { git_q -C "$1/origin.git" show "main:$2"; }

# Case 1: same-file conflict -- ours (the just-regenerated file) wins.
d="$(setup case1)"
( cd "$d/ci"; echo vCI > regenerated.txt; git_q add -A; git_q commit -qm "ci regen" ) >/dev/null 2>&1
concurrent_push "$d" regenerated.txt vOTHER
if ( cd "$d/ci"; bash "$HELPER" ) >/dev/null 2>&1; then
  r="$(origin_show "$d" regenerated.txt)"; s="$(origin_show "$d" sibling.txt)"
  if [ "$r" = vCI ] && [ "$s" = s0 ]; then
    ok "case1: same-file conflict converges, ours wins"
  else
    bad "case1: regenerated=$r sibling=$s (want vCI/s0)"
  fi
else
  bad "case1: helper exited non-zero on a recoverable race"
fi

# Case 2: concurrent change to a different file is preserved.
d="$(setup case2)"
( cd "$d/ci"; echo vCI > regenerated.txt; git_q add -A; git_q commit -qm "ci regen" ) >/dev/null 2>&1
concurrent_push "$d" sibling.txt sOTHER
if ( cd "$d/ci"; bash "$HELPER" ) >/dev/null 2>&1; then
  r="$(origin_show "$d" regenerated.txt)"; s="$(origin_show "$d" sibling.txt)"
  if [ "$r" = vCI ] && [ "$s" = sOTHER ]; then
    ok "case2: concurrent sibling change preserved"
  else
    bad "case2: regenerated=$r sibling=$s (want vCI/sOTHER)"
  fi
else
  bad "case2: helper exited non-zero on a recoverable race"
fi

# Case 3: a persistently rejected push fails loudly after the bound.
d="$(setup case3)"
cat > "$d/origin.git/hooks/pre-receive" <<'HOOK'
#!/bin/sh
echo "rejecting (test)" >&2
exit 1
HOOK
chmod +x "$d/origin.git/hooks/pre-receive"
( cd "$d/ci"; echo vCI > regenerated.txt; git_q add -A; git_q commit -qm "ci regen" ) >/dev/null 2>&1
set +e
out="$( cd "$d/ci"; PUSH_RETRIES=2 bash "$HELPER" 2>&1 )"
rc=$?
set -e
if [ "$rc" -ne 0 ] \
  && printf '%s' "$out" | grep -q "failing loudly" \
  && printf '%s' "$out" | grep -q "attempt 1/2" \
  && ! printf '%s' "$out" | grep -q "attempt 2/2"; then
  ok "case3: bounded loud-fail after exactly the retry bound (exit $rc)"
else
  bad "case3: rc=$rc, expected loud-fail with 'attempt 1/2' and no 'attempt 2/2'"
fi

# Case 4: the rebase targets FETCH_HEAD, not the (possibly stale) origin/main ref.
# Mimic actions/checkout's narrow refspec by unsetting the ci clone's fetch
# refspec, so `git fetch origin main` advances only FETCH_HEAD and leaves
# origin/main stale. The helper must still converge; a rebase onto origin/main
# would replay onto the stale tip, never converge, and loud-fail at the bound.
d="$(setup case4)"
git_q -C "$d/ci" config --unset-all remote.origin.fetch 2>/dev/null || true
( cd "$d/ci"; echo vCI > regenerated.txt; git_q add -A; git_q commit -qm "ci regen" ) >/dev/null 2>&1
concurrent_push "$d" regenerated.txt vOTHER
if ( cd "$d/ci"; bash "$HELPER" ) >/dev/null 2>&1; then
  r="$(origin_show "$d" regenerated.txt)"
  if [ "$r" = vCI ]; then
    ok "case4: converges onto FETCH_HEAD when the origin/main ref is stale"
  else
    bad "case4: regenerated=$r (want vCI)"
  fi
else
  bad "case4: helper did not converge with a stale origin/main ref (FETCH_HEAD lost?)"
fi

# Case 5: --autostash survives a dirty working tree (e.g. a non-frozen install's
# lockfile touch). Leave a tracked file modified before invoking the helper;
# assert convergence and that the dirty change is restored locally. Without
# --autostash the rebase aborts and the helper exits non-zero.
d="$(setup case5)"
( cd "$d/ci"; echo vCI > regenerated.txt; git_q add -A; git_q commit -qm "ci regen" ) >/dev/null 2>&1
concurrent_push "$d" regenerated.txt vOTHER
echo dirty >> "$d/ci/sibling.txt"
if ( cd "$d/ci"; bash "$HELPER" ) >/dev/null 2>&1; then
  r="$(origin_show "$d" regenerated.txt)"
  if [ "$r" = vCI ] && grep -q dirty "$d/ci/sibling.txt"; then
    ok "case5: --autostash converges with a dirty tree and restores the change"
  else
    bad "case5: regenerated=$r; dirty restored=$(grep -c dirty "$d/ci/sibling.txt")"
  fi
else
  bad "case5: helper aborted on a dirty tree (--autostash missing?)"
fi

# Case 6: PUSH_RETRIES=0 floors to one attempt -- it still pushes, never a no-push.
d="$(setup case6)"
( cd "$d/ci"; echo vCI > regenerated.txt; git_q add -A; git_q commit -qm "ci regen" ) >/dev/null 2>&1
if ( cd "$d/ci"; PUSH_RETRIES=0 bash "$HELPER" ) >/dev/null 2>&1; then
  r="$(origin_show "$d" regenerated.txt)"
  [ "$r" = vCI ] && ok "case6: PUSH_RETRIES=0 floors to one attempt and pushes" \
    || bad "case6: regenerated=$r (want vCI)"
else
  bad "case6: PUSH_RETRIES=0 did not push (floor missing?)"
fi

# Case 7: a non-integer PUSH_RETRIES normalises to the default and still pushes,
# rather than falling through to a no-push.
d="$(setup case7)"
( cd "$d/ci"; echo vCI > regenerated.txt; git_q add -A; git_q commit -qm "ci regen" ) >/dev/null 2>&1
if ( cd "$d/ci"; PUSH_RETRIES=notanumber bash "$HELPER" ) >/dev/null 2>&1; then
  r="$(origin_show "$d" regenerated.txt)"
  [ "$r" = vCI ] && ok "case7: non-integer PUSH_RETRIES normalises and pushes" \
    || bad "case7: regenerated=$r (want vCI)"
else
  bad "case7: non-integer PUSH_RETRIES did not push (validation missing?)"
fi

echo "---"
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
