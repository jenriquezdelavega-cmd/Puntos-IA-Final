'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  Award,
  Building2,
  Clock3,
  Gift,
  LogOut,
  Medal,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Instagram,
  UserRound,
} from 'lucide-react';
import {
  MarketingBackground,
  MarketingFooter,
  Section,
  buttonStyles,
} from '../../components/marketing/ui';
import { BUSINESS_CATEGORIES, DEFAULT_BUSINESS_CATEGORY } from '../../lib/business-categories';
import { normalizeInstagramUrl } from '../../lib/business-map-utils';

const BusinessMap = dynamic(() => import('../../components/BusinessMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-3xl border border-[#ead8fb] bg-white" />
  ),
});

type MilestoneData = {
  id: string;
  visitTarget: number;
  reward: string;
  emoji: string;
  redeemed?: boolean;
};

type Membership = {
  tenantId: string;
  name?: string;
  prize?: string;
  instagram?: string;
  businessCategory?: string;
  requiredVisits?: number;
  rewardPeriod?: string;
  logoData?: string;
  visits?: number;
  points?: number;
  rewardCodeStatus?: 'READY_TO_GENERATE' | 'CODE_PENDING' | 'CODE_USED';
  rewardCodeLabel?: string;
  pendingRewardCode?: string | null;
  earnedCodes?: Array<{
    id: string;
    code: string;
    reward: string;
    channel: 'FINAL' | 'MILESTONE';
    status: 'PENDING' | 'USED';
    createdAt: string;
    usedAt?: string | null;
  }>;
  milestones?: MilestoneData[];
};

