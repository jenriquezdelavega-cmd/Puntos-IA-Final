'use client';

import { useEffect, useState } from 'react';
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

export default function IngresarPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [defaultTab, setDefaultTab] = useState<'cliente' | 'negocio'>('negocio');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tipo = new URLSearchParams(window.location.search).get('tipo');
    if (tipo === 'cliente') setDefaultTab('cliente');
  }, []);

  const onCustomerLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password: password.trim() || undefined }),
      });

      const payload = (await response.json()) as { ok?: boolean; data?: UserLoginResponse; error?: { message?: string } };

      if (!response.ok || !payload?.data) {
        setMessage(payload?.error?.message || 'No se pudo iniciar sesión. Verifica tus datos.');
        return;
      }

      localStorage.setItem('punto_user', JSON.stringify(payload.data));
      const preferredBusiness = payload.data.memberships?.[0]?.tenantId;
      const destination = preferredBusiness ? `/pass?business_id=${encodeURIComponent(preferredBusiness)}` : '/pass';
      window.location.assign(destination);
    } catch {
      setMessage('No se pudo conectar con el servidor. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffaf8] text-[#231644]">
      <MarketingBackground />
      <MarketingHeader badge="Acceso claro" />

      <Section
        eyebrow="Ingresar"
        title="Elige cómo quieres entrar"
        description="Acceso separado por intención: negocio o cliente final."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <article className={`rounded-3xl border bg-white p-6 ${defaultTab === 'negocio' ? 'border-[#d7c4f2]' : 'border-[#ebdef8]'}`}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a74b3]">Negocios</p>
            <h2 className="mt-3 text-2xl font-black">Entrar al panel de negocio</h2>
            <p className="mt-3 text-sm text-[#5f4e84]">Para administradores y equipos operativos que gestionan campañas, canjes y reportes.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/admin" className={buttonStyles('primary')}>Entrar como negocio</a>
            </div>
          </article>

          <article className={`rounded-3xl border bg-white p-6 ${defaultTab === 'cliente' ? 'border-[#d7c4f2]' : 'border-[#ebdef8]'}`}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a74b3]">Clientes</p>
            <h2 className="mt-3 text-2xl font-black">Entrar a mi cuenta</h2>
            <p className="mt-3 text-sm text-[#5f4e84]">Usa tu número de teléfono para entrar y ver tus negocios, visitas y recompensas.</p>
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
              <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="password">Contraseña (si aplica)</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm focus:border-[#7c3aed] focus:outline-none"
                placeholder="Si tu cuenta tiene contraseña, escríbela"
              />
              <button type="submit" className={buttonStyles('secondary')} disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar a mi cuenta'}
              </button>
              {message ? <p className="text-sm font-semibold text-[#b4234f]">{message}</p> : null}
            </form>
          </article>
        </div>
      </Section>

      <MarketingFooter />
    </main>
  );
}
