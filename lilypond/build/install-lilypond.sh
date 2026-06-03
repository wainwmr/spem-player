#!/usr/bin/env bash
# Install LilyPond for Netlify builds.
#
# Background: ticket #318 removed the tracked SVGs from the repo. Netlify
# builds now regenerate them from src/lilypond/, which requires LilyPond on
# PATH. Netlify's build image does not include LilyPond, so this script
# downloads and caches the generic Linux x86_64 binary at build time.
#
# LILYPOND_VERSION must stay in sync with the path in netlify.toml's build
# command (the explicit `export PATH=...` there is required because this
# script's own PATH export does not propagate across the `&&` chain).

set -euo pipefail

LILYPOND_VERSION="2.26.0"
LILYPOND_URL="https://gitlab.com/lilypond/lilypond/-/releases/v${LILYPOND_VERSION}/downloads/lilypond-${LILYPOND_VERSION}-linux-x86_64.tar.gz"
INSTALL_DIR="$HOME/.local/lilypond"
LILYPOND_BIN="$INSTALL_DIR/lilypond-${LILYPOND_VERSION}/bin/lilypond"

if command -v lilypond >/dev/null 2>&1; then
  echo "LilyPond already available: $(lilypond --version | head -n1)"
  exit 0
fi

if [ -x "$LILYPOND_BIN" ]; then
  echo "Using cached LilyPond ${LILYPOND_VERSION}"
else
  echo "Downloading LilyPond ${LILYPOND_VERSION}..."
  mkdir -p "$INSTALL_DIR"
  # -f fails on HTTP errors; -sS silences progress but shows errors.
  # Download to a file then extract, so a partial stream is caught.
  curl -fsSL "$LILYPOND_URL" -o /tmp/lilypond.tar.gz
  tar xzf /tmp/lilypond.tar.gz -C "$INSTALL_DIR"
  rm /tmp/lilypond.tar.gz
  echo "LilyPond downloaded to $INSTALL_DIR"
fi

# Verify the binary exists and runs. Done as separate statements (not
# inside `$(...)`) so `set -e` catches the failure — command-substitution
# failures inside `echo "...$(cmd)..."` do NOT terminate the script unless
# `inherit_errexit` is set, which would mask a missing-shared-libraries
# failure mode common to portable LilyPond binaries.
if [ ! -x "$LILYPOND_BIN" ]; then
  echo "ERROR: lilypond binary not found at $LILYPOND_BIN after install." >&2
  exit 1
fi
if ! "$LILYPOND_BIN" --version >/dev/null 2>&1; then
  echo "ERROR: lilypond binary present but failed to execute." >&2
  echo "Likely missing shared libraries on this image." >&2
  "$LILYPOND_BIN" --version || true
  exit 1
fi

export PATH="$INSTALL_DIR/lilypond-${LILYPOND_VERSION}/bin:$PATH"
echo "LilyPond version: $(lilypond --version | head -n1)"
