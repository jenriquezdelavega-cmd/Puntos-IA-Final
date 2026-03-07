'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { Landmark, Medal, ScanLine, UserRound } from 'lucide-react';
import {
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  Section,
  buttonStyles,
} from '../../components/marketing/ui';

const BusinessMap = dynamic(() => import('../../components/BusinessMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-3xl border border-[#ead8fb] bg-white" />
  ),
});

type Membership = {
  tenantId: string;
  name?: string;
  prize?: string;
  instagram?: string;
  requiredVisits?: number;
  visits?: number;
  points?: number;
};

type StoredUser = {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  gender?: string;
  birthDate?: string | null;
  memberships?: Membership[];
  sessionToken?: string;
};

type TenantMapItem = {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  prize?: string;
  instagram?: string | null;
};

type HistoryItem = {
  id: string;
  tenant: string;
  prize: string;
  date: string;
  time: string;
};

type CoalitionReward = {
  id: string;
  status: 'UNLOCKED' | 'REQUESTED' | 'REDEEMED';
  reward: {
    title: string;
    rewardValue: string;
    business: { id: string; name: string };
  };
};

type ClientTab = 'puntos' | 'aliados' | 'perfil';

function isUnauthorizedResponse(response: Response, body: { code?: string }) {
  if (response.status === 401) return true;
  return body?.code === 'UNAUTHORIZED';
}

