'use client';

import { useMemo, useState } from 'react';

interface TenantUser {
  id: string;
  name: string;
  username: string;
  role: string;
  password?: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  codePrefix?: string;
  isActive?: boolean;
  users: TenantUser[];
  coalitionOptIn?: boolean;
  coalitionDiscountPercent?: number;
  coalitionProduct?: string;
}

interface RewardOption {
  id: string;
  title: string;
  rewardValue: string;
  business: { id: string; name: string };
}

interface BusinessOption {
  id: string;
  name: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  challengeType: 'VISIT_COUNT' | 'DISTINCT_BUSINESSES';
  targetValue: number;
  timeWindow: number;
  active: boolean;
  rewardCampaign?: {
    id: string;
    title: string;
    business: { id: string; name: string };
  } | null;
}

type WalletSyncConfig = {
  appleEnabled: boolean;
  googleEnabled: boolean;
  appleTouchConcurrency: number;
  applePushConcurrency: number;
  googleSyncMaxCustomers: number;
  alertErrorThreshold: number;
  alertWindowMinutes: number;
  executionMode: 'immediate' | 'queued';
  workerBatchSize: number;
  workerMaxAttempts: number;
  workerRetryDelaySeconds: number;
  workerEnabled: boolean;
  workerLockTimeoutMinutes: number;
  maintenanceEnabled: boolean;
  maintenanceHourUtc: number;
  auditRetentionDays: number;
  jobRetentionDays: number;
  updatedAt: string | null;
};

type WalletSyncLog = {
  id: number;
  tenant_id: string;
  reason: string;
  channel: string;
  status: string;
  message: string;
  metadata: unknown;
  created_at: string;
};

type WalletSyncAlert = {
  id: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
};

type WalletSyncMetrics = {
  recentErrors: number;
  alertThreshold: number;
  alertWindowMinutes: number;
  auditLast24h: { success: number; error: number; skipped: number };
  queue: { pending: number; running: number; failed: number; completed: number };
};

type WalletSyncJob = {
  id: number;
  tenant_id: string;
  reason: string;
  origin: string;
  status: string;
  attempts: number;
  max_attempts: number;
  run_after: string;
  last_error: string;
  created_at: string;
  updated_at: string;
};

type ChallengeForm = {
  title: string;
  description: string;
  challengeType: Challenge['challengeType'];
  targetValue: number;
  timeWindow: number;
  active: boolean;
  rewardCampaignId: string;
};

const initialChallengeForm: ChallengeForm = {
  title: '',
  description: '',
  challengeType: 'VISIT_COUNT',
  targetValue: 5,
  timeWindow: 30,
  active: true,
  rewardCampaignId: '',
};

