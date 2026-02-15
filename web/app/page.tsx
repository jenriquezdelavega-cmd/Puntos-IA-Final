'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const BusinessMap = dynamic(() => import('./components/BusinessMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 animate-pulse">
      <span className="text-4xl mb-2">🗺️</span>
      <span className="text-xs font-black uppercase tracking-widest">Cargando...</span>
    </div>
  ),
});

// Scanner: dinámica para evitar broncas en build/SSR
const QRScanner = dynamic(() => import('@yudiel/react-qr-scanner').then((m) => m.Scanner), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-white/80">
      <div className="text-center">
        <div className="text-4xl mb-3">📷</div>
        <div className="text-xs font-black uppercase tracking-widest">Cargando cámara…</div>
      </div>
    </div>
  ),
});

type ViewState = 'WELCOME' | 'LOGIN' | 'REGISTER' | 'APP';

type BusinessLeadForm = {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
};

const glow = 'bg-gradient-to-br from-[#ff7a59] via-[#ff3f8e] to-[#f90086]';

const screenFx = {
  initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(8px)' },
};

const modalFx = {
  initial: { opacity: 0, scale: 0.94, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 14 },
};

const spring = { type: 'spring', stiffness: 420, damping: 30 };

const clsInput =
  'w-full p-4 bg-white rounded-2xl text-gray-900 font-semibold border border-gray-200 ' +
  'shadow-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-pink-400';

const clsInputFixed =
  'block w-full h-[60px] px-4 bg-white rounded-2xl text-gray-900 font-semibold border border-gray-200 ' +
  'shadow-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-pink-400 appearance-none';

const clsLabel = 'text-xs font-black text-gray-400 uppercase ml-1 block mb-2 tracking-widest';

const TZ = 'America/Monterrey';
function formatRewardPeriod(period?: string) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const y = parseInt(parts.find((p) => p.type === 'year')?.value || String(now.getFullYear()), 10);
  const mStr = parts.find((p) => p.type === 'month')?.value || String(now.getMonth() + 1).padStart(2, '0');
  const month = parseInt(mStr, 10);

  const fmtEnd = (d: Date) =>
    new Intl.DateTimeFormat('es-MX', {
      timeZone: TZ,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);

  const endOfMonth = (year: number, month1to12: number) => new Date(Date.UTC(year, month1to12, 0, 12));

  const p = (period || 'OPEN').toUpperCase();
  let counter = 'Sin vigencia';
  let window = 'Sin vigencia';

  if (p === 'MONTHLY') {
    counter = 'Mensual';
    window = `Hasta ${fmtEnd(endOfMonth(y, month))}`;
  } else if (p === 'QUARTERLY') {
    counter = 'Trimestral';
    const q = Math.floor((month - 1) / 3) + 1;
    const endMonth = q * 3;
    window = `Hasta ${fmtEnd(endOfMonth(y, endMonth))}`;
  } else if (p === 'SEMESTER') {
    counter = 'Semestral';
    const endMonth = month <= 6 ? 6 : 12;
    window = `Hasta ${fmtEnd(endOfMonth(y, endMonth))}`;
  } else if (p === 'ANNUAL') {
    counter = 'Anual';
    window = `Hasta ${fmtEnd(endOfMonth(y, 12))}`;
  }

  return { counter, window };
}

function Shine() {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <span className="absolute -inset-x-24 -top-24 h-48 w-48 rotate-12 bg-white/25 blur-2xl" />
    </span>
  );
}

function BrandLogo({ animate = true }: { animate?: boolean }) {
  const reduce = useReducedMotion();
  const canAnim = animate && !reduce;

  return (
    <div className="mb-2 select-none scale-90">
      <motion.div
        initial={canAnim ? { opacity: 0, y: 8 } : false}
        animate={canAnim ? { opacity: 1, y: 0 } : false}
        transition={canAnim ? { ...spring } : undefined}
        className="brand-lockup relative inline-flex items-end justify-center gap-3"
      >
        <span className="brand-punto-wrap">
          <span className="brand-word brand-word-punto">punt</span>
          <span className="brand-o-wrap">
            <span className="brand-word brand-word-punto">o</span>
            <motion.span
              initial={canAnim ? { scale: 0.85, opacity: 0 } : false}
              animate={canAnim ? { scale: 1, opacity: 1 } : false}
              transition={canAnim ? { ...spring, delay: 0.08 } : undefined}
              className="brand-orb"
            >
              <span className="brand-orb-glow" />
              <span className="brand-orb-shine" />
            </motion.span>
          </span>
        </span>
        <span className="brand-word brand-word-ia">IA</span>
      </motion.div>
    </div>
  );
}

