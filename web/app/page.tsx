'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';



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
  // Avoid shadowing the global `validityWindow` object (can confuse bundlers / minifiers).
  let validityWindow = 'Sin vigencia';

  if (p === 'MONTHLY') {
    counter = 'Mensual';
    validityWindow = `Hasta ${fmtEnd(endOfMonth(y, month))}`;
  } else if (p === 'QUARTERLY') {
    counter = 'Trimestral';
    const q = Math.floor((month - 1) / 3) + 1;
    const endMonth = q * 3;
    validityWindow = `Hasta ${fmtEnd(endOfMonth(y, endMonth))}`;
  } else if (p === 'SEMESTER') {
    counter = 'Semestral';
    const endMonth = month <= 6 ? 6 : 12;
    validityWindow = `Hasta ${fmtEnd(endOfMonth(y, endMonth))}`;
  } else if (p === 'ANNUAL') {
    counter = 'Anual';
    validityWindow = `Hasta ${fmtEnd(endOfMonth(y, 12))}`;
  }

  return { counter, window: validityWindow };
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

  const [activeTab, setActiveTab] = useState<'points' | 'aliados' | 'profile'>('points');

  const [user, setUser] = useState<Record<string, unknown> | null>(null);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [prizeCode, setPrizeCode] = useState<{ code: string; tenant: string } | null>(null);

  const [tenants, setTenants] = useState<Record<string, unknown>[]>([]);
  const [aliadosSearch, setAliadosSearch] = useState('');
  const [expandedAliadoId, setExpandedAliadoId] = useState<string | null>(null);


  const [showTutorial, setShowTutorial] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
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
  const [showClientPortal, setShowClientPortal] = useState(false);

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
      if (p.get('clientes') === '1') {
        setShowClientPortal(true);
      }
    }
    loadTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTenants = async () => {
    try {
      const res = await fetch('/api/map/tenants');
      const d = await res.json();
      if (d.tenants) setTenants(d.tenants);
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

        setActiveTab('points');
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



  const openPass = (tenantName?: string, tenantId?: string) => {
    if (!user?.id) {
      alert('Primero inicia sesión para ver tu pase.');
      return;
    }

    const explicitBusinessId = String(tenantId || '').trim();
    const explicitBusinessName = String(tenantName || '').trim();

    const matchedByName = explicitBusinessName
      ? tenants.find((t) => String(t?.name || '').trim().toLowerCase() === explicitBusinessName.toLowerCase())
      : null;

    const matchedMembershipByName = explicitBusinessName && Array.isArray(user?.memberships)
      ? user.memberships.find((m: Record<string, unknown>) => String(m?.name || '').trim().toLowerCase() === explicitBusinessName.toLowerCase())
      : null;

    const storedBusinessId =
      typeof window !== 'undefined' ? String(localStorage.getItem('punto_last_business_id') || '').trim() : '';
    const storedBusinessName =
      typeof window !== 'undefined' ? String(localStorage.getItem('punto_last_business_name') || '').trim() : '';

    const fallbackMembership = Array.isArray(user?.memberships) && user.memberships.length > 0
      ? user.memberships[0]
      : null;

    const resolvedBusinessId =
      explicitBusinessId ||
      String(matchedByName?.id || '').trim() ||
      String(matchedMembershipByName?.tenantId || '').trim() ||
      storedBusinessId ||
      String(fallbackMembership?.tenantId || '').trim();

    const resolvedBusinessName =
      explicitBusinessName ||
      String(matchedByName?.name || '').trim() ||
      String(matchedMembershipByName?.name || '').trim() ||
      storedBusinessName ||
      String(fallbackMembership?.name || '').trim();

    if (!resolvedBusinessId) {
      alert('No se puede identificar el negocio. Entra primero a un negocio y vuelve a abrir tu pase.');
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('punto_last_business_id', resolvedBusinessId);
      if (resolvedBusinessName) localStorage.setItem('punto_last_business_name', resolvedBusinessName);
    }

    const customerId = String(user.id);
    const label = resolvedBusinessName ? `&from=${encodeURIComponent(resolvedBusinessName)}` : '';
    const businessParam = `&business_id=${encodeURIComponent(resolvedBusinessId)}`;
    const passUrl = `/pass?customer_id=${encodeURIComponent(customerId)}${label}${businessParam}`;

    const prefetchUrl = `/api/pass/${encodeURIComponent(customerId)}?businessId=${encodeURIComponent(resolvedBusinessId)}`;
    void fetch(prefetchUrl, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok || typeof window === 'undefined') return;
        const data = await res.json();
        localStorage.setItem(
          `punto_pass_cache:${customerId}:${resolvedBusinessId}`,
          JSON.stringify({ ts: Date.now(), data })
        );
      })
      .catch(() => undefined);

    const newTab = window.open(passUrl, '_blank', 'noopener,noreferrer');
    if (!newTab) {
      window.location.href = passUrl;
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

  return prelaunchMode && !showClientPortal ? (
    <main className="min-h-screen bg-[#080812] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#ff7a59]/20 via-transparent to-[#f90086]/10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-[#ff7a59]/30 via-[#ff3f8e]/20 to-transparent rounded-full blur-[120px] opacity-60" />

      <nav className="relative z-20 mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <div className="scale-[0.65] origin-left"><BrandLogo animate={false} /></div>
        <div className="flex items-center gap-3">
          <Link href="/negocios" className="text-white/60 text-sm font-bold hover:text-white transition hidden sm:block">Para Negocios</Link>
          <Link href="/?clientes=1" className="bg-white/10 border border-white/20 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/20 transition">
            Soy Cliente
          </Link>
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-8 md:pt-16 pb-12">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ff3f8e]/40 bg-[#ff3f8e]/15 px-4 py-1.5 text-[11px] font-black tracking-[0.2em] uppercase text-pink-200 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#ff3f8e] animate-pulse" />
            Pre-lanzamiento · Cupo limitado
          </span>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.08] max-w-4xl tracking-tight">
            Tus clientes regresan.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7]">Tu negocio crece.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-white/70 text-base md:text-lg font-medium leading-relaxed">
            Punto IA es la primera coalición de lealtad para PyMEs en México.
            Un solo pase digital para que tus clientes acumulen puntos en cafeterías, taquerías, estéticas y más negocios aliados.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <a href="#registro" className="bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] text-white font-black px-8 py-4 rounded-2xl shadow-[0_8px_32px_rgba(255,63,142,0.4)] hover:shadow-[0_12px_40px_rgba(255,63,142,0.5)] transition-all text-lg">
              Registra tu negocio
            </a>
            <Link href="/negocios" className="border border-white/25 bg-white/5 text-white font-bold px-6 py-4 rounded-2xl hover:bg-white/10 transition">
              Conoce más →
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '📱', title: 'Un pase, muchos negocios', desc: 'Tus clientes acumulan puntos en toda la red de aliados con un solo pase en Apple Wallet.' },
            { icon: '🔄', title: 'Visitas que se convierten en lealtad', desc: 'Cada check-in suma. Al completar las visitas, tu cliente gana su premio automáticamente.' },
            { icon: '📊', title: 'Datos reales de tu negocio', desc: 'Dashboard con tendencias de visita, perfil de clientes y reportes exportables.' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <span className="text-3xl">{item.icon}</span>
              <h3 className="mt-3 text-lg font-black">{item.title}</h3>
              <p className="mt-2 text-white/60 text-sm font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.15fr,1fr]">
          <div>
            <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white/40 mb-3">Conoce Punto IA</p>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl">
              <div className="aspect-video rounded-2xl bg-black/40 overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                <iframe
                  className="h-full w-full"
                  src="https://player.vimeo.com/video/1165202097?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
                  title="Presentación Punto IA"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  loading="lazy"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { num: '5x–7x', label: 'más rentable retener que adquirir nuevos' },
                { num: '+40%', label: 'más recurrencia con programa de lealtad' },
                { num: '4 sem', label: 'para crear un hábito de visita' },
              ].map((s) => (
                <div key={s.num} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                  <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e]">{s.num}</p>
                  <p className="text-[10px] text-white/50 font-semibold mt-1 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="registro" className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.03] backdrop-blur-md p-6 shadow-2xl scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] flex items-center justify-center text-lg">🚀</span>
              <div>
                <h2 className="text-xl font-black">Sé aliado fundador</h2>
                <p className="text-xs text-white/60 font-semibold">Cupo limitado · Pre-lanzamiento sin costo</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <input className="w-full rounded-xl border border-white/15 bg-white/95 text-gray-900 p-3 text-sm font-semibold placeholder:text-gray-400 focus:ring-2 focus:ring-pink-400 outline-none" placeholder="Nombre del negocio" value={leadForm.businessName} onChange={(e) => handleLeadField('businessName', e.target.value)} />
              <input className="w-full rounded-xl border border-white/15 bg-white/95 text-gray-900 p-3 text-sm font-semibold placeholder:text-gray-400 focus:ring-2 focus:ring-pink-400 outline-none" placeholder="Tu nombre" value={leadForm.contactName} onChange={(e) => handleLeadField('contactName', e.target.value)} />
              <div className="grid grid-cols-2 gap-2.5">
                <input className="w-full rounded-xl border border-white/15 bg-white/95 text-gray-900 p-3 text-sm font-semibold placeholder:text-gray-400 focus:ring-2 focus:ring-pink-400 outline-none" placeholder="Teléfono" value={leadForm.phone} onChange={(e) => handleLeadField('phone', e.target.value)} />
                <input className="w-full rounded-xl border border-white/15 bg-white/95 text-gray-900 p-3 text-sm font-semibold placeholder:text-gray-400 focus:ring-2 focus:ring-pink-400 outline-none" placeholder="Ciudad" value={leadForm.city} onChange={(e) => handleLeadField('city', e.target.value)} />
              </div>
              <input type="email" className="w-full rounded-xl border border-white/15 bg-white/95 text-gray-900 p-3 text-sm font-semibold placeholder:text-gray-400 focus:ring-2 focus:ring-pink-400 outline-none" placeholder="Email" value={leadForm.email} onChange={(e) => handleLeadField('email', e.target.value)} />

              <button onClick={submitLead} disabled={leadLoading} className="w-full bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] text-white font-black py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 text-sm">
                {leadLoading ? 'Enviando...' : 'Quiero ser aliado fundador →'}
              </button>

              {leadStatus && <p className="text-sm font-semibold text-center text-white/90">{leadStatus}</p>}
            </div>

            <p className="text-[10px] text-white/40 font-medium text-center mt-3">
              Sin compromiso · Te contactamos en menos de 24 hrs
            </p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 mt-8">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="scale-[0.5] origin-left"><BrandLogo animate={false} /></div>
            <p className="text-white/40 text-xs font-semibold">Coalición de PyMEs · Hecho en México 🇲🇽</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/negocios" className="text-white/40 text-xs font-bold hover:text-white/70 transition">Para Negocios</Link>
            <Link href="/?clientes=1" className="text-white/40 text-xs font-bold hover:text-white/70 transition">Soy Cliente</Link>
            <Link href="/aliados" className="text-white/40 text-xs font-bold hover:text-white/70 transition">Aliados</Link>
          </div>
        </div>
      </footer>
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
          className={`min-h-screen ${glow} flex flex-col items-center p-6 text-white relative overflow-hidden`}
        >
          <motion.div
            aria-hidden
            className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/12 blur-[80px]"
            animate={canAnim ? { x: [0, 30, 0], y: [0, 20, 0] } : undefined}
            transition={canAnim ? { duration: 8, repeat: Infinity } : undefined}
          />
          <motion.div
            aria-hidden
            className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/8 blur-[80px]"
            animate={canAnim ? { x: [0, -25, 0], y: [0, -18, 0] } : undefined}
            transition={canAnim ? { duration: 9, repeat: Infinity } : undefined}
          />
          <motion.div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-[100px]"
          />

          <div className="w-full max-w-sm flex flex-col items-center pt-20 pb-12 relative">
            <BrandLogo />

            <motion.h1
              initial={canAnim ? { opacity: 0, y: 10 } : false}
              animate={canAnim ? { opacity: 1, y: 0 } : false}
              transition={canAnim ? { ...spring, delay: 0.1 } : undefined}
              className="text-[1.75rem] md:text-3xl font-black text-center leading-[1.2] tracking-tight mt-4"
            >
              Tu pase de lealtad
              <br />
              <span className="text-white/85 italic">en un solo lugar</span>
            </motion.h1>

            <motion.p
              initial={canAnim ? { opacity: 0, y: 8 } : false}
              animate={canAnim ? { opacity: 1, y: 0 } : false}
              transition={canAnim ? { ...spring, delay: 0.15 } : undefined}
              className="text-white/60 text-[13px] font-medium text-center mt-3 mb-10 max-w-[280px] leading-relaxed"
            >
              Acumula puntos en tus negocios favoritos y gana premios reales.
            </motion.p>

            <motion.div
              initial={canAnim ? { opacity: 0, y: 10 } : false}
              animate={canAnim ? { opacity: 1, y: 0 } : false}
              transition={canAnim ? { ...spring, delay: 0.2 } : undefined}
              className="w-full space-y-3 mb-12"
            >
              <motion.button
                whileTap={canAnim ? { scale: 0.97 } : undefined}
                onClick={() => { setMessage(''); setView('LOGIN'); }}
                className="relative w-full bg-white text-pink-600 py-4 rounded-2xl font-black text-base shadow-[0_6px_24px_rgba(0,0,0,0.15)] hover:bg-gray-50 transition-all overflow-hidden"
              >
                <Shine />
                Iniciar Sesión
              </motion.button>

              <motion.button
                whileTap={canAnim ? { scale: 0.97 } : undefined}
                onClick={() => { setMessage(''); setView('REGISTER'); }}
                className="w-full bg-white/10 border border-white/30 text-white py-4 rounded-2xl font-bold text-base hover:bg-white/15 transition-all"
              >
                Crear Cuenta Gratis
              </motion.button>
            </motion.div>

            <div className="w-full space-y-3 mb-12">
              {[
                { num: '1', title: 'Crea tu pase', desc: 'Regístrate y obtén tu pase digital en Apple Wallet' },
                { num: '2', title: 'Suma visitas', desc: 'Muestra tu pase cada vez que visites un negocio aliado' },
                { num: '3', title: 'Gana premios', desc: 'Al completar tus visitas, canjea tu recompensa' },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={canAnim ? { opacity: 0, x: -12 } : false}
                  animate={canAnim ? { opacity: 1, x: 0 } : false}
                  transition={canAnim ? { ...spring, delay: 0.35 + i * 0.1 } : undefined}
                  className="flex items-center gap-4 bg-white/8 border border-white/15 rounded-2xl px-4 py-3.5 backdrop-blur-sm"
                >
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff7a59] to-[#ff3f8e] flex items-center justify-center text-white text-sm font-black shrink-0 shadow-sm">
                    {step.num}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white text-[13px] font-black leading-tight">{step.title}</p>
                    <p className="text-white/45 text-[11px] font-medium mt-0.5 leading-snug">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={canAnim ? { opacity: 0 } : false}
              animate={canAnim ? { opacity: 1 } : false}
              transition={canAnim ? { delay: 0.7 } : undefined}
              className="flex flex-col items-center gap-5"
            >
              <div className="flex items-center gap-3 text-white/40 text-[11px] font-semibold">
                <span className="h-px w-6 bg-white/15" />
                Disponible en Apple Wallet
                <span className="h-px w-6 bg-white/15" />
              </div>

              <Link
                href="/aliados"
                className="text-white/50 text-[12px] font-bold hover:text-white/80 transition"
              >
                ¿Tienes negocio? <span className="underline underline-offset-2">Únete a Punto IA</span>
              </Link>
            </motion.div>
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
          className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,#fff7ed,transparent_40%),radial-gradient(circle_at_85%_5%,#fdf2f8,transparent_35%),#f9fafb] flex flex-col"
        >
          <div className={`${glow} p-8 pb-20 pt-16 rounded-b-[3rem] shadow-[0_22px_60px_rgba(249,0,134,0.35)] text-white text-center relative overflow-hidden`}>
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
              {view === 'REGISTER' ? 'Crea tu cuenta Punto IA' : 'Bienvenido de vuelta'}
            </h2>
            <p className="text-white/95 text-sm mt-1 font-semibold">
              {view === 'REGISTER' ? 'Activa tu pase universal y comienza a acumular beneficios.' : 'Entra y muestra tu pase para registrar visitas.'}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-1 text-[11px] font-black uppercase tracking-[0.15em]">
              <span>cliente</span>
              <span className="text-white/70">•</span>
              <span>experiencia premium</span>
            </div>
          </div>

          <div className="flex-1 px-6 -mt-12 pb-10">
            <motion.div
              initial={canAnim ? { opacity: 0, y: 14 } : false}
              animate={canAnim ? { opacity: 1, y: 0 } : false}
              transition={canAnim ? { ...spring } : undefined}
              className="bg-white/95 rounded-3xl shadow-[0_24px_70px_rgba(17,24,39,0.16)] p-8 space-y-6 border border-white relative overflow-hidden backdrop-blur"
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
                {loading ? 'Procesando...' : view === 'REGISTER' ? '🚀 Crear Cuenta' : 'Entrar'}
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
                      history.map((h: Record<string, unknown>, i: number) => (
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
          <div className="bg-white/95 backdrop-blur-xl px-6 pt-14 pb-5 sticky top-0 z-20 shadow-[0_1px_0_rgba(0,0,0,0.04)] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] flex items-center justify-center shadow-sm">
                <span className="text-white text-[11px] font-black tracking-tight">P.IA</span>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em]">Hola,</p>
                <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight">{user?.name?.split(' ')?.[0] ?? '👋'}</h1>
              </div>
            </div>

            <motion.button
              whileTap={canAnim ? { scale: 0.95 } : undefined}
              onClick={handleLogout}
              className="h-9 w-9 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm flex items-center justify-center hover:bg-gray-200 hover:text-gray-600 transition-all"
              title="Salir"
            >
              ✕
            </motion.button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* TAB: PUNTOS */}
            {activeTab === 'points' && (
              <div className="space-y-6">
                {user?.memberships?.length === 0 && (
                  <motion.div
                    initial={canAnim ? { opacity: 0, y: 20 } : false}
                    animate={canAnim ? { opacity: 1, y: 0 } : false}
                    transition={canAnim ? { ...spring } : undefined}
                    className="text-center py-20 px-6"
                  >
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center mb-5">
                      <span className="text-4xl">🏪</span>
                    </div>
                    <h3 className="text-lg font-black text-gray-800 tracking-tight">Tu aventura empieza aquí</h3>
                    <p className="text-[13px] text-gray-400 font-medium mt-2 max-w-[260px] mx-auto leading-relaxed">Escanea el QR de un negocio aliado para empezar a acumular y ganar premios</p>
                  </motion.div>
                )}
                {user?.memberships?.map((m: Record<string, unknown>, idx: number) => {
                  const logo = (m.logoData ?? (m.tenant as Record<string, unknown>)?.logoData ?? '') as string;
                  const requiredVisits = (m.requiredVisits ?? 10) as number;
                  const visits = (m.visits ?? Math.round(((m.points ?? 0) as number) / 10)) as number;
                  const progress = Math.min(Math.round((visits / requiredVisits) * 100), 100);
                  const isWinner = visits >= requiredVisits;
                  const remaining = Math.max(requiredVisits - visits, 0);

                  const MAX_STAMPS = 20;
                  const showStamps = requiredVisits <= MAX_STAMPS;
                  const stamps = showStamps ? Array.from({ length: requiredVisits }, (_, i) => i < visits) : [];
                  const periodInfo = formatRewardPeriod(m.rewardPeriod as string);

                  return (
                    <motion.div
                      key={idx}
                      initial={canAnim ? { opacity: 0, y: 20 } : false}
                      animate={canAnim ? { opacity: 1, y: 0 } : false}
                      transition={canAnim ? { ...spring, delay: idx * 0.08 } : undefined}
                      className="rounded-[2rem] overflow-hidden bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04),0_8px_40px_rgba(0,0,0,0.04)]"
                    >
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800" />
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-[#ff7a59]/25 via-[#ff3f8e]/15 to-transparent rounded-full blur-3xl" />
                        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-tr from-purple-500/15 to-transparent rounded-full blur-2xl" />

                        <div className="relative px-5 pt-5 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-[0.85rem] bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                              {logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logo} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white/80 font-black text-[15px]">{(m.name as string)?.charAt(0)}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-black text-[15px] text-white tracking-tight truncate leading-tight">{m.name as string}</h3>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span className="text-white/40 text-[10px] font-semibold">{periodInfo.counter}</span>
                                {periodInfo.window !== 'Sin vigencia' && (
                                  <>
                                    <span className="text-white/20">·</span>
                                    <span className="text-white/30 text-[10px] font-semibold">{periodInfo.window}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-end justify-between">
                            <div>
                              <span className="text-white/30 text-[10px] font-bold uppercase tracking-[0.15em]">Visitas</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-[2rem] font-black text-white leading-none tracking-tight">{visits}</span>
                                <span className="text-white/25 text-sm font-bold">/ {requiredVisits}</span>
                              </div>
                            </div>
                            <div className="text-right pb-1">
                              {!isWinner ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/10">
                                  <span className="text-[10px]">🎁</span>
                                  <span className="text-[10px] font-bold text-white/60">
                                    {remaining === 1 ? '¡1 más!' : `Faltan ${remaining}`}
                                  </span>
                                </span>
                              ) : (
                                <motion.span
                                  animate={canAnim ? { scale: [1, 1.05, 1] } : undefined}
                                  transition={canAnim ? { duration: 2, repeat: Infinity } : undefined}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30"
                                >
                                  <span className="text-[10px]">🏆</span>
                                  <span className="text-[10px] font-black text-yellow-300">¡Listo!</span>
                                </motion.span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 relative w-full h-[5px] bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7]"
                              initial={canAnim ? { width: 0 } : false}
                              animate={canAnim ? { width: `${progress}%` } : false}
                              transition={canAnim ? { duration: 1, ease: 'easeOut', delay: 0.2 + idx * 0.08 } : undefined}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="px-5 pt-4 pb-5">
                        {showStamps ? (
                          <div className="flex flex-wrap gap-2 justify-center mb-5">
                            {stamps.map((filled, i) => (
                              <motion.div
                                key={i}
                                initial={canAnim ? { scale: 0, opacity: 0 } : false}
                                animate={canAnim ? { scale: 1, opacity: 1 } : false}
                                transition={canAnim ? { type: 'spring', stiffness: 500, damping: 25, delay: 0.2 + i * 0.035 } : undefined}
                                className="relative"
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${
                                  filled
                                    ? 'bg-gradient-to-br from-[#ff7a59] to-[#ff3f8e] text-white shadow-[0_0_12px_rgba(255,122,89,0.5)]'
                                    : 'bg-gray-100 text-gray-300'
                                }`}>
                                  {filled ? '✓' : i + 1}
                                </div>
                                {filled && (
                                  <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#ff7a59]/40 to-[#ff3f8e]/20 blur-[6px] -z-10" />
                                )}
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-baseline justify-center gap-2 mb-5 py-3">
                            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e]">{visits}</span>
                            <span className="text-gray-300 text-2xl font-bold">/</span>
                            <span className="text-5xl font-black text-gray-200">{requiredVisits}</span>
                          </div>
                        )}

                        {!isWinner ? (
                          <div className="bg-gradient-to-r from-[#fff7ed] via-[#fff1f2] to-[#fdf4ff] rounded-2xl p-4 mb-4 border border-orange-100/60">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shrink-0 shadow-sm">
                                <span className="text-white text-lg">🎁</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                                  {remaining === 1 ? '¡Una visita más y es tuyo!' : `${remaining} visitas para tu premio`}
                                </p>
                                <p className="text-[15px] font-black text-gray-900 truncate mt-0.5">{m.prize as string}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <motion.button
                            whileTap={canAnim ? { scale: 0.97 } : undefined}
                            animate={canAnim ? { boxShadow: ['0 4px 20px rgba(249,115,22,0.3)', '0 8px 30px rgba(249,115,22,0.5)', '0 4px 20px rgba(249,115,22,0.3)'] } : undefined}
                            transition={canAnim ? { duration: 2.5, repeat: Infinity } : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              getPrizeCode(m.tenantId as string, m.name as string);
                            }}
                            className="relative w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-black py-4 rounded-2xl text-[15px] overflow-hidden mb-4"
                          >
                            <Shine />
                            🎉 ¡Canjear Premio!
                          </motion.button>
                        )}

                        <div className="flex gap-2">
                          {[
                            { icon: '🎟️', label: 'Mi Pase', action: (e: React.MouseEvent) => { e.stopPropagation(); openPass(String(m?.name || '').trim(), String(m?.tenantId || '').trim()); } },
                            ...(m.instagram ? [{ icon: '📸', label: 'Instagram', action: null, href: `https://instagram.com/${String(m.instagram).replace('@', '')}` }] : []),
                          ].map((btn) => btn.href ? (
                            <a
                              key={btn.label}
                              href={btn.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 bg-gray-50/80 hover:bg-gray-100 py-2.5 rounded-xl font-bold text-[11px] text-gray-500 flex items-center justify-center gap-1 transition-all no-underline"
                            >
                              <span className="text-sm">{btn.icon}</span> {btn.label}
                            </a>
                          ) : (
                            <motion.button
                              key={btn.label}
                              whileTap={canAnim ? { scale: 0.95 } : undefined}
                              onClick={btn.action as (e: React.MouseEvent) => void}
                              className="flex-1 bg-gray-50/80 hover:bg-gray-100 py-2.5 rounded-xl font-bold text-[11px] text-gray-500 flex items-center justify-center gap-1 transition-all"
                            >
                              <span className="text-sm">{btn.icon}</span> {btn.label}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* TAB: ALIADOS */}
            {activeTab === 'aliados' && (() => {
              const q = aliadosSearch.trim().toLowerCase();
              const filtered = tenants.filter((t) =>
                !q || String(t.name || '').toLowerCase().includes(q) ||
                String(t.address || '').toLowerCase().includes(q) ||
                String(t.prize || '').toLowerCase().includes(q)
              );
              const sorted = [...filtered].sort((a, b) =>
                String(a.name || '').localeCompare(String(b.name || ''), 'es')
              );
              const grouped: Record<string, typeof sorted> = {};
              for (const t of sorted) {
                const letter = (String(t.name || '')[0] || '#').toUpperCase();
                if (!grouped[letter]) grouped[letter] = [];
                grouped[letter].push(t);
              }
              const letters = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'es'));

              return (
                <motion.div
                  initial={canAnim ? { opacity: 0, y: 10 } : false}
                  animate={canAnim ? { opacity: 1, y: 0 } : false}
                  transition={canAnim ? { ...spring } : undefined}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Aliados</h2>
                    <p className="text-[11px] text-gray-400 font-semibold mt-0.5">{tenants.length} negocio{tenants.length === 1 ? '' : 's'} en la coalición Punto IA</p>
                  </div>

                  <div className="relative">
                    <input
                      value={aliadosSearch}
                      onChange={(e) => setAliadosSearch(e.target.value)}
                      placeholder="Buscar negocio, ciudad o premio..."
                      className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-100 text-sm font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-pink-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
                  </div>

                  {sorted.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="text-3xl block mb-3">🔍</span>
                      <p className="text-sm font-bold text-gray-400">No se encontraron negocios</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {letters.map((letter) => (
                        <div key={letter}>
                          <div className="flex items-center gap-2 mb-2 mt-1">
                            <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[11px] font-black text-gray-500">{letter}</span>
                            <span className="h-px flex-1 bg-gray-100" />
                          </div>
                          <div className="space-y-2">
                            {grouped[letter].map((t) => {
                              const tid = String(t.id || '');
                              const isOpen = expandedAliadoId === tid;
                              const address = String(t.address || '').trim();
                              const prize = String(t.prize || '').trim();
                              const ig = String(t.instagram || '').trim();
                              const lat = Number(t.lat);
                              const lng = Number(t.lng);

                              return (
                                <motion.div
                                  key={tid}
                                  layout
                                  onClick={() => setExpandedAliadoId(isOpen ? null : tid)}
                                  className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden cursor-pointer"
                                >
                                  <div className="px-4 py-3 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white font-black text-xs shrink-0">
                                      {String(t.name || '').charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[13px] font-black text-gray-900 truncate">{String(t.name)}</p>
                                      {address && address !== 'Dirección pendiente' && (
                                        <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">{address}</p>
                                      )}
                                    </div>
                                    {prize && (
                                      <span className="shrink-0 text-[9px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] max-w-[80px] truncate">
                                        🎁 {prize}
                                      </span>
                                    )}
                                  </div>

                                  {isOpen && (
                                    <motion.div
                                      initial={canAnim ? { opacity: 0, height: 0 } : false}
                                      animate={canAnim ? { opacity: 1, height: 'auto' } : false}
                                      className="px-4 pb-3 flex gap-2"
                                    >
                                      <button
                                        onClick={(e) => { e.stopPropagation(); openPass(String(t.name), tid); }}
                                        className="flex-1 bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] text-white py-2.5 rounded-xl font-black text-[11px] shadow-sm"
                                      >
                                        🎟️ Crear Pase
                                      </button>
                                      {Number.isFinite(lat) && Number.isFinite(lng) && (
                                        <a
                                          onClick={(e) => e.stopPropagation()}
                                          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-bold text-[11px] no-underline text-center"
                                        >
                                          📍 Cómo llegar
                                        </a>
                                      )}
                                      {ig && (
                                        <a
                                          onClick={(e) => e.stopPropagation()}
                                          href={`https://instagram.com/${ig.replace('@', '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="bg-gray-100 text-gray-600 px-3 py-2.5 rounded-xl font-bold text-[11px] no-underline"
                                        >
                                          📸
                                        </a>
                                      )}
                                    </motion.div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })()}
          </div>

          {/* TAB: PERFIL */}
          {activeTab === 'profile' && (
            <div className="p-6 pt-0 space-y-4">
              <motion.div
                initial={canAnim ? { opacity: 0, y: 10 } : false}
                animate={canAnim ? { opacity: 1, y: 0 } : false}
                transition={canAnim ? { ...spring } : undefined}
                className="rounded-[2rem] overflow-hidden bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
              >
                <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-800 p-5 relative overflow-hidden">
                  <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-[#ff7a59]/20 via-[#ff3f8e]/10 to-transparent rounded-full blur-3xl" />
                  <div className="relative flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0">
                      {(user?.name as string)?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h2 className="text-white font-black text-base tracking-tight">{user?.name as string}</h2>
                      <p className="text-white/40 text-[10px] font-semibold mt-0.5">Miembro Punto IA</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] ml-0.5 mb-1.5 block">Nombre</label>
                    <input className="w-full p-3 bg-gray-50 rounded-xl text-gray-900 font-semibold text-sm border border-gray-100 outline-none focus:ring-2 focus:ring-pink-200 focus:bg-white transition" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] ml-0.5 mb-1.5 block">Teléfono</label>
                    <input type="tel" maxLength={10} className="w-full p-3 bg-gray-50 rounded-xl text-gray-900 font-semibold text-sm border border-gray-100 outline-none focus:ring-2 focus:ring-pink-200 focus:bg-white transition" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] ml-0.5 mb-1.5 block">Email</label>
                    <input type="email" className="w-full p-3 bg-gray-50 rounded-xl text-gray-900 font-semibold text-sm border border-gray-100 outline-none focus:ring-2 focus:ring-pink-200 focus:bg-white transition" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] ml-0.5 mb-1.5 block">Nacimiento</label>
                      <input type="date" className="w-full p-3 bg-gray-50 rounded-xl text-gray-900 font-semibold text-sm border border-gray-100 outline-none focus:ring-2 focus:ring-pink-200 focus:bg-white transition" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] ml-0.5 mb-1.5 block">Género</label>
                      <select className="w-full p-3 bg-gray-50 rounded-xl text-gray-900 font-semibold text-sm border border-gray-100 outline-none focus:ring-2 focus:ring-pink-200 transition" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="Hombre">Masculino</option>
                        <option value="Mujer">Femenino</option>
                      </select>
                    </div>
                  </div>

                  <motion.button
                    whileTap={canAnim ? { scale: 0.97 } : undefined}
                    onClick={handleUpdate}
                    className="w-full bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] text-white p-3.5 rounded-xl font-black text-sm shadow-sm mt-2"
                  >
                    Guardar Cambios
                  </motion.button>

                  {message && (
                    <p className={`text-center text-sm font-bold p-3 rounded-xl ${message.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                      {message}
                    </p>
                  )}
                </div>
              </motion.div>

              <motion.button
                initial={canAnim ? { opacity: 0, y: 8 } : false}
                animate={canAnim ? { opacity: 1, y: 0 } : false}
                transition={canAnim ? { ...spring, delay: 0.1 } : undefined}
                whileTap={canAnim ? { scale: 0.97 } : undefined}
                onClick={loadHistory}
                className="w-full bg-white p-4 rounded-2xl font-bold text-sm text-gray-600 shadow-[0_2px_16px_rgba(0,0,0,0.04)] flex items-center justify-center gap-2 hover:bg-gray-50 transition"
              >
                <span className="text-base">🏆</span> Ver Historial de Premios
              </motion.button>

              <p className="text-center text-gray-300 text-[10px] font-semibold pt-2">
                punto IA · Coalición de PyMEs 🇲🇽
              </p>
            </div>
          )}

          {/* Bottom Tabs */}
          <div className="fixed bottom-5 left-5 right-5 bg-white/90 backdrop-blur-2xl border border-gray-200/50 p-1.5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex items-center z-40">
            {[
              { key: 'points', label: 'Puntos', isOrb: true },
              { key: 'aliados', label: 'Aliados', icon: '🤝' },
              { key: 'profile', label: 'Perfil', icon: '👤' },
            ].map((t) => {
              const active = activeTab === (t.key as 'points' | 'aliados' | 'profile');
              return (
                <motion.button
                  key={t.key}
                  whileTap={canAnim ? { scale: 0.96 } : undefined}
                  onClick={() => setActiveTab(t.key as 'points' | 'aliados' | 'profile')}
                  className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all duration-200 ${
                    active ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-md' : 'text-gray-400'
                  }`}
                >
                  {(t as Record<string, unknown>).isOrb ? (
                    <span className={`w-5 h-5 rounded-full mb-1 ${active ? 'bg-gradient-to-br from-[#ff7a59] to-[#ff3f8e] shadow-[0_0_8px_rgba(255,63,142,0.5)]' : 'bg-gray-300'}`} />
                  ) : (
                    <span className="text-base mb-0.5">{(t as Record<string, unknown>).icon as string}</span>
                  )}
                  <span className="text-[9px] font-black uppercase tracking-[0.1em]">{t.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
