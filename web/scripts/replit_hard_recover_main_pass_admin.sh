#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"
if [ ! -d "$ROOT_DIR/.git" ] || [ ! -d "$ROOT_DIR/web" ]; then
  echo "Error: ejecuta esto desde la raiz del repo (debe existir .git y /web)."
  exit 1
fi

cd "$ROOT_DIR"

echo "[1/6] Abortando operaciones git en curso (si existen)..."
git merge --abort 2>/dev/null || true
git rebase --abort 2>/dev/null || true
git cherry-pick --abort 2>/dev/null || true

echo "[1.1/6] Limpiando índice/working tree en estado conflictivo..."
git reset --hard HEAD 2>/dev/null || true

echo "[2/6] Sincronizando main con origin/main..."
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo work)"
if git remote get-url origin >/dev/null 2>&1; then
  git fetch origin --prune
  git checkout -f main 2>/dev/null || git switch -f main
  git reset --hard origin/main
  SOURCE_REF="origin/main"
else
  if git show-ref --verify --quiet refs/heads/main; then
    echo "Aviso: no existe remote origin; usando main local como fuente."
    git checkout -f main 2>/dev/null || git switch -f main
    git reset --hard main
    SOURCE_REF="main"
  else
    echo "Aviso: no existe main/origin; usando rama actual ($CURRENT_BRANCH) como fuente."
    git checkout -f "$CURRENT_BRANCH" 2>/dev/null || git switch -f "$CURRENT_BRANCH"
    git reset --hard "$CURRENT_BRANCH"
    SOURCE_REF="$CURRENT_BRANCH"
  fi
fi

echo "[3/6] Restaurando archivos críticos desde $SOURCE_REF..."
FILES=(
  "web/app/admin/page.tsx"
  "web/app/page.tsx"
  "web/app/pass/page.tsx"
  "web/app/api/pass/[customer_id]/route.ts"
  "web/app/api/pass/resolve-token/route.ts"
  "web/app/lib/customer-token.ts"
  "web/app/api/wallet/apple/route.ts"
  "web/scripts/replit_admin_scanner_bootstrap.sh"
  "web/scripts/replit_admin_scanner_full_reset.sh"
  "web/scripts/replit_apply_admin_scan_flow.sh"
  "web/scripts/templates/admin_page_scan.tsx"
  "web/scripts/templates/customer-token.ts"
  "web/scripts/templates/resolve-token-route.ts"
)

for f in "${FILES[@]}"; do
  mkdir -p "$(dirname "$f")"
  git show "$SOURCE_REF:$f" > "$f"
done

echo "[4/6] Ejecutando script determinístico de recuperación..."
bash web/scripts/replit_admin_scanner_bootstrap.sh

echo "[5/6] Validando lint..."
cd web
npx eslint app/admin/page.tsx --rule '@typescript-eslint/no-explicit-any: off' --rule '@typescript-eslint/no-unused-vars: off'
npx eslint app/lib/customer-token.ts app/api/pass/resolve-token/route.ts
npx eslint app/pass/page.tsx app/api/pass/[customer_id]/route.ts app/api/wallet/apple/route.ts
npx eslint app/page.tsx --rule '@typescript-eslint/no-explicit-any: off'

echo "Tip: si quieres re-aplicar manualmente el flujo admin extendido, ejecútalo aparte:"
echo "  bash web/scripts/replit_apply_admin_scan_flow.sh"

echo "[6/6] Listo ✅"
echo "Si todo quedó bien: cd .. && git push origin main"