type StoredUser = {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  emailVerificationPending?: boolean;
  phoneOtpVerified?: boolean;
  phoneOtpVerificationEnabled?: boolean;
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
  logoData?: string | null;
  businessCategory?: string;
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

type ChallengeStats = {
  availablePoints: number;
  coalitionVisits: number;
};

function rewardValidityLabel(period?: string) {
  switch (String(period || 'OPEN')) {
    case 'MONTHLY':
      return 'vigentes durante el mes en curso';
    case 'QUARTERLY':
      return 'vigentes durante el trimestre en curso';
    case 'SEMESTER':
      return 'vigentes durante el semestre en curso';
    case 'ANNUAL':
      return 'vigentes durante el año en curso';
    default:
      return 'vigentes hasta su canje';
  }
}

type ClientTab = 'puntos' | 'retos' | 'negocios' | 'perfil';

const tabItems: Array<{ key: ClientTab; label: string; icon: LucideIcon }> = [
  { key: 'puntos', label: 'Mis puntos', icon: Medal },
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

function isoDateToDisplay(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function displayDateToIso(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function formatBirthDateInput(value: string): string {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 8);
  if (digitsOnly.length <= 2) return digitsOnly;
  if (digitsOnly.length <= 4) return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
  return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`;
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

function rewardStatusLabel(status: CoalitionReward['status']) {
  if (status === 'REDEEMED') return 'Canjeado';
  if (status === 'REQUESTED') return 'Solicitado';
  return 'Disponible';
}

function BusinessLogo({ name, logoData, size = 'md' }: { name?: string; logoData?: string; size?: 'sm' | 'md' }) {
  const dimensions = size === 'sm' ? 'h-10 w-10 rounded-xl' : 'h-14 w-14 rounded-2xl';
  const inner = size === 'sm' ? 'rounded-[0.6rem]' : 'rounded-xl';

  return (
    <span className={`inline-flex shrink-0 items-center justify-center border border-[#3b2668] bg-[linear-gradient(120deg,#2a184f_0%,#1e133b_55%,#3a2368_100%)] p-1 ${dimensions}`}>
      {logoData ? (
        <span className={`h-full w-full bg-contain bg-center bg-no-repeat ${inner}`} style={{ backgroundImage: `url(${logoData})` }} />
      ) : (
        <span
          className={`h-full w-full bg-center bg-cover bg-no-repeat ${inner}`}
          style={{ backgroundImage: 'url(/icono.png)' }}
          aria-label={`Ícono de ${name || 'negocio'}`}
          role="img"
        />
      )}
    </span>
  );
}

export default function ClientesAppPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [tab, setTab] = useState<ClientTab>('puntos');
  const [statusMessage, setStatusMessage] = useState('');

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [rewards, setRewards] = useState<CoalitionReward[]>([]);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [challengeStats, setChallengeStats] = useState<ChallengeStats>({ availablePoints: 0, coalitionVisits: 0 });
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
  const [loadingMemberships, setLoadingMemberships] = useState(false);
  const [syncingData, setSyncingData] = useState(false);
  const [selectedBusinessCategory, setSelectedBusinessCategory] = useState<string>('Todos');
  const [selectedMapTenant, setSelectedMapTenant] = useState<TenantMapItem | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [dataWarnings, setDataWarnings] = useState<{
    history?: string;
    memberships?: string;
    rewards?: string;
    challenges?: string;
    tenants?: string;
  }>({});

  const membershipSyncInFlight = useRef<Promise<void> | null>(null);

  const activeMemberships = useMemo(() => user?.memberships || [], [user?.memberships]);
  const emailContactVerified = useMemo(
    () => Boolean(user?.email) && (Boolean(user?.emailVerified) || !user?.emailVerificationPending),
    [user?.email, user?.emailVerificationPending, user?.emailVerified],
  );
  const whatsappOtpVerificationEnabled = useMemo(
    () => Boolean(user?.phoneOtpVerificationEnabled),
    [user?.phoneOtpVerificationEnabled],
  );
  const whatsappOtpVerified = useMemo(() => Boolean(user?.phoneOtpVerified), [user?.phoneOtpVerified]);
  const pointsTotal = useMemo(
    () => activeMemberships.reduce((sum, membership) => sum + Number(membership.points || 0), 0),
    [activeMemberships],
  );
  const tenantLogoById = useMemo(() => {
    const map: Record<string, string> = {};
    tenants.forEach((tenant) => {
      if (tenant.id && tenant.logoData) {
        map[tenant.id] = tenant.logoData;
      }
    });
    return map;
  }, [tenants]);
  const tenantCategoryById = useMemo(() => {
    const map: Record<string, string> = {};
    tenants.forEach((tenant) => {
      if (tenant.id) {
        map[tenant.id] = tenant.businessCategory || DEFAULT_BUSINESS_CATEGORY;
      }
    });
    return map;
  }, [tenants]);
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
  const warningMessages = useMemo(
    () => Object.values(dataWarnings).filter((message): message is string => Boolean(message)),
    [dataWarnings],
  );
  const filteredTenants = useMemo(
    () =>
      selectedBusinessCategory === 'Todos'
        ? tenants
        : tenants.filter((tenant) => (tenant.businessCategory || DEFAULT_BUSINESS_CATEGORY) === selectedBusinessCategory),
    [tenants, selectedBusinessCategory],
  );
  useEffect(() => {
    if (!selectedMapTenant) return;
    const stillExists = filteredTenants.some((tenant) => tenant.id === selectedMapTenant.id && tenant.lat === selectedMapTenant.lat && tenant.lng === selectedMapTenant.lng);
    if (!stillExists) {
      setSelectedMapTenant(null);
    }
  }, [filteredTenants, selectedMapTenant]);

  const handleSessionExpired = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('punto_user');
      window.location.assign('/ingresar?tipo=cliente&modo=login');
    }
  }, []);

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

  const syncMembershipSnapshot = useCallback(async () => {
    if (!user?.id || !user?.sessionToken) return;
    if (membershipSyncInFlight.current) {
      await membershipSyncInFlight.current;
      return;
    }

    membershipSyncInFlight.current = (async () => {
      setLoadingMemberships(true);
      try {
        const response = await fetch('/api/user/memberships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            sessionToken: user.sessionToken,
          }),
        });
        const body = (await response.json()) as {
          memberships?: Membership[];
          message?: string;
          error?: string;
          code?: string;
          warning?: string;
        };
        if (!response.ok) {
          if (isUnauthorizedResponse(response, body)) {
            handleSessionExpired();
            return;
          }
          setDataWarnings((prev) => ({ ...prev, memberships: body?.message || body?.error || 'No se pudo actualizar estado de membresías' }));
          return;
        }
        setUser((prev) => {
          if (!prev) return prev;
          const next = { ...prev, memberships: body.memberships || [] };
          if (typeof window !== 'undefined') {
            localStorage.setItem('punto_user', JSON.stringify(next));
          }
          return next;
        });
        if (body.warning) {
          setDataWarnings((prev) => ({ ...prev, memberships: body.warning }));
        }
      } finally {
        setLoadingMemberships(false);
        membershipSyncInFlight.current = null;
      }
    })();
    await membershipSyncInFlight.current;
  }, [handleSessionExpired, user?.id, user?.sessionToken]);

  const loadClientData = useCallback(async () => {
    if (!user?.id || !user?.sessionToken) return;

    setSyncingData(true);
    setDataWarnings({});
    const authPayload = {
      userId: user.id,
      sessionToken: user.sessionToken,
    };

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await fetch('/api/user/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authPayload),
        });
        const body = (await response.json()) as { history?: HistoryItem[]; message?: string; error?: string; code?: string; warning?: string };
        if (!response.ok) {
          if (isUnauthorizedResponse(response, body)) {
            handleSessionExpired();
            return;
          }
          setDataWarnings((prev) => ({ ...prev, history: body?.message || body?.error || 'No se pudo cargar historial' }));
          return;
        }
        setHistory(body.history || []);
        if (body.warning) {
          setDataWarnings((prev) => ({ ...prev, history: body.warning }));
        }
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
          body: JSON.stringify(authPayload),
        });
        const body = (await response.json()) as { rewards?: CoalitionReward[]; message?: string; error?: string; code?: string; warning?: string };
        if (!response.ok) {
          if (isUnauthorizedResponse(response, body)) {
            handleSessionExpired();
            return;
          }
          setDataWarnings((prev) => ({ ...prev, rewards: body?.message || body?.error || 'No se pudieron cargar beneficios' }));
          return;
        }
        setRewards(body.rewards || []);
        if (body.warning) {
          setDataWarnings((prev) => ({ ...prev, rewards: body.warning }));
        }
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
          body: JSON.stringify(authPayload),
        });
        const body = (await response.json()) as {
          challenges?: ChallengeItem[];
          availablePoints?: number;
          coalitionVisits?: number;
          message?: string;
          error?: string;
          code?: string;
          warning?: string;
        };
        if (!response.ok) {
          if (isUnauthorizedResponse(response, body)) {
            handleSessionExpired();
            return;
          }
          setChallengeStats({ availablePoints: 0, coalitionVisits: 0 });
          setDataWarnings((prev) => ({ ...prev, challenges: body?.message || body?.error || 'No se pudieron cargar retos' }));
          return;
        }
        setChallenges(body.challenges || []);
        setChallengeStats({
          availablePoints: Math.max(0, Number(body.availablePoints || 0)),
          coalitionVisits: Math.max(0, Number(body.coalitionVisits || 0)),
        });
        if (body.warning) {
          setDataWarnings((prev) => ({ ...prev, challenges: body.warning }));
        }
      } finally {
        setLoadingChallenges(false);
      }
    };

    const loadTenants = async () => {
      setLoadingTenants(true);
      try {
        const response = await fetch('/api/map/tenants');
        const body = (await response.json()) as { tenants?: TenantMapItem[]; message?: string; error?: string };
        if (!response.ok) {
          setDataWarnings((prev) => ({ ...prev, tenants: body?.message || body?.error || 'No se pudo cargar el mapa de negocios' }));
          return;
        }
        setTenants(body.tenants || []);
      } finally {
        setLoadingTenants(false);
      }
    };

    try {
      await Promise.all([loadHistory(), syncMembershipSnapshot(), loadRewards(), loadChallenges(), loadTenants()]);
      setLastSyncAt(new Date());
    } finally {
      setSyncingData(false);
    }
  }, [syncMembershipSnapshot, handleSessionExpired, user?.id, user?.sessionToken]);

  useEffect(() => {
    void loadClientData();
  }, [loadClientData]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id || !user?.sessionToken) return;
    const params = new URLSearchParams(window.location.search);
    const onboardingBusinessId = params.get('business_id');
    const flow = params.get('flow');

    if (onboardingBusinessId && flow === 'create-pass') {
      const autoJoin = async () => {
        try {
          const res = await fetch('/api/user/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              sessionToken: user.sessionToken,
              tenantId: onboardingBusinessId,
            }),
          });
          if (res.ok) {
            window.history.replaceState({}, '', window.location.pathname);
            await syncMembershipSnapshot();
            openBusinessPass({ id: onboardingBusinessId });
          }
        } catch {
          // Fallo silencioso si no se puede unir automáticamente
        }
      };
      void autoJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.sessionToken, syncMembershipSnapshot]);

  const saveProfile = async () => {
    if (!user?.id || !user?.sessionToken) return;
    const normalizedBirthDate = profileBirthDate ? displayDateToIso(profileBirthDate) : '';
    if (profileBirthDate && !normalizedBirthDate) {
      setStatusMessage('La fecha de nacimiento debe estar en formato DD/MM/AAAA.');
      return;
    }
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
          birthDate: normalizedBirthDate || undefined,
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
          birthDate: normalizedBirthDate || null,
        };
        localStorage.setItem('punto_user', JSON.stringify(updated));
        return updated;
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const openBusinessPass = (tenant: { id?: string }) => {
    if (typeof window === 'undefined') return;
    if (!user?.id) return;
    if (!tenant.id) return;
    window.location.assign(`/pass?customer_id=${encodeURIComponent(user.id)}&business_id=${encodeURIComponent(tenant.id)}`);
  };

  const logout = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('punto_user');
    window.location.assign('/ingresar?tipo=cliente&modo=login');
  };

  const statusToneIsError = /no se pudo|fall[oó]|error|inv[aá]lido|inv[aá]lida/i.test(statusMessage);

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#fffdf9] text-[#1d1238]">
        <MarketingBackground />
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
      <div className="fixed top-4 right-4 z-40">
        <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-[#d9c8f4] bg-white/95 px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-[#3b2568] shadow-sm backdrop-blur transition hover:bg-[#f8f2ff]">
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      </div>

      <Section
        eyebrow="Mi cuenta"
        title={`Hola${user.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        description="Tu panel de cliente está diseñado para que todo sea claro: progreso, recompensas, negocios y perfil en un solo lugar."
      >
        <div className="space-y-5">
          <article className="rounded-[1.75rem] border border-[#ead8fb] bg-[linear-gradient(120deg,#ffffff_0%,#fff6ef_45%,#f8f0ff_100%)] p-5 shadow-[0_18px_42px_rgba(73,42,129,0.1)] md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-[#efdffb] bg-[#fffafe] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#7755a6]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Panel activo
                </p>
                <h3 className="mt-3 text-2xl font-black text-[#241646] md:text-3xl">Todo tu avance en una vista</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5d4b82]">
                  Consulta puntos, retos, negocios aliados y datos de perfil sin salir de esta app.
                </p>
                {lastSyncAt ? (
                  <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#6f58a0]">
                    <Clock3 className="h-3.5 w-3.5" />
                    Última actualización {lastSyncAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => void loadClientData()} disabled={syncingData} className={buttonStyles('tertiary')}>
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className={`h-4 w-4 ${syncingData ? 'animate-spin' : ''}`} />
                    {syncingData ? 'Actualizando' : 'Actualizar datos'}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-[#e7d9f8] bg-white p-4">
                <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#7d61ab]">
                  <Medal className="h-3.5 w-3.5" />
                  Puntos totales
                </p>
                <p className="mt-2 text-3xl font-black text-[#25174a]">{pointsTotal}</p>
                <p className="text-xs font-semibold text-[#78639e]">acumulados en tu cuenta</p>
              </article>
              <article className="rounded-2xl border border-[#e7d9f8] bg-white p-4">
                <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#7d61ab]">
                  <Building2 className="h-3.5 w-3.5" />
                  Negocios activos
                </p>
                <p className="mt-2 text-3xl font-black text-[#25174a]">{activeMemberships.length}</p>
                <p className="text-xs font-semibold text-[#78639e]">donde ya participas</p>
              </article>
              <article className="rounded-2xl border border-[#e7d9f8] bg-white p-4">
                <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#7d61ab]">
                  <Gift className="h-3.5 w-3.5" />
                  Canjeables hoy
                </p>
                <p className="mt-2 text-3xl font-black text-[#25174a]">{redeemReadyCount}</p>
                <p className="text-xs font-semibold text-[#78639e]">recompensas listas</p>
              </article>
              <article className="rounded-2xl border border-[#e7d9f8] bg-white p-4">
                <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#7d61ab]">
                  <Award className="h-3.5 w-3.5" />
                  Retos completados
                </p>
                <p className="mt-2 text-3xl font-black text-[#25174a]">{completedChallenges}</p>
                <p className="text-xs font-semibold text-[#78639e]">objetivos alcanzados</p>
              </article>
            </div>
          </article>

          {warningMessages.length > 0 ? (
            <article className="rounded-2xl border border-[#f7dccb] bg-[#fff7f3] p-4">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#a34f27]">
                <AlertCircle className="h-4 w-4" />
                Avisos de sincronización
              </p>
              <ul className="mt-2 space-y-1 text-xs font-semibold text-[#7d4c34]">
                {warningMessages.map((message, index) => (
                  <li key={`${message}-${index}`}>• {message}</li>
                ))}
              </ul>
            </article>
          ) : null}

          <div className="sticky top-[84px] z-20 rounded-2xl border border-[#e9daf9] bg-white/95 p-2 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {tabItems.map((item) => {
                const Icon = item.icon;
                const isActive = tab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition ${
                      isActive
                        ? 'border-[#2a184f] bg-[#2a184f] text-white shadow-[0_10px_24px_rgba(42,24,79,0.35)]'
                        : 'border-[#e8daf9] bg-[#faf5ff] text-[#4a3577] hover:border-[#cfb6ed] hover:bg-[#f5ecff]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <span className={`mt-1 block text-[11px] font-semibold ${isActive ? 'text-white/80' : 'text-[#7b64a7]'}`}>
                      {item.key === 'puntos' && 'Progreso y canjes'}
                      {item.key === 'retos' && 'Metas de recompra'}
                      {item.key === 'negocios' && 'Mapa y aliados'}
                      {item.key === 'perfil' && 'Datos de cuenta'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {tab === 'puntos' ? (
            <section className="grid gap-5">
              {loadingMemberships ? (
                <article className="rounded-3xl border border-[#e9daf9] bg-white p-4">
                  <p className="text-sm font-semibold text-[#5c4a82]">Actualizando estado de canjes…</p>
                </article>
              ) : null}
              {activeMemberships.length === 0 ? (
                <article className="rounded-3xl border border-[#e9daf9] bg-white p-6">
                  <h3 className="text-xl font-black text-[#25174a]">Aún no tienes membresías activas</h3>
                  <p className="mt-2 text-sm text-[#5c4a82]">Activa tu pase en tienda para empezar a acumular visitas y puntos.</p>
                  <div className="mt-4">
                    <Link href="/activar-pase" className={buttonStyles('primary')}>Activar pase</Link>
                  </div>
                </article>
              ) : (
                activeMemberships.map((membership) => {
                  const requiredVisits = Math.max(1, Number(membership.requiredVisits || 10));
                  const currentVisits = Number(membership.visits || 0);
                  const currentPoints = Number(membership.points || 0);
                  const instagramUrl = normalizeInstagramUrl(membership.instagram);
                  const businessCategory = membership.businessCategory || tenantCategoryById[membership.tenantId] || DEFAULT_BUSINESS_CATEGORY;
                  const progress = Math.min(100, Math.round((currentVisits / requiredVisits) * 100));
                  const canRedeem = currentVisits >= requiredVisits;
                  const hasPendingCode = membership.rewardCodeStatus === 'CODE_PENDING';
                  const earnedCodes = membership.earnedCodes || [];
                  return (
                    <article key={membership.tenantId} className="rounded-3xl border border-[#e9daf9] bg-white p-5 shadow-[0_14px_34px_rgba(53,30,95,0.09)] md:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <BusinessLogo
                            name={membership.name}
                            logoData={membership.logoData || tenantLogoById[membership.tenantId] || undefined}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate text-xl font-black text-[#231644] md:text-2xl">{membership.name || 'Negocio aliado'}</h3>
                              {instagramUrl ? (
                                <a
                                  href={instagramUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`Instagram de ${membership.name || 'negocio aliado'}`}
                                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e7d7fb] text-[#5a3c8a] transition hover:bg-[#f7f1ff]"
                                >
                                  <Instagram className="h-4 w-4" />
                                </a>
                              ) : null}
                            </div>
                            <p className="mt-1 truncate text-sm text-[#5c4a82]">{businessCategory}</p>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-[#eddffb] bg-[#fcf8ff] px-3.5 py-2.5 text-right text-sm font-semibold text-[#4e3a78]">
                          <p className="text-lg font-black text-[#2a184f]">{currentPoints} pts</p>
                          <span className="mt-1 block text-xs text-[#7b63a8]">{currentVisits}/{requiredVisits} visitas</span>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-[#efe1fd] bg-[#fbf6ff] p-3.5">
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#5f4a89]">
                          <span>Meta para canjear recompensa</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-[#f0e4ff]">
                          <div
                            className="h-2.5 rounded-full bg-gradient-to-r from-[#ff7a59] via-[#ff4a93] to-[#8b5cf6]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {!canRedeem ? (
                          <p className="mt-2 text-xs font-semibold text-[#7b63a8]">
                            Te faltan {requiredVisits - currentVisits} visita(s) para canjear.
                          </p>
                        ) : hasPendingCode ? (
                          <p className="mt-2 text-xs font-semibold text-[#a34f27]">
                            {membership.rewardCodeLabel || 'Ya tienes un código pendiente. Úsalo en caja para redimir tu premio.'}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs font-semibold text-[#2c7a4f]">Tu código se crea automáticamente cuando registras la visita que completa tu meta.</p>
                        )}
                        {membership.rewardCodeStatus === 'CODE_USED' ? (
                          <p className="mt-1 text-[11px] font-semibold text-[#5f4a89]">{membership.rewardCodeLabel || 'Tu último código ya fue canjeado.'}</p>
                        ) : null}
                      </div>

                      {membership.milestones && membership.milestones.length > 0 ? (
                        <div className="mt-3 rounded-2xl border border-[#e9daf9] bg-[#faf5ff] p-3.5">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#7755a6]">Escalera de beneficios</p>
                          <div className="flex flex-col gap-1.5">
                            {membership.milestones.map((m) => {
                              const unlocked = currentVisits >= m.visitTarget;
                              const redeemedMilestone = Boolean(m.redeemed);
                              return (
                                <div
                                  key={m.id}
                                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all ${
                                    redeemedMilestone
                                      ? 'bg-gray-50 border border-gray-100 opacity-70'
                                      : unlocked
                                      ? 'bg-[#ecfff2] border border-[#c8f3d8]'
                                      : 'bg-white border border-[#efe1fd] opacity-60'
                                  }`}
                                >
                                  <span className="text-base">{redeemedMilestone ? '🏁' : unlocked ? '✅' : m.emoji}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-bold text-xs truncate ${redeemedMilestone ? 'text-gray-400 line-through' : unlocked ? 'text-[#11643a]' : 'text-[#5c4a82]'}`}>{m.reward}</p>
                                    <p className={`text-[10px] font-semibold ${redeemedMilestone ? 'text-gray-400' : unlocked ? 'text-[#2c7a4f]' : 'text-[#9b88be]'}`}>
                                      {redeemedMilestone
                                        ? 'Código ya canjeado'
                                        : `Visita ${m.visitTarget}${unlocked ? ' · ¡Desbloqueado!' : ` · Faltan ${m.visitTarget - currentVisits} visita(s)`}`}
                                    </p>
                                  </div>
                                  {unlocked && !redeemedMilestone ? (
                                    <span className="rounded-full border border-[#c8f3d8] bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#2c7a4f]">
                                      Código automático
                                    </span>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {earnedCodes.length > 0 ? (
                        <div className="mt-3 rounded-2xl border border-[#e9daf9] bg-white p-3.5">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#7755a6]">Códigos ya ganados</p>
                          <div className="space-y-1.5">
                            {earnedCodes.map((earnedCode) => (
                              <div key={earnedCode.id} className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 ${
                                earnedCode.status === 'PENDING' ? 'border-[#f3d3c2] bg-[#fff8f3]' : 'border-gray-100 bg-gray-50 opacity-70'
                              }`}>
                                <p className="font-mono text-xs font-black tracking-[0.08em] text-[#2a184f]">{earnedCode.code}</p>
                                <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#7a5aa8]">
                                  {earnedCode.channel === 'MILESTONE' ? 'Intermedio' : 'Final'}
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${
                                  earnedCode.status === 'PENDING' ? 'bg-[#ffe3d7] text-[#a34f27]' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {earnedCode.status === 'PENDING' ? 'Pendiente' : 'Canjeado'}
                                </span>
                                <p className="w-full text-[11px] font-semibold text-[#5c4a82]">{earnedCode.reward}</p>
                              </div>
                            ))}
                          </div>
                          <p className="mt-2 text-[11px] font-semibold text-[#7b63a8]">
                            Los códigos ganados se mantienen aquí hasta que se canjean o termina su vigencia ({rewardValidityLabel(membership.rewardPeriod)}).
                          </p>
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                          href={`/pass?customer_id=${encodeURIComponent(user.id)}&business_id=${encodeURIComponent(membership.tenantId)}`}
                          className={buttonStyles('secondary')}
                        >
                          <span className="inline-flex items-center gap-2"><ScanLine className="h-4 w-4" /> Ver pase</span>
                        </Link>
                      </div>
                    </article>
                  );
                })
              )}

              <article className="rounded-3xl border border-[#e9daf9] bg-white p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="inline-flex items-center gap-2 text-xl font-black text-[#241646]">
                    <Trophy className="h-5 w-5 text-[#7a4ac8]" />
                    Historial de canjes
                  </h3>
                  <span className="text-xs font-semibold text-[#7d67aa]">Últimos 10 movimientos</span>
                </div>
                {loadingHistory ? (
                  <p className="mt-4 text-sm text-[#5c4a82]">Cargando historial...</p>
                ) : history.length === 0 ? (
                  <p className="mt-4 text-sm text-[#5c4a82]">Aún no tienes canjes registrados.</p>
                ) : (
                  <ul className="mt-4 space-y-2.5 text-sm text-[#4f3d76]">
                    {history.slice(0, 10).map((item) => (
                      <li key={item.id} className="rounded-xl border border-[#f0e5fc] bg-[#fffdf9] p-3.5">
                        <p className="font-semibold text-[#2f1d57]">{item.tenant}</p>
                        <p className="mt-1 text-xs text-[#5b467f]">{item.prize}</p>
                        <p className="mt-1 text-[11px] font-semibold text-[#7c66a8]">{item.date} · {item.time}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </section>
          ) : null}

          {tab === 'retos' ? (
            <section className="grid gap-5">
              <article className="rounded-3xl border border-[#e9daf9] bg-white p-6">
                <h3 className="text-xl font-black text-[#25174a]">Retos activos</h3>
                <p className="mt-1 text-sm text-[#5c4a82]">
                  Completa metas de visitas y negocios para desbloquear recompensas adicionales.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#ead8fb] bg-[#fcf9ff] p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7f61ad]">Total retos</p>
                    <p className="mt-1 text-2xl font-black text-[#2a184f]">{challenges.length}</p>
                  </div>
                  <div className="rounded-2xl border border-[#ead8fb] bg-[#fcf9ff] p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7f61ad]">En progreso</p>
                    <p className="mt-1 text-2xl font-black text-[#2a184f]">{Math.max(challenges.length - completedChallenges, 0)}</p>
                  </div>
                  <div className="rounded-2xl border border-[#ead8fb] bg-[#fcf9ff] p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7f61ad]">Completados</p>
                    <p className="mt-1 text-2xl font-black text-[#2a184f]">{completedChallenges}</p>
                  </div>
                  <div className="rounded-2xl border border-[#ead8fb] bg-[#fcf9ff] p-4 sm:col-span-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7f61ad]">Puntos disponibles</p>
                    <p className="mt-1 text-2xl font-black text-[#2a184f]">{challengeStats.availablePoints}</p>
                    <p className="mt-1 text-xs font-semibold text-[#6c549a]">
                      Acumulados por {challengeStats.coalitionVisits} visita(s) en negocios de la coalición.
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-[#e9daf9] bg-white p-6">
                {loadingChallenges ? (
                  <p className="text-sm text-[#5c4a82]">Cargando retos...</p>
                ) : challenges.length === 0 ? (
                  <>
                    <h3 className="text-xl font-black text-[#25174a]">No hay retos activos por ahora</h3>
                    <p className="mt-2 text-sm text-[#5c4a82]">Cuando haya nuevos retos aparecerán aquí con su progreso.</p>
                  </>
                ) : (
                  <div className="space-y-3.5">
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
            </section>
          ) : null}

          {tab === 'negocios' ? (
            <section className="grid gap-5">
              <article className="rounded-3xl border border-[#e9daf9] bg-white p-6">
                <h3 className="text-xl font-black text-[#25174a]">Negocios aliados</h3>
                <p className="mt-1 text-sm text-[#5c4a82]">
                  Explora negocios cercanos, abre tu pase al instante y revisa tu avance por aliado.
                </p>

                {activeMemberships.length > 0 ? (
                  <ul className="mt-4 space-y-2.5">
                    {activeMemberships.map((membership) => {
                      const requiredVisits = Math.max(1, Number(membership.requiredVisits || 10));
                      const currentVisits = Number(membership.visits || 0);
                      return (
                        <li key={membership.tenantId} className="rounded-2xl border border-[#efe1fd] bg-[#fffdfd] p-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <BusinessLogo
                                name={membership.name}
                                logoData={membership.logoData || tenantLogoById[membership.tenantId] || undefined}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="truncate font-black text-[#2a184f]">{membership.name || 'Negocio aliado'}</p>
                                <p className="text-xs font-semibold text-[#6e57a0]">
                                  {currentVisits}/{requiredVisits} visitas · {membership.points || 0} pts
                                </p>
                              </div>
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
                ) : (
                  <p className="mt-3 text-sm text-[#5c4a82]">Aún no tienes negocios activos. Activa tu pase para comenzar.</p>
                )}
              </article>

              <article className="rounded-3xl border border-[#e9daf9] bg-white p-4 md:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xl font-black text-[#25174a]">Mapa de negocios</h3>
                  <span className="text-xs font-semibold text-[#7a63a8]">{filteredTenants.length} negocios disponibles</span>
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <label htmlFor="business-category-filter" className="text-[11px] font-black uppercase tracking-[0.1em] text-[#7859a8]">
                    Filtrar por giro
                  </label>
                  <select
                    id="business-category-filter"
                    value={selectedBusinessCategory}
                    onChange={(event) => setSelectedBusinessCategory(event.target.value)}
                    className="rounded-xl border border-[#e7d8fb] bg-[#fffafe] px-3 py-2 text-xs font-semibold text-[#4f3b79] outline-none focus:border-[#b693ea] focus:ring-2 focus:ring-[#eadbff]"
                  >
                    <option value="Todos">Todos</option>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 lg:grid-cols-[1fr_1.65fr]">
                  <div className="rounded-2xl border border-[#efe2fc] bg-[#fffafe] p-3.5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7859a8]">Directorio rápido</p>
                    {loadingTenants ? (
                      <div className="mt-3 space-y-2">
                        <div className="h-14 animate-pulse rounded-xl bg-[#f4ebff]" />
                        <div className="h-14 animate-pulse rounded-xl bg-[#f4ebff]" />
                        <div className="h-14 animate-pulse rounded-xl bg-[#f4ebff]" />
                      </div>
                    ) : filteredTenants.length === 0 ? (
                      <p className="mt-3 text-sm text-[#5d4a82]">No encontramos negocios en este momento.</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {filteredTenants.slice(0, 8).map((tenant) => {
                          const instagramUrl = normalizeInstagramUrl(tenant.instagram);
                          const prizeTag = tenant.prize ? `🎁 ${tenant.prize}` : null;

                          return (
                            <li key={tenant.id || `${tenant.name}-${tenant.lat}-${tenant.lng}`} className="rounded-xl border border-[#eee2fb] bg-white p-2.5">
                              <div className="flex items-start gap-2.5">
                                <BusinessLogo name={tenant.name} logoData={tenant.logoData || undefined} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-black text-[#26174c]">{tenant.name}</p>
                                  <p className="truncate text-[11px] font-semibold text-[#77629f]">{tenant.address || `${tenant.lat.toFixed(4)}, ${tenant.lng.toFixed(4)}`}</p>
                                  {prizeTag ? (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      <span className="rounded-full border border-[#e9daf9] bg-[#f9f2ff] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.06em] text-[#8b6bb8]">
                                        {prizeTag}
                                      </span>
                                    </div>
                                  ) : null}
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedMapTenant(tenant)}
                                      className={`${buttonStyles('secondary')} px-2.5 py-1.5 text-[11px]`}
                                    >
                                      Ver en mapa
                                    </button>
                                  </div>
                                </div>
                                {instagramUrl ? (
                                  <a
                                    href={instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Instagram de ${tenant.name || 'negocio aliado'}`}
                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e8d9fa] bg-white text-[#7e4cd9] transition hover:border-[#c9a9f3] hover:bg-[#f8f0ff] hover:text-[#5f2fb5]"
                                  >
                                    <Instagram className="h-4 w-4" />
                                  </a>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="h-[360px] overflow-hidden rounded-3xl border border-[#f0e5fc] shadow-[0_14px_28px_rgba(79,46,142,0.12)] lg:h-[410px]">
                      {loadingTenants ? (
                        <div className="h-full w-full animate-pulse bg-[#f7f0ff]" />
                      ) : (
                        <BusinessMap
                          tenants={filteredTenants}
                          focusCoords={selectedMapTenant ? [selectedMapTenant.lat, selectedMapTenant.lng] : null}
                          radiusKm={selectedMapTenant ? 2 : 50}
                          onCreatePass={openBusinessPass}
                          selectedTenant={selectedMapTenant}
                          onSelectedChange={setSelectedMapTenant}
                          showInlineSelectedCard={false}
                        />
                      )}
                    </div>
                    <div className="rounded-2xl border border-[#efe2fc] bg-[#fffafe] p-3.5">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7859a8]">Negocio seleccionado</p>
                      {selectedMapTenant ? (
                        <div className="mt-2.5">
                          <div className="flex items-start gap-2.5">
                            <BusinessLogo name={selectedMapTenant.name} logoData={selectedMapTenant.logoData || undefined} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black text-[#26174c]">{selectedMapTenant.name}</p>
                              <p className="truncate text-[11px] font-semibold text-[#77629f]">
                                {selectedMapTenant.address || `${selectedMapTenant.lat.toFixed(4)}, ${selectedMapTenant.lng.toFixed(4)}`}
                              </p>
                              {selectedMapTenant.prize ? (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  <span className="rounded-full border border-[#e9daf9] bg-[#f9f2ff] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.06em] text-[#8b6bb8]">
                                    {`🎁 ${selectedMapTenant.prize}`}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => openBusinessPass(selectedMapTenant)}
                              disabled={!selectedMapTenant.id}
                              className={`${buttonStyles('tertiary')} px-2.5 py-1.5 text-[11px] ${selectedMapTenant.id ? '' : 'cursor-not-allowed opacity-50'}`}
                            >
                              Abrir pase
                            </button>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${selectedMapTenant.lat},${selectedMapTenant.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${buttonStyles('tertiary')} px-2.5 py-1.5 text-[11px]`}
                            >
                              Cómo llegar
                            </a>
                            <button
                              type="button"
                              onClick={() => setSelectedMapTenant(null)}
                              className={`${buttonStyles('secondary')} px-2.5 py-1.5 text-[11px]`}
                            >
                              Cerrar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2.5 text-sm font-semibold text-[#5d4a82]">
                          Selecciona un negocio desde el listado o tocando un marcador del mapa para ver sus detalles aquí.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-[#e9daf9] bg-white p-6">
                <h3 className="text-xl font-black text-[#25174a]">Beneficios de red desbloqueados</h3>
                {loadingRewards ? (
                  <p className="mt-3 text-sm text-[#5c4a82]">Cargando beneficios...</p>
                ) : rewards.length === 0 ? (
                  <p className="mt-3 text-sm text-[#5c4a82]">Todavía no tienes beneficios de red desbloqueados.</p>
                ) : (
                  <ul className="mt-4 space-y-2.5 text-sm text-[#4f3d76]">
                    {rewards.slice(0, 10).map((reward) => (
                      <li key={reward.id} className="rounded-xl border border-[#f0e5fc] bg-[#fffdf9] p-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-[#2a184f]">
                            {reward.reward.title} · {reward.reward.rewardValue}
                          </p>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] ${rewardStatusStyles(reward.status)}`}>
                            {rewardStatusLabel(reward.status)}
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
            </section>
          ) : null}

          {tab === 'perfil' ? (
            <section className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
              <article className="rounded-3xl border border-[#e9daf9] bg-white p-6">
                <h3 className="text-2xl font-black text-[#25174a]">Mi perfil</h3>
                <p className="mt-1 text-sm text-[#5c4a82]">Mantén tus datos actualizados para recibir mejores experiencias y soporte.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label htmlFor="name" className="text-xs font-bold uppercase tracking-[0.14em] text-[#7e67a8]">Nombre</label>
                    <input
                      id="name"
                      value={profileName}
                      onChange={(event) => setProfileName(event.target.value)}
                      className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-3 py-2.5 text-sm text-[#2e1e54] focus:border-[#9f7bd3] focus:outline-none"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="phone" className="text-xs font-bold uppercase tracking-[0.14em] text-[#7e67a8]">Teléfono</label>
                    <input
                      id="phone"
                      value={profilePhone}
                      onChange={(event) => setProfilePhone(event.target.value)}
                      className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-3 py-2.5 text-sm text-[#2e1e54] focus:border-[#9f7bd3] focus:outline-none"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.14em] text-[#7e67a8]">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={profileEmail}
                      onChange={(event) => setProfileEmail(event.target.value)}
                      className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-3 py-2.5 text-sm text-[#2e1e54] focus:border-[#9f7bd3] focus:outline-none"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="gender" className="text-xs font-bold uppercase tracking-[0.14em] text-[#7e67a8]">Género</label>
                    <select
                      id="gender"
                      value={profileGender}
                      onChange={(event) => setProfileGender(event.target.value)}
                      className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-3 py-2.5 text-sm text-[#2e1e54] focus:border-[#9f7bd3] focus:outline-none"
                    >
                      <option value="">Selecciona</option>
                      <option value="Hombre">Hombre</option>
                      <option value="Mujer">Mujer</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5 md:col-span-2">
                    <label htmlFor="birthDate" className="text-xs font-bold uppercase tracking-[0.14em] text-[#7e67a8]">Fecha de nacimiento</label>
                    <input
                      id="birthDate"
                      type="text"
                      inputMode="numeric"
                      value={isoDateToDisplay(profileBirthDate)}
                      onChange={(event) => setProfileBirthDate(formatBirthDateInput(event.target.value))}
                      placeholder="DD/MM/AAAA"
                      className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-3 py-2.5 text-sm text-[#2e1e54] focus:border-[#9f7bd3] focus:outline-none md:max-w-xs"
                    />
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={saveProfile} disabled={savingProfile} className={buttonStyles('primary')}>
                    {savingProfile ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <Link href={`/pass?customer_id=${encodeURIComponent(user.id)}`} className={buttonStyles('secondary')}>
                    Ver mi pase
                  </Link>
                </div>
              </article>

              <article className="rounded-3xl border border-[#e9daf9] bg-[linear-gradient(145deg,#fffdfa_0%,#f9f3ff_100%)] p-6">
                <h3 className="inline-flex items-center gap-2 text-xl font-black text-[#25174a]">
                  <ShieldCheck className="h-5 w-5 text-[#6f4ea2]" />
                  Seguridad de cuenta
                </h3>
                <p className="mt-2 text-sm text-[#5c4a82]">
                  Tu sesión está protegida y puedes cerrar sesión en cualquier momento desde este panel.
                </p>
                <div className="mt-4 rounded-2xl border border-[#ecdffb] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7d61ab]">Información de acceso</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div>
                      <dt className="font-semibold text-[#6a5498]">Usuario</dt>
                      <dd className="font-black text-[#28184f]">{profileName || 'Cliente Punto IA'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-[#6a5498]">Teléfono</dt>
                      <dd className="font-black text-[#28184f]">{profilePhone || '-'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-[#6a5498]">Email</dt>
                      <dd className="font-black text-[#28184f]">{profileEmail || '-'}</dd>
                    </div>
                  </dl>
                </div>
                <div className="mt-4 rounded-2xl border border-[#ecdffb] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7d61ab]">Estado de verificación</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.1em] ${
                        emailContactVerified ? 'border-[#c8f3d8] bg-[#ecfff2] text-[#11643a]' : 'border-[#f7dccb] bg-[#fff3ec] text-[#a34f27]'
                      }`}
                    >
                      Email {emailContactVerified ? 'verificado' : 'pendiente'}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.1em] ${
                        whatsappOtpVerificationEnabled
                          ? whatsappOtpVerified
                            ? 'border-[#c8f3d8] bg-[#ecfff2] text-[#11643a]'
                            : 'border-[#f7dccb] bg-[#fff3ec] text-[#a34f27]'
                          : 'border-[#e8d6fb] bg-[#f9f1ff] text-[#5f3f8f]'
                      }`}
                    >
                      WhatsApp OTP {whatsappOtpVerificationEnabled ? (whatsappOtpVerified ? 'verificado' : 'pendiente') : 'deshabilitado'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-[#efe3fc] bg-white p-4">
                  <p className="text-sm font-semibold text-[#533c82]">
                    Si usas un equipo compartido, cierra sesión al terminar.
                  </p>
                  <button type="button" onClick={logout} className={`mt-3 w-full ${buttonStyles('secondary')}`}>
                    Cerrar sesión
                  </button>
                </div>
              </article>
            </section>
          ) : null}

          {statusMessage ? (
            <p
              className={`rounded-xl border p-3 text-sm font-semibold ${
                statusToneIsError
                  ? 'border-[#f4d2c4] bg-[#fff7f2] text-[#8a4226]'
                  : 'border-[#d8f0e1] bg-[#f3fff7] text-[#1f6a44]'
              }`}
            >
              {statusMessage}
            </p>
          ) : null}
        </div>
      </Section>

      <MarketingFooter />
    </main>
  );
}
