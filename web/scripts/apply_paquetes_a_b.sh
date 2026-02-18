#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f "app/page.tsx" ]]; then
  echo "Error: ejecuta este script dentro de /web o desde el repo con la ruta web/scripts/..."
  exit 1
fi

mkdir -p app/lib
cat > app/lib/password.ts <<'TS'
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LENGTH = 64;

export function hashPassword(rawPassword: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(rawPassword, salt, KEY_LENGTH).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function isHashedPassword(value: string): boolean {
  return value.startsWith('scrypt$');
}

export function verifyPassword(rawPassword: string, storedPassword: string): boolean {
  if (!isHashedPassword(storedPassword)) {
    return rawPassword === storedPassword;
  }

  const [, salt, storedHash] = storedPassword.split('$');
  if (!salt || !storedHash) return false;

  const derived = scryptSync(rawPassword, salt, KEY_LENGTH);
  const hashBuffer = Buffer.from(storedHash, 'hex');

  if (derived.length !== hashBuffer.length) return false;
  return timingSafeEqual(derived, hashBuffer);
}
TS

echo "✅ app/lib/password.ts listo"

mkdir -p app/aliados
cat > app/aliados/page.tsx <<'TS'
import Link from 'next/link';

const perks = [
  'Aumenta visitas recurrentes con check-in QR.',
  'Convierte clientes en fans con recompensas claras.',
  'Mide actividad y canjes desde un panel simple.',
  'Lanzamiento rápido pensado para pymes en México.',
];

export default function AliadosPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-fuchsia-50 text-gray-900">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-14 md:py-20">
        <div className="rounded-3xl border border-orange-100 bg-white/90 p-8 shadow-xl">
          <p className="mb-3 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-700">
            Programa para negocios
          </p>
          <h1 className="text-3xl font-black leading-tight md:text-5xl">
            Haz que tu negocio se convierta en <span className="text-fuchsia-600">aliado de Punto IA</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-gray-600 md:text-base">
            Ayudamos a tu negocio a fidelizar clientes con un sistema de puntos fácil de usar. Tus clientes
            registran visitas, acumulan beneficios y regresan más seguido.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {perks.map((perk) => (
              <div key={perk} className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold shadow-sm">
                ✨ {perk}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:ventas@puntoia.mx?subject=Quiero%20ser%20aliado%20de%20Punto%20IA"
              className="inline-flex items-center justify-center rounded-2xl bg-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-fuchsia-700"
            >
              Quiero una demo
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-50"
            >
              Volver a inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
TS

echo "✅ app/aliados/page.tsx listo"

node - <<'NODE_PATCH'
const fs = require('fs');
const path = 'app/page.tsx';
let text = fs.readFileSync(path, 'utf8');

if (!text.includes("import Link from 'next/link';")) {
  text = text.replace(
    "import { useEffect, useMemo, useState } from 'react';\n",
    "import { useEffect, useMemo, useState } from 'react';\nimport Link from 'next/link';\n"
  );
}

if (!text.includes('href="/aliados"')) {
  const marker = `            <div className="w-full pt-8 border-t border-white/20">\n              <p className="text-center text-white/70 text-xs font-black uppercase tracking-widest mb-6">\n                ¿CÓMO FUNCIONA?\n              </p>\n              <Onboarding />\n            </div>\n`;

  const cta = `\n\n            <Link\n              href="/aliados"\n              className="mt-8 inline-flex items-center justify-center rounded-full border border-white/50 bg-white/15 px-5 py-3 text-sm font-black tracking-wide text-white shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/25"\n            >\n              ¿Quieres que tu negocio sea aliado de Punto IA? <span className="ml-2 underline">Conoce más</span>\n            </Link>\n`;

  if (!text.includes(marker)) {
    console.error('❌ No encontré el bloque WELCOME esperado en app/page.tsx. Inserta CTA manualmente.');
    process.exit(1);
  }

  text = text.replace(marker, marker + cta);
}

fs.writeFileSync(path, text);
console.log('✅ CTA /aliados listo en app/page.tsx');
NODE_PATCH


echo "\nSiguiente paso:"
echo "  npm install && npm run build"
echo "  git add app/page.tsx app/aliados/page.tsx app/lib/password.ts"
echo "  git commit -m 'feat: aplicar paquete A+B (aliados + hash base)'"
echo "  git push origin main"
