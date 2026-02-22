#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[1/6] Estado git actual"
git status --short --branch || true

echo "[2/6] Abortando merge/rebase/cherry-pick si hay uno en progreso"
git merge --abort 2>/dev/null || true
git rebase --abort 2>/dev/null || true
git cherry-pick --abort 2>/dev/null || true

echo "[3/6] Limpiando archivos conflictivos de wallet/pass"
git checkout --ours web/app/api/wallet/apple/route.ts 2>/dev/null || true
git checkout --theirs web/app/api/wallet/apple/route.ts 2>/dev/null || true
git checkout -- web/app/api/wallet/apple/route.ts 2>/dev/null || true
git checkout -- web/app/pass/page.tsx 2>/dev/null || true

echo "[4/6] Sincronizando main remoto"
git fetch origin main --prune
git checkout -B main origin/main

echo "[5/6] Restaurando archivos wallet/pass desde origin/main"
git checkout origin/main -- web/app/api/wallet/apple/route.ts web/app/pass/page.tsx

echo "[6/6] Validando lint"
cd web
npx eslint app/api/wallet/apple/route.ts app/pass/page.tsx

echo ""
echo "Listo. Bloque copy/paste para rama y push:"
echo "cd ~/workspace"
echo "git checkout -b fix/apple-wallet-merge-recovery || git checkout fix/apple-wallet-merge-recovery"
echo "git add web/app/api/wallet/apple/route.ts web/app/pass/page.tsx"
echo "git commit -m 'fix(wallet): recover from unmerged state and restore wallet files'"
echo "git push -u origin fix/apple-wallet-merge-recovery"
