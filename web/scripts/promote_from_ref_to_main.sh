#!/usr/bin/env bash
set -euo pipefail

# Promote specific files from a source ref into main safely.
# Usage:
#   bash web/scripts/promote_from_ref_to_main.sh [remote] [main_branch] [source_ref] [file ...]
#
# Examples:
#   bash web/scripts/promote_from_ref_to_main.sh
#   bash web/scripts/promote_from_ref_to_main.sh origin main origin/codex/review-my-code web/app/pass/page.tsx
#
# If no files are provided, the script promotes a default Wallet/Pass set.

REMOTE="${1:-origin}"
MAIN_BRANCH="${2:-main}"
SOURCE_REF="${3:-origin/codex/review-my-code}"

shift $(( $# >= 3 ? 3 : $# )) || true

DEFAULT_FILES=(
  "web/app/api/wallet/apple/route.ts"
  "web/app/api/pass/create/route.ts"
  "web/app/api/pass/[customer_id]/route.ts"
  "web/app/lib/customer-token.ts"
  "web/app/lib/customer-pass.ts"
  "web/app/lib/wallet-pass-assets.ts"
  "web/app/pass/page.tsx"
  "web/app/admin/page.tsx"
)

if [ "$#" -gt 0 ]; then
  FILES=("$@")
else
  FILES=("${DEFAULT_FILES[@]}")
fi

echo "[1/8] Fetching ${REMOTE}..."
git fetch "${REMOTE}"

echo "[2/8] Switching to ${MAIN_BRANCH}..."
git checkout "${MAIN_BRANCH}"

echo "[3/8] Pulling latest ${REMOTE}/${MAIN_BRANCH}..."
git pull "${REMOTE}" "${MAIN_BRANCH}"

echo "[4/8] Verifying source ref ${SOURCE_REF} exists..."
git rev-parse --verify "${SOURCE_REF}" >/dev/null

echo "[5/8] Repairing conflict markers first (if present)..."
bash web/scripts/repair_conflict_markers.sh "${REMOTE}" "${MAIN_BRANCH}" "${SOURCE_REF}" || true

echo "[6/8] Promoting files from ${SOURCE_REF}:"
MISSING=0
for file in "${FILES[@]}"; do
  if git cat-file -e "${SOURCE_REF}:${file}" 2>/dev/null; then
    echo "  - ${file}"
    git checkout "${SOURCE_REF}" -- "${file}"
  else
    echo "  - (missing in source) ${file}"
    MISSING=1
  fi
done

echo "[7/8] Verifying no conflict markers remain under web/..."
if git grep -n -E '^(<<<<<<<|=======|>>>>>>>)' -- web; then
  echo "Conflict markers still present. Resolve before continuing."
  exit 1
fi

echo "[8/8] Committing promoted changes..."
git add "${FILES[@]}" || true
if git diff --cached --quiet; then
  echo "No promoted changes staged."
else
  git commit -m "chore: promote selected files from ${SOURCE_REF} into ${MAIN_BRANCH}"
fi

if [ "$MISSING" -eq 1 ]; then
  echo
  echo "Warning: Some requested files do not exist in ${SOURCE_REF}."
fi

echo
echo "Done. Next step:"
echo "  git push ${REMOTE} ${MAIN_BRANCH}"
