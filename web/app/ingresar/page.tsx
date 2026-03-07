'use client';

import { useEffect, useState } from 'react';
import { Building2, CircleUserRound } from 'lucide-react';
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

type CustomerMode = 'login' | 'registro';

export default function IngresarPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const [defaultTab, setDefaultTab] = useState<'cliente' | 'negocio'>('negocio');
  const [customerMode, setCustomerMode] = useState<CustomerMode>('login');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get('tipo');
    const modo = params.get('modo');

    if (tipo === 'cliente') setDefaultTab('cliente');
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

      const body = (await response.json()) as { ok?: boolean; data?: UserLoginResponse; error?: { message?: string } };

      if (!response.ok || !body?.data) {
        if (showError) {
          setLoginMessage(body?.error?.message || 'No se pudo iniciar sesión. Verifica tus datos.');
        }
        return false;
      }

      localStorage.setItem('punto_user', JSON.stringify(body.data));
      const preferredBusiness = body.data.memberships?.[0]?.tenantId;
      const destination = preferredBusiness ? `/pass?business_id=${encodeURIComponent(preferredBusiness)}` : '/activar-pase?from=acceso';
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
          email: registerEmail.trim() || undefined,
        }),
      });

      const body = (await response.json()) as { ok?: boolean; error?: { message?: string } };
      if (!response.ok) {
        setRegisterMessage(body?.error?.message || 'No se pudo crear la cuenta. Revisa tus datos.');
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
        setRegisterMessage('Cuenta creada. Ahora inicia sesión para continuar.');
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
        eyebrow="Acceso"
        title="Autenticación de clientes y negocios"
        description="Una sola pantalla para acceder al panel de negocio o gestionar el acceso de clientes con login y registro real."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <article className={`rounded-3xl border bg-white p-6 ${defaultTab === 'negocio' ? 'border-[#d7c4f2]' : 'border-[#ebdef8]'}`}>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#8a74b3]">
              <Building2 className="h-4 w-4" />
              Negocios
            </p>
            <h2 className="mt-3 text-2xl font-black">Entrar al panel operativo</h2>
            <p className="mt-3 text-sm text-[#5f4e84]">
              Acceso para administradores y equipos de sucursal que operan campañas, check-ins, canjes y reportes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/admin" className={buttonStyles('primary')}>Entrar como negocio</a>
            </div>
          </article>

          <article className={`rounded-3xl border bg-white p-6 ${defaultTab === 'cliente' ? 'border-[#d7c4f2]' : 'border-[#ebdef8]'}`}>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#8a74b3]">
              <CircleUserRound className="h-4 w-4" />
              Clientes
            </p>
            <h2 className="mt-3 text-2xl font-black">Acceso de clientes</h2>
            <p className="mt-3 text-sm text-[#5f4e84]">Inicia sesión o crea tu cuenta. Ambos flujos conectan con la autenticación real de Punto IA.</p>

            <div className="mt-5 grid grid-cols-2 rounded-xl border border-[#e8daf7] bg-[#fcf8ff] p-1">
              <button
                type="button"
                onClick={() => {
                  setCustomerMode('login');
                  setModeInUrl('login');
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${customerMode === 'login' ? 'bg-white text-[#2f1f57] shadow-sm' : 'text-[#654f8c] hover:text-[#3c2a62]'}`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomerMode('registro');
                  setModeInUrl('registro');
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${customerMode === 'registro' ? 'bg-white text-[#2f1f57] shadow-sm' : 'text-[#654f8c] hover:text-[#3c2a62]'}`}
              >
                Crear cuenta
              </button>
            </div>

            {customerMode === 'login' ? (
              <form className="mt-5 grid gap-3" onSubmit={onCustomerLogin}>
                <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="phone">Teléfono</label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm focus:border-[#7c3aed] focus:outline-none"
                  placeholder="Ejemplo: +5215512345678"
                  required
                />
                <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm focus:border-[#7c3aed] focus:outline-none"
                  placeholder="Tu contraseña"
                />
                <button type="submit" className={buttonStyles('primary')} disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar a mi cuenta'}
                </button>
                <a href="/recuperar" className="mt-1 inline-flex text-xs font-semibold text-[#6a51a0] hover:text-[#3c2a62]">Recuperar contraseña</a>
                {loginMessage ? <p className="text-sm font-semibold text-[#b4234f]">{loginMessage}</p> : null}
              </form>
            ) : (
              <form className="mt-5 grid gap-3" onSubmit={onCustomerRegister}>
                <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="register-name">Nombre</label>
                <input
                  id="register-name"
                  value={registerName}
                  onChange={(event) => setRegisterName(event.target.value)}
                  className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm focus:border-[#7c3aed] focus:outline-none"
                  placeholder="Tu nombre completo"
                  required
                />
                <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="register-phone">Teléfono</label>
                <input
                  id="register-phone"
                  value={registerPhone}
                  onChange={(event) => setRegisterPhone(event.target.value)}
                  className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm focus:border-[#7c3aed] focus:outline-none"
                  placeholder="Ejemplo: +5215512345678"
                  required
                />
                <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="register-email">Email (opcional)</label>
                <input
                  id="register-email"
                  type="email"
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm focus:border-[#7c3aed] focus:outline-none"
                  placeholder="nombre@correo.com"
                />
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
                <button type="submit" className={buttonStyles('primary')} disabled={registerLoading}>
                  {registerLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
                {registerMessage ? <p className="text-sm font-semibold text-[#4e3b74]">{registerMessage}</p> : null}
              </form>
            )}
          </article>
        </div>
      </Section>

      <MarketingFooter />
    </main>
  );
}
