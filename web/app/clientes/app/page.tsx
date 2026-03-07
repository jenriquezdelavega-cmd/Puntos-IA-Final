'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Award, Building2, Medal, ScanLine, Target, Trophy, UserRound } from 'lucide-react';
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
  rewardPeriod?: string;
  logoData?: string;
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
  unlockedAt?: string;
  requestedAt?: string | null;
  redeemedAt?: string | null;
  redemption?: {
    code: string;
    isUsed: boolean;
    createdAt: string;
  } | null;
  reward: {
    id?: string;
    title: string;
    rewardType?: string;
    rewardValue: string;
    expiresAt?: string | null;
    business: { id: string; name: string };
  };
};

type ChallengeItem = {
  id: string;
  title: string;
  description: string;
  challengeType: 'VISIT_COUNT' | 'DISTINCT_BUSINESSES';
  targetValue: number;
  timeWindow: number;
  progressValue: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string | null;
  reward: {
    id: string;
    title: string;
    rewardType: string;
    rewardValue: string;
    businessName: string;
  } | null;
};

type ClientTab = 'puntos' | 'retos' | 'negocios' | 'perfil';

const tabItems: Array<{ key: ClientTab; label: string; icon: LucideIcon }> = [
  { key: 'puntos', label: 'Puntos', icon: Medal },
  { key: 'retos', label: 'Retos', icon: Target },
  { key: 'negocios', label: 'Negocios', icon: Building2 },
  { key: 'perfil', label: 'Perfil', icon: UserRound },
];

function isUnauthorizedResponse(response: Response, body: { code?: string }) {
  if (response.status === 401) return true;
  return body?.code === 'UNAUTHORIZED';
}

function formatDateLabel(value: string | Date | null | undefined) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function challengeTypeLabel(challengeType: ChallengeItem['challengeType']) {
  return challengeType === 'DISTINCT_BUSINESSES' ? 'Negocios distintos' : 'Visitas acumuladas';
}

function challengeStatusStyles(status: ChallengeItem['status']) {
  if (status === 'COMPLETED') {
    return 'border-[#c8f3d8] bg-[#ecfff2] text-[#11643a]';
  }
  return 'border-[#e8d6fb] bg-[#f9f1ff] text-[#5f3f8f]';
}

function rewardStatusStyles(status: CoalitionReward['status']) {
  if (status === 'REDEEMED') {
    return 'border-[#d9e2ff] bg-[#eff3ff] text-[#2a4a96]';
  }
  if (status === 'REQUESTED') {
    return 'border-[#f7dccb] bg-[#fff3ec] text-[#a34f27]';
  }
  return 'border-[#c8f3d8] bg-[#ecfff2] text-[#11643a]';
}

