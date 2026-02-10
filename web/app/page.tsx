'use client';

import { useEffect, useMemo, useState } from 'react';
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

const glow = 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600';

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

// Framer Motion transitions
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

async function safeJson(res: Response): Promise<any> {
  // Evita crashes cuando la API responde vacío / no-JSON / HTML (por ejemplo, un error intermedio).
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const slides = [
  { icon: '🎁', title: 'Tus premios te esperan', text: 'Acumula puntos y cámbialos por recompensas.' },
  { icon: '📍', title: 'Encuentra negocios', text: 'Explora el mapa y descubre aliados cerca de ti.' },
  { icon: '📲', title: 'Check-in rápido', text: 'Escanea un QR o ingresa un código para sumar puntos.' },
] as const;

// 👇 Renombrado para evitar "defined multiple times"
const springOnboarding = { type: 'spring', stiffness: 350, damping: 30 };

function Onboarding({ canAnim }: { canAnim: boolean }) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setSlide((p) => (p + 1) % slides.length), 3500);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={canAnim ? { opacity: 0, y: 10 } : false}
            animate={canAnim ? { opacity: 1, y: 0 } : false}
            exit={canAnim ? { opacity: 0, y: -10 } : false}
            transition={canAnim ? { ...springOnboarding } : undefined}
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
  const reduce = useReducedMotion();
  const canAnim = !reduce;

  const [view, setView] = useState<ViewState>('WELCOME');

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
      const d = await safeJson(res);
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
      const data = await safeJson(res);
      if (data.history) setHistory(data.history);
      setShowHistory(true);
    } catch (err) {
      console.error('History fetch error', err);
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
      const data = await safeJson(res);
      if (res.ok) {
        setUser(data);
        setName(data.name);
        setEmail(data.email || '');
        setGender(data.gender || '');
        if (data.birthDate) setBirthDate(data.birthDate.split('T')[0]);
        else setBirthDate('');
        setView('APP');
        setActiveTab('checkin');
        setMessage('✅ Sesión iniciada');
      } else {
        setMessage(data.error || '❌ Error al iniciar sesión');
      }
    } catch {
      setMessage('❌ Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setMessage('');
    if (!name) return setMessage('❌ Nombre requerido');
    if (!isValidPhone(phone)) return setMessage('❌ Teléfono debe tener 10 dígitos');
    if (!password || password.length < 4) return setMessage('❌ Contraseña muy corta');
    if (email && !isValidEmail(email)) return setMessage('❌ Email inválido');

    setLoading(true);
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, name, email, gender, birthDate }),
      });
      const data = await safeJson(res);

      if (res.ok) {
        setUser(data);
        setView('APP');
        setActiveTab('checkin');
        setMessage('✅ Registro exitoso');
      } else {
        setMessage(data.error || '❌ Error al registrar');
      }
    } catch {
      setMessage('❌ Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!user?.id) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          phone,
          name,
          email,
          gender,
          birthDate,
        }),
      });
      const data = await safeJson(res);
      if (res.ok) {
        setUser((u: any) => ({ ...u, ...data.user }));
        setMessage('✅ Cambios guardados');
      } else {
        setMessage(data.error || '❌ Error guardando');
      }
    } catch {
      setMessage('❌ Error guardando');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPassword('');
    setView('WELCOME');
    setActiveTab('checkin');
    setMessage('');
    setPrizeCode(null);
    setHistory([]);
    setShowHistory(false);
  };

  const handleScan = async (code: string) => {
    if (!user?.id) {
      setMessage('⚠️ Inicia sesión para registrar');
      return;
    }
    if (!code) return;

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, code }),
      });
      const data = await safeJson(res);

      if (res.ok) {
        setUser((u: any) => ({
          ...u,
          points: data.points,
          balance: data.balance,
          latestMilestones: data.latestMilestones,
        }));
        setMessage(`✅ +${data.addedPoints} pts`);
      } else {
        setMessage(data.error || '❌ No se pudo registrar');
      }
    } catch (e) {
      console.error(e);
      setMessage('❌ Error registrando');
    } finally {
      setLoading(false);
      setScanning(false);
      setManualCode('');
    }
  };

  const getPrizeCode = async (tenantId: string, tenantName: string) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/prize/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, tenantId }),
      });
      const data = await safeJson(res);
      if (res.ok) {
        setPrizeCode({ code: data.code, tenant: tenantName });
      } else {
        alert(data.error || 'No se pudo generar código');
      }
    } catch {
      alert('Error generando código');
    } finally {
      setLoading(false);
    }
  };

  const goToBusinessMap = (businessName: string) => {
    const t = tenants.find((x) => x.name?.toLowerCase?.() === businessName.toLowerCase());
    if (t && typeof t.lat === 'number' && typeof t.lng === 'number') {
      setMapFocus([t.lat, t.lng]);
      setActiveTab('map');
    } else {
      setActiveTab('map');
    }
  };

  function Shine() {
    return (
      <span className="pointer-events-none absolute inset-0">
        <span className="absolute -left-1/2 top-0 h-full w-1/2 bg-white/10 rotate-12 blur-md animate-[shine_1.6s_ease-in-out_infinite]" />
        <style jsx>{`
          @keyframes shine {
            0% {
              transform: translateX(-120%) rotate(12deg);
            }
            100% {
              transform: translateX(260%) rotate(12deg);
            }
          }
        `}</style>
      </span>
    );
  }

  const milestones = useMemo(() => user?.latestMilestones || [], [user]);

  const showPrizeBanner =
    Array.isArray(milestones) && milestones.some((m: any) => m?.status === 'EARNED');

  const points = user?.points ?? 0;
  const balance = user?.balance ?? 0;

  const periodInfo = formatRewardPeriod(user?.rewardPeriod);

  return (
    <AnimatePresence mode="wait">
      {view !== 'APP' ? (
        <motion.div
          key={view}
          initial={canAnim ? screenFx.initial : false}
          animate={canAnim ? screenFx.animate : false}
          exit={canAnim ? screenFx.exit : false}
          transition={canAnim ? { ...spring } : undefined}
          className={`min-h-screen ${glow} flex items-center justify-center p-6`}
        >
          <div className="w-full max-w-md">
            <div className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-[2.5rem] p-8 shadow-2xl">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-black text-white drop-shadow">Puntos IA</h1>
                <p className="text-white/85 text-sm font-semibold mt-1">Gana puntos. Canjea premios.</p>
              </div>

              {view === 'WELCOME' && (
                <>
                  <Onboarding canAnim={canAnim} />

                  <div className="mt-8 space-y-3">
                    <motion.button
                      whileTap={canAnim ? { scale: 0.98 } : undefined}
                      onClick={() => setView('LOGIN')}
                      className="w-full bg-white text-gray-900 py-4 rounded-2xl font-black shadow-lg"
                    >
                      Iniciar sesión
                    </motion.button>

                    <motion.button
                      whileTap={canAnim ? { scale: 0.98 } : undefined}
                      onClick={() => setView('REGISTER')}
                      className="w-full bg-white/20 text-white py-4 rounded-2xl font-black border border-white/20"
                    >
                      Crear cuenta
                    </motion.button>
                  </div>
                </>
              )}

              {view === 'LOGIN' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-black text-white/80 uppercase ml-1 block mb-2 tracking-widest">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      className={clsInput}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10 dígitos"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-white/80 uppercase ml-1 block mb-2 tracking-widest">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      className={clsInput}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••"
                    />
                  </div>

                  <motion.button
                    whileTap={canAnim ? { scale: 0.98 } : undefined}
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-gray-950 text-white py-4 rounded-2xl font-black shadow-xl disabled:opacity-60"
                  >
                    {loading ? 'Cargando…' : 'Entrar'}
                  </motion.button>

                  <button onClick={() => setView('WELCOME')} className="w-full text-white/70 font-black text-sm">
                    Volver
                  </button>

                  {message && <p className="text-center text-white font-black">{message}</p>}
                </div>
              )}

              {view === 'REGISTER' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black text-white/80 uppercase ml-1 block mb-2 tracking-widest">
                      Nombre
                    </label>
                    <input
                      className={clsInput}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-white/80 uppercase ml-1 block mb-2 tracking-widest">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      className={clsInput}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10 dígitos"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-white/80 uppercase ml-1 block mb-2 tracking-widest">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      className={clsInput}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-white/80 uppercase ml-1 block mb-2 tracking-widest">
                      Email (opcional)
                    </label>
                    <input
                      type="email"
                      className={clsInput}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-xs font-black text-white/80 uppercase ml-1 block mb-2 tracking-widest">
                        Nacimiento
                      </label>
                      <input
                        type="date"
                        className={clsInputFixed}
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>

                    <div className="flex-1">
                      <label className="text-xs font-black text-white/80 uppercase ml-1 block mb-2 tracking-widest">
                        Género
                      </label>
                      <select className={clsInput} value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">Selecciona</option>
                        <option value="Hombre">Masculino</option>
                        <option value="Mujer">Femenino</option>
                      </select>
                    </div>
                  </div>

                  <motion.button
                    whileTap={canAnim ? { scale: 0.98 } : undefined}
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full bg-gray-950 text-white py-4 rounded-2xl font-black shadow-xl disabled:opacity-60"
                  >
                    {loading ? 'Cargando…' : 'Crear cuenta'}
                  </motion.button>

                  <button onClick={() => setView('WELCOME')} className="w-full text-white/70 font-black text-sm">
                    Volver
                  </button>

                  {message && <p className="text-center text-white font-black">{message}</p>}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={canAnim ? { opacity: 0 } : false}
          animate={canAnim ? { opacity: 1 } : false}
          exit={canAnim ? { opacity: 0 } : false}
          className={`min-h-screen ${glow} pb-28`}
        >
          {/* Header */}
          <div className="sticky top-0 z-40 p-6 pb-4 backdrop-blur-xl bg-black/10 border-b border-white/10">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-white/70">Bienvenido</div>
                <div className="text-2xl font-black text-white drop-shadow">{user?.name || 'Usuario'}</div>
              </div>
              <motion.button
                whileTap={canAnim ? { scale: 0.98 } : undefined}
                onClick={handleLogout}
                className="bg-white/15 text-white font-black px-5 py-3 rounded-2xl border border-white/20 shadow-lg"
              >
                Salir
              </motion.button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-6 pt-6 space-y-6">
            {/* Points Card */}
            <motion.div
              initial={canAnim ? { opacity: 0, y: 10 } : false}
              animate={canAnim ? { opacity: 1, y: 0 } : false}
              transition={canAnim ? { ...spring } : undefined}
              className="bg-white p-7 rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden"
            >
              <span className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-pink-200/40 blur-3xl" />
              <span className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-orange-200/40 blur-3xl" />

              <div className="flex items-start justify-between relative">
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Puntos</div>
                  <div className="text-4xl font-black text-gray-950">{points}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Saldo</div>
                  <div className="text-2xl font-black text-gray-950">{balance}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-black text-gray-500 uppercase tracking-widest relative">
                <span>{periodInfo.counter}</span>
                <span>{periodInfo.window}</span>
              </div>

              <motion.button
                whileTap={canAnim ? { scale: 0.98 } : undefined}
                onClick={() => setShowTutorial(true)}
                className="mt-6 w-full bg-gray-950 text-white py-4 rounded-2xl font-black shadow-xl"
              >
                ¿Cómo funciona? 🤔
              </motion.button>
            </motion.div>

            {/* Prize banner */}
            {showPrizeBanner && (
              <motion.div
                initial={canAnim ? { opacity: 0, y: 10 } : false}
                animate={canAnim ? { opacity: 1, y: 0 } : false}
                transition={canAnim ? { ...spring } : undefined}
                className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white rounded-[2.5rem] p-6 shadow-2xl border border-white/20"
              >
                <div className="font-black text-xl">🎉 ¡Tienes premios disponibles!</div>
                <div className="text-white/90 text-sm font-semibold mt-1">
                  Ve a <b>Puntos</b> y toca <b>CANJEAR PREMIO</b>.
                </div>
              </motion.div>
            )}

            {/* Tabs content */}
            <div className="space-y-6">
              {/* TAB: CHECKIN */}
              {activeTab === 'checkin' && (
                <motion.div
                  initial={canAnim ? { opacity: 0, y: 10 } : false}
                  animate={canAnim ? { opacity: 1, y: 0 } : false}
                  transition={canAnim ? { ...spring } : undefined}
                  className="bg-white p-7 rounded-[2.5rem] shadow-2xl border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-black text-gray-950">Check-in</h2>
                      <p className="text-sm text-gray-400 font-semibold">Escanea QR o ingresa código</p>
                    </div>
                    <div className="text-3xl">✅</div>
                  </div>

                  <div className="space-y-4">
                    <motion.button
                      whileTap={canAnim ? { scale: 0.98 } : undefined}
                      onClick={() => setScanning(true)}
                      className="w-full bg-gray-950 text-white py-5 rounded-2xl font-black shadow-xl text-lg"
                    >
                      Escanear QR 📷
                    </motion.button>

                    <div className="grid grid-cols-1 gap-3">
                      <input
                        className={clsInput}
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Ingresa código manual"
                      />
                      <motion.button
                        whileTap={canAnim ? { scale: 0.98 } : undefined}
                        onClick={() => handleScan(manualCode.trim())}
                        disabled={loading || !manualCode.trim()}
                        className="w-full bg-pink-600 text-white py-4 rounded-2xl font-black shadow-xl disabled:opacity-60"
                      >
                        Registrar código
                      </motion.button>
                    </div>

                    {message && (
                      <p className="text-center text-gray-900 font-black bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        {message}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB: POINTS */}
              {activeTab === 'points' && (
                <div className="space-y-4">
                  <motion.div
                    initial={canAnim ? { opacity: 0, y: 10 } : false}
                    animate={canAnim ? { opacity: 1, y: 0 } : false}
                    transition={canAnim ? { ...spring } : undefined}
                    className="bg-white p-7 rounded-[2.5rem] shadow-2xl border border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-black text-gray-950">Puntos</h2>
                        <p className="text-sm text-gray-400 font-semibold">Tus metas y premios</p>
                      </div>
                      <div className="text-3xl">🔥</div>
                    </div>
                  </motion.div>

                  <div className="space-y-4">
                    {milestones.map((m: any) => {
                      const isExpanded = expandedId === m.id;
                      const earned = m.status === 'EARNED';

                      return (
                        <motion.div
                          key={m.id}
                          layout
                          className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden"
                          onClick={() => setExpandedId((x) => (x === m.id ? null : m.id))}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                {m.tenantName}
                              </div>
                              <div className="text-lg font-black text-gray-950 truncate">{m.name}</div>
                              <div className="text-sm text-gray-500 font-semibold mt-1">
                                Meta: <b>{m.targetPoints}</b> pts
                              </div>
                            </div>

                            <div
                              className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest ${
                                earned ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {earned ? 'Ganado' : 'En progreso'}
                            </div>
                          </div>

                          {earned && (
                            <motion.button
                              whileTap={canAnim ? { scale: 0.98 } : undefined}
                              onClick={(e) => {
                                e.stopPropagation();
                                getPrizeCode(m.tenantId, m.name);
                              }}
                              className="relative w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-black py-5 rounded-2xl shadow-2xl tracking-wide text-lg overflow-hidden border-4 border-white/20 mt-5"
                            >
                              <Shine />
                              🎁 CANJEAR PREMIO
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
                              <span className="text-2xl mb-1">📍</span>
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
                                <span className="text-2xl mb-1">📸</span>
                                Instagram
                              </a>
                            ) : (
                              <div className="bg-gray-50 border-2 border-gray-100 text-gray-300 py-4 rounded-2xl font-black text-xs flex flex-col items-center opacity-70">
                                <span className="text-2xl mb-1">📸</span>
                                No IG
                              </div>
                            )}
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: MAPA */}
              {activeTab === 'map' && (
                <motion.div
                  initial={canAnim ? { opacity: 0, y: 10 } : false}
                  animate={canAnim ? { opacity: 1, y: 0 } : false}
                  transition={canAnim ? { ...spring } : undefined}
                  className="h-[52vh] md:h-[58vh] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white relative"
                >
                  <BusinessMap tenants={tenants} focusCoords={mapFocus} radiusKm={50} />
                </motion.div>
              )}
            </div>
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
                className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100 relative overflow-hidden"
              >
                <span className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-pink-200/35 blur-3xl" />
                <span className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-orange-200/35 blur-3xl" />

                <div className="flex items-center gap-5 mb-10 relative">
                  <div className="h-20 w-20 bg-gradient-to-br from-orange-100 to-pink-100 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner text-pink-600">
                    👤
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">Mi Perfil</h2>
                    <p className="text-sm text-gray-400 font-semibold">Gestiona tu identidad</p>
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
                      <input
                        type="date"
                        className={clsInputFixed}
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
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
                  className="w-full bg-yellow-400 text-yellow-950 p-5 rounded-2xl font-black mt-8 shadow-xl hover:bg-yellow-300 transition-all text-lg flex items-center justify-center gap-2"
                >
                  <span>📜</span> Ver Historial de Premios
                </motion.button>

                <motion.button
                  whileTap={canAnim ? { scale: 0.98 } : undefined}
                  onClick={handleUpdate}
                  className="relative w-full bg-gray-950 text-white p-5 rounded-2xl font-black mt-4 shadow-2xl transition-all text-lg hover:bg-black overflow-hidden"
                >
                  <Shine />
                  Guardar Cambios 💾
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
              { key: 'checkin', icon: '✅', label: 'Check-In' },
              { key: 'points', icon: '🔥', label: 'Puntos' },
              { key: 'map', icon: '🗺️', label: 'Mapa' },
              { key: 'profile', icon: '👤', label: 'Perfil' },
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

          {/* Prize Code Modal */}
          <AnimatePresence>
            {prizeCode && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
                initial={canAnim ? { opacity: 0 } : false}
                animate={canAnim ? { opacity: 1 } : false}
                exit={canAnim ? { opacity: 0 } : false}
                onClick={() => setPrizeCode(null)}
              >
                <motion.div
                  initial={canAnim ? modalFx.initial : false}
                  animate={canAnim ? modalFx.animate : false}
                  exit={canAnim ? modalFx.exit : false}
                  transition={canAnim ? { ...spring } : undefined}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100"
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3">🎁</div>
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Código de canje</div>
                    <div className="text-2xl font-black text-gray-950 mt-1">{prizeCode.tenant}</div>

                    <div className="mt-6 bg-gray-950 text-white rounded-2xl p-6 font-black text-3xl tracking-widest">
                      {prizeCode.code}
                    </div>

                    <p className="text-sm text-gray-500 font-semibold mt-4">
                      Muéstralo al negocio para canjear tu premio.
                    </p>

                    <motion.button
                      whileTap={canAnim ? { scale: 0.98 } : undefined}
                      onClick={() => setPrizeCode(null)}
                      className="mt-6 w-full bg-gray-950 text-white py-4 rounded-2xl font-black shadow-xl"
                    >
                      Cerrar
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tutorial Modal */}
          <AnimatePresence>
            {showTutorial && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
                initial={canAnim ? { opacity: 0 } : false}
                animate={canAnim ? { opacity: 1 } : false}
                exit={canAnim ? { opacity: 0 } : false}
                onClick={() => setShowTutorial(false)}
              >
                <motion.div
                  initial={canAnim ? modalFx.initial : false}
                  animate={canAnim ? modalFx.animate : false}
                  exit={canAnim ? modalFx.exit : false}
                  transition={canAnim ? { ...spring } : undefined}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100"
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3">🤝</div>
                    <div className="text-2xl font-black text-gray-950">¿Cómo funciona?</div>
                    <p className="text-sm text-gray-500 font-semibold mt-3">
                      1) Haz check-in con QR/código<br />
                      2) Acumula puntos<br />
                      3) Completa metas y canjea premios
                    </p>

                    <motion.button
                      whileTap={canAnim ? { scale: 0.98 } : undefined}
                      onClick={() => setShowTutorial(false)}
                      className="mt-6 w-full bg-gray-950 text-white py-4 rounded-2xl font-black shadow-xl"
                    >
                      Entendido
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History Modal */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
                initial={canAnim ? { opacity: 0 } : false}
                animate={canAnim ? { opacity: 1 } : false}
                exit={canAnim ? { opacity: 0 } : false}
                onClick={() => setShowHistory(false)}
              >
                <motion.div
                  initial={canAnim ? modalFx.initial : false}
                  animate={canAnim ? modalFx.animate : false}
                  exit={canAnim ? modalFx.exit : false}
                  transition={canAnim ? { ...spring } : undefined}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xl font-black text-gray-950">Historial</div>
                    <button className="text-gray-400 font-black" onClick={() => setShowHistory(false)}>
                      ✕
                    </button>
                  </div>

                  <div className="max-h-[50vh] overflow-auto space-y-3">
                    {history.length ? (
                      history.map((h: any) => (
                        <div key={h.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">{h.tenantName}</div>
                          <div className="text-sm font-black text-gray-900">{h.milestoneName}</div>
                          <div className="text-xs text-gray-500 font-semibold mt-1">
                            {new Date(h.redeemedAt).toLocaleString('es-MX')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 font-semibold">Sin historial todavía.</div>
                    )}
                  </div>

                  <motion.button
                    whileTap={canAnim ? { scale: 0.98 } : undefined}
                    onClick={() => setShowHistory(false)}
                    className="mt-6 w-full bg-gray-950 text-white py-4 rounded-2xl font-black shadow-xl"
                  >
                    Cerrar
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
