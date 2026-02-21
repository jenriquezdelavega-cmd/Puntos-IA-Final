#!/usr/bin/env bash
set -euo pipefail

# Sync only Wallet/Pass functionality into main without using GitHub "Update branch".
# This avoids binary merge issues and keeps unrelated UI/style commits out.

REMOTE="${1:-origin}"
MAIN_BRANCH="${2:-main}"
SOURCE_REF="${3:-origin/codex/review-my-code}"

# Chosen commits from codex/review-my-code (oldest -> newest)
COMMITS=(
  7dd5968 # feat(pass): add universal signed customer loyalty pass module
  326b694 # feat(pass): integrate pass access into user map/business cards and admin
)

echo "[1/6] Fetching latest refs from ${REMOTE}..."
git fetch "${REMOTE}"

echo "[2/6] Switching to ${MAIN_BRANCH}..."
git checkout "${MAIN_BRANCH}"

echo "[3/6] Updating ${MAIN_BRANCH} from ${REMOTE}/${MAIN_BRANCH}..."
git pull "${REMOTE}" "${MAIN_BRANCH}"

echo "[4/6] Verifying source ref ${SOURCE_REF} exists..."
git rev-parse --verify "${SOURCE_REF}" >/dev/null

echo "[5/6] Cherry-picking selected wallet/pass commits..."
for sha in "${COMMITS[@]}"; do
  echo "  - cherry-pick ${sha}"
  git cherry-pick "${sha}"
done

echo "[6/6] Done. Next steps:"
echo "  git push ${REMOTE} ${MAIN_BRANCH}"
echo "  Then redeploy in Vercel and validate /admin (Pases), /pass, and /api/wallet/apple"
