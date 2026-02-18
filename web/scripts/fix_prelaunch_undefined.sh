#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

node - <<'NODE'
const fs = require('fs');
const path = 'app/page.tsx';
let s = fs.readFileSync(path, 'utf8');

if (!s.includes("const prelaunchMode = process.env.NEXT_PUBLIC_PRELAUNCH_MODE !== 'false';")) {
  s = s.replace(
    'export default function Home() {',
    "export default function Home() {\n  const prelaunchMode = process.env.NEXT_PUBLIC_PRELAUNCH_MODE !== 'false';"
  );
}

// Remove early-return prelaunch blocks (they can break hook ordering)
const earlyStart = s.indexOf('  if (prelaunchMode) {');
if (earlyStart !== -1) {
  const earlyEnd = s.indexOf('  useEffect(() => {', earlyStart);
  if (earlyEnd !== -1) {
    s = s.slice(0, earlyStart) + s.slice(earlyEnd);
  }
}

const teaserExpr = `(
    <main className={\`min-h-screen \${glow} text-white relative overflow-hidden\`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.22),transparent_36%),radial-gradient(circle_at_82%_8%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_88%_88%,rgba(255,255,255,0.12),transparent_40%)]" />

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="flex flex-col items-center text-center">
          <BrandLogo />
          <p className="mt-4 inline-block rounded-full border border-white/35 bg-white/10 px-4 py-1 text-xs font-black tracking-widest uppercase">
            PRE-LANZAMIENTO
          </p>
          <h1 className="mt-6 text-4xl md:text-6xl font-black leading-tight max-w-4xl">
            Muy pronto lanzamos Punto IA para transformar la lealtad de tus clientes.
          </h1>
          <p className="mt-4 text-white/90 max-w-2xl text-sm md:text-base font-semibold">
            Sistema de puntos multi-negocio para pymes en México. Deja tus datos y sé de los primeros aliados en activar la plataforma.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr,1fr]">
          <div className="rounded-3xl border border-white/30 bg-white/12 backdrop-blur-md p-5 md:p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.22em] font-black text-white/75 mb-3">Teaser video</p>
            <div className="aspect-video rounded-2xl border border-white/30 bg-black/25 flex flex-col items-center justify-center text-center px-4">
              <p className="text-lg md:text-xl font-black">Aquí va tu mini video teaser</p>
              <p className="text-white/80 text-sm mt-2">Puedes pegar un embed de YouTube/Vimeo o un video MP4 cuando lo tengas listo.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/35 bg-white/15 backdrop-blur-md p-5 md:p-6 shadow-2xl">
            <h2 className="text-2xl font-black">Preinscripción para negocios</h2>
            <p className="text-sm text-white/85 mt-1 mb-4">Te contactamos para sumarte como aliado fundador.</p>

            <div className="space-y-3">
              <input
                className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"
                placeholder="Nombre del negocio"
                value={leadForm.businessName}
                onChange={(e) => handleLeadField('businessName', e.target.value)}
              />
              <input
                className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"
                placeholder="Tu nombre"
                value={leadForm.contactName}
                onChange={(e) => handleLeadField('contactName', e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"
                  placeholder="Teléfono"
                  value={leadForm.phone}
                  onChange={(e) => handleLeadField('phone', e.target.value)}
                />
                <input
                  className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"
                  placeholder="Ciudad"
                  value={leadForm.city}
                  onChange={(e) => handleLeadField('city', e.target.value)}
                />
              </div>
              <input
                type="email"
                className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"
                placeholder="Email"
                value={leadForm.email}
                onChange={(e) => handleLeadField('email', e.target.value)}
              />

              <button
                onClick={submitLead}
                disabled={leadLoading}
                className="w-full rounded-2xl bg-white text-pink-600 font-black py-3.5 shadow-xl hover:bg-pink-50 transition disabled:opacity-70"
              >
                {leadLoading ? 'Enviando...' : 'Quiero preinscribirme como negocio'}
              </button>

              {leadStatus ? <p className="text-sm font-semibold text-white/95">{leadStatus}</p> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  )`;

// Remove prelaunch const block if it exists
const constStart = s.indexOf('  const prelaunchTeaser = (');
if (constStart !== -1) {
  const constEnd = s.indexOf('  useEffect(() => {', constStart);
  if (constEnd !== -1) {
    s = s.slice(0, constStart) + s.slice(constEnd);
  }
}

// Ensure return uses inline teaser (no prelaunchTeaser reference)
if (/return\s+prelaunchMode\s*\?\s*prelaunchTeaser\s*:\s*\(/.test(s)) {
  s = s.replace(/return\s+prelaunchMode\s*\?\s*prelaunchTeaser\s*:\s*\(/, `return prelaunchMode ? ${teaserExpr} : (`);
} else if (!s.includes('return prelaunchMode ? (')) {
  s = s.replace('  return (\n    <AnimatePresence mode="wait">', `  return prelaunchMode ? ${teaserExpr} : (\n    <AnimatePresence mode="wait">`);
}

fs.writeFileSync(path, s);
console.log('✅ prelaunchTeaser undefined hotfix aplicado (inline teaser return)');
NODE
