#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Safe build + deploy for upgraded-pancake.
#
# The problem this solves: `ng build` empties its output directory before it
# starts, and pm2 serves straight out of that directory. So a normal build takes
# the live site down for its whole ~9 minute duration, and a build that is
# interrupted leaves the site down with an empty dist.
#
# Here the build goes to a staging directory and is only swapped into the served
# one once it has actually succeeded. The site stays up throughout, and a failed
# or killed build leaves the previous version serving.
#
#   ./build.sh            production build (default)
#   ./build.sh dev        unoptimised build — much faster, for iteration
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")"

CONFIG="production"
[[ "${1:-}" == "dev" ]] && CONFIG="development"

SERVE_DIR="dist/upgraded-pancake"
STAGE_DIR="dist/.staging"
PREV_DIR="dist/.previous"
LOG="/tmp/ngbuild.log"

echo "▶ building (configuration: $CONFIG) → $STAGE_DIR"
echo "  log: $LOG"

rm -rf "$STAGE_DIR"
START=$(date +%s)

# Build into staging. The served directory is untouched until this succeeds.
if ! npx ng build --configuration "$CONFIG" --output-path "$STAGE_DIR" > "$LOG" 2>&1; then
  echo "✗ build FAILED after $(( $(date +%s) - START ))s — live site untouched."
  tail -25 "$LOG"
  exit 1
fi

# Angular may nest output under browser/ depending on builder version.
SRC="$STAGE_DIR"
[[ -f "$STAGE_DIR/browser/index.html" ]] && SRC="$STAGE_DIR/browser"

if [[ ! -f "$SRC/index.html" ]]; then
  echo "✗ build produced no index.html — refusing to deploy."
  exit 1
fi

# Swap: move the old aside, move the new in, then drop the old. Two renames on
# the same filesystem, so the window where the site is missing is milliseconds
# rather than minutes.
rm -rf "$PREV_DIR"
[[ -d "$SERVE_DIR" ]] && mv "$SERVE_DIR" "$PREV_DIR"
mv "$SRC" "$SERVE_DIR"
rm -rf "$STAGE_DIR" "$PREV_DIR"

echo "✓ deployed in $(( $(date +%s) - START ))s → $SERVE_DIR"
grep -E "Initial total|bundle generation complete" "$LOG" || true
