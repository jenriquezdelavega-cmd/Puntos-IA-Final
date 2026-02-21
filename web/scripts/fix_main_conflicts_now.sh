#!/usr/bin/env bash
set -euo pipefail

# Emergency repair for committed Git merge markers in web/.
# Safe for Replit copy/paste usage.
#
# Usage:
#   bash web/scripts/fix_main_conflicts_now.sh [remote] [target_branch] [source_ref]
# Defaults:
#   remote=origin
#   target_branch=main
#   source_ref=origin/codex/review-my-code

REMOTE="${1:-origin}"
TARGET_BRANCH="${2:-main}"
SOURCE_REF="${3:-origin/codex/review-my-code}"

echo "[1/8] Fetching remote refs..."
git fetch "$REMOTE"

echo "[2/8] Switching to $TARGET_BRANCH..."
git checkout "$TARGET_BRANCH"

echo "[3/8] Pulling latest $REMOTE/$TARGET_BRANCH..."
git pull "$REMOTE" "$TARGET_BRANCH"

echo "[4/8] Verifying source ref exists: $SOURCE_REF"
git rev-parse --verify "$SOURCE_REF" >/dev/null

echo "[5/8] Detecting files with merge markers in web/..."
mapfile -t BROKEN_FILES < <(rg -l "^(<<<<<<<|=======|>>>>>>>)" web || true)

if [ ${#BROKEN_FILES[@]} -eq 0 ]; then
  echo "No conflict markers found. Nothing to repair."
  exit 0
fi

printf 'Found %d broken files:\n' "${#BROKEN_FILES[@]}"
printf ' - %s\n' "${BROKEN_FILES[@]}"

echo "[6/8] Restoring those files from $SOURCE_REF ..."
for file in "${BROKEN_FILES[@]}"; do
  git checkout "$SOURCE_REF" -- "$file"
done

echo "[7/8] Verifying markers are gone..."
if rg -n "^(<<<<<<<|=======|>>>>>>>)" web; then
  echo "Markers still present. Stop and review manually."
  exit 1
fi

echo "[8/8] Commit repair and show push command..."
git add "${BROKEN_FILES[@]}"
if git diff --cached --quiet; then
  echo "No staged changes after restore."
  exit 0
fi

git commit -m "fix: remove committed conflict markers from web by restoring clean ref"

echo
echo "Done. Run:"
echo "  git push $REMOTE $TARGET_BRANCH"
