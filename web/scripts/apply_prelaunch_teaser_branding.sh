#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

cat > app/layout.tsx <<'FILE'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Punto IA | Loyalty para negocios",
  description: "Punto IA: fidelización para pymes con check-ins, puntos y recompensas.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
FILE

cat > app/icon.svg <<'FILE'
<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" rx="64" fill="url(#bg)"/>
  <circle cx="128" cy="128" r="58" fill="url(#orb)"/>
  <circle cx="108" cy="106" r="14" fill="rgba(255,255,255,0.75)"/>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FF7A59"/>
      <stop offset="0.53" stop-color="#FF3F8E"/>
      <stop offset="1" stop-color="#F90086"/>
    </linearGradient>
    <radialGradient id="orb" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(143 106) rotate(130) scale(94)">
      <stop stop-color="#FFE8BD"/>
      <stop offset="0.26" stop-color="#FFC664"/>
      <stop offset="0.62" stop-color="#FF8A16"/>
      <stop offset="1" stop-color="#E84A00"/>
    </radialGradient>
  </defs>
</svg>
FILE

mkdir -p app/api/prelaunch/business
cat > app/api/prelaunch/business/route.ts <<'FILE'
import { NextResponse } from 'next/server';

type LeadBody = {
  businessName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  city?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LeadBody;

    const businessName = String(body.businessName || '').trim();
    const contactName = String(body.contactName || '').trim();
    const phone = String(body.phone || '').trim();
    const email = String(body.email || '').trim();
    const city = String(body.city || '').trim();

    if (!businessName || !contactName || !phone || !email) {
      return NextResponse.json({ error: 'Faltan datos obligatorios.' }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    console.info(
      JSON.stringify({
        level: 'info',
        route: '/api/prelaunch/business',
        event: 'lead_submitted',
        ts: new Date().toISOString(),
        businessName,
        contactName,
        phone,
        email,
        city,
      })
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo procesar la solicitud.' }, { status: 500 });
  }
}
FILE

node - <<'NODE'
const fs = require('fs');
const p = 'app/page.tsx';
let s = fs.readFileSync(p, 'utf8');

if (!s.includes('type BusinessLeadForm =')) {
  s = s.replace(
    "type ViewState = 'WELCOME' | 'LOGIN' | 'REGISTER' | 'APP';",
    `type ViewState = 'WELCOME' | 'LOGIN' | 'REGISTER' | 'APP';\n\ntype BusinessLeadForm = {\n  businessName: string;\n  contactName: string;\n  phone: string;\n  email: string;\n  city: string;\n};`
  );
}

if (!s.includes("const prelaunchMode = process.env.NEXT_PUBLIC_PRELAUNCH_MODE !== 'false';")) {
  s = s.replace(
    'export default function Home() {',
    "export default function Home() {\n  const prelaunchMode = process.env.NEXT_PUBLIC_PRELAUNCH_MODE !== 'false';"
  );
}

if (!s.includes('const [leadForm, setLeadForm] = useState<BusinessLeadForm>(')) {
  s = s.replace(
    "  const [showHistory, setShowHistory] = useState(false);",
`  const [showHistory, setShowHistory] = useState(false);\n\n  const [leadForm, setLeadForm] = useState<BusinessLeadForm>({\n    businessName: '',\n    contactName: '',\n    phone: '',\n    email: '',\n    city: '',\n  });\n  const [leadLoading, setLeadLoading] = useState(false);\n  const [leadStatus, setLeadStatus] = useState('');\n\n  const handleLeadField = (key: keyof BusinessLeadForm, value: string) => {\n    setLeadForm((prev) => ({ ...prev, [key]: value }));\n  };\n\n  const submitLead = async () => {\n    if (!leadForm.businessName.trim() || !leadForm.contactName.trim() || !leadForm.phone.trim() || !leadForm.email.trim()) {\n      setLeadStatus('Completa negocio, nombre, teléfono y email.');\n      return;\n    }\n\n    setLeadLoading(true);\n    setLeadStatus('Enviando...');\n\n    try {\n      const res = await fetch('/api/prelaunch/business', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify(leadForm),\n      });\n\n      const data = await res.json();\n      if (!res.ok) {\n        setLeadStatus(data?.error || 'No se pudo enviar. Intenta de nuevo.');\n      } else {\n        setLeadStatus('¡Gracias! Te contactaremos para activar tu negocio.');\n        setLeadForm({ businessName: '', contactName: '', phone: '', email: '', city: '' });\n      }\n    } catch {\n      setLeadStatus('Error de conexión. Intenta nuevamente.');\n    } finally {\n      setLeadLoading(false);\n    }\n  };`
  );
}

if (!s.includes('const prelaunchTeaser = (')) {
  const marker = "  useEffect(() => {";
  const teaser = `  const prelaunchTeaser = (\n    <main className={\`min-h-screen \${glow} text-white relative overflow-hidden\`}>\n      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.22),transparent_36%),radial-gradient(circle_at_82%_8%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_88%_88%,rgba(255,255,255,0.12),transparent_40%)]" />\n\n      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 md:py-16">\n        <div className="flex flex-col items-center text-center">\n          <BrandLogo />\n          <p className="mt-4 inline-block rounded-full border border-white/35 bg-white/10 px-4 py-1 text-xs font-black tracking-widest uppercase">\n            PRE-LANZAMIENTO\n          </p>\n          <h1 className="mt-6 text-4xl md:text-6xl font-black leading-tight max-w-4xl">\n            Muy pronto lanzamos Punto IA para transformar la lealtad de tus clientes.\n          </h1>\n          <p className="mt-4 text-white/90 max-w-2xl text-sm md:text-base font-semibold">\n            Sistema de puntos multi-negocio para pymes en México. Deja tus datos y sé de los primeros aliados en activar la plataforma.\n          </p>\n        </div>\n\n        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr,1fr]">\n          <div className="rounded-3xl border border-white/30 bg-white/12 backdrop-blur-md p-5 md:p-6 shadow-2xl">\n            <p className="text-xs uppercase tracking-[0.22em] font-black text-white/75 mb-3">Teaser video</p>\n            <div className="aspect-video rounded-2xl border border-white/30 bg-black/25 flex flex-col items-center justify-center text-center px-4">\n              <p className="text-lg md:text-xl font-black">Aquí va tu mini video teaser</p>\n              <p className="text-white/80 text-sm mt-2">Puedes pegar un embed de YouTube/Vimeo o un video MP4 cuando lo tengas listo.</p>\n            </div>\n          </div>\n\n          <div className="rounded-3xl border border-white/35 bg-white/15 backdrop-blur-md p-5 md:p-6 shadow-2xl">\n            <h2 className="text-2xl font-black">Preinscripción para negocios</h2>\n            <p className="text-sm text-white/85 mt-1 mb-4">Te contactamos para sumarte como aliado fundador.</p>\n\n            <div className="space-y-3">\n              <input\n                className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"\n                placeholder="Nombre del negocio"\n                value={leadForm.businessName}\n                onChange={(e) => handleLeadField('businessName', e.target.value)}\n              />\n              <input\n                className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"\n                placeholder="Tu nombre"\n                value={leadForm.contactName}\n                onChange={(e) => handleLeadField('contactName', e.target.value)}\n              />\n              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">\n                <input\n                  className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"\n                  placeholder="Teléfono"\n                  value={leadForm.phone}\n                  onChange={(e) => handleLeadField('phone', e.target.value)}\n                />\n                <input\n                  className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"\n                  placeholder="Ciudad"\n                  value={leadForm.city}\n                  onChange={(e) => handleLeadField('city', e.target.value)}\n                />\n              </div>\n              <input\n                type="email"\n                className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"\n                placeholder="Email"\n                value={leadForm.email}\n                onChange={(e) => handleLeadField('email', e.target.value)}\n              />\n\n              <button\n                onClick={submitLead}\n                disabled={leadLoading}\n                className="w-full rounded-2xl bg-white text-pink-600 font-black py-3.5 shadow-xl hover:bg-pink-50 transition disabled:opacity-70"\n              >\n                {leadLoading ? 'Enviando...' : 'Quiero preinscribirme como negocio'}\n              </button>\n\n              {leadStatus ? <p className="text-sm font-semibold text-white/95">{leadStatus}</p> : null}\n            </div>\n          </div>\n        </div>\n      </section>\n    </main>\n  );\n\n`;
  s = s.replace(marker, teaser + marker);
}

if (!s.includes('return prelaunchMode ? prelaunchTeaser : (')) {
  s = s.replace(
    "  return (\n    <AnimatePresence mode=\"wait\">",
    "  return prelaunchMode ? prelaunchTeaser : (\n    <AnimatePresence mode=\"wait\">"
  );
}

fs.writeFileSync(p, s);
console.log('✅ page.tsx parcheado con prelaunch teaser');
NODE

echo "✅ prelaunch + branding aplicado"
