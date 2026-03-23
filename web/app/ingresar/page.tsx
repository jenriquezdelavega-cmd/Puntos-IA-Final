// NOTE: metadata is exported from app/ingresar/layout.tsx since this is a 'use client' component.
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CircleUserRound, ShieldCheck } from 'lucide-react';
import { PageShell } from '@/src/components/marketing/page-shell';
import { SiteHeader } from '@/src/components/marketing/site-header';
import { SiteFooter } from '@/src/components/marketing/site-footer';
import { marketingRoutes } from '@/src/config/marketing-routes';

const NAV_ITEMS = [
  { label: 'Inicio', href: marketingRoutes.home },
  { label: 'Negocios', href: marketingRoutes.negocios },
  { label: 'Clientes', href: marketingRoutes.clientes },
  { label: 'Precios', href: marketingRoutes.precios },
  { label: 'Entrar', href: marketingRoutes.login },
] as const;

type UserLoginResponse = {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  phoneOtpVerified?: boolean;
  phoneOtpVerificationEnabled?: boolean;
  emailVerificationPending?: boolean;
  gender?: string;
  birthDate?: string | null;
  memberships?: Array<{ tenantId: string; name?: string }>;
  sessionToken?: string;
};

type ApiErrorResponse = {
  ok?: false;
  code?: string;
  message?: string;
  error?: string;
  emailStatus?: 'sent' | 'not_configured' | 'failed';
};

type CustomerMode = 'login' | 'registro';

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getBirthDateLimits() {
  const today = new Date();
  const max = new Date(today);
  max.setUTCFullYear(max.getUTCFullYear() - 5);
  const min = new Date(today);
  min.setUTCFullYear(min.getUTCFullYear() - 100);
  return {
    minBirthDate: toIsoDate(min),
    maxBirthDate: toIsoDate(max),
  };
}

function isValidBasicEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isoDateToDisplay(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function displayDateToIso(value: string): string {
  const normalized = value.replace(/[^\d]/g, '');
  if (normalized.length !== 8) return value;
  const day = normalized.slice(0, 2);
  const month = normalized.slice(2, 4);
  const year = normalized.slice(4, 8);
  return `${year}-${month}-${day}`;
}

function getApiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  if ('message' in body && typeof body.message === 'string' && body.message.trim()) return body.message;
  if ('error' in body && typeof body.error === 'string' && body.error.trim()) return body.error;
  return fallback;
}

const BIRTH_DATE_LIMITS = getBirthDateLimits();

