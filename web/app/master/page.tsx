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
  const [activeTab, setActiveTab] = useState<'negocios' | 'retos'>('negocios');

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    const [tenantsOk, challengesOk] = await Promise.all([loadTenants(masterUser, masterPass, coalitionOnly), loadChallenges()]);
    setIsAuthenticating(false);

    if (!tenantsOk || !challengesOk) {
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

  const downloadReport = async (report: 'prelaunch' | 'tenant-users', onlySelectedTenant = false) => {
    const res = await fetch('/api/master/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...withMasterAuth,
        reportType: report,
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
      ) : (
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