export default function ClientesAppPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [tab, setTab] = useState<ClientTab>('puntos');
  const [statusMessage, setStatusMessage] = useState('');

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [rewards, setRewards] = useState<CoalitionReward[]>([]);
  const [tenants, setTenants] = useState<TenantMapItem[]>([]);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [profileBirthDate, setProfileBirthDate] = useState('');

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(false);

  const [redeemCode, setRedeemCode] = useState<{ code: string; business: string } | null>(null);

  const activeMemberships = useMemo(() => user?.memberships || [], [user?.memberships]);

  const handleSessionExpired = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('punto_user');
      window.location.assign('/ingresar?tipo=cliente&modo=login');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('punto_user');
    if (!raw) {
      window.location.assign('/ingresar?tipo=cliente&modo=login');
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredUser;
      if (!parsed?.id || !parsed?.sessionToken) {
        window.location.assign('/ingresar?tipo=cliente&modo=login');
        return;
      }

      setUser(parsed);
      setProfileName(parsed.name || '');
      setProfilePhone(parsed.phone || '');
      setProfileEmail(parsed.email || '');
      setProfileGender(parsed.gender || '');
      setProfileBirthDate(parsed.birthDate ? String(parsed.birthDate).slice(0, 10) : '');
    } catch {
      window.location.assign('/ingresar?tipo=cliente&modo=login');
    }
  }, []);

  useEffect(() => {
    if (!user?.id || !user?.sessionToken) return;

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await fetch('/api/user/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            sessionToken: user.sessionToken,
          }),
        });
        const body = (await response.json()) as { history?: HistoryItem[]; message?: string; error?: string; code?: string };
        if (!response.ok) {
          if (isUnauthorizedResponse(response, body)) handleSessionExpired();
          return;
        }
        setHistory(body.history || []);
      } finally {
        setLoadingHistory(false);
      }
    };

    const loadRewards = async () => {
      setLoadingRewards(true);
      try {
        const response = await fetch('/api/user/coalition-rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            sessionToken: user.sessionToken,
          }),
        });
        const body = (await response.json()) as { rewards?: CoalitionReward[]; message?: string; error?: string; code?: string };
        if (!response.ok) {
          if (isUnauthorizedResponse(response, body)) handleSessionExpired();
          return;
        }
        setRewards(body.rewards || []);
      } finally {
        setLoadingRewards(false);
      }
    };

    const loadTenants = async () => {
      setLoadingTenants(true);
      try {
        const response = await fetch('/api/map/tenants');
        const body = (await response.json()) as { tenants?: TenantMapItem[] };
        setTenants(body.tenants || []);
      } finally {
        setLoadingTenants(false);
      }
    };

    void loadHistory();
    void loadRewards();
    void loadTenants();
  }, [user?.id, user?.sessionToken]);

  const handleRedeem = async (membership: Membership) => {
    if (!user?.id || !user?.sessionToken) return;
    setStatusMessage('');
    setRedeemCode(null);

    const response = await fetch('/api/redeem/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        tenantId: membership.tenantId,
        sessionToken: user.sessionToken,
      }),
    });

    const body = (await response.json()) as { code?: string; message?: string; error?: string };
    if (!response.ok) {
      const message = body?.message || body?.error || 'No se pudo generar canje';
      if (isUnauthorizedResponse(response, body)) {
        handleSessionExpired();
        return;
      }
      setStatusMessage(message);
      return;
    }

    setRedeemCode({ code: body.code || '----', business: membership.name || 'Negocio' });
    setStatusMessage(`Código de canje generado para ${membership.name || 'el negocio'}.`);
    setUser((prev) => {
      if (!prev) return prev;
      const updatedMemberships = (prev.memberships || []).map((item) =>
        item.tenantId === membership.tenantId
          ? { ...item, visits: 0, points: 0 }
          : item,
      );
      const updated = { ...prev, memberships: updatedMemberships };
      localStorage.setItem('punto_user', JSON.stringify(updated));
      return updated;
    });
  };

  const saveProfile = async () => {
    if (!user?.id || !user?.sessionToken) return;
    setSavingProfile(true);
    setStatusMessage('');
    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          sessionToken: user.sessionToken,
          name: profileName,
          phone: profilePhone,
          email: profileEmail,
          gender: profileGender,
          birthDate: profileBirthDate || undefined,
        }),
      });

      const body = (await response.json()) as { message?: string; error?: string; code?: string };
      if (!response.ok) {
        const message = body?.message || body?.error || 'No se pudo actualizar perfil';
        if (isUnauthorizedResponse(response, body)) {
          handleSessionExpired();
          return;
        }
        setStatusMessage(message);
        return;
      }

      setStatusMessage('Perfil actualizado correctamente.');
      const updated = {
        ...(user || {}),
        name: profileName,
        phone: profilePhone,
        email: profileEmail,
        gender: profileGender,
        birthDate: profileBirthDate || null,
      };
      localStorage.setItem('punto_user', JSON.stringify(updated));
      setUser(updated);
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#fffdf9] text-[#1d1238]">
        <MarketingBackground />
        <MarketingHeader badge="Área de cliente" />
        <Section title="Cargando tu sesión..." description="Estamos validando tu acceso de cliente." />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffdf9] text-[#1d1238]">
      <MarketingBackground />
      <MarketingHeader badge="Área de cliente" primaryCta={{ href: '/pass?customer_id=' + encodeURIComponent(user.id), label: 'Abrir mi pase' }} />

      <Section
        eyebrow="Mi cuenta"
        title={`Hola${user.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        description="Aquí gestionas tus puntos, negocios aliados y perfil."
      >
        <div className="rounded-3xl border border-[#e9daf9] bg-white p-4 md:p-5">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTab('puntos')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === 'puntos' ? 'bg-[#2a184f] text-white' : 'bg-[#f8f2ff] text-[#4a3577]'}`}
            >
              <span className="inline-flex items-center gap-1"><Medal className="h-4 w-4" /> Puntos</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('aliados')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === 'aliados' ? 'bg-[#2a184f] text-white' : 'bg-[#f8f2ff] text-[#4a3577]'}`}
            >
              <span className="inline-flex items-center gap-1"><Landmark className="h-4 w-4" /> Aliados</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('perfil')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === 'perfil' ? 'bg-[#2a184f] text-white' : 'bg-[#f8f2ff] text-[#4a3577]'}`}
            >
              <span className="inline-flex items-center gap-1"><UserRound className="h-4 w-4" /> Perfil</span>
            </button>
          </div>
        </div>

        {tab === 'puntos' ? (
          <div className="mt-6 grid gap-4">
            {activeMemberships.length === 0 ? (
              <article className="rounded-3xl border border-[#e9daf9] bg-white p-6">
                <h3 className="text-xl font-black">Aún no tienes membresías activas.</h3>
                <p className="mt-2 text-sm text-[#5c4a82]">Activa tu pase desde el QR del negocio para comenzar a sumar puntos.</p>
                <a href="/activar-pase" className={`mt-4 ${buttonStyles('primary')}`}>Activar pase</a>
              </article>
            ) : (
              activeMemberships.map((membership) => {
                const requiredVisits = membership.requiredVisits || 10;
                const currentVisits = membership.visits || 0;
                const canRedeem = currentVisits >= requiredVisits;
                return (
                  <article key={membership.tenantId} className="rounded-3xl border border-[#e9daf9] bg-white p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-black text-[#231644]">{membership.name || 'Negocio aliado'}</h3>
                        <p className="mt-1 text-sm text-[#5c4a82]">{membership.prize || 'Premio disponible'}</p>
                      </div>
                      <p className="text-right text-sm font-semibold text-[#4e3a78]">
                        {membership.points || 0} pts
                        <span className="mt-1 block text-xs text-[#7b63a8]">{currentVisits}/{requiredVisits} visitas</span>
                      </p>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-[#f4ebff]">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#ff7a59] to-[#8b5cf6]"
                        style={{ width: `${Math.min(100, (currentVisits / requiredVisits) * 100)}%` }}
                      />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <a href={`/pass?customer_id=${encodeURIComponent(user.id)}&business_id=${encodeURIComponent(membership.tenantId)}`} className={buttonStyles('secondary')}>
                        <span className="inline-flex items-center gap-2"><ScanLine className="h-4 w-4" /> Ver pase</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRedeem(membership)}
                        disabled={!canRedeem}
                        className={buttonStyles('primary')}
                      >
                        Canjear recompensa
                      </button>
                    </div>
                    {!canRedeem ? (
                      <p className="mt-3 text-xs font-semibold text-[#7b63a8]">
                        Te faltan {requiredVisits - currentVisits} visita(s) para canjear.
                      </p>
                    ) : null}
                  </article>
                );
              })
            )}

            <article className="rounded-3xl border border-[#e9daf9] bg-white p-6">
              <h3 className="text-xl font-black">Historial de canjes</h3>
              {loadingHistory ? (
                <p className="mt-3 text-sm text-[#5c4a82]">Cargando historial...</p>
              ) : history.length === 0 ? (
                <p className="mt-3 text-sm text-[#5c4a82]">Aún no tienes canjes registrados.</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm text-[#4f3d76]">
                  {history.slice(0, 10).map((item) => (
                    <li key={item.id} className="rounded-xl border border-[#f0e5fc] bg-[#fffdf9] p-3">
                      <span className="font-semibold">{item.tenant}</span> · {item.prize} · {item.date} {item.time}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        ) : null}

        {tab === 'aliados' ? (
          <div className="mt-6 grid gap-4">
            <article className="rounded-3xl border border-[#e9daf9] bg-white p-4 md:p-6">
              <h3 className="mb-3 text-xl font-black">Mapa de negocios aliados</h3>
              <div className="h-[420px] overflow-hidden rounded-3xl border border-[#f0e5fc]">
                {loadingTenants ? (
                  <div className="h-full w-full animate-pulse bg-[#f7f0ff]" />
                ) : (
                  <BusinessMap tenants={tenants} focusCoords={null} radiusKm={50} />
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-[#e9daf9] bg-white p-6">
              <h3 className="text-xl font-black">Beneficios aliados desbloqueados</h3>
              {loadingRewards ? (
                <p className="mt-3 text-sm text-[#5c4a82]">Cargando beneficios...</p>
              ) : rewards.length === 0 ? (
                <p className="mt-3 text-sm text-[#5c4a82]">Todavía no tienes beneficios aliados desbloqueados.</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm text-[#4f3d76]">
                  {rewards.slice(0, 10).map((reward) => (
                    <li key={reward.id} className="rounded-xl border border-[#f0e5fc] bg-[#fffdf9] p-3">
                      <span className="font-semibold">{reward.reward.title}</span> · {reward.reward.rewardValue} · {reward.reward.business.name}
                      <span className="ml-2 text-xs font-semibold text-[#7b63a8]">({reward.status})</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        ) : null}

        {tab === 'perfil' ? (
          <article className="mt-6 rounded-3xl border border-[#e9daf9] bg-white p-6">
            <h3 className="text-2xl font-black">Mi perfil</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="grid gap-1">
                <label htmlFor="name" className="text-xs font-bold uppercase tracking-[0.14em] text-[#7e67a8]">Nombre</label>
                <input id="name" value={profileName} onChange={(event) => setProfileName(event.target.value)} className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-3 py-2 text-sm" />
              </div>
              <div className="grid gap-1">
                <label htmlFor="phone" className="text-xs font-bold uppercase tracking-[0.14em] text-[#7e67a8]">Teléfono</label>
                <input id="phone" value={profilePhone} onChange={(event) => setProfilePhone(event.target.value)} className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-3 py-2 text-sm" />
              </div>
              <div className="grid gap-1">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.14em] text-[#7e67a8]">Email</label>
                <input id="email" type="email" value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-3 py-2 text-sm" />
              </div>
              <div className="grid gap-1">
                <label htmlFor="gender" className="text-xs font-bold uppercase tracking-[0.14em] text-[#7e67a8]">Género</label>
                <select id="gender" value={profileGender} onChange={(event) => setProfileGender(event.target.value)} className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-3 py-2 text-sm">
                  <option value="">Selecciona</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="grid gap-1 md:col-span-2">
                <label htmlFor="birthDate" className="text-xs font-bold uppercase tracking-[0.14em] text-[#7e67a8]">Fecha de nacimiento</label>
                <input id="birthDate" type="date" value={profileBirthDate} onChange={(event) => setProfileBirthDate(event.target.value)} className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-3 py-2 text-sm md:max-w-xs" />
              </div>
            </div>
            <button type="button" onClick={saveProfile} disabled={savingProfile} className={`mt-5 ${buttonStyles('primary')}`}>
              {savingProfile ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </article>
        ) : null}

        {redeemCode ? (
          <article className="mt-6 rounded-3xl border border-[#f7d9cc] bg-[#fff8f4] p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c9654c]">Código de canje</p>
            <p className="mt-2 text-3xl font-black tracking-[0.1em] text-[#2a184f]">{redeemCode.code}</p>
            <p className="mt-2 text-sm text-[#5c4a82]">Muestra este código en {redeemCode.business}.</p>
          </article>
        ) : null}

        {statusMessage ? (
          <p className="mt-4 rounded-xl border border-[#ead8fb] bg-white p-3 text-sm font-semibold text-[#4f3d76]">
            {statusMessage}
          </p>
        ) : null}
      </Section>

      <MarketingFooter />
    </main>
  );
}