export default function MasterPage() {
  const [auth, setAuth] = useState(false);
  const [masterUser, setMasterUser] = useState('');
  const [masterPass, setMasterPass] = useState('');
  const [activeTab, setActiveTab] = useState<'negocios' | 'retos' | 'wallet'>('negocios');

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [coalitionOnly, setCoalitionOnly] = useState(true);
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const [tName, setTName] = useState('');
  const [tSlug, setTSlug] = useState('');
  const [uName, setUName] = useState('');
  const [uPhone, setUPhone] = useState('');
  const [uUser, setUUser] = useState('');
  const [uPass, setUPass] = useState('');
  const [uRole, setURole] = useState('ADMIN');

  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);

  const [networkChallenges, setNetworkChallenges] = useState<Challenge[]>([]);
  const [rewardOptions, setRewardOptions] = useState<RewardOption[]>([]);
  const [businessOptions, setBusinessOptions] = useState<BusinessOption[]>([]);
  const [challengeForm, setChallengeForm] = useState<ChallengeForm>(initialChallengeForm);
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSavingChallenge, setIsSavingChallenge] = useState(false);
  const [isSavingWalletConfig, setIsSavingWalletConfig] = useState(false);
  const [walletConfig, setWalletConfig] = useState<WalletSyncConfig>({
    appleEnabled: true,
    googleEnabled: true,
    appleTouchConcurrency: 10,
    applePushConcurrency: 8,
    googleSyncMaxCustomers: 500,
    alertErrorThreshold: 5,
    alertWindowMinutes: 60,
    executionMode: 'queued',
    workerBatchSize: 50,
    workerMaxAttempts: 5,
    workerRetryDelaySeconds: 60,
    workerEnabled: true,
    workerLockTimeoutMinutes: 15,
    maintenanceEnabled: true,
    maintenanceHourUtc: 8,
    auditRetentionDays: 30,
    jobRetentionDays: 14,
    updatedAt: null,
  });
  const [walletLogs, setWalletLogs] = useState<WalletSyncLog[]>([]);
  const [walletAlerts, setWalletAlerts] = useState<WalletSyncAlert[]>([]);
  const [walletJobs, setWalletJobs] = useState<WalletSyncJob[]>([]);
  const [walletMetrics, setWalletMetrics] = useState<WalletSyncMetrics>({
    recentErrors: 0,
    alertThreshold: 5,
    alertWindowMinutes: 60,
    auditLast24h: { success: 0, error: 0, skipped: 0 },
    queue: { pending: 0, running: 0, failed: 0, completed: 0 },
  });
  const [isRunningWalletJobs, setIsRunningWalletJobs] = useState(false);
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);

  const [msg, setMsg] = useState('');

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) ?? null,
    [selectedTenantId, tenants],
  );

  const withMasterAuth = {
    masterUsername: masterUser,
    masterPassword: masterPass,
  };

  const postMasterJson = async (url: string, payload: Record<string, unknown>) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let data: Record<string, unknown> = {};
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      data = {};
    }

    return { response, data };
  };

  const applyChallengesDashboardData = (data: Record<string, unknown>) => {
    setNetworkChallenges((data.challenges as Challenge[]) ?? []);
    setRewardOptions((data.rewards as RewardOption[]) ?? []);
    setBusinessOptions((data.businesses as BusinessOption[]) ?? []);
  };

  const loadTenants = async (userOverride?: string, passOverride?: string, coalitionOverride?: boolean) => {
    try {
      const res = await fetch('/api/master/list-tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterUsername: userOverride ?? masterUser,
          masterPassword: passOverride ?? masterPass,
          coalitionOnly: coalitionOverride ?? coalitionOnly,
        }),
      });

      if (!res.ok) return false;
      const data = await res.json();
      setTenants(data.tenants ?? []);
      if (!selectedTenantId && data.tenants?.length) {
        setSelectedTenantId(data.tenants[0].id);
      }
      return true;
    } catch {
      return false;
    }
  };

  const loadChallenges = async () => {
    try {
      const { response, data } = await postMasterJson('/api/master/manage-challenges', {
        ...withMasterAuth,
        action: 'LIST',
      });
      if (!response.ok) return false;
      applyChallengesDashboardData(data);
      return true;
    } catch {
      return false;
    }
  };

  const applyWalletSyncData = (data: Record<string, unknown>) => {
    if (data.config && typeof data.config === 'object') {
      setWalletConfig((data.config as WalletSyncConfig));
    }
    setWalletLogs((data.logs as WalletSyncLog[]) ?? []);
    setWalletAlerts((data.alerts as WalletSyncAlert[]) ?? []);
    setWalletJobs((data.jobs as WalletSyncJob[]) ?? []);
    if (data.metrics && typeof data.metrics === 'object') {
      setWalletMetrics((data.metrics as WalletSyncMetrics));
    }
  };

  const loadWalletSync = async () => {
    try {
      const { response, data } = await postMasterJson('/api/master/wallet-sync', {
        ...withMasterAuth,
        action: 'LIST',
        limit: 120,
      });
      if (!response.ok) return false;
      applyWalletSyncData(data);
      return true;
    } catch {
      return false;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    const [tenantsOk, challengesOk, walletOk] = await Promise.all([
      loadTenants(masterUser, masterPass, coalitionOnly),
      loadChallenges(),
      loadWalletSync(),
    ]);
    setIsAuthenticating(false);

    if (!tenantsOk || !challengesOk || !walletOk) {
      alert('Usuario o contraseña maestra incorrectos.');
      return;
    }

    setAuth(true);
  };

  const createTenant = async () => {
    setMsg('Creando negocio...');
    const res = await fetch('/api/master/create-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...withMasterAuth, name: tName, slug: tSlug }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(`❌ ${data.error}`);
      return;
    }
    setMsg(`✅ Negocio creado: ${data.tenant.name}`);
    setTName('');
    setTSlug('');
    await loadTenants();
  };

  const createUser = async () => {
    if (!selectedTenantId) return alert('Selecciona un negocio.');

    const res = await fetch('/api/master/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...withMasterAuth,
        tenantId: selectedTenantId,
        name: uName,
        phone: uPhone,
        email: '',
        username: uUser,
        password: uPass,
        role: uRole,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(`❌ ${data.error}`);
      return;
    }

    setMsg('✅ Usuario agregado.');
    setUName('');
    setUPhone('');
    setUUser('');
    setUPass('');
    await loadTenants();
  };

  const updateTenant = async () => {
    if (!editingTenant) return;

    await fetch('/api/master/manage-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...withMasterAuth,
        action: 'UPDATE',
        tenantId: editingTenant.id,
        data: editingTenant,
      }),
    });

    setEditingTenant(null);
    setMsg('✅ Negocio actualizado.');
    await loadTenants();
  };

  const deleteTenant = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar negocio ${name}?`)) return;
    await fetch('/api/master/manage-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...withMasterAuth, action: 'DELETE', tenantId: id }),
    });
    setMsg('✅ Negocio eliminado.');
    await loadTenants();
  };

  const updateUser = async () => {
    if (!editingUser) return;
    await fetch('/api/master/manage-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...withMasterAuth, action: 'UPDATE', userId: editingUser.id, data: editingUser }),
    });
    setEditingUser(null);
    setMsg('✅ Usuario actualizado.');
    await loadTenants();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('¿Eliminar usuario?')) return;
    await fetch('/api/master/manage-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...withMasterAuth, action: 'DELETE', userId }),
    });
    setMsg('✅ Usuario eliminado.');
    await loadTenants();
  };

  const downloadReport = async (report: 'prelaunch' | 'tenant-users' | 'redemption-logs', onlySelectedTenant = false) => {
    const res = await fetch('/api/master/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...withMasterAuth,
        report,
        tenantId: onlySelectedTenant ? selectedTenantId : undefined,
      }),
    });

    if (!res.ok) {
      setMsg('❌ No se pudo descargar el reporte.');
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const submitChallenge = async () => {
    const action = editingChallengeId ? 'UPDATE' : 'CREATE';
    setIsSavingChallenge(true);

    try {
      const { response, data } = await postMasterJson('/api/master/manage-challenges', {
        ...withMasterAuth,
        action,
        challengeId: editingChallengeId,
        ...challengeForm,
      });

      if (!response.ok) {
        setMsg(`❌ ${String(data.error || 'No se pudo guardar el reto')}`);
        return;
      }

      applyChallengesDashboardData(data);
      setChallengeForm(initialChallengeForm);
      setEditingChallengeId(null);
      setMsg(`✅ Reto ${action === 'CREATE' ? 'creado' : 'actualizado'}.`);
    } finally {
      setIsSavingChallenge(false);
    }
  };

  const removeChallenge = async (challengeId: string) => {
    if (!confirm('¿Eliminar reto de red?')) return;

    const { response, data } = await postMasterJson('/api/master/manage-challenges', {
      ...withMasterAuth,
      action: 'DELETE',
      challengeId,
    });

    if (!response.ok) {
      setMsg(`❌ ${String(data.error || 'No se pudo eliminar el reto')}`);
      return;
    }

    applyChallengesDashboardData(data);
    setMsg('✅ Reto eliminado.');
  };

  const startEditingChallenge = (challenge: Challenge) => {
    setEditingChallengeId(challenge.id);
    setChallengeForm({
      title: challenge.title,
      description: challenge.description,
      challengeType: challenge.challengeType,
      targetValue: challenge.targetValue,
      timeWindow: challenge.timeWindow,
      active: challenge.active,
      rewardCampaignId: challenge.rewardCampaign?.id ?? '',
    });
  };

  const saveWalletConfig = async () => {
    setIsSavingWalletConfig(true);
    try {
      const { response, data } = await postMasterJson('/api/master/wallet-sync', {
        ...withMasterAuth,
        action: 'UPDATE',
        ...walletConfig,
        limit: 120,
      });

      if (!response.ok) {
        setMsg(`❌ ${String(data.error || 'No se pudo guardar la configuración de sync')}`);
        return;
      }
      applyWalletSyncData(data);
      setMsg('✅ Configuración de sincronización wallet actualizada.');
    } finally {
      setIsSavingWalletConfig(false);
    }
  };

  const runWalletJobsNow = async () => {
    setIsRunningWalletJobs(true);
    try {
      const { response, data } = await postMasterJson('/api/master/wallet-sync', {
        ...withMasterAuth,
        action: 'RUN_JOBS',
        batchSize: walletConfig.workerBatchSize,
        limit: 120,
        jobsLimit: 120,
      });
      if (!response.ok) {
        setMsg(`❌ ${String(data.error || 'No se pudo ejecutar la cola de sync')}`);
        return;
      }
      applyWalletSyncData(data);
      const processed = Number(data.processed || 0);
      const succeeded = Number(data.succeeded || 0);
      const failed = Number(data.failed || 0);
      setMsg(`✅ Cola procesada. Total: ${processed}, OK: ${succeeded}, Fallos: ${failed}.`);
    } finally {
      setIsRunningWalletJobs(false);
    }
  };

  const runMaintenanceNow = async () => {
    setIsRunningMaintenance(true);
    try {
      const { response, data } = await postMasterJson('/api/master/wallet-sync', {
        ...withMasterAuth,
        action: 'RUN_MAINTENANCE',
        forceRun: true,
      });
      if (!response.ok) {
        setMsg(`❌ ${String(data.error || 'No se pudo ejecutar mantenimiento')}`);
        return;
      }
      const deletedAuditRows = Number(data.deletedAuditRows || 0);
      const deletedCompletedJobs = Number(data.deletedCompletedJobs || 0);
      setMsg(`✅ Mantenimiento ejecutado. Logs eliminados: ${deletedAuditRows}, jobs depurados: ${deletedCompletedJobs}.`);
      await loadWalletSync();
    } finally {
      setIsRunningMaintenance(false);
    }
  };

  if (!auth) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-6 flex items-center justify-center">
        <form onSubmit={handleAuth} className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4">
          <h1 className="text-2xl font-bold">Panel Master · Punto IA</h1>
          <p className="text-sm text-slate-400">Acceso para administración global de negocios y retos.</p>
          <input className="w-full rounded-lg bg-slate-800 p-3" placeholder="Usuario master" value={masterUser} onChange={(e) => setMasterUser(e.target.value)} />
          <input className="w-full rounded-lg bg-slate-800 p-3" type="password" placeholder="Contraseña master" value={masterPass} onChange={(e) => setMasterPass(e.target.value)} />
          <button disabled={isAuthenticating} className="w-full rounded-lg bg-emerald-500 text-slate-950 font-semibold py-3 disabled:opacity-60">
            {isAuthenticating ? 'Validando...' : 'Entrar'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Control Master</h1>
            <p className="text-sm text-slate-400">Administra operación de negocios y retos de red en un solo lugar.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('negocios')} className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'negocios' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-200'}`}>Negocios</button>
            <button onClick={() => setActiveTab('retos')} className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'retos' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-200'}`}>Retos de red</button>
            <button onClick={() => setActiveTab('wallet')} className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'wallet' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-200'}`}>Wallet Sync</button>
          </div>
        </div>
        {msg ? <p className="mt-4 text-sm text-emerald-300">{msg}</p> : null}
      </section>

      {activeTab === 'negocios' ? (
        <section className="grid xl:grid-cols-[420px_minmax(0,1fr)] gap-5">
          <div className="space-y-5">
            <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4 space-y-3">
              <h2 className="font-semibold">Crear negocio</h2>
              <input className="w-full rounded-lg bg-slate-800 p-3" placeholder="Nombre comercial" value={tName} onChange={(e) => setTName(e.target.value)} />
              <input className="w-full rounded-lg bg-slate-800 p-3" placeholder="Slug" value={tSlug} onChange={(e) => setTSlug(e.target.value)} />
              <button onClick={createTenant} className="w-full rounded-lg bg-emerald-500 text-slate-950 py-2 font-semibold">Crear</button>
            </article>

            <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Crear usuario</h2>
                <span className="text-xs text-slate-400">Negocio: {selectedTenant?.name ?? 'Sin seleccionar'}</span>
              </div>
              <input className="w-full rounded-lg bg-slate-800 p-3" placeholder="Nombre" value={uName} onChange={(e) => setUName(e.target.value)} />
              <input className="w-full rounded-lg bg-slate-800 p-3" placeholder="Teléfono" value={uPhone} onChange={(e) => setUPhone(e.target.value)} />
              <input className="w-full rounded-lg bg-slate-800 p-3" placeholder="Usuario" value={uUser} onChange={(e) => setUUser(e.target.value)} />
              <input className="w-full rounded-lg bg-slate-800 p-3" type="password" placeholder="Contraseña" value={uPass} onChange={(e) => setUPass(e.target.value)} />
              <select className="w-full rounded-lg bg-slate-800 p-3" value={uRole} onChange={(e) => setURole(e.target.value)}>
                <option value="ADMIN">ADMIN</option>
                <option value="STAFF">STAFF</option>
              </select>
              <button onClick={createUser} className="w-full rounded-lg bg-blue-500 text-white py-2 font-semibold">Agregar usuario</button>
            </article>

            <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4 space-y-3">
              <h2 className="font-semibold">Reportes</h2>
              <div className="flex items-center justify-between rounded-lg bg-slate-800 p-3 text-sm">
                <span>Mostrar solo negocios de coalición</span>
                <input type="checkbox" checked={coalitionOnly} onChange={async (e) => {
                  setCoalitionOnly(e.target.checked);
                  await loadTenants(undefined, undefined, e.target.checked);
                }} />
              </div>
              <button onClick={() => downloadReport('tenant-users', false)} className="w-full rounded-lg bg-slate-700 py-2">Usuarios por negocio</button>
              <button onClick={() => downloadReport('prelaunch', false)} className="w-full rounded-lg bg-slate-700 py-2">Leads prelaunch</button>
              <button onClick={() => downloadReport('tenant-users', true)} disabled={!selectedTenantId} className="w-full rounded-lg bg-slate-700 py-2 disabled:opacity-40">Usuarios del negocio seleccionado</button>
              <button onClick={() => downloadReport('redemption-logs', false)} className="w-full rounded-lg bg-slate-700 py-2">Logs de canje (global)</button>
              <button onClick={() => downloadReport('redemption-logs', true)} disabled={!selectedTenantId} className="w-full rounded-lg bg-slate-700 py-2 disabled:opacity-40">Logs de canje del negocio</button>
            </article>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 space-y-3">
            <h2 className="font-semibold">Negocios ({tenants.length})</h2>
            <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
              {tenants.map((tenant) => (
                <article key={tenant.id} className={`rounded-xl border p-4 ${selectedTenantId === tenant.id ? 'border-emerald-500 bg-slate-800' : 'border-slate-700 bg-slate-900'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <button className="text-left flex-1" onClick={() => setSelectedTenantId(tenant.id)}>
                      <h3 className="font-semibold">{tenant.name}</h3>
                      <p className="text-xs text-slate-400">/{tenant.slug} · CODE {tenant.codePrefix ?? 'N/A'}</p>
                      <p className="text-xs text-slate-400 mt-1">{tenant.coalitionOptIn ? `Coalición ${tenant.coalitionDiscountPercent ?? 0}% en ${tenant.coalitionProduct || 'producto'}` : 'Sin coalición activa'}</p>
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingTenant(tenant)} className="text-xs px-2 py-1 rounded bg-amber-500 text-slate-950">Editar</button>
                      <button onClick={() => deleteTenant(tenant.id, tenant.name)} className="text-xs px-2 py-1 rounded bg-rose-600">Eliminar</button>
                    </div>
                  </div>
                  <div className="mt-3 grid md:grid-cols-2 gap-2">
                    {tenant.users.map((user) => (
                      <div key={user.id} className="rounded-lg border border-slate-700 bg-slate-800 p-2 flex justify-between items-center gap-2">
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.username} · {user.role}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-xs text-slate-300" onClick={() => setEditingUser(user)}>✏️</button>
                          <button className="text-xs text-rose-300" onClick={() => deleteUser(user.id)}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : activeTab === 'retos' ? (
        <section className="grid xl:grid-cols-[460px_minmax(0,1fr)] gap-5">
          <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-slate-800 p-2">
                <p className="text-slate-400">Retos</p>
                <p className="text-base font-semibold">{networkChallenges.length}</p>
              </div>
              <div className="rounded-lg bg-slate-800 p-2">
                <p className="text-slate-400">Recompensas</p>
                <p className="text-base font-semibold">{rewardOptions.length}</p>
              </div>
              <div className="rounded-lg bg-slate-800 p-2">
                <p className="text-slate-400">Negocios activos</p>
                <p className="text-base font-semibold">{businessOptions.length}</p>
              </div>
            </div>
            <h2 className="font-semibold">{editingChallengeId ? 'Editar reto de red' : 'Crear reto de red'}</h2>
            <input className="w-full rounded-lg bg-slate-800 p-3" placeholder="Título" value={challengeForm.title} onChange={(e) => setChallengeForm((prev) => ({ ...prev, title: e.target.value }))} />
            <textarea className="w-full rounded-lg bg-slate-800 p-3 min-h-24" placeholder="Descripción" value={challengeForm.description} onChange={(e) => setChallengeForm((prev) => ({ ...prev, description: e.target.value }))} />
            <select className="w-full rounded-lg bg-slate-800 p-3" value={challengeForm.challengeType} onChange={(e) => setChallengeForm((prev) => ({ ...prev, challengeType: e.target.value as 'VISIT_COUNT' | 'DISTINCT_BUSINESSES' }))}>
              <option value="VISIT_COUNT">Visitas acumuladas</option>
              <option value="DISTINCT_BUSINESSES">Negocios distintos</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input className="rounded-lg bg-slate-800 p-3" type="number" min={1} value={challengeForm.targetValue} onChange={(e) => setChallengeForm((prev) => ({ ...prev, targetValue: Number(e.target.value) }))} />
              <input className="rounded-lg bg-slate-800 p-3" type="number" min={1} value={challengeForm.timeWindow} onChange={(e) => setChallengeForm((prev) => ({ ...prev, timeWindow: Number(e.target.value) }))} />
            </div>
            <select className="w-full rounded-lg bg-slate-800 p-3" value={challengeForm.rewardCampaignId} onChange={(e) => setChallengeForm((prev) => ({ ...prev, rewardCampaignId: e.target.value }))}>
              <option value="">Sin recompensa asociada</option>
              {rewardOptions.map((reward) => (
                <option key={reward.id} value={reward.id}>{reward.business.name} · {reward.title} ({reward.rewardValue})</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={challengeForm.active} onChange={(e) => setChallengeForm((prev) => ({ ...prev, active: e.target.checked }))} />
              Reto activo
            </label>
            <div className="flex gap-2">
              <button onClick={submitChallenge} disabled={isSavingChallenge || challengeForm.title.trim().length < 3 || challengeForm.description.trim().length < 10} className="flex-1 rounded-lg bg-emerald-500 text-slate-950 py-2 font-semibold disabled:opacity-60">
                {isSavingChallenge ? 'Guardando...' : editingChallengeId ? 'Guardar cambios' : 'Crear reto'}
              </button>
              {editingChallengeId ? (
                <button onClick={() => {
                  setEditingChallengeId(null);
                  setChallengeForm(initialChallengeForm);
                }} className="rounded-lg px-3 py-2 bg-slate-700">Cancelar</button>
              ) : null}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Retos configurados</h2>
              <button onClick={loadChallenges} disabled={isSavingChallenge} className="text-sm rounded-lg px-3 py-1 bg-slate-700 disabled:opacity-60">Recargar</button>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
              {networkChallenges.map((challenge) => (
                <article key={challenge.id} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{challenge.title}</h3>
                      <p className="text-sm text-slate-300">{challenge.description}</p>
                      <p className="text-xs text-slate-400 mt-2">{challenge.challengeType === 'VISIT_COUNT' ? 'Visitas acumuladas' : 'Negocios distintos'} · Meta: {challenge.targetValue} · Ventana: {challenge.timeWindow} días</p>
                      <p className="text-xs text-slate-400">Recompensa: {challenge.rewardCampaign ? `${challenge.rewardCampaign.business.name} · ${challenge.rewardCampaign.title}` : 'Sin recompensa'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${challenge.active ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>{challenge.active ? 'Activo' : 'Inactivo'}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => startEditingChallenge(challenge)} className="text-xs px-2 py-1 rounded bg-amber-500 text-slate-950">Editar</button>
                    <button onClick={() => removeChallenge(challenge.id)} className="text-xs px-2 py-1 rounded bg-rose-600">Eliminar</button>
                  </div>
                </article>
              ))}
              {networkChallenges.length === 0 ? <p className="text-sm text-slate-400">No hay retos de red configurados todavía.</p> : null}
            </div>
          </article>
        </section>
      ) : (
        <section className="grid xl:grid-cols-[420px_minmax(0,1fr)] gap-5">
          <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4 space-y-3">
            <h2 className="font-semibold">Controles de sincronización Wallet</h2>
            <label className="flex items-center justify-between rounded-lg bg-slate-800 p-3 text-sm">
              <span>Apple sync habilitado</span>
              <input type="checkbox" checked={walletConfig.appleEnabled} onChange={(e) => setWalletConfig((prev) => ({ ...prev, appleEnabled: e.target.checked }))} />
            </label>
            <label className="flex items-center justify-between rounded-lg bg-slate-800 p-3 text-sm">
              <span>Google sync habilitado</span>
              <input type="checkbox" checked={walletConfig.googleEnabled} onChange={(e) => setWalletConfig((prev) => ({ ...prev, googleEnabled: e.target.checked }))} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-300 space-y-1">
                <span>Concurrency touch Apple</span>
                <input className="w-full rounded-lg bg-slate-800 p-2" type="number" min={1} max={20} value={walletConfig.appleTouchConcurrency} onChange={(e) => setWalletConfig((prev) => ({ ...prev, appleTouchConcurrency: Number(e.target.value) }))} />
              </label>
              <label className="text-xs text-slate-300 space-y-1">
                <span>Concurrency push Apple</span>
                <input className="w-full rounded-lg bg-slate-800 p-2" type="number" min={1} max={20} value={walletConfig.applePushConcurrency} onChange={(e) => setWalletConfig((prev) => ({ ...prev, applePushConcurrency: Number(e.target.value) }))} />
              </label>
            </div>
            <label className="text-xs text-slate-300 space-y-1 block">
              <span>Máximo clientes por sync Google</span>
              <input className="w-full rounded-lg bg-slate-800 p-2" type="number" min={10} max={5000} value={walletConfig.googleSyncMaxCustomers} onChange={(e) => setWalletConfig((prev) => ({ ...prev, googleSyncMaxCustomers: Number(e.target.value) }))} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-300 space-y-1">
                <span>Umbral de alerta (errores)</span>
                <input className="w-full rounded-lg bg-slate-800 p-2" type="number" min={1} max={1000} value={walletConfig.alertErrorThreshold} onChange={(e) => setWalletConfig((prev) => ({ ...prev, alertErrorThreshold: Number(e.target.value) }))} />
              </label>
              <label className="text-xs text-slate-300 space-y-1">
                <span>Ventana alerta (min)</span>
                <input className="w-full rounded-lg bg-slate-800 p-2" type="number" min={5} max={1440} value={walletConfig.alertWindowMinutes} onChange={(e) => setWalletConfig((prev) => ({ ...prev, alertWindowMinutes: Number(e.target.value) }))} />
              </label>
            </div>
            <label className="text-xs text-slate-300 space-y-1 block">
              <span>Modo de ejecución</span>
              <select className="w-full rounded-lg bg-slate-800 p-2" value={walletConfig.executionMode} onChange={(e) => setWalletConfig((prev) => ({ ...prev, executionMode: e.target.value as 'immediate' | 'queued' }))}>
                <option value="queued">Queued (recomendado)</option>
                <option value="immediate">Immediate</option>
              </select>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="text-xs text-slate-300 space-y-1">
                <span>Batch worker</span>
                <input className="w-full rounded-lg bg-slate-800 p-2" type="number" min={1} max={500} value={walletConfig.workerBatchSize} onChange={(e) => setWalletConfig((prev) => ({ ...prev, workerBatchSize: Number(e.target.value) }))} />
              </label>
              <label className="text-xs text-slate-300 space-y-1">
                <span>Max intentos</span>
                <input className="w-full rounded-lg bg-slate-800 p-2" type="number" min={1} max={20} value={walletConfig.workerMaxAttempts} onChange={(e) => setWalletConfig((prev) => ({ ...prev, workerMaxAttempts: Number(e.target.value) }))} />
              </label>
              <label className="text-xs text-slate-300 space-y-1">
                <span>Retry delay (seg)</span>
                <input className="w-full rounded-lg bg-slate-800 p-2" type="number" min={10} max={86400} value={walletConfig.workerRetryDelaySeconds} onChange={(e) => setWalletConfig((prev) => ({ ...prev, workerRetryDelaySeconds: Number(e.target.value) }))} />
              </label>
              <label className="text-xs text-slate-300 space-y-1">
                <span>Stale lock (min)</span>
                <input className="w-full rounded-lg bg-slate-800 p-2" type="number" min={1} max={240} value={walletConfig.workerLockTimeoutMinutes} onChange={(e) => setWalletConfig((prev) => ({ ...prev, workerLockTimeoutMinutes: Number(e.target.value) }))} />
              </label>
            </div>
            <label className="flex items-center justify-between rounded-lg bg-slate-800 p-3 text-sm">
              <span>Worker de cola habilitado</span>
              <input type="checkbox" checked={walletConfig.workerEnabled} onChange={(e) => setWalletConfig((prev) => ({ ...prev, workerEnabled: e.target.checked }))} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-between rounded-lg bg-slate-800 p-3 text-sm">
                <span>Mantenimiento habilitado</span>
                <input type="checkbox" checked={walletConfig.maintenanceEnabled} onChange={(e) => setWalletConfig((prev) => ({ ...prev, maintenanceEnabled: e.target.checked }))} />
              </label>
              <label className="text-xs text-slate-300 space-y-1">
                <span>Hora mantenimiento UTC</span>
                <input className="w-full rounded-lg bg-slate-800 p-2" type="number" min={0} max={23} value={walletConfig.maintenanceHourUtc} onChange={(e) => setWalletConfig((prev) => ({ ...prev, maintenanceHourUtc: Number(e.target.value) }))} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-300 space-y-1">
                <span>Retención logs (días)</span>
                <input className="w-full rounded-lg bg-slate-800 p-2" type="number" min={1} max={365} value={walletConfig.auditRetentionDays} onChange={(e) => setWalletConfig((prev) => ({ ...prev, auditRetentionDays: Number(e.target.value) }))} />
              </label>
              <label className="text-xs text-slate-300 space-y-1">
                <span>Retención jobs (días)</span>
                <input className="w-full rounded-lg bg-slate-800 p-2" type="number" min={1} max={365} value={walletConfig.jobRetentionDays} onChange={(e) => setWalletConfig((prev) => ({ ...prev, jobRetentionDays: Number(e.target.value) }))} />
              </label>
            </div>
            <p className="text-xs text-slate-400">Última actualización: {walletConfig.updatedAt ? new Date(walletConfig.updatedAt).toLocaleString('es-MX') : '—'}</p>
            <div className="flex gap-2">
              <button onClick={saveWalletConfig} disabled={isSavingWalletConfig} className="flex-1 rounded-lg bg-emerald-500 text-slate-950 py-2 font-semibold disabled:opacity-60">
                {isSavingWalletConfig ? 'Guardando...' : 'Guardar configuración'}
              </button>
              <button onClick={runWalletJobsNow} disabled={isRunningWalletJobs} className="rounded-lg bg-blue-600 px-3 py-2 disabled:opacity-60">
                {isRunningWalletJobs ? 'Procesando cola...' : 'Procesar cola'}
              </button>
              <button onClick={runMaintenanceNow} disabled={isRunningMaintenance} className="rounded-lg bg-amber-500 text-slate-900 px-3 py-2 disabled:opacity-60">
                {isRunningMaintenance ? 'Ejecutando maintenance...' : 'Maintenance ahora'}
              </button>
              <button onClick={loadWalletSync} className="rounded-lg bg-slate-700 px-3 py-2">Recargar</button>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Alertas y logs de wallet sync</h2>
              <span className="text-xs text-slate-400">Últimos {walletLogs.length} eventos</span>
            </div>
            {walletAlerts.length > 0 ? (
              <div className="space-y-2">
                {walletAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-rose-500/60 bg-rose-950/30 p-3 text-sm text-rose-200">
                    ⚠️ {alert.message}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-300">Sin alertas activas.</p>
            )}

            <div className="space-y-2 max-h-[64vh] overflow-auto pr-1">
              {walletLogs.map((log) => (
                <article key={log.id} className="rounded-lg border border-slate-700 bg-slate-800 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded ${log.status === 'success' ? 'bg-emerald-900 text-emerald-300' : log.status === 'error' ? 'bg-rose-900 text-rose-300' : 'bg-slate-700 text-slate-300'}`}>
                      {log.status.toUpperCase()}
                    </span>
                    <span className="text-slate-400">{new Date(log.created_at).toLocaleString('es-MX')}</span>
                  </div>
                  <p className="mt-1 text-slate-200">
                    <strong>Tenant:</strong> {log.tenant_id} · <strong>Canal:</strong> {log.channel} · <strong>Motivo:</strong> {log.reason}
                  </p>
                  {log.message ? <p className="mt-1 text-slate-300">{log.message}</p> : null}
                </article>
              ))}
              {walletLogs.length === 0 ? <p className="text-sm text-slate-400">No hay logs de sincronización todavía.</p> : null}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="rounded-lg bg-slate-800 p-2">
                <p className="text-slate-400">Queue Pending</p>
                <p className="text-base font-semibold">{walletMetrics.queue.pending}</p>
              </div>
              <div className="rounded-lg bg-slate-800 p-2">
                <p className="text-slate-400">Queue Running</p>
                <p className="text-base font-semibold">{walletMetrics.queue.running}</p>
              </div>
              <div className="rounded-lg bg-slate-800 p-2">
                <p className="text-slate-400">Errores (24h)</p>
                <p className="text-base font-semibold">{walletMetrics.auditLast24h.error}</p>
              </div>
              <div className="rounded-lg bg-slate-800 p-2">
                <p className="text-slate-400">Success (24h)</p>
                <p className="text-base font-semibold">{walletMetrics.auditLast24h.success}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <h3 className="font-medium mb-2">Cola de trabajos ({walletJobs.length})</h3>
              <div className="space-y-2 max-h-48 overflow-auto pr-1 text-xs">
                {walletJobs.map((job) => (
                  <div key={job.id} className="rounded-md border border-slate-700 p-2">
                    <p><strong>Job {job.id}</strong> · {job.status.toUpperCase()} · Tenant {job.tenant_id}</p>
                    <p className="text-slate-300">Intentos: {job.attempts}/{job.max_attempts} · Run after: {new Date(job.run_after).toLocaleString('es-MX')}</p>
                    {job.last_error ? <p className="text-rose-300">Error: {job.last_error}</p> : null}
                  </div>
                ))}
                {walletJobs.length === 0 ? <p className="text-slate-400">Sin trabajos en cola.</p> : null}
              </div>
            </div>
          </article>
        </section>
      )}

      {editingTenant ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-slate-600 bg-slate-900 p-5 space-y-3">
            <h2 className="font-semibold text-lg">Editar negocio</h2>
            <input className="w-full rounded-lg bg-slate-800 p-3" value={editingTenant.name} onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })} />
            <input className="w-full rounded-lg bg-slate-800 p-3" value={editingTenant.slug} onChange={(e) => setEditingTenant({ ...editingTenant, slug: e.target.value })} />
            <div className="rounded-lg bg-slate-800 p-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editingTenant.isActive !== false} onChange={(e) => setEditingTenant({ ...editingTenant, isActive: e.target.checked })} />
                Negocio activo
              </label>
            </div>
            <div className="rounded-lg bg-slate-800 p-3 space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={Boolean(editingTenant.coalitionOptIn)} onChange={(e) => setEditingTenant({ ...editingTenant, coalitionOptIn: e.target.checked })} />
                Activar coalición
              </label>
              <input className="w-full rounded-lg bg-slate-900 p-2" type="number" value={editingTenant.coalitionDiscountPercent ?? 10} onChange={(e) => setEditingTenant({ ...editingTenant, coalitionDiscountPercent: Number(e.target.value) })} />
              <input className="w-full rounded-lg bg-slate-900 p-2" value={editingTenant.coalitionProduct ?? ''} onChange={(e) => setEditingTenant({ ...editingTenant, coalitionProduct: e.target.value })} placeholder="Producto participante" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingTenant(null)} className="rounded-lg bg-slate-700 px-3 py-2">Cancelar</button>
              <button onClick={updateTenant} className="rounded-lg bg-emerald-500 text-slate-950 px-3 py-2 font-semibold">Guardar</button>
            </div>
          </div>
        </div>
      ) : null}

      {editingUser ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-slate-600 bg-slate-900 p-5 space-y-3">
            <h2 className="font-semibold text-lg">Editar usuario</h2>
            <input className="w-full rounded-lg bg-slate-800 p-3" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} />
            <input className="w-full rounded-lg bg-slate-800 p-3" value={editingUser.username} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })} />
            <input className="w-full rounded-lg bg-slate-800 p-3" type="password" value={editingUser.password ?? ''} onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} placeholder="Contraseña nueva" />
            <select className="w-full rounded-lg bg-slate-800 p-3" value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
              <option value="ADMIN">ADMIN</option>
              <option value="STAFF">STAFF</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingUser(null)} className="rounded-lg bg-slate-700 px-3 py-2">Cancelar</button>
              <button onClick={updateUser} className="rounded-lg bg-emerald-500 text-slate-950 px-3 py-2 font-semibold">Guardar</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
