'use client';

import { useEffect, useState } from 'react';
import { Building2, CircleUserRound, ShieldCheck } from 'lucide-react';
import {
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  Section,
  buttonStyles,
} from '../components/marketing/ui';

type UserLoginResponse = {
  id: string;
  phone: string;
  name?: string;
  memberships?: Array<{ tenantId: string; name?: string }>;
  sessionToken?: string;
};

type ApiErrorResponse = {
  ok?: false;
  message?: string;
  error?: string;
  emailStatus?: 'sent' | 'not_configured' | 'failed';
};

type CustomerMode = 'login' | 'registro';

export default function IngresarPage() {
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const modo = params.get('modo');

    if (modo === 'registro') setCustomerMode('registro');
    if (modo === 'login') setCustomerMode('login');
  }, []);

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
      window.location.assign(destination);
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

    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName.trim(),
          phone: registerPhone.trim(),
          password: registerPassword,
          email: registerEmail.trim(),
          gender: registerGender,
          birthDate: registerBirthDate,
        }),
      });

      const body = (await response.json()) as ApiErrorResponse;
      if (!response.ok) {
        setRegisterMessage(body?.message || body?.error || 'No se pudo crear la cuenta. Revisa tus datos.');
        return;
      }

      const autoLoginOk = await loginCustomer(
        { phone: registerPhone.trim(), password: registerPassword },
        false,
      );

      if (!autoLoginOk) {
        setPhone(registerPhone.trim());
        setPassword(registerPassword);
        setCustomerMode('login');
        setModeInUrl('login');
        if (body?.emailStatus === 'not_configured') {
          setRegisterMessage('Cuenta creada. El correo de confirmación no se envió porque el servicio de email no está configurado.');
        } else if (body?.emailStatus === 'failed') {
          setRegisterMessage('Cuenta creada. El correo de confirmación falló. Intenta más tarde o contacta soporte.');
        } else {
          setRegisterMessage('Cuenta creada y correo de confirmación enviado. Ahora inicia sesión para continuar.');
        }
      }
    } catch {
      setRegisterMessage('No se pudo crear la cuenta en este momento. Intenta nuevamente.');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffaf8] text-[#231644]">
      <MarketingBackground />
      <MarketingHeader badge="Acceso a Punto IA" />

      <Section
        eyebrow="Acceso principal"
        title="Entrar a Punto IA"
        description="Inicia sesión o crea tu cuenta de cliente en pocos pasos, con un flujo claro y directo."
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr),320px]">
          <article className="rounded-3xl border border-[#e5d4f7] bg-white p-6 shadow-[0_14px_30px_rgba(95,58,152,0.12)] md:p-7">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#8a74b3]">
              <CircleUserRound className="h-4 w-4" />
              Clientes
            </p>
            <h2 className="mt-3 text-2xl font-black text-[#28184f] md:text-3xl">
              {customerMode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
            </h2>
            <p className="mt-2 text-sm text-[#5f4e84]">
              {customerMode === 'login'
                ? 'Accede con tu teléfono y contraseña.'
                : 'Completa tus datos para activar tu cuenta desde hoy.'}
            </p>

            <div className="mt-5 grid grid-cols-2 rounded-xl border border-[#e7d7f8] bg-[#faf5ff] p-1">
              <button
                type="button"
                onClick={() => {
                  setCustomerMode('login');
                  setModeInUrl('login');
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  customerMode === 'login'
                    ? 'bg-white text-[#2f1f57] shadow-sm'
                    : 'text-[#654f8c] hover:text-[#3c2a62]'
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
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  customerMode === 'registro'
                    ? 'bg-white text-[#2f1f57] shadow-sm'
                    : 'text-[#654f8c] hover:text-[#3c2a62]'
                }`}
              >
                Crear cuenta
              </button>
            </div>

            {customerMode === 'login' ? (
              <form className="mt-5 grid gap-4" onSubmit={onCustomerLogin}>
                <div className="grid gap-1.5">
                  <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="phone">Teléfono</label>
                  <input
                    id="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm focus:border-[#7c3aed] focus:outline-none"
                    placeholder="Ejemplo: 5512345678"
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="password">Contraseña</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm focus:border-[#7c3aed] focus:outline-none"
                    placeholder="Tu contraseña"
                    required
                  />
                </div>
                <button type="submit" className={buttonStyles('primary')} disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar a mi cuenta'}
                </button>
                <a href="/recuperar" className="mt-1 inline-flex text-xs font-semibold text-[#6a51a0] hover:text-[#3c2a62]">Recuperar contraseña</a>
                {loginMessage ? (
                  <p className="rounded-lg border border-[#f6d3dd] bg-[#fff4f8] px-3 py-2 text-sm font-semibold text-[#b4234f]">
                    {loginMessage}
                  </p>
                ) : null}
              </form>
            ) : (
              <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={onCustomerRegister}>
                <div className="grid gap-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="register-name">Nombre completo</label>
                  <input
                    id="register-name"
                    value={registerName}
                    onChange={(event) => setRegisterName(event.target.value)}
                    className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm focus:border-[#7c3aed] focus:outline-none"
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="register-phone">Teléfono</label>
                  <input
                    id="register-phone"
                    value={registerPhone}
                    onChange={(event) => setRegisterPhone(event.target.value)}
                    className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm focus:border-[#7c3aed] focus:outline-none"
                    placeholder="Ejemplo: 5512345678"
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="register-email">Email</label>
                  <input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value)}
                    className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm focus:border-[#7c3aed] focus:outline-none"
                    placeholder="nombre@correo.com"
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="register-gender">Género</label>
                  <select
                    id="register-gender"
                    value={registerGender}
                    onChange={(event) => setRegisterGender(event.target.value)}
                    className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm focus:border-[#7c3aed] focus:outline-none"
                    required
                  >
                    <option value="">Selecciona</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="register-birth-date">Fecha de nacimiento</label>
                  <input
                    id="register-birth-date"
                    type="date"
                    value={registerBirthDate}
                    onChange={(event) => setRegisterBirthDate(event.target.value)}
                    className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm focus:border-[#7c3aed] focus:outline-none"
                    required
                  />
                </div>
                <div className="grid gap-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="register-password">Contraseña</label>
                  <input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm focus:border-[#7c3aed] focus:outline-none"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                </div>
                <button type="submit" className={`md:col-span-2 ${buttonStyles('primary')}`} disabled={registerLoading}>
                  {registerLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
                {registerMessage ? (
                  <p className="md:col-span-2 rounded-lg border border-[#e7d6fa] bg-[#faf5ff] px-3 py-2 text-sm font-semibold text-[#4e3b74]">
                    {registerMessage}
                  </p>
                ) : null}
              </form>
            )}
          </article>

          <article className="rounded-3xl border border-[#ebdef8] bg-white p-6">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#8a74b3]">
              <Building2 className="h-4 w-4" />
              Negocios
            </p>
            <h2 className="mt-3 text-xl font-black text-[#28184f]">Acceso para negocio</h2>
            <p className="mt-3 text-sm text-[#5f4e84]">
              Gestiona check-ins, canjes y reportes desde tu panel administrativo.
            </p>
            <div className="mt-4 rounded-2xl border border-[#ebdef8] bg-[#fcf8ff] p-4">
              <p className="inline-flex items-center gap-2 text-xs font-semibold text-[#5e4989]">
                <ShieldCheck className="h-4 w-4" />
                Sesión protegida para equipo operativo.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="/admin" className={buttonStyles('secondary')}>Entrar como negocio</a>
            </div>
          </article>
        </div>
      </Section>

      <MarketingFooter />
    </main>
  );
}