export default function IngresarPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerGender, setRegisterGender] = useState('');
  const [registerBirthDate, setRegisterBirthDate] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const [customerMode, setCustomerMode] = useState<CustomerMode>('login');
  const { minBirthDate, maxBirthDate } = BIRTH_DATE_LIMITS;
  const cleanRegisterEmail = registerEmail.trim().toLowerCase();
  const isBirthDateInRange = Boolean(registerBirthDate) && registerBirthDate >= minBirthDate && registerBirthDate <= maxBirthDate;
  const canSubmitRegister = Boolean(
    registerName.trim() &&
      registerPassword &&
      registerGender &&
      registerPhone.trim() &&
      isValidBasicEmail(cleanRegisterEmail) &&
      isBirthDateInRange,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const modo = params.get('modo');
    const emailVerification = params.get('emailVerification');

    if (modo === 'registro') setCustomerMode('registro');
    if (modo === 'login') setCustomerMode('login');
    if (emailVerification === 'ok') {
      setCustomerMode('login');
      setLoginMessage('¡Correo confirmado! Ya puedes iniciar sesión.');
    } else if (emailVerification === 'expired') {
      setCustomerMode('login');
      setLoginMessage('El enlace de confirmación expiró. Regístrate nuevamente para recibir uno nuevo.');
    } else if (emailVerification === 'invalid') {
      setCustomerMode('login');
      setLoginMessage('El enlace de confirmación no es válido.');
    } else if (emailVerification === 'already') {
      setCustomerMode('login');
      setLoginMessage('Tu correo ya estaba confirmado. Inicia sesión.');
    }
  }, []);

  useEffect(() => {
    router.prefetch('/clientes/app');
  }, [router]);

  const setModeInUrl = (mode: CustomerMode) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('tipo', 'cliente');
    url.searchParams.set('modo', mode);
    window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
  };

  const loginCustomer = async (payload: { phone: string; password?: string }, showError = true) => {
    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: payload.phone.trim(), password: payload.password?.trim() || undefined }),
      });

      const body = (await response.json()) as (UserLoginResponse & { ok?: true; message?: string; error?: string }) | ApiErrorResponse;

      if (!response.ok || !body || !('id' in body)) {
        if (showError) {
          setLoginMessage(body?.message || body?.error || 'No se pudo iniciar sesión. Verifica tus datos.');
        }
        return false;
      }

      localStorage.setItem('punto_user', JSON.stringify(body));
      const preferredBusiness = body.memberships?.[0]?.tenantId;
      const destination = preferredBusiness
        ? `/clientes/app?business_id=${encodeURIComponent(preferredBusiness)}`
        : '/clientes/app';
      router.push(destination);
      return true;
    } catch {
      if (showError) {
        setLoginMessage('No se pudo conectar con el servidor. Intenta nuevamente.');
      }
      return false;
    }
  };

  const onCustomerLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setLoginMessage('');
    try {
      await loginCustomer({ phone, password }, true);
    } finally {
      setLoading(false);
    }
  };

  const onCustomerRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterLoading(true);
    setRegisterMessage('');
    const cleanPhone = registerPhone.trim();
    const cleanEmail = cleanRegisterEmail;
    if (!isValidBasicEmail(cleanEmail)) {
      setRegisterMessage('Ingresa un correo válido (ejemplo@dominio.com).');
      setRegisterLoading(false);
      return;
    }
    if (registerBirthDate < minBirthDate || registerBirthDate > maxBirthDate) {
      setRegisterMessage('La edad permitida para registro es entre 5 y 100 años.');
      setRegisterLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName.trim(),
          phone: cleanPhone,
          password: registerPassword,
          email: cleanEmail,
          gender: registerGender,
          birthDate: registerBirthDate,
        }),
      });

      const body = (await response.json()) as (UserLoginResponse & { ok?: true; emailStatus?: ApiErrorResponse['emailStatus'] }) | ApiErrorResponse;
      if (!response.ok) {
        setRegisterMessage(getApiErrorMessage(body, 'No se pudo crear la cuenta. Revisa tus datos.'));
        return;
      }
      setPhone(cleanPhone);
      setPassword(registerPassword);
      if ('id' in body) {
        localStorage.setItem('punto_user', JSON.stringify(body));
        const preferredBusiness = body.memberships?.[0]?.tenantId;
        const destination = preferredBusiness
          ? `/clientes/app?business_id=${encodeURIComponent(preferredBusiness)}`
          : '/clientes/app';
        router.push(destination);
      }
      if (body?.emailStatus === 'not_configured') {
        setRegisterMessage('Cuenta creada, pero el email de verificación no está configurado en este momento.');
      } else if (body?.emailStatus === 'failed') {
        setRegisterMessage('Cuenta creada. No pudimos enviar el email de verificación, pero ya puedes iniciar sesión.');
      } else {
        setRegisterMessage('Cuenta creada. Te enviamos un email para verificar tu cuenta.');
      }
    } catch {
      setRegisterMessage('No se pudo crear la cuenta en este momento. Intenta nuevamente.');
    } finally {
      setRegisterLoading(false);
    }
  };


  return (
    <PageShell variant="dark">
      <SiteHeader navItems={NAV_ITEMS} dark />
      <main className="relative flex-grow flex items-center justify-center py-20 px-6 sm:px-12 overflow-hidden">

        <div className="relative z-10 w-full max-w-5xl mx-auto grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr),350px]">
          {/* Tarjeta de Clientes */}
          <article className="rounded-[2.5rem] border border-white/10 bg-[#160b2b]/80 p-8 shadow-2xl backdrop-blur-xl md:p-10">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#dacbf0]">
              <CircleUserRound className="h-4 w-4" />
              Portal de Clientes
            </p>
            <h2 className="mt-4 text-3xl font-black text-white md:text-4xl">
              {customerMode === 'login' ? 'Bienvenido de vuelta.' : 'Desbloquea tus beneficios.'}
            </h2>
            <p className="mt-3 text-[#a593c2]">
              {customerMode === 'login'
                ? 'Ingresa tus datos para ver tus recompensas.'
                : 'Activa tu Wallet Pass y empieza a ganar retos.'}
            </p>

            <div className="mt-8 flex rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => {
                  setCustomerMode('login');
                  setModeInUrl('login');
                }}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  customerMode === 'login'
                    ? 'bg-[#7e4fd3] text-white shadow-lg shadow-purple-500/25'
                    : 'text-[#dacbf0] hover:text-white hover:bg-white/5'
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomerMode('registro');
                  setModeInUrl('registro');
                }}
                className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  customerMode === 'registro'
                    ? 'bg-[#7e4fd3] text-white shadow-lg shadow-purple-500/25'
                    : 'text-[#dacbf0] hover:text-white hover:bg-white/5'
                }`}
              >
                Crear cuenta
              </button>
            </div>

            {customerMode === 'login' ? (
              <form className="mt-8 grid gap-4 relative" onSubmit={onCustomerLogin}>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[#dacbf0]" htmlFor="phone">Número de WhatsApp</label>
                  <input
                    id="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#7e4fd3] focus:ring-1 focus:ring-[#7e4fd3] focus:outline-none transition-colors"
                    placeholder="Ejemplo: 5512345678"
                    autoComplete="tel"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-[#dacbf0]" htmlFor="password">Contraseña</label>
                    <a href="/recuperar" className="text-xs font-semibold text-[#ff5e91] hover:text-pink-400 transition-colors">¿Olvidaste tu contraseña?</a>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#7e4fd3] focus:ring-1 focus:ring-[#7e4fd3] focus:outline-none transition-colors"
                    placeholder="Escribe tu contraseña"
                    autoComplete="current-password"
                    required
                  />
                </div>
                
                {loginMessage && (
                  <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                    {loginMessage}
                  </p>
                )}

                <button type="submit" className={`mt-2 w-full py-3.5 px-6 rounded-xl font-bold bg-[#7e4fd3] text-white hover:bg-[#6c40bb] shadow-lg shadow-purple-500/25 transition-all ${loading ? 'opacity-70 cursor-wait' : ''}`} disabled={loading}>
                  {loading ? 'Validando...' : 'Entrar a mi Wallet'}
                </button>
              </form>
            ) : (
               <form className="mt-8 grid gap-4 sm:grid-cols-2 relative" onSubmit={onCustomerRegister}>
                <div className="grid gap-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-[#dacbf0]" htmlFor="register-name">Nombre completo</label>
                  <input
                    id="register-name"
                    value={registerName}
                    onChange={(event) => setRegisterName(event.target.value)}
                    className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#7e4fd3] focus:ring-1 focus:ring-[#7e4fd3] focus:outline-none"
                    placeholder="¿Cómo te llamas?"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[#dacbf0]" htmlFor="register-phone">WhatsApp</label>
                  <input
                    id="register-phone"
                    value={registerPhone}
                    onChange={(event) => setRegisterPhone(event.target.value)}
                    className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#7e4fd3] focus:ring-1 focus:ring-[#7e4fd3] focus:outline-none"
                    placeholder="Tu WhatsApp"
                    autoComplete="tel-national"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[#dacbf0]" htmlFor="register-email">Email</label>
                  <input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value.trimStart())}
                    className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#7e4fd3] focus:ring-1 focus:ring-[#7e4fd3] focus:outline-none"
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[#dacbf0]" htmlFor="register-gender">Identidad</label>
                  <select
                    id="register-gender"
                    value={registerGender}
                    onChange={(event) => setRegisterGender(event.target.value)}
                    className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#7e4fd3] focus:ring-1 focus:ring-[#7e4fd3] focus:outline-none [&>option]:text-black"
                    required
                  >
                    <option value="">Selecciona</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                    <option value="Otro">Prefiero no decir</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[#dacbf0]" htmlFor="register-birth-date">Cumpleaños</label>
                  <input
                    id="register-birth-date"
                    type="text"
                    inputMode="numeric"
                    pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/(19|20)\\d{2}$"
                    value={isoDateToDisplay(registerBirthDate)}
                    onChange={(event) => {
                      const next = displayDateToIso(event.target.value);
                      setRegisterBirthDate(next);
                    }}
                    className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#7e4fd3] focus:ring-1 focus:ring-[#7e4fd3] focus:outline-none sm:[color-scheme:dark]"
                    placeholder="DD/MM/AAAA"
                    required
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-[#dacbf0]" htmlFor="register-password">Contraseña segura</label>
                  <input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#7e4fd3] focus:ring-1 focus:ring-[#7e4fd3] focus:outline-none"
                    placeholder="Min. 6 caracteres"
                    minLength={6}
                    autoComplete="new-password"
                    required
                  />
                </div>
                
                {registerMessage && (
                  <p className="sm:col-span-2 mt-2 rounded-lg border border-[#7e4fd3]/30 bg-[#7e4fd3]/10 px-4 py-3 text-sm font-semibold text-[#dacbf0]">
                    {registerMessage}
                  </p>
                )}

                <button type="submit" className={`sm:col-span-2 mt-2 w-full py-3.5 px-6 rounded-xl font-bold bg-[#7e4fd3] text-white hover:bg-[#6c40bb] shadow-lg shadow-purple-500/25 transition-all ${registerLoading ? 'opacity-70 cursor-wait' : ''}`} disabled={registerLoading || !canSubmitRegister}>
                  {registerLoading ? 'Generando Pase...' : 'Generar mi Wallet Pass'}
                </button>
              </form>
            )}
          </article>

          {/* Tarjeta de Negocios */}
          <article className="rounded-[2.5rem] border border-white/10 bg-[#1e1333] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
             
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Building2 className="w-48 h-48 rotate-12" />
            </div>

            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#ff5e91]">
                <Building2 className="h-4 w-4" />
                Negocios
              </p>
              <h2 className="mt-4 text-2xl font-black text-white">¿Eres dueño o equipo?</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#a593c2]">
                Ingresa al punto de venta o panel administrativo para escanear pases y ver métricas.
              </p>
            </div>

            <div className="mt-8 relative z-10">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 mb-6">
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-amber-200">
                  <ShieldCheck className="h-4 w-4" />
                  Conexión segura (Staff / Admin).
                </p>
              </div>
              <a href="/admin" className="block w-full text-center py-3.5 px-6 rounded-xl font-bold bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-all">
                Ir a mi Operación
              </a>
            </div>
          </article>
        </div>
      </main>
      <SiteFooter navItems={NAV_ITEMS} />
    </PageShell>
  );
}