export default function ClientesAppPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [tab, setTab] = useState<ClientTab>('puntos');
  const [statusMessage, setStatusMessage] = useState('');

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [rewards, setRewards] = useState<CoalitionReward[]>([]);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [tenants, setTenants] = useState<TenantMapItem[]>([]);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [profileBirthDate, setProfileBirthDate] = useState('');

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(false);

  const [redeemCode, setRedeemCode] = useState<{ code: string; business: string } | null>(null);

  const activeMemberships = useMemo(() => user?.memberships || [], [user?.memberships]);
  const pointsTotal = useMemo(
    () => activeMemberships.reduce((sum, membership) => sum + Number(membership.points || 0), 0),
    [activeMemberships],
  );
  const redeemReadyCount = useMemo(
    () =>
      activeMemberships.filter((membership) => {
        const required = Math.max(1, Number(membership.requiredVisits || 10));
        const current = Number(membership.visits || 0);
        return current >= required;
      }).length,
    [activeMemberships],
  );
  const completedChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.status === 'COMPLETED').length,
    [challenges],
  );

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

    const loadChallenges = async () => {
      setLoadingChallenges(true);
      try {
        const response = await fetch('/api/user/challenges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            sessionToken: user.sessionToken,
          }),
        });
        const body = (await response.json()) as { challenges?: ChallengeItem[]; message?: string; error?: string; code?: string };
        if (!response.ok) {
          if (isUnauthorizedResponse(response, body)) handleSessionExpired();
          return;
        }
        setChallenges(body.challenges || []);
      } finally {
        setLoadingChallenges(false);
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
    void loadChallenges();
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
      setUser((prev) => {
        if (!prev) return prev;
        const updated: StoredUser = {
          ...prev,
          name: profileName,
          phone: profilePhone,
          email: profileEmail,
          gender: profileGender,
          birthDate: profileBirthDate || null,
        };
        localStorage.setItem('punto_user', JSON.stringify(updated));
        return updated;
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const logout = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('punto_user');
    window.location.assign('/ingresar?tipo=cliente&modo=login');
  };

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#fffdf9] text-[#1d1238]">
        <MarketingBackground />
        <MarketingHeader badge="Área de cliente" />
        <Section title="Cargando tu sesión..." description="Estamos validando tu acceso de cliente.">
          <div className="rounded-2xl border border-[#ead8fb] bg-white p-4 text-sm text-[#5c4a82]">
            Validando credenciales...
          </div>
        </Section>
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
        description="Aquí gestionas puntos, retos, negocios y tu perfil."
      >
        <article className="rounded-3xl border border-[#ead8fb] bg-[linear-gradient(120deg,#ffffff_0%,#fff5ef_50%,#f7efff_100%)] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7f61ad]">Resumen de cuenta</p>
              <h3 className="mt-2 text-2xl font-black text-[#241646]">Tu progreso en Punto IA</h3>
            </div>
            <Link href={`/pass?customer_id=${encodeURIComponent(user.id)}`} className={buttonStyles('secondary')}>
              <span className="inline-flex items-center gap-2"><ScanLine className="h-4 w-4" /> Abrir mi pase</span>
            </Link>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#ead8fb] bg-white p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7f61ad]">Puntos totales</p>
              <p className="mt-1 text-2xl font-black text-[#2a184f]">{pointsTotal}</p>
            </div>
            <div className="rounded-2xl border border-[#ead8fb] bg-white p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7f61ad]">Negocios activos</p>
              <p className="mt-1 text-2xl font-black text-[#2a184f]">{activeMemberships.length}</p>
            </div>
            <div className="rounded-2xl border border-[#ead8fb] bg-white p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7f61ad]">Canjeables hoy</p>
              <p className="mt-1 text-2xl font-black text-[#2a184f]">{redeemReadyCount}</p>
            </div>
            <div className="rounded-2xl border border-[#ead8fb] bg-white p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7f61ad]">Retos completados</p>
              <p className="mt-1 text-2xl font-black text-[#2a184f]">{completedChallenges}</p>
            </div>
          </div>
        </article>

        <div className="mt-4 rounded-3xl border border-[#e9daf9] bg-white p-4 md:p-5">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {tabItems.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${isActive ? 'bg-[#2a184f] text-white' : 'bg-[#f8f2ff] text-[#4a3577]'}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                </button>
              );
            })}
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
                const requiredVisits = Math.max(1, Number(membership.requiredVisits || 10));
                const currentVisits = Number(membership.visits || 0);
                const currentPoints = Number(membership.points || 0);
                const progress = Math.min(100, Math.round((currentVisits / requiredVisits) * 100));
                const canRedeem = currentVisits >= requiredVisits;
                return (
                  <article key={membership.tenantId} className="rounded-3xl border border-[#e9daf9] bg-white p-6 shadow-[0_12px_28px_rgba(53,30,95,0.08)]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-2xl font-black text-[#231644]">{membership.name || 'Negocio aliado'}</h3>
                        <p className="mt-1 text-sm text-[#5c4a82]">{membership.prize || 'Premio disponible'}</p>
                      </div>
                      <div className="rounded-2xl border border-[#eddffb] bg-[#fcf8ff] px-3 py-2 text-right text-sm font-semibold text-[#4e3a78]">
                        <p className="text-base font-black text-[#2a184f]">{currentPoints} pts</p>
                        <span className="mt-1 block text-xs text-[#7b63a8]">{currentVisits}/{requiredVisits} visitas</span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-[#efe1fd] bg-[#fbf5ff] p-3">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#5f4a89]">
                        <span>Meta para canjear</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#f0e4ff]">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-[#ff7a59] to-[#8b5cf6]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {!canRedeem ? (
                        <p className="mt-2 text-xs font-semibold text-[#7b63a8]">
                          Te faltan {requiredVisits - currentVisits} visita(s) para canjear.
                        </p>
                      ) : (
                        <p className="mt-2 text-xs font-semibold text-[#2c7a4f]">Tu recompensa ya está lista para canje.</p>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`/pass?customer_id=${encodeURIComponent(user.id)}&business_id=${encodeURIComponent(membership.tenantId)}`}
                        className={buttonStyles('secondary')}
                      >
                        <span className="inline-flex items-center gap-2"><ScanLine className="h-4 w-4" /> Ver pase</span>
                      </Link>
                      <div
                        className={`inline-flex items-center justify-center rounded-xl ${canRedeem ? '' : 'cursor-not-allowed opacity-60'}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleRedeem(membership)}
                          disabled={!canRedeem}
                          className={`${buttonStyles('primary')} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          Canjear recompensa
                        </button>
                      </div>
                      {membership.instagram ? (
                        <a
                          href={membership.instagram.startsWith('http') ? membership.instagram : `https://instagram.com/${membership.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={buttonStyles('tertiary')}
                        >
                          Instagram
                        </a>
                      ) : null}
                    </div>
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
                      <span className="inline-flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-[#7a4ac8]" />
                        <span className="font-semibold">{item.tenant}</span>
                      </span>
                      <p className="mt-1 text-xs text-[#5b467f]">{item.prize} · {item.date} {item.time}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        ) : null}

        {tab === 'retos' ? (
          <div className="mt-6 grid gap-4">
            <article className="rounded-3xl border border-[#e9daf9] bg-white p-6">
              <h3 className="text-xl font-black">Retos activos</h3>
              <p className="mt-1 text-sm text-[#5c4a82]">
                Completa metas de visitas y negocios para desbloquear recompensas de red.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#ead8fb] bg-[#fcf9ff] p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7f61ad]">Total retos</p>
                  <p className="mt-1 text-2xl font-black text-[#2a184f]">{challenges.length}</p>
                </div>
                <div className="rounded-2xl border border-[#ead8fb] bg-[#fcf9ff] p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7f61ad]">En progreso</p>
                  <p className="mt-1 text-2xl font-black text-[#2a184f]">{Math.max(challenges.length - completedChallenges, 0)}</p>
                </div>
                <div className="rounded-2xl border border-[#ead8fb] bg-[#fcf9ff] p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7f61ad]">Completados</p>
                  <p className="mt-1 text-2xl font-black text-[#2a184f]">{completedChallenges}</p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e9daf9] bg-white p-6">
              {loadingChallenges ? (
                <p className="text-sm text-[#5c4a82]">Cargando retos...</p>
              ) : challenges.length === 0 ? (
                <>
                  <h3 className="text-xl font-black">No hay retos activos por ahora</h3>
                  <p className="mt-2 text-sm text-[#5c4a82]">Cuando haya nuevos retos aparecerán aquí con su progreso.</p>
                </>
              ) : (
                <div className="space-y-3">
                  {challenges.map((challenge) => {
                    const target = Math.max(1, Number(challenge.targetValue || 1));
                    const progressValue = Math.max(0, Number(challenge.progressValue || 0));
                    const progress = Math.min(100, Math.round((progressValue / target) * 100));
                    const isCompleted = challenge.status === 'COMPLETED';
                    const pending = Math.max(target - progressValue, 0);

                    return (
                      <article key={challenge.id} className="rounded-2xl border border-[#efe1fd] bg-[#fffdfd] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-lg font-black text-[#241646]">{challenge.title}</h4>
                            <p className="mt-1 text-sm text-[#5f4a89]">{challenge.description}</p>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] ${challengeStatusStyles(challenge.status)}`}>
                            {isCompleted ? 'Completado' : 'En progreso'}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[#674f95]">
                          <span className="rounded-full border border-[#ead8fb] bg-[#faf4ff] px-2.5 py-1">{challengeTypeLabel(challenge.challengeType)}</span>
                          <span className="rounded-full border border-[#ead8fb] bg-[#faf4ff] px-2.5 py-1">Meta: {target}</span>
                          <span className="rounded-full border border-[#ead8fb] bg-[#faf4ff] px-2.5 py-1">Ventana: {challenge.timeWindow} días</span>
                        </div>

                        <div className="mt-4 rounded-xl border border-[#efe1fd] bg-[#fcf8ff] p-3">
                          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#5f4a89]">
                            <span>Progreso</span>
                            <span>{progressValue}/{target}</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#f0e4ff]">
                            <div className="h-2 rounded-full bg-gradient-to-r from-[#ff7a59] to-[#8b5cf6]" style={{ width: `${progress}%` }} />
                          </div>
                          <p className="mt-2 text-xs font-semibold text-[#6d55a0]">
                            {isCompleted ? 'Reto completado.' : `Te faltan ${pending} para completar este reto.`}
                          </p>
                        </div>

                        {challenge.reward ? (
                          <div className="mt-3 rounded-xl border border-[#f7dccb] bg-[#fff8f3] p-3 text-sm text-[#5a3d2f]">
                            <p className="inline-flex items-center gap-2 font-black">
                              <Award className="h-4 w-4" />
                              Recompensa: {challenge.reward.title}
                            </p>
                            <p className="mt-1 text-xs font-semibold">
                              {challenge.reward.rewardValue} · {challenge.reward.businessName}
                            </p>
                          </div>
                        ) : null}

                        {isCompleted && challenge.completedAt ? (
                          <p className="mt-3 text-xs font-semibold text-[#4b7b5d]">
                            Completado el {formatDateLabel(challenge.completedAt)}.
                          </p>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </article>
          </div>
        ) : null}

        {tab === 'negocios' ? (
          <div className="mt-6 grid gap-4">
            <article className="rounded-3xl border border-[#e9daf9] bg-white p-6">
              <h3 className="text-xl font-black">Mis negocios activos</h3>
              {activeMemberships.length === 0 ? (
                <p className="mt-3 text-sm text-[#5c4a82]">No tienes negocios activos todavía. Activa tu pase para comenzar.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {activeMemberships.map((membership) => {
                    const requiredVisits = Math.max(1, Number(membership.requiredVisits || 10));
                    const currentVisits = Number(membership.visits || 0);
                    return (
                      <li key={membership.tenantId} className="rounded-2xl border border-[#efe1fd] bg-[#fffdfd] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-black text-[#2a184f]">{membership.name || 'Negocio aliado'}</p>
                            <p className="text-xs font-semibold text-[#6e57a0]">
                              {currentVisits}/{requiredVisits} visitas · {membership.points || 0} pts
                            </p>
                          </div>
                          <Link
                            href={`/pass?customer_id=${encodeURIComponent(user.id)}&business_id=${encodeURIComponent(membership.tenantId)}`}
                            className={buttonStyles('tertiary')}
                          >
                            Ver pase
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>

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
              <h3 className="text-xl font-black">Beneficios de red desbloqueados</h3>
              {loadingRewards ? (
                <p className="mt-3 text-sm text-[#5c4a82]">Cargando beneficios...</p>
              ) : rewards.length === 0 ? (
                <p className="mt-3 text-sm text-[#5c4a82]">Todavía no tienes beneficios de red desbloqueados.</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm text-[#4f3d76]">
                  {rewards.slice(0, 10).map((reward) => (
                    <li key={reward.id} className="rounded-xl border border-[#f0e5fc] bg-[#fffdf9] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[#2a184f]">
                          {reward.reward.title} · {reward.reward.rewardValue}
                        </p>
                        <span className={`rounded-full border px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] ${rewardStatusStyles(reward.status)}`}>
                          {reward.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#5c4a82]">{reward.reward.business.name}</p>
                      {reward.redemption?.code ? (
                        <p className="mt-1 text-xs font-semibold text-[#4b3b71]">Código: {reward.redemption.code}</p>
                      ) : null}
                      {reward.unlockedAt ? (
                        <p className="mt-1 text-[11px] text-[#7e69a9]">Desbloqueado: {formatDateLabel(reward.unlockedAt)}</p>
                      ) : null}
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
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={saveProfile} disabled={savingProfile} className={buttonStyles('primary')}>
                {savingProfile ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={logout} className={buttonStyles('secondary')}>
                Cerrar sesión
              </button>
            </div>
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
