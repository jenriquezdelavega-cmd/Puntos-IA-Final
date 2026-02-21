#!/usr/bin/env bash
set -euo pipefail

# Repair broken merges where conflict markers were accidentally committed.
# Usage:
#   bash web/scripts/repair_conflict_markers.sh [remote] [target_branch] [source_ref]
# Examples:
#   bash web/scripts/repair_conflict_markers.sh
#   bash web/scripts/repair_conflict_markers.sh origin main origin/codex/review-my-code
#
# If source_ref is omitted, the script auto-detects a clean source from:
#   origin/codex/review-my-code, origin/work, origin/main, HEAD~1

REMOTE="${1:-origin}"
TARGET_BRANCH="${2:-main}"
SOURCE_REF="${3:-}"

choose_source_ref() {
  local -a candidates=(
    "${REMOTE}/codex/review-my-code"
    "${REMOTE}/work"
    "${REMOTE}/main"
    "HEAD~1"
  )

  local ref
  for ref in "${candidates[@]}"; do
    if git rev-parse --verify --quiet "$ref" >/dev/null; then
      # skip refs that still contain conflict markers in web/
      if git grep -q -E '^(<<<<<<<|=======|>>>>>>>)' "$ref" -- web 2>/dev/null; then
        continue
      fi
      echo "$ref"
      return 0
    fi
  done

  return 1
}

printf "[1/8] Fetching %s...\n" "$REMOTE"
git fetch "$REMOTE"

printf "[2/8] Checking out %s...\n" "$TARGET_BRANCH"
git checkout "$TARGET_BRANCH"

printf "[3/8] Pulling latest %s/%s...\n" "$REMOTE" "$TARGET_BRANCH"
git pull "$REMOTE" "$TARGET_BRANCH"

printf "[4/8] Detecting committed conflict markers in web/...\n"
mapfile -t BROKEN_FILES < <(git grep -l -E '^(<<<<<<<|=======|>>>>>>>)' -- web || true)

if [ ${#BROKEN_FILES[@]} -eq 0 ]; then
  echo "No conflict markers found under web/. Nothing to repair."
  exit 0
fi

printf "Found %d broken file(s):\n" "${#BROKEN_FILES[@]}"
printf ' - %s\n' "${BROKEN_FILES[@]}"

if [ -z "$SOURCE_REF" ]; then
  printf "[5/8] Auto-detecting a clean source ref...\n"
  SOURCE_REF="$(choose_source_ref || true)"
else
  printf "[5/8] Using provided source ref %s...\n" "$SOURCE_REF"
fi

if [ -z "$SOURCE_REF" ]; then
  echo "Could not auto-detect a clean source ref."
  echo "Re-run with an explicit source ref, for example:"
  echo "  bash web/scripts/repair_conflict_markers.sh $REMOTE $TARGET_BRANCH <good_ref>"
  exit 1
fi

echo "Using source ref: $SOURCE_REF"
git rev-parse --verify "$SOURCE_REF" >/dev/null

printf "[6/8] Restoring clean versions from %s...\n" "$SOURCE_REF"
for file in "${BROKEN_FILES[@]}"; do
  git checkout "$SOURCE_REF" -- "$file"
done

printf "[7/8] Verifying markers are gone...\n"
if git grep -n -E '^(<<<<<<<|=======|>>>>>>>)' -- web; then
  echo "Conflict markers still present. Resolve manually before continuing."
  exit 1
fi

printf "[8/8] Committing repaired files...\n"
git add "${BROKEN_FILES[@]}"
if git diff --cached --quiet; then
  echo "No changes staged after restore."
  exit 0
fi

git commit -m "fix: repair committed merge conflict markers in web sources"

echo
echo "Done. Next step:"
echo "  git push $REMOTE $TARGET_BRANCH"
