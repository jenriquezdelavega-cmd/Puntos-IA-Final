#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[1/4] Sincronizando ramas remotas..."
git fetch --all --prune

echo "[2/4] Restaurando archivos wallet/pase desde origin/main..."
git checkout origin/main -- web/app/api/wallet/apple/route.ts web/app/pass/page.tsx

echo "[3/4] Validando lint..."
cd web
npx eslint app/api/wallet/apple/route.ts app/pass/page.tsx

echo "[4/4] Listo. Ahora puedes commitear en tu rama actual:"
echo "  git add web/app/api/wallet/apple/route.ts web/app/pass/page.tsx"
echo "  git commit -m 'fix(wallet): restore wallet route and pass CTA from main'"
echo "  git push"