function Onboarding() {
  const reduce = useReducedMotion();
  const canAnim = !reduce;

  const [slide, setSlide] = useState(0);
  const slides = useMemo(
    () => [
      { icon: '📸', title: '1. Escanea', text: 'Visita y escanea el código QR.' },
      { icon: '🔥', title: '2. Suma', text: 'Acumula puntos automáticamente.' },
      { icon: '🎁', title: '3. Canjea', text: 'Genera tu código de premio.' },
      { icon: '🏆', title: '4. Gana', text: 'Recibe tu recompensa.' },
    ],
    []
  );

  useEffect(() => {
    const i = setInterval(() => setSlide((p) => (p + 1) % slides.length), 3500);
    return () => clearInterval(i);
  }, [slides.length]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={canAnim ? { opacity: 0, y: 10 } : false}
            animate={canAnim ? { opacity: 1, y: 0 } : false}
            exit={canAnim ? { opacity: 0, y: -10 } : false}
            transition={canAnim ? { ...spring } : undefined}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={canAnim ? { y: [0, -4, 0] } : undefined}
              transition={canAnim ? { duration: 1.8, repeat: Infinity } : undefined}
              className="text-5xl mb-3 drop-shadow-md"
            >
              {slides[slide].icon}
            </motion.div>
            <h2 className="text-xl font-black text-white mb-2 drop-shadow-md">{slides[slide].title}</h2>
            <p className="text-white/90 text-center text-xs h-8 px-4">{slides[slide].text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex gap-2 mt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`h-1.5 rounded-full transition-all ${i === slide ? 'bg-white w-6' : 'bg-white/40 w-2'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const prelaunchMode = process.env.NEXT_PUBLIC_PRELAUNCH_MODE !== 'false';
  const reduce = useReducedMotion();
  const canAnim = !reduce;

  // ✅ ESTE ERA EL QUE TE FALTABA (y por eso truena el build)
  const [view, setView] = useState<ViewState>('WELCOME');

  // ✅ Tabs separados: Check-In (primero), Puntos, Mapa, Perfil
  const [activeTab, setActiveTab] = useState<'checkin' | 'points' | 'map' | 'profile'>('checkin');

  const [user, setUser] = useState<any>(null);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [manualCode, setManualCode] = useState('');
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const [prizeCode, setPrizeCode] = useState<{ code: string; tenant: string } | null>(null);

  const [tenants, setTenants] = useState<any[]>([]);
  const [mapFocus, setMapFocus] = useState<[number, number] | null>(null);

  const [showTutorial, setShowTutorial] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [leadForm, setLeadForm] = useState<BusinessLeadForm>({
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    city: '',
  });
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadStatus, setLeadStatus] = useState('');

  const handleLeadField = (key: keyof BusinessLeadForm, value: string) => {
    setLeadForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitLead = async () => {
    if (!leadForm.businessName.trim() || !leadForm.contactName.trim() || !leadForm.phone.trim() || !leadForm.email.trim()) {
      setLeadStatus('Completa negocio, nombre, teléfono y email.');
      return;
    }

    setLeadLoading(true);
    setLeadStatus('Enviando...');

    try {
      const res = await fetch('/api/prelaunch/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setLeadStatus(data?.error || 'No se pudo enviar. Intenta de nuevo.');
      } else {
        setLeadStatus('¡Gracias! Te contactaremos para activar tu negocio.');
        setLeadForm({ businessName: '', contactName: '', phone: '', email: '', city: '' });
      }
    } catch {
      setLeadStatus('Error de conexión. Intenta nuevamente.');
    } finally {
      setLeadLoading(false);
    }
  };

  const isValidPhone = (p: string) => /^\d{10}$/.test(p);
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const c = p.get('code');
      if (c) {
        setPendingCode(c);
        if (!user) setMessage('👋 Código detectado.');
      }
    }
    loadMapData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user && pendingCode) {
      handleScan(pendingCode);
      setPendingCode(null);
      if (typeof window !== 'undefined') window.history.replaceState({}, '', '/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pendingCode]);

  const loadMapData = async () => {
    try {
      const res = await fetch('/api/map/tenants');
      const d = await res.json();
      if (d.tenants) {
        setTenants(d.tenants);

        if (!mapFocus) {
          const coords = (d.tenants as any[])
            .filter((t) => typeof t?.lat === 'number' && typeof t?.lng === 'number')
            .map((t) => [t.lat as number, t.lng as number] as [number, number]);

          if (coords.length) {
            const avgLat = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;
            const avgLng = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;
            setMapFocus([avgLat, avgLng]);
          }
        }
      }
    } catch {}
  };

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/user/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.history) setHistory(data.history);
      setShowHistory(true);
    } catch {
      alert('Error cargando historial');
    }
  };

  const handleLogin = async () => {
    setMessage('');
    if (!phone) return setMessage('❌ Teléfono requerido');
    setLoading(true);
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setName(data.name);
        setEmail(data.email || '');
        setGender(data.gender || '');
        if (data.birthDate) setBirthDate(data.birthDate.split('T')[0]);
        else setBirthDate('');

        // ✅ Entra a Cliente y abre CHECK-IN primero
        setActiveTab('checkin');
        setView('APP');
      } else setMessage('⚠️ ' + data.error);
    } catch {
      setMessage('🔥 Error de conexión');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setMessage('');
    if (!name.trim()) return setMessage('❌ Nombre requerido');
    if (!isValidPhone(phone)) return setMessage('❌ Teléfono 10 dígitos');
    if (email && !isValidEmail(email)) return setMessage('❌ Email inválido');

    setLoading(true);
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, gender, birthDate }),
      });
      if (res.ok) handleLogin();
      else {
        const d = await res.json();
        setMessage('⚠️ ' + d.error);
      }
    } catch {
      setMessage('🔥 Error de conexión');
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!user?.id) return;
    if (!isValidPhone(phone)) return setMessage('❌ Teléfono inválido');

    setMessage('Guardando...');
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, name, email, gender, birthDate, phone }),
      });

      if (res.ok) {
        setMessage('✅ Datos actualizados');
        setUser({ ...user, name, email, gender, birthDate, phone });
      } else {
        const d = await res.json();
        setMessage('❌ ' + d.error);
      }
    } catch {
      setMessage('🔥 Error de red');
    }
  };

  const handleScan = async (result: string) => {
    if (!result) return;
    setScanning(false);

    let finalCode = result;
    if (result.includes('code=')) finalCode = result.split('code=')[1].split('&')[0];

    try {
      const res = await fetch('/api/check-in/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, code: finalCode }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        handleLogin();
        setManualCode('');
      } else alert('❌ ' + data.error);
    } catch {
      if (user) alert('Error');
    }
  };

  const getPrizeCode = async (tenantId: string, tenantName: string) => {
    if (!confirm(`¿Canjear premio en ${tenantName}?`)) return;
    try {
      const res = await fetch('/api/redeem/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, tenantId }),
      });
      const data = await res.json();
      if (res.ok) setPrizeCode({ code: data.code, tenant: tenantName });
      else alert(data.error);
    } catch {
      alert('Error');
    }
  };

  const goToBusinessMap = (tName: string) => {
    const target = tenants.find((t) => t.name === tName);
    if (target && target.lat && target.lng) {
      setMapFocus([target.lat, target.lng]);
      setActiveTab('map');
    } else {
      alert('Ubicación no disponible.');
    }
  };

  const handleLogout = () => {
    if (confirm('¿Salir?')) {
      setUser(null);
      setView('WELCOME');
      setPhone('');
      setPassword('');
      setMessage('');
    }
  };

  const toggleCard = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return prelaunchMode ? (
    <main className={`min-h-screen ${glow} text-white relative overflow-hidden`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.22),transparent_36%),radial-gradient(circle_at_82%_8%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_88%_88%,rgba(255,255,255,0.12),transparent_40%)]" />
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="flex flex-col items-center text-center">
          <BrandLogo />
          <p className="mt-4 inline-block rounded-full border border-white/35 bg-white/10 px-4 py-1 text-xs font-black tracking-widest uppercase">PRE-LANZAMIENTO</p>
          <h1 className="mt-6 text-4xl md:text-6xl font-black leading-tight max-w-4xl">Muy pronto lanzaremos Punto IA para transformar la lealtad de tus clientes.</h1>
          <p className="mt-4 text-white/90 max-w-2xl text-sm md:text-base font-semibold">Sistema de puntos multi-negocio para pymes en México. Deja tus datos y sé de los primeros aliados en activar la plataforma.</p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr,1fr]">
          <div className="rounded-3xl border border-white/30 bg-white/12 backdrop-blur-md p-5 md:p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.22em] font-black text-white/75 mb-3">Teaser video</p>
            <div className="aspect-video rounded-2xl border border-white/30 bg-black/30 overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <iframe
                className="h-full w-full"
                src="https://player.vimeo.com/video/1165202097?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
                title="PUNTO IA"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
                allowFullScreen
              />
            </div>
          </div>
          <div className="rounded-3xl border border-white/35 bg-white/15 backdrop-blur-md p-5 md:p-6 shadow-2xl">
            <h2 className="text-2xl font-black">Preinscripción para negocios</h2>
            <p className="text-sm text-white/85 mt-1 mb-4">Te contactamos para sumarte como aliado fundador.</p>
            <div className="space-y-3">
              <input className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold" placeholder="Nombre del negocio" value={leadForm.businessName} onChange={(e) => handleLeadField('businessName', e.target.value)} />
              <input className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold" placeholder="Tu nombre" value={leadForm.contactName} onChange={(e) => handleLeadField('contactName', e.target.value)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold" placeholder="Teléfono" value={leadForm.phone} onChange={(e) => handleLeadField('phone', e.target.value)} />
                <input className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold" placeholder="Ciudad" value={leadForm.city} onChange={(e) => handleLeadField('city', e.target.value)} />
              </div>
              <input type="email" className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold" placeholder="Email" value={leadForm.email} onChange={(e) => handleLeadField('email', e.target.value)} />
              <button onClick={submitLead} disabled={leadLoading} className="w-full rounded-2xl bg-white text-pink-600 font-black py-3.5 shadow-xl hover:bg-pink-50 transition disabled:opacity-70">
                {leadLoading ? 'Enviando...' : 'Quiero preinscribirme como negocio'}
              </button>
              {leadStatus ? <p className="text-sm font-semibold text-white/95">{leadStatus}</p> : null}
            </div>
          </div>
        </div>

        <p className="mt-6 text-white/90 max-w-2xl text-sm md:text-base font-semibold mx-auto text-center">
          Sistema de puntos multi-negocio para pymes en México. Deja tus datos y sé de los primeros aliados en activar la plataforma.
        </p>
      </section>
    </main>
  ) : (
    <AnimatePresence mode="wait">
      {view === 'WELCOME' && (
        <motion.div
          key="welcome"
          initial={canAnim ? screenFx.initial : false}
          animate={canAnim ? screenFx.animate : false}
          exit={canAnim ? screenFx.exit : false}
          transition={canAnim ? { ...spring } : undefined}
          className={`min-h-screen ${glow} flex flex-col items-center justify-center p-6 text-white relative overflow-hidden`}
        >
          <motion.div
            aria-hidden
            className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/15 blur-3xl"
            animate={canAnim ? { x: [0, 20, 0], y: [0, 12, 0] } : undefined}
            transition={canAnim ? { duration: 6, repeat: Infinity } : undefined}
          />
          <motion.div
            aria-hidden
            className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
            animate={canAnim ? { x: [0, -18, 0], y: [0, -14, 0] } : undefined}
            transition={canAnim ? { duration: 7, repeat: Infinity } : undefined}
          />

          <div className="w-full max-w-sm flex flex-col items-center py-10 relative">
            <BrandLogo />

            <p className="text-white text-xl font-medium mb-10 mt-0 tracking-wide drop-shadow-md text-center leading-tight">
              Premiamos tu lealtad,
              <br />
              <span className="font-extrabold italic">fácil y YA.</span>
            </p>

            {pendingCode && (
              <motion.div
                initial={canAnim ? { opacity: 0, y: 10 } : false}
                animate={canAnim ? { opacity: 1, y: 0 } : false}
                transition={canAnim ? { ...spring } : undefined}
                className="bg-white/20 p-4 rounded-2xl mb-4 border border-white/30 backdrop-blur-sm w-full text-center"
              >
                <p className="font-black">🎉 ¡Código detectado!</p>
              </motion.div>
            )}

            <div className="space-y-4 w-full mb-12">
              <motion.button
                whileTap={canAnim ? { scale: 0.97 } : undefined}
                whileHover={canAnim ? { y: -2 } : undefined}
                onClick={() => {
                  setMessage('');
                  setView('LOGIN');
                }}
                className="relative w-full bg-white text-pink-600 py-4 rounded-2xl font-extrabold text-lg shadow-2xl hover:bg-gray-50 transition-all overflow-hidden"
              >
                <Shine />
                Iniciar Sesión
              </motion.button>

              <motion.button
                whileTap={canAnim ? { scale: 0.97 } : undefined}
                whileHover={canAnim ? { y: -2 } : undefined}
                onClick={() => {
                  setMessage('');
                  setView('REGISTER');
                }}
                className="w-full bg-white/10 border-2 border-white/50 text-white py-4 rounded-2xl font-black text-lg hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                Crear Cuenta
              </motion.button>
            </div>

            <div className="w-full pt-8 border-t border-white/20">
              <p className="text-center text-white/70 text-xs font-black uppercase tracking-widest mb-6">
                ¿CÓMO FUNCIONA?
              </p>
              <Onboarding />
            </div>


            <Link
              href="/aliados"
              className="mt-12 inline-flex items-center justify-center rounded-full border border-white/50 bg-white/15 px-5 py-3 text-sm font-black tracking-wide text-white shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/25"
            >
              ¿Tienes negocio? <span className="ml-2 underline">Únete a Punto IA</span>
            </Link>
          </div>
        </motion.div>
      )}

      {(view === 'LOGIN' || view === 'REGISTER') && (
        <motion.div
          key={view}
          initial={canAnim ? screenFx.initial : false}
          animate={canAnim ? screenFx.animate : false}
          exit={canAnim ? screenFx.exit : false}
          transition={canAnim ? { ...spring } : undefined}
          className="min-h-screen bg-gray-50 flex flex-col"
        >
          <div className={`${glow} p-8 pb-20 pt-16 rounded-b-[3rem] shadow-xl text-white text-center relative`}>
            <button
              onClick={() => setView('WELCOME')}
              className="absolute top-12 left-6 text-white/80 hover:text-white font-black text-2xl transition-colors"
            >
              ←
            </button>
            <div className="mt-4 mb-4 flex justify-center scale-[0.75]">
              <BrandLogo animate={false} />
            </div>
            <h2 className="text-3xl font-black mt-2 tracking-tight">
              {view === 'REGISTER' ? 'Únete al Club' : 'Bienvenido'}
            </h2>
            <p className="text-white/90 text-sm mt-1 font-semibold">
              {view === 'REGISTER' ? 'Premiamos tu lealtad, fácil y YA.' : 'Tus premios te esperan'}
            </p>
          </div>

          <div className="flex-1 px-6 -mt-12 pb-10">
            <motion.div
              initial={canAnim ? { opacity: 0, y: 14 } : false}
              animate={canAnim ? { opacity: 1, y: 0 } : false}
              transition={canAnim ? { ...spring } : undefined}
              className="bg-white rounded-3xl shadow-2xl p-8 space-y-6 border border-gray-100 relative overflow-hidden"
            >
              <span className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-pink-200/35 blur-3xl" />
              <span className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-orange-200/35 blur-3xl" />

              {view === 'REGISTER' && (
                <div className="relative">
                  <label className={clsLabel}>Nombre Completo</label>
                  <input className={clsInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Pedro" />
                </div>
              )}

              <div className="relative">
                <label className={clsLabel}>Teléfono Celular</label>
                <input
                  type="tel"
                  maxLength={10}
                  className={clsInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10 dígitos"
                />
              </div>

              {view === 'REGISTER' && (
                <>
                  <div className="relative">
                    <label className={clsLabel}>Email (Opcional)</label>
                    <input type="email" className={clsInput} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="flex-1">
                      <label className={clsLabel}>Fecha de nacimiento</label>
                      <input type="date" className={clsInputFixed} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                    </div>

                    <div className="flex-1">
                      <label className={clsLabel}>Género</label>
                      <select className={`${clsInput} h-[58px]`} value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">-</option>
                        <option value="Hombre">Masculino</option>
                        <option value="Mujer">Femenino</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="relative">
                <label className={clsLabel}>Contraseña</label>
                <input type="password" className={clsInput} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••" />
              </div>

              {message && (
                <motion.div
                  initial={canAnim ? { opacity: 0, y: 8 } : false}
                  animate={canAnim ? { opacity: 1, y: 0 } : false}
                  className="p-4 bg-red-50 text-red-500 rounded-2xl text-center font-black text-sm border border-red-100"
                >
                  {message}
                </motion.div>
              )}

              <motion.button
                whileTap={canAnim ? { scale: 0.98 } : undefined}
                whileHover={canAnim ? { y: -2 } : undefined}
                onClick={view === 'REGISTER' ? handleRegister : handleLogin}
                disabled={loading}
                className={`relative w-full ${glow} text-white py-4 rounded-2xl font-black shadow-2xl transition-all text-lg mt-2 overflow-hidden`}
              >
                <Shine />
                {loading ? 'Procesando...' : view === 'REGISTER' ? 'Crear Cuenta' : 'Entrar'}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}

      {view === 'APP' && (
        <motion.div
          key="app"
          initial={canAnim ? screenFx.initial : false}
          animate={canAnim ? screenFx.animate : false}
          exit={canAnim ? screenFx.exit : false}
          transition={canAnim ? { ...spring } : undefined}
          className="min-h-screen bg-gradient-to-b from-[#fff2f8] via-[#fff9f4] to-[#fffdfd] pb-32"
        >
          {/* Overlays */}
          <AnimatePresence>
            {showTutorial && (
              <motion.div
                key="tutorial"
                initial={canAnim ? { opacity: 0 } : false}
                animate={canAnim ? { opacity: 1 } : false}
                exit={canAnim ? { opacity: 0 } : false}
                className={`fixed inset-0 ${glow} z-[60] flex flex-col items-center justify-center p-8`}
              >
                <motion.div
                  initial={canAnim ? modalFx.initial : false}
                  animate={canAnim ? modalFx.animate : false}
                  exit={canAnim ? modalFx.exit : false}
                  transition={canAnim ? { ...spring } : undefined}
                  className="w-full max-w-sm"
                >
                  <h2 className="text-white text-center font-black text-3xl mb-10">¿Cómo usar PuntoIA?</h2>
                  <Onboarding />
                  <motion.button
                    whileTap={canAnim ? { scale: 0.98 } : undefined}
                    onClick={() => setShowTutorial(false)}
                    className="w-full bg-white text-purple-600 font-black py-4 rounded-2xl mt-12 shadow-2xl hover:bg-gray-100"
                  >
                    ¡Entendido!
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                key="history"
                initial={canAnim ? { opacity: 0 } : false}
                animate={canAnim ? { opacity: 1 } : false}
                exit={canAnim ? { opacity: 0 } : false}
                className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center p-6"
              >
                <motion.div
                  initial={canAnim ? modalFx.initial : false}
                  animate={canAnim ? modalFx.animate : false}
                  exit={canAnim ? modalFx.exit : false}
                  transition={canAnim ? { ...spring } : undefined}
                  className="bg-white p-6 rounded-[2rem] w-full max-w-md h-[70vh] flex flex-col shadow-2xl relative"
                >
                  <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 text-gray-400 font-black p-2 text-xl hover:text-gray-600">
                    ✕
                  </button>

                  <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">✨ Mis premios</h2>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {history.length > 0 ? (
                      history.map((h: any, i: number) => (
                        <motion.div
                          key={i}
                          initial={canAnim ? { opacity: 0, y: 10 } : false}
                          animate={canAnim ? { opacity: 1, y: 0 } : false}
                          transition={canAnim ? { ...spring, delay: i * 0.03 } : undefined}
                          className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex items-center gap-4"
                        >
                          <div className="bg-yellow-100 text-yellow-700 h-12 w-12 rounded-xl flex items-center justify-center text-2xl">✨</div>
                          <div>
                            <h3 className="font-black text-gray-800">{h.prize}</h3>
                            <p className="text-xs text-gray-500 font-semibold">
                              {h.tenant} • {h.date}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 py-10">
                        <p className="text-4xl mb-2">🤷‍♂️</p>
                        <p>Aún no has canjeado premios.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {prizeCode && (
              <motion.div
                key="prize"
                initial={canAnim ? { opacity: 0 } : false}
                animate={canAnim ? { opacity: 1 } : false}
                exit={canAnim ? { opacity: 0 } : false}
                className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md"
              >
                <motion.div
                  initial={canAnim ? modalFx.initial : false}
                  animate={canAnim ? modalFx.animate : false}
                  exit={canAnim ? modalFx.exit : false}
                  transition={canAnim ? { ...spring } : undefined}
                  className="bg-white p-8 rounded-[2rem] text-center w-full max-w-sm relative shadow-2xl overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-orange-500" />

                  <button
                    onClick={() => {
                      setPrizeCode(null);
                      handleLogin();
                    }}
                    className="absolute top-4 right-4 text-gray-400 font-black p-2 text-xl hover:text-gray-600"
                  >
                    ✕
                  </button>

                  <p className="text-pink-500 uppercase text-xs font-black tracking-widest mb-2 mt-4">¡PREMIO DESBLOQUEADO!</p>

                  <h2 className="text-3xl font-black text-gray-900 mb-6 leading-tight">{prizeCode.tenant}</h2>

                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-8 rounded-3xl mb-6 relative overflow-hidden">
                    {canAnim && (
                      <motion.div
                        aria-hidden
                        className="absolute inset-0"
                        animate={{ opacity: [0.2, 0.35, 0.2] }}
                        transition={{ duration: 2.2, repeat: Infinity }}
                        style={{
                          background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,.5) 40%, transparent 70%)',
                          transform: 'translateX(-30%)',
                        }}
                      />
                    )}
                    <p className="text-5xl font-mono font-black text-gray-800 tracking-widest relative">{prizeCode.code}</p>
                  </div>

                  <p className="text-sm text-gray-500 font-semibold">Muestra este código al personal.</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="bg-white/95 backdrop-blur px-8 pt-16 pb-6 sticky top-0 z-20 shadow-sm border-b border-pink-100/80 flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Hola,</p>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{user?.name?.split(' ')?.[0] ?? '👋'}</h1>
            </div>

            <div className="flex gap-2">
              <motion.button
                whileTap={canAnim ? { scale: 0.95 } : undefined}
                onClick={() => setShowTutorial(true)}
                className="h-12 w-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-full font-black border border-white/30 flex items-center justify-center hover:brightness-110 transition-all shadow-md"
                title="Ayuda"
              >
                ✨
              </motion.button>

              <motion.button
                whileTap={canAnim ? { scale: 0.95 } : undefined}
                onClick={handleLogout}
                className="h-12 w-12 bg-red-50 text-red-500 rounded-full font-black border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                title="Salir"
              >
                ✕
              </motion.button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* TAB: CHECK-IN */}
            {activeTab === 'checkin' && !scanning && (
              <div className="flex flex-col gap-6">
                <div className="bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-md relative overflow-hidden">
                  <span className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-pink-100/50 blur-3xl" />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-gray-900">Hacer Check-In</h2>
                      <p className="text-sm text-gray-600 mt-1">Escanea el QR del negocio para registrar tu visita.</p>
                    </div>

                    <motion.button
                      whileTap={canAnim ? { scale: 0.98 } : undefined}
                      whileHover={canAnim ? { y: -1 } : undefined}
                      onClick={() => setScanning(true)}
                      className="shrink-0 bg-gradient-to-r from-gray-950 to-gray-800 text-white font-black px-5 py-3 rounded-2xl shadow-md"
                    >
                      Escanear QR
                    </motion.button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-3xl p-5 md:p-6 shadow-sm">
                  <div>
                    <h3 className="text-base font-black text-gray-900">Escribir manual</h3>
                    <p className="text-sm text-gray-600 mt-1">Si no puedes escanear, escribe el código del QR.</p>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <input
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Ej. ABCD-1234-EFGH"
                      className="w-full sm:flex-1 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
                    />
                    <motion.button
                      whileTap={canAnim ? { scale: 0.98 } : undefined}
                      onClick={() => {
                        if (!manualCode.trim()) return;
                        handleScan(manualCode.trim());
                      }}
                      className="bg-gradient-to-r from-gray-950 to-gray-800 text-white font-black px-6 py-3 rounded-2xl shadow-sm"
                    >
                      OK
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PUNTOS */}
            {activeTab === 'points' && (
              <div className="space-y-4">
                {user?.memberships?.map((m: any, idx: number) => {
                  const logo = (m.logoData ?? m.tenant?.logoData ?? '') as string;
                  const requiredVisits = m.requiredVisits ?? 10;
                  const visits = m.visits ?? Math.round((m.points ?? 0) / 10);
                  const progress = Math.min(Math.round((visits / requiredVisits) * 100), 100);
                  const isWinner = visits >= requiredVisits;
                  const isExpanded = expandedId === m.tenantId;

                  return (
                    <motion.div
                      key={idx}
                      layout
                      transition={canAnim ? spring : undefined}
                      onClick={() => toggleCard(m.tenantId)}
                      whileTap={canAnim ? { scale: 0.99 } : undefined}
                      className={`bg-white p-5 md:p-6 rounded-3xl relative overflow-hidden cursor-pointer border border-gray-100 ${
                        isExpanded ? 'shadow-xl ring-2 ring-pink-100' : 'shadow-md hover:shadow-lg'
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 rounded-bl-full opacity-70" />
                      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-100/50 blur-3xl rounded-full" />

                      <div className="relative z-10">
                        <div className="flex justify-between items-start gap-3 mb-4">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gray-950 to-gray-700 text-white flex items-center justify-center font-black text-2xl shadow-lg overflow-hidden">
                              {logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                              ) : (
                                <span>{m.name?.charAt(0)}</span>
                              )}
                            </div>

                            <div>
                              <h3 className="font-black text-gray-900 text-lg md:text-xl tracking-tight leading-tight">{m.name}</h3>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <motion.span
                                  initial={{ scale: 1 }}
                                  animate={canAnim ? { y: [0, -1, 0], scale: [1, 1.03, 1] } : undefined}
                                  transition={canAnim ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white shadow-md border border-white/30"
                                >
                                  <span className="text-[10px] font-black uppercase tracking-widest opacity-90">Premio</span>
                                  <span className="text-sm font-black leading-none">{m.prize}</span>
                                  <span className="ml-0.5 text-base leading-none">✨</span>
                                </motion.span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="block text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">
                              {visits}
                            </span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">VISITAS</span>
                          </div>
                        </div>

                        {!isWinner ? (
                          <>
                            <div className="mb-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
                              <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                                <span>Meta: <span className="text-gray-900">{requiredVisits} visitas</span></span>
                                <span>Llevas: <span className="text-gray-900">{visits}</span></span>
                              </div>
                              <div className="mt-2 relative w-full h-3 bg-white rounded-full overflow-hidden border border-gray-200">
                                <motion.div
                                  className="h-full rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600"
                                  initial={canAnim ? { width: 0 } : false}
                                  animate={canAnim ? { width: `${progress}%` } : false}
                                  transition={canAnim ? { duration: 0.9, ease: 'easeOut' } : undefined}
                                />
                              </div>
                              <div className="mt-1 text-[11px] font-semibold text-gray-500">
                                Te faltan <span className="text-gray-900">{Math.max(requiredVisits - visits, 0)}</span> visita(s) para canjear.
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                {isExpanded ? '▾ Menos info' : '▸ Ver más'}
                              </span>

                              <div className="text-right leading-tight">
                                <div className="text-[11px] font-extrabold text-gray-800 whitespace-nowrap">
                                  Contador: {formatRewardPeriod(m.rewardPeriod).counter}
                                </div>
                                <div className="text-[11px] font-semibold text-gray-500 whitespace-nowrap mt-0.5">
                                  Vigencia: {formatRewardPeriod(m.rewardPeriod).window}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <motion.button
                            whileTap={canAnim ? { scale: 0.98 } : undefined}
                            whileHover={canAnim ? { y: -2 } : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              getPrizeCode(m.tenantId, m.name);
                            }}
                            className="relative w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-black py-5 rounded-2xl shadow-2xl tracking-wide text-lg overflow-hidden border-4 border-white/20"
                          >
                            <Shine />
                            CANJEAR PREMIO ✨
                            <span className="block text-[11px] font-black text-white/80 mt-1">Listo para canjear</span>
                          </motion.button>
                        )}

                        <motion.div
                          layout
                          className={`grid grid-cols-2 gap-3 mt-4 overflow-hidden ${
                            isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                          } transition-all duration-500`}
                        >
                          <motion.button
                            whileTap={canAnim ? { scale: 0.98 } : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              goToBusinessMap(m.name);
                            }}
                            className="bg-white border-2 border-blue-50 text-blue-700 py-4 rounded-2xl font-black text-xs flex flex-col items-center hover:bg-blue-50 transition-colors shadow-sm"
                          >
                            <span className="text-2xl mb-1">🧭</span>
                            Ver Mapa
                          </motion.button>

                          {m.instagram ? (
                            <a
                              href={`https://instagram.com/${m.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-white border-2 border-pink-50 text-pink-700 py-4 rounded-2xl font-black text-xs flex flex-col items-center hover:bg-pink-50 transition-colors no-underline shadow-sm"
                            >
                              <span className="text-2xl mb-1">📲</span>
                              Instagram
                            </a>
                          ) : (
                            <div className="bg-gray-50 border-2 border-gray-100 text-gray-300 py-4 rounded-2xl font-black text-xs flex flex-col items-center opacity-70">
                              <span className="text-2xl mb-1">◎</span>
                              No IG
                            </div>
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* TAB: MAPA */}
            {activeTab === 'map' && (
              <motion.div
                initial={canAnim ? { opacity: 0, y: 10 } : false}
                animate={canAnim ? { opacity: 1, y: 0 } : false}
                transition={canAnim ? { ...spring } : undefined}
                className="h-[52vh] md:h-[58vh] w-full rounded-3xl overflow-hidden shadow-xl border border-gray-100 relative"
              >
<div className="absolute top-3 left-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-pink-600 shadow">Mapa de aliados Punto IA</div>
                                <BusinessMap tenants={tenants} focusCoords={mapFocus} radiusKm={50} />
              </motion.div>
            )}
          </div>

          {/* Scanner Overlay */}
          {scanning && (
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
              <QRScanner onScan={(r: any) => r?.[0] && handleScan(r[0].rawValue)} onError={() => {}} />
              <motion.button
                whileTap={canAnim ? { scale: 0.98 } : undefined}
                onClick={() => setScanning(false)}
                className="absolute bottom-12 left-8 right-8 bg-white/20 backdrop-blur-md text-white p-5 rounded-3xl font-black border border-white/20 shadow-2xl"
              >
                Cancelar Escaneo
              </motion.button>
            </div>
          )}

          {/* TAB: PERFIL */}
          {activeTab === 'profile' && (
            <div className="p-6 pt-0">
              <motion.div
                initial={canAnim ? { opacity: 0, y: 10 } : false}
                animate={canAnim ? { opacity: 1, y: 0 } : false}
                transition={canAnim ? { ...spring } : undefined}
                className="bg-white p-6 md:p-7 rounded-3xl shadow-md border border-gray-100 relative overflow-hidden"
              >
                <span className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-pink-200/35 blur-3xl" />
                <span className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-orange-200/35 blur-3xl" />

                <div className="flex items-center gap-5 mb-10 relative">
                  <div className="h-20 w-20 bg-gradient-to-br from-orange-100 to-pink-100 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner text-pink-600">
                    PI
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">Mi Perfil</h2>
                    <p className="text-sm text-pink-500 font-bold">Tu identidad Punto IA</p>
                  </div>
                </div>

                <div className="space-y-6 relative">
                  <div>
                    <label className={clsLabel}>Nombre</label>
                    <input className={clsInput} value={name} onChange={(e) => setName(e.target.value)} />
                  </div>

                  <div>
                    <label className={clsLabel}>Teléfono</label>
                    <input
                      type="tel"
                      maxLength={10}
                      className={clsInput}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <div>
                    <label className={clsLabel}>Email</label>
                    <input type="email" className={clsInput} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="flex-1">
                      <label className={clsLabel}>Fecha de nacimiento</label>
                      <input type="date" className={clsInputFixed} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                    </div>

                    <div className="flex-1">
                      <label className={clsLabel}>Género</label>
                      <select className={clsInput} value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="Hombre">Masculino</option>
                        <option value="Mujer">Femenino</option>
                      </select>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileTap={canAnim ? { scale: 0.98 } : undefined}
                  onClick={loadHistory}
                  className="w-full bg-yellow-400 text-yellow-950 p-4 rounded-2xl font-black mt-6 shadow-md hover:bg-yellow-300 transition-all text-base flex items-center justify-center gap-2"
                >
                  <span>🗂️</span> Ver Historial de Premios
                </motion.button>

                <motion.button
                  whileTap={canAnim ? { scale: 0.98 } : undefined}
                  onClick={handleUpdate}
                  className="relative w-full bg-gradient-to-r from-gray-950 to-gray-800 text-white p-4 rounded-2xl font-black mt-3 shadow-lg transition-all text-base hover:from-black hover:to-gray-900 overflow-hidden"
                >
                  <Shine />
                  Guardar Cambios ✨
                </motion.button>

                {message && (
                  <p className="text-center text-green-700 mt-6 font-black bg-green-50 p-4 rounded-2xl border border-green-100">
                    {message}
                  </p>
                )}
              </motion.div>
            </div>
          )}

          {/* Bottom Tabs */}
          <div className="fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl border border-white/40 p-2 rounded-[2.5rem] shadow-2xl flex justify-between items-center z-40 ring-1 ring-black/5">
            {[
              { key: 'checkin', icon: '⚡', label: 'Check-In' },
              { key: 'points', icon: '🎯', label: 'Puntos' },
              { key: 'map', icon: '🧭', label: 'Mapa' },
              { key: 'profile', icon: '✨', label: 'Perfil' },
            ].map((t) => {
              const active = activeTab === (t.key as any);
              return (
                <motion.button
                  key={t.key}
                  whileTap={canAnim ? { scale: 0.98 } : undefined}
                  onClick={() => setActiveTab(t.key as any)}
                  className={`flex-1 flex flex-col items-center py-4 rounded-[2rem] transition-all duration-300 ${
                    active ? 'bg-gray-950 text-white shadow-lg' : 'text-gray-400 hover:bg-white hover:text-gray-700'
                  }`}
                >
                  <motion.span
                    animate={active && canAnim ? { y: [0, -2, 0] } : undefined}
                    transition={active && canAnim ? { duration: 1.6, repeat: Infinity } : undefined}
                    className="text-xl mb-1"
                  >
                    {t.icon}
                  </motion.span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
