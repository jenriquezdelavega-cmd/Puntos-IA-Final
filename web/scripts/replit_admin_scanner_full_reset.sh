#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[1/4] Restaurando archivos del scanner admin desde templates..."
mkdir -p web/app/admin web/app/lib web/app/api/pass/resolve-token
git show HEAD:web/scripts/templates/admin_page_scan.tsx > web/app/admin/page.tsx
git show HEAD:web/scripts/templates/customer-token.ts > web/app/lib/customer-token.ts
git show HEAD:web/scripts/templates/resolve-token-route.ts > web/app/api/pass/resolve-token/route.ts

echo "[2/4] Verificando dependencia del scanner..."
if ! rg -n "@yudiel/react-qr-scanner" web/package.json >/dev/null; then
  echo "Falta @yudiel/react-qr-scanner en web/package.json"
  exit 1
fi

echo "[3/4] Validando lint..."
cd web
npx eslint app/admin/page.tsx --rule '@typescript-eslint/no-explicit-any: off' --rule '@typescript-eslint/no-unused-vars: off'
npx eslint app/lib/customer-token.ts app/api/pass/resolve-token/route.ts

echo "[4/4] OK"
echo "Archivos aplicados correctamente."
