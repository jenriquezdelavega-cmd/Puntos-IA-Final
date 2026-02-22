#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"
if [ ! -d "$ROOT_DIR/web" ]; then
  echo "Error: ejecuta desde la raíz del repo (debe existir carpeta web)."
  exit 1
fi

mkdir -p web/app/admin web/app web/app/pass web/app/api/pass/[customer_id] web/app/api/pass/resolve-token web/app/api/pass web/app/lib web/app/api/wallet/apple

cat > web/app/admin/page.tsx <<'EOF_web_app_admin_page_tsx'
'use client';
import { useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import dynamic from 'next/dynamic';

const AdminMap = dynamic(() => import('../components/AdminMap'), { ssr: false, loading: () => <div className="h-full bg-gray-100 animate-pulse text-center pt-10 text-gray-400">Cargando...</div> });

const QRScanner = dynamic(() => import('@yudiel/react-qr-scanner').then((m) => m.Scanner), {
  ssr: false,
  loading: () => <div className="h-[320px] rounded-2xl bg-gray-100 animate-pulse text-center pt-24 text-gray-400">Cargando cámara...</div>,
});

export default function AdminPage() {
const [tenant, setTenant] = useState<any>(null);
const [tenantUserId, setTenantUserId] = useState<string>('');
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');

const [code, setCode] = useState('');
const [reportData, setReportData] = useState<any>(null);
const [baseUrl, setBaseUrl] = useState('');
const [tab, setTab] = useState('qr');
const [userRole, setUserRole] = useState('');

const [prizeName, setPrizeName] = useState('');
const [requiredVisits, setRequiredVisits] = useState('10');
const [rewardPeriod, setRewardPeriod] = useState('OPEN');
const [logoData, setLogoData] = useState<string>('');
const [instagram, setInstagram] = useState('');
const [addressSearch, setAddressSearch] = useState('');
const [isSearching, setIsSearching] = useState(false);
const [coords, setCoords] = useState<[number, number]>([19.4326, -99.1332]);

const [redeemCode, setRedeemCode] = useState('');
const [msg, setMsg] = useState('');
const [scannerOpen, setScannerOpen] = useState(false);
const [scannerMsg, setScannerMsg] = useState('');
const lastScanRef = useRef<string>('');

const [team, setTeam] = useState<any[]>([]);
const [newStaff, setNewStaff] = useState({ name: '', username: '', password: '', role: 'STAFF' });
const [lastScannedCustomerId, setLastScannedCustomerId] = useState('');

const trendData = reportData?.chartData ?? [];
const genderData = reportData?.genderData ?? [];
const ageData = reportData?.ageData ?? [];
const totalClients = reportData?.csvData?.length || 0;
const totalCheckins = trendData.reduce((sum: number, item: any) => sum + Number(item.count || 0), 0);
const peakDay = trendData.reduce((max: any, item: any) => {
  return Number(item.count || 0) > Number(max?.count || 0) ? item : max;
}, null);
const trendMax = Math.max(...trendData.map((d: any) => Number(d.count || 0)), 1);
const genderMax = Math.max(...genderData.map((d: any) => Number(d.value || 0)), 1);
const ageMax = Math.max(...ageData.map((d: any) => Number(d.value || 0)), 1);

const handleLogin = async (e: React.FormEvent) => {
e.preventDefault();
try {
const res = await fetch('/api/tenant/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ username, password }) });
const data = await res.json();
if(res.ok) {
setTenant(data.tenant);
setUserRole(data.user.role);
setTenantUserId(data.user.id || '');
setPrizeName(data.tenant.prize || '');
setInstagram(data.tenant.instagram || '');
setRequiredVisits(String(data.tenant.requiredVisits ?? 10));
setRewardPeriod(String(data.tenant.rewardPeriod ?? 'OPEN'));
setLogoData(String(data.tenant.logoData ?? ''));
if (data.tenant.lat && data.tenant.lng) {
setCoords([data.tenant.lat, data.tenant.lng]);
if (data.tenant.address) setAddressSearch(data.tenant.address);
}
if (typeof window !== 'undefined') setBaseUrl(window.location.origin);

if (data.user.role === 'ADMIN') { 
setTab('qr'); 
loadReports(data.tenant.id); 
loadTeam(data.tenant.id);
} else setTab('qr');

} else alert(data.error);
} catch(e) { alert('Error'); }
};

const loadReports = async (tid: string) => { try { const res = await fetch('/api/admin/reports', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ tenantId: tid }) }); setReportData(await res.json()); } catch(e) {} };

const loadTeam = async (tid: string) => {
try { const res = await fetch(`/api/tenant/users?tenantId=${tid}`); const data = await res.json(); if(data.users) setTeam(data.users); } catch(e) {}
};

const createStaff = async () => {
if(!newStaff.name || !newStaff.username || !newStaff.password) return alert("Faltan datos");
try {
const res = await fetch('/api/tenant/users', { 
method: 'POST', headers: {'Content-Type': 'application/json'}, 
body: JSON.stringify({ tenantId: tenant.id, ...newStaff }) 
});
if(res.ok) { 
alert("Empleado creado "); 
setNewStaff({ name: '', username: '', password: '', role: 'STAFF' }); 
loadTeam(tenant.id); 
} else { const d = await res.json(); alert(d.error); }
} catch(e) { alert("Error"); }
};

const deleteStaff = async (id: string) => {
if(!confirm("¿Eliminar empleado?")) return;
try { await fetch('/api/tenant/users', { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id }) }); loadTeam(tenant.id); } catch(e) {}
};

const generateCode = async () => { try { const res = await fetch('/api/admin/generate', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ tenantId: tenant.id, tenantUserId }) }); const data = await res.json(); if (data.code) setCode(data.code); } catch (e) {} };

const searchLocation = async () => {
if (!addressSearch) return;
setIsSearching(true);
try {
const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearch)}`);
const data = await res.json();
if (data && data.length > 0) { setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]); } else alert("No encontrado");
} catch (e) { alert("Error"); }
setIsSearching(false);
};

const saveSettings = async () => {
  try {
    const res = await fetch('/api/tenant/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: tenant.id,
        prize: prizeName,
        requiredVisits,
        rewardPeriod,
        logoData, // ✅ AHORA SÍ SE ENVÍA
        lat: coords[0],
        lng: coords[1],
        address: addressSearch,
        instagram
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Error guardando');
      return;
    }

    // ✅ Persistencia: actualiza tenant en UI con lo que regresa el backend
    if (data?.tenant) {
      setTenant(data.tenant);
      setLogoData(String(data.tenant.logoData ?? ''));
      setPrizeName(data.tenant.prize || '');
      setInstagram(data.tenant.instagram || '');
      setRequiredVisits(String(data.tenant.requiredVisits ?? 10));
      setRewardPeriod(String(data.tenant.rewardPeriod ?? 'OPEN'));
    }

    alert('✅ Guardado');
  } catch (e) {
    alert('Error');
  }
};

const validateRedeem = async () => { setMsg('Validando...'); try { const res = await fetch('/api/redeem/validate', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ tenantId: tenant.id, code: redeemCode }) }); const data = await res.json(); if (res.ok) { setMsg(` ENTREGAR A: ${data.user}`); setRedeemCode(''); if(userRole==='ADMIN') loadReports(tenant.id); } else setMsg(' ' + data.error); } catch(e) { setMsg('Error'); } };
const downloadCSV = () => { if (!reportData?.csvData) return; const headers = Object.keys(reportData.csvData[0]).join(','); const rows = reportData.csvData.map((obj: any) => Object.values(obj).join(',')).join('\n'); const encodedUri = encodeURI("data:text/csv;charset=utf-8," + headers + "\n" + rows); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `clientes_${tenant.slug}.csv`); document.body.appendChild(link); link.click(); };


const ensureDailyCode = async () => {
  const res = await fetch('/api/admin/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: tenant.id, tenantUserId }),
  });
  const data = await res.json();
  if (!res.ok || !data?.code) throw new Error(data?.error || 'No se pudo generar código diario');
  setCode(data.code);
  return String(data.code);
};

const resolveScannedCustomerId = async (rawValue: string) => {
  const raw = String(rawValue || '').trim();
  if (!raw) throw new Error('QR vacío');

  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get('customer_id') || url.searchParams.get('customerId');
    if (fromQuery) return fromQuery;
  } catch {}

  const uuidMatch = raw.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/);
  if (uuidMatch?.[0]) return uuidMatch[0];

  const res = await fetch('/api/pass/resolve-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrValue: raw }),
  });
  const data = await res.json();
  if (!res.ok || !data?.customerId) throw new Error(data?.error || 'No se pudo resolver cliente del QR');
  return String(data.customerId);
};

const handleAdminScan = async (rawValue: string) => {
  const raw = String(rawValue || '').trim();
  if (!raw) return;
  if (lastScanRef.current === raw) return;
  lastScanRef.current = raw;

  setScannerMsg('Procesando QR...');
  try {
    const customerId = await resolveScannedCustomerId(raw);
    const todayCode = await ensureDailyCode();

    const res = await fetch('/api/check-in/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: customerId, code: todayCode }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'No se pudo registrar visita');

    setScannerMsg(`✅ ${data.message || 'Visita registrada'} (${data.visits}/${data.requiredVisits})`);
    setMsg(`✅ ${data.message || 'Visita registrada'} (${data.visits}/${data.requiredVisits})`);
    setLastScannedCustomerId(customerId);
  } catch (error: unknown) {
    const text = error instanceof Error ? error.message : 'Error al escanear';
    setScannerMsg(`❌ ${text}`);
    setMsg(`❌ ${text}`);
  } finally {
    setTimeout(() => {
      lastScanRef.current = '';
    }, 1200);
  }
};

if (!tenant) return <div className="min-h-screen bg-gray-900 flex justify-center items-center p-4"><div className="bg-gray-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700"><div className="text-center mb-8"><h1 className="text-3xl font-black text-white tracking-tighter">punto<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">IA</span></h1><p className="text-gray-400 text-sm mt-2">Acceso de Personal</p></div><form onSubmit={handleLogin} className="space-y-4"><input className="w-full p-4 rounded-xl bg-gray-700 text-white border border-gray-600 outline-none" placeholder="Usuario (Ej: PIZZA.juan)" value={username} onChange={e=>setUsername(e.target.value)} /><input type="password" className="w-full p-4 rounded-xl bg-gray-700 text-white border border-gray-600 outline-none" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} /><button className="w-full bg-gradient-to-r from-orange-500 to-pink-600 font-bold py-4 rounded-xl text-white shadow-lg">Iniciar Sesión</button></form></div></div>;

const qrValue = code ? `${baseUrl}/?code=${code}` : '';

return (
<div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
<div className="w-full md:w-64 bg-gray-950/95 text-white flex md:flex-col p-3 md:p-6 fixed inset-x-4 bottom-4 md:inset-x-0 md:bottom-auto md:relative z-50 md:h-full justify-between md:justify-start border border-gray-800/80 md:border-t-0 md:border-l-0 md:border-b-0 md:border-r rounded-[2rem] md:rounded-none shadow-[0_-10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
<h1 className="text-2xl font-black tracking-tighter mb-4 hidden md:block">punto<span className="text-pink-500">IA</span></h1>
<div className="hidden md:block mb-6"><span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider shadow-sm ring-1 ring-white/10 ${userRole==='ADMIN'?'bg-gradient-to-r from-purple-600 to-pink-600':'bg-gradient-to-r from-sky-600 to-blue-700'}`}>{userRole}</span></div>
<nav className="flex md:flex-col gap-2 w-full justify-around md:justify-start">
  {userRole === 'ADMIN' && (
    <button
      onClick={()=>setTab('dashboard')}
      className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 px-3 py-3 rounded-2xl transition-all ${tab==='dashboard'?'bg-white/10 text-white shadow-lg ring-1 ring-white/10':'text-white/80 hover:bg-white/10'}`}
    >
      <span className="text-xl leading-none">📊</span>
      <span className="text-[10px] md:text-sm font-black md:font-bold uppercase md:normal-case tracking-widest md:tracking-normal">Dashboard</span>
    </button>
  )}

  {userRole === 'ADMIN' && (
    <button
      onClick={()=>setTab('team')}
      className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 px-3 py-3 rounded-2xl transition-all ${tab==='team'?'bg-white/10 text-white shadow-lg ring-1 ring-white/10':'text-white/80 hover:bg-white/10'}`}
    >
      <span className="text-xl leading-none">👥</span>
      <span className="text-[10px] md:text-sm font-black md:font-bold uppercase md:normal-case tracking-widest md:tracking-normal">Equipo</span>
    </button>
  )}

  <button
    onClick={()=>setTab('qr')}
    className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 px-3 py-3 rounded-2xl transition-all ${tab==='qr'?'bg-white/10 text-white shadow-lg ring-1 ring-white/10':'text-white/80 hover:bg-white/10'}`}
  >
    <span className="text-xl leading-none">📷</span>
    <span className="text-[10px] md:text-sm font-black md:font-bold uppercase md:normal-case tracking-widest md:tracking-normal">QR</span>
  </button>


  <button
    onClick={()=>setTab('redeem')}
    className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 px-3 py-3 rounded-2xl transition-all ${tab==='redeem'?'bg-white/10 text-white shadow-lg ring-1 ring-white/10':'text-white/80 hover:bg-white/10'}`}
  >
    <span className="text-xl leading-none">🎁</span>
    <span className="text-[10px] md:text-sm font-black md:font-bold uppercase md:normal-case tracking-widest md:tracking-normal">Canje</span>
  </button>

  {userRole === 'ADMIN' && (
    <button
      onClick={()=>setTab('settings')}
      className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 px-3 py-3 rounded-2xl transition-all ${tab==='settings'?'bg-white/10 text-white shadow-lg ring-1 ring-white/10':'text-white/80 hover:bg-white/10'}`}
    >
      <span className="text-xl leading-none">⚙️</span>
      <span className="text-[10px] md:text-sm font-black md:font-bold uppercase md:normal-case tracking-widest md:tracking-normal">Config</span>
    </button>
  )}
</nav>
<div className="hidden md:block mt-auto pt-6 border-t border-gray-800"><p className="font-bold text-sm truncate">{tenant.name}</p><button onClick={() => setTenant(null)} className="text-xs text-red-400 mt-4 hover:text-red-300 border border-red-900 p-2 rounded w-full">Cerrar Sesión</button></div>
</div>
<button onClick={() => setTenant(null)} className="md:hidden fixed top-4 right-4 z-50 bg-red-600 text-white w-8 h-8 rounded-full font-bold flex items-center justify-center shadow-lg">✕</button>

<div className="flex-1 p-6 md:p-8 overflow-y-auto pb-32 md:pb-0">
{tab === 'dashboard' && userRole === 'ADMIN' && (
<div className="space-y-8 animate-fadeIn">
<div className="flex items-center justify-between gap-4 flex-wrap">
  <div>
    <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
    <p className="text-sm text-gray-500 font-medium mt-1">Tendencia de check-ins, género y edades de tus clientes.</p>
  </div>
  <button className="bg-gradient-to-br from-orange-400 to-pink-500 px-5 py-3 rounded-2xl shadow-lg text-white font-black text-sm" onClick={downloadCSV}>Exportar base (CSV)</button>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
<div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><p className="text-gray-400 text-xs font-bold uppercase">Clientes registrados</p><p className="text-4xl font-black text-gray-900 mt-2">{totalClients}</p></div>
<div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><p className="text-gray-400 text-xs font-bold uppercase">Check-ins acumulados</p><p className="text-4xl font-black text-gray-900 mt-2">{totalCheckins}</p></div>
<div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><p className="text-gray-400 text-xs font-bold uppercase">Día más fuerte</p><p className="text-xl font-black text-gray-900 mt-2">{peakDay ? `${peakDay.date} · ${peakDay.count}` : 'Sin datos'}</p></div>
</div>

<div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
  <h3 className="text-lg font-bold text-gray-800 mb-1">Tendencia de check-ins</h3>
  <p className="text-xs text-gray-500 font-medium mb-5">Actividad diaria de tus clientes.</p>
  <div className="h-44 flex items-end justify-between gap-2">
    {trendData.length > 0 ? trendData.map((d:any,i:number)=>(
      <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-0">
        <div className="w-full bg-gradient-to-t from-orange-500 to-pink-500 rounded-t-lg" style={{height:`${Math.max((Number(d.count || 0) / trendMax) * 170, 8)}px`}}></div>
        <span className="text-[10px] font-bold text-gray-400 truncate w-full text-center">{String(d.date).slice(5)}</span>
      </div>
    )) : <p className="text-sm text-gray-400">Aún no hay check-ins para mostrar.</p>}
  </div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
    <h3 className="text-lg font-bold text-gray-800 mb-1">Distribución por género</h3>
    <p className="text-xs text-gray-500 font-medium mb-5">Clientes por segmento.</p>
    <div className="space-y-4">
      {genderData.length > 0 ? genderData.map((item:any) => {
        const width = Math.max((Number(item.value || 0) / genderMax) * 100, item.value ? 8 : 0);
        return (
          <div key={item.label}>
            <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: item.color || '#fb7185' }}></div>
            </div>
          </div>
        );
      }) : <p className="text-sm text-gray-400">Sin datos de género.</p>}
    </div>
  </div>

  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
    <h3 className="text-lg font-bold text-gray-800 mb-1">Distribución por edades</h3>
    <p className="text-xs text-gray-500 font-medium mb-5">Rangos de edad de tus clientes.</p>
    <div className="space-y-3">
      {ageData.length > 0 ? ageData.map((item:any, idx:number) => {
        const width = Math.max((Number(item.value || 0) / ageMax) * 100, item.value ? 8 : 0);
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-14 text-[11px] font-bold text-gray-500">{item.label}</span>
            <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" style={{ width: `${width}%`, opacity: 0.6 + (idx % 4) * 0.1 }}></div>
            </div>
            <span className="w-6 text-right text-xs font-bold text-gray-700">{item.value}</span>
          </div>
        );
      }) : <p className="text-sm text-gray-400">Sin datos de edades.</p>}
    </div>
  </div>
</div>
</div>
)}

{tab === 'team' && userRole === 'ADMIN' && (
<div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
<div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-4">
<h2 className="text-xl font-bold text-gray-800">Agregar Personal</h2>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<input className="p-4 bg-white rounded-2xl outline-none border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-400" placeholder="Nombre (ej: Pedro)" value={newStaff.name} onChange={e=>setNewStaff({...newStaff, name: e.target.value})} />

<div className="flex items-center bg-white rounded-2xl px-4 border border-gray-200 focus-within:ring-2 focus-within:ring-pink-400">
<span className="text-gray-400 font-mono text-sm font-bold mr-1 select-none">{tenant.codePrefix || '???'}.</span>
<input 
className="bg-transparent w-full p-4 outline-none font-semibold text-gray-900 placeholder:text-gray-400" 
placeholder="ej: juan" 
value={newStaff.username} 
onChange={e=>setNewStaff({...newStaff, username: e.target.value})} 
/>
</div>

<input className="p-4 bg-white rounded-2xl outline-none border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-pink-400 shadow-sm" placeholder="Contraseña" value={newStaff.password} onChange={e=>setNewStaff({...newStaff, password: e.target.value})} />
<select className="p-4 bg-white rounded-2xl outline-none border border-gray-200 text-gray-900 focus:ring-2 focus:ring-pink-400" value={newStaff.role} onChange={e=>setNewStaff({...newStaff, role: e.target.value})}>
<option value="STAFF">Operativo (Solo QR/Canje)</option>
<option value="ADMIN">Administrador (Total)</option>
</select>
</div>
<button onClick={createStaff} className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg">Agregar Empleado</button>
</div>

<h2 className="text-xl font-bold text-gray-800 ml-2">Mi Equipo</h2>
<div className="grid gap-4">
{team.map((u: any) => (
<div key={u.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
<div>
<h3 className="font-bold text-lg">{u.name}</h3>
<p className="text-sm text-gray-500">Login: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-bold">{u.username}</span></p>
<span className={`text-[10px] px-2 py-1 rounded font-bold mt-1 inline-block ${u.role==='ADMIN'?'bg-purple-100 text-purple-600':'bg-blue-100 text-blue-600'}`}>{u.role}</span>
</div>
<button onClick={() => deleteStaff(u.id)} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-100">Eliminar</button>
</div>
))}
</div>
</div>
)}

{tab === 'qr' && (
<div className="flex flex-col items-center justify-center h-full animate-fadeIn">
<div className="bg-white p-10 rounded-[3rem] shadow-xl text-center border border-gray-100 max-w-md w-full">
<h2 className="text-2xl font-bold text-gray-800 mb-6">Código de Hoy</h2>
<div className="bg-gray-50 p-6 rounded-3xl mb-6 flex justify-center">{qrValue ? <QRCode value={qrValue} size={200} /> : <div className="h-[200px] w-[200px] bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">Sin QR</div>}</div>
{code && <p className="text-4xl font-mono font-black text-gray-900 tracking-widest mb-6">{code}</p>}
<button onClick={generateCode} className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-lg">Generar Nuevo</button>

<div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left">
  <h3 className="text-sm font-black text-emerald-700 uppercase tracking-wider">Escanear pase de cliente</h3>
  <p className="text-xs text-emerald-700/80 mt-1">Aquí se escanea el QR que el cliente guardó en Apple Wallet para contar una visita.</p>
  <button
    onClick={() => { setScannerOpen(true); setScannerMsg('Apunta al QR del pase del cliente'); }}
    className="mt-3 w-full px-4 py-3 rounded-xl bg-emerald-600 text-white font-black"
  >
    Abrir cámara y escanear pase
  </button>
</div>
{scannerMsg ? <p className="mt-3 text-xs font-bold text-gray-600 text-left">{scannerMsg}</p> : null}
{lastScannedCustomerId ? <p className="mt-1 text-[11px] font-mono text-gray-500 text-left">Cliente: {lastScannedCustomerId}</p> : null}
</div>
</div>
)}


{scannerOpen && (
<div className="fixed inset-0 z-[70] bg-black/80 p-4 md:p-8">
  <div className="max-w-xl mx-auto bg-white rounded-3xl p-4 md:p-6 shadow-2xl border border-gray-200">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-black text-gray-900">Escanear pase de cliente</h3>
      <button
        onClick={() => setScannerOpen(false)}
        className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-bold"
      >
        Cerrar
      </button>
    </div>

    <div className="rounded-2xl overflow-hidden border border-gray-200 h-[360px] bg-black">
      <QRScanner
        paused={!scannerOpen}
        constraints={{ facingMode: 'environment' }}
        onScan={(codes: { rawValue: string }[]) => {
          const value = codes?.[0]?.rawValue;
          if (value) void handleAdminScan(value);
        }}
        onError={() => {
          setScannerMsg('No se pudo acceder a la cámara. Revisa permisos del navegador.');
        }}
      />
    </div>
    <p className="mt-3 text-xs font-semibold text-gray-600">Escanea el QR del pase en Apple Wallet para registrar una visita.</p>
    {scannerMsg ? <p className="mt-2 text-sm font-black text-emerald-700">{scannerMsg}</p> : null}
  </div>
</div>
)}


{tab === 'redeem' && (
<div className="max-w-md mx-auto mt-10 animate-fadeIn">
<div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-pink-100 text-center">
<h2 className="text-xl font-bold text-gray-800 mb-4">Validar Premio</h2>
<input className="w-full p-6 text-center text-3xl font-mono font-bold tracking-[0.5em] uppercase border-2 border-gray-100 rounded-2xl mb-6 outline-none focus:border-pink-500" placeholder="0000" maxLength={4} value={redeemCode} onChange={e => setRedeemCode(e.target.value)} />
<button onClick={validateRedeem} disabled={!redeemCode} className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold py-4 rounded-2xl shadow-lg disabled:opacity-50">Validar Código</button>
{msg && <div className="mt-6 p-4 bg-gray-50 rounded-2xl text-center font-bold text-gray-800 border border-gray-200">{msg}</div>}
</div>
</div>
)}

{tab === 'settings' && userRole === 'ADMIN' && (
<div className="max-w-lg mx-auto mt-10 animate-fadeIn space-y-6">
<div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-4">
<h2 className="text-xl font-bold text-gray-800">Datos del Negocio</h2>
<div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Nombre</label><input className="w-full p-4 bg-gray-100 rounded-2xl mt-1 text-gray-500 font-bold border border-transparent cursor-not-allowed" value={tenant.name} readOnly /></div>
<div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Premio</label><input className="w-full p-4 bg-white rounded-2xl mt-1 font-semibold text-gray-900 border border-gray-200 focus:ring-2 focus:ring-pink-400 outline-none transition-all shadow-sm placeholder:text-gray-400" value={prizeName} onChange={e => setPrizeName(e.target.value)} /></div>
<div>
  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Logo del negocio</label>
  <div className="mt-2 flex items-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden grid place-items-center">
      {logoData ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoData} alt="Logo" className="w-full h-full object-cover" />
      ) : (
        <span className="text-lg font-black text-gray-400">{(tenant?.name?.[0] ?? '?')}</span>
      )}
    </div>
    <div className="flex-1">
      <input
        type="file"
        accept="image/*"
        className="w-full p-4 bg-gray-50 rounded-2xl font-medium text-gray-800 border border-transparent focus:bg-white focus:border-gray-200 outline-none transition-all"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 200 * 1024) {
            alert("Logo muy pesado. Usa uno pequeño (máx ~200KB) para este MVP.");
            return;
          }
          const reader = new FileReader();
          reader.onload = () => setLogoData(String(reader.result || ""));
          reader.readAsDataURL(file);
        }}
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLogoData('')}
          className="px-4 py-2 rounded-xl font-bold text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
        >
          Quitar
        </button>
        <span className="text-[11px] text-gray-400 font-semibold">Se guarda como imagen pequeña (MVP).</span>
      </div>
    </div>
  </div>
</div>
<div>
        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Visitas requeridas</label>
        <input
          type="number"
          min="1"
          className="w-full p-4 bg-gray-50 rounded-2xl mt-1 font-medium text-gray-800 border border-transparent focus:bg-white focus:border-gray-200 outline-none transition-all"
          value={requiredVisits}
          onChange={e => setRequiredVisits(e.target.value)}
        />
        <p className="text-[11px] text-gray-400 font-semibold mt-2 ml-1">
          Meta del premio: {requiredVisits || 10} visita(s) = {(parseInt(requiredVisits || '10', 10) * 10)} puntos.
        </p>
      </div>
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Vigencia del premio</label>
        <select
          className="w-full p-4 bg-gray-50 rounded-2xl mt-1 font-medium text-gray-800 border border-transparent focus:bg-white focus:border-gray-200 outline-none transition-all"
          value={rewardPeriod}
          onChange={e => setRewardPeriod(e.target.value)}
        >
          <option value="OPEN">Visitas abiertas (sin caducidad)</option>
          <option value="MONTHLY">Mensual (mes calendario)</option>
          <option value="QUARTERLY">Trimestral (Ene-Mar, Abr-Jun, Jul-Sep, Oct-Dic)</option>
          <option value="SEMESTER">Semestral (Ene-Jun, Jul-Dic)</option>
          <option value="ANNUAL">Anual (Ene-Dic)</option>
        </select>
      </div>
<div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Instagram</label><input className="w-full p-4 bg-pink-50 rounded-2xl mt-1 font-medium text-pink-600 border border-pink-100 focus:bg-white focus:ring-2 focus:ring-pink-400 outline-none transition-all" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@usuario" /></div>
</div>
<div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-4">
<h2 className="text-xl font-bold text-gray-800"> Ubicación</h2>
<div className="flex gap-2 mb-2"><input className="flex-1 p-3 bg-blue-50 rounded-xl text-gray-800 text-sm border border-blue-100 outline-none focus:ring-2 focus:ring-blue-300" placeholder="Dirección..." value={addressSearch} onChange={(e) => setAddressSearch(e.target.value)} /><button onClick={searchLocation} disabled={isSearching} className="bg-blue-600 text-white px-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50" aria-label="Buscar">🔎</button></div>
<div className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-200 z-0 relative"><AdminMap coords={coords} setCoords={setCoords} /></div>
</div>
<button onClick={saveSettings} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg">Guardar Todo</button>
</div>
)}
</div>
</div>
);
}
EOF_web_app_admin_page_tsx

cat > web/app/page.tsx <<'EOF_web_app_page_tsx'
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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

type BusinessLeadForm = {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
};

const glow = 'bg-gradient-to-br from-[#ff7a59] via-[#ff3f8e] to-[#f90086]';

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
  // Avoid shadowing the global `validityWindow` object (can confuse bundlers / minifiers).
  let validityWindow = 'Sin vigencia';

  if (p === 'MONTHLY') {
    counter = 'Mensual';
    validityWindow = `Hasta ${fmtEnd(endOfMonth(y, month))}`;
  } else if (p === 'QUARTERLY') {
    counter = 'Trimestral';
    const q = Math.floor((month - 1) / 3) + 1;
    const endMonth = q * 3;
    validityWindow = `Hasta ${fmtEnd(endOfMonth(y, endMonth))}`;
  } else if (p === 'SEMESTER') {
    counter = 'Semestral';
    const endMonth = month <= 6 ? 6 : 12;
    validityWindow = `Hasta ${fmtEnd(endOfMonth(y, endMonth))}`;
  } else if (p === 'ANNUAL') {
    counter = 'Anual';
    validityWindow = `Hasta ${fmtEnd(endOfMonth(y, 12))}`;
  }

  return { counter, window: validityWindow };
}

function Shine() {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <span className="absolute -inset-x-24 -top-24 h-48 w-48 rotate-12 bg-white/25 blur-2xl" />
    </span>
  );
}

function BrandLogo({ animate = true }: { animate?: boolean }) {
  const reduce = useReducedMotion();
  const canAnim = animate && !reduce;

  return (
    <div className="mb-2 select-none scale-90">
      <motion.div
        initial={canAnim ? { opacity: 0, y: 8 } : false}
        animate={canAnim ? { opacity: 1, y: 0 } : false}
        transition={canAnim ? { ...spring } : undefined}
        className="brand-lockup relative inline-flex items-end justify-center gap-3"
      >
        <span className="brand-punto-wrap">
          <span className="brand-word brand-word-punto">punt</span>
          <span className="brand-o-wrap">
            <span className="brand-word brand-word-punto">o</span>
            <motion.span
              initial={canAnim ? { scale: 0.85, opacity: 0 } : false}
              animate={canAnim ? { scale: 1, opacity: 1 } : false}
              transition={canAnim ? { ...spring, delay: 0.08 } : undefined}
              className="brand-orb"
            >
              <span className="brand-orb-glow" />
              <span className="brand-orb-shine" />
            </motion.span>
          </span>
        </span>
        <span className="brand-word brand-word-ia">IA</span>
      </motion.div>
    </div>
  );
}

function Onboarding() {
  const reduce = useReducedMotion();
  const canAnim = !reduce;

  const [slide, setSlide] = useState(0);
  const slides = useMemo(
    () => [
      { icon: '📸', title: '1. Escanea', text: 'Visita y escanea el código QR.' },
      { icon: '🔥', title: '2. Suma', text: 'Acumula puntos automáticamente.' },
      { icon: '🎁', title: '3. Canjea', text: 'Genera tu código de premio.' },
      { icon: '🏆', title: '4. Gana', text: 'Recibe tu recompensa.' },
    ],
    []
  );

  useEffect(() => {
    const i = setInterval(() => setSlide((p) => (p + 1) % slides.length), 3500);
    return () => clearInterval(i);
  }, [slides.length]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={canAnim ? { opacity: 0, y: 10 } : false}
            animate={canAnim ? { opacity: 1, y: 0 } : false}
            exit={canAnim ? { opacity: 0, y: -10 } : false}
            transition={canAnim ? { ...spring } : undefined}
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
  const prelaunchMode = process.env.NEXT_PUBLIC_PRELAUNCH_MODE !== 'false';
  const reduce = useReducedMotion();
  const canAnim = !reduce;

  // ✅ ESTE ERA EL QUE TE FALTABA (y por eso truena el build)
  const [view, setView] = useState<ViewState>('WELCOME');

  // ✅ Tabs separados: Check-In (primero), Puntos, Mapa, Perfil
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

  const [leadForm, setLeadForm] = useState<BusinessLeadForm>({
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    city: '',
  });
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadStatus, setLeadStatus] = useState('');
  const [showClientPortal, setShowClientPortal] = useState(false);

  const handleLeadField = (key: keyof BusinessLeadForm, value: string) => {
    setLeadForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitLead = async () => {
    if (!leadForm.businessName.trim() || !leadForm.contactName.trim() || !leadForm.phone.trim() || !leadForm.email.trim()) {
      setLeadStatus('Completa negocio, nombre, teléfono y email.');
      return;
    }

    setLeadLoading(true);
    setLeadStatus('Enviando...');

    try {
      const res = await fetch('/api/prelaunch/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setLeadStatus(data?.error || 'No se pudo enviar. Intenta de nuevo.');
      } else {
        setLeadStatus('¡Gracias! Te contactaremos para activar tu negocio.');
        setLeadForm({ businessName: '', contactName: '', phone: '', email: '', city: '' });
      }
    } catch {
      setLeadStatus('Error de conexión. Intenta nuevamente.');
    } finally {
      setLeadLoading(false);
    }
  };

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
      if (p.get('clientes') === '1') {
        setShowClientPortal(true);
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
      const d = await res.json();
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
      const data = await res.json();
      if (data.history) setHistory(data.history);
      setShowHistory(true);
    } catch {
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
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setName(data.name);
        setEmail(data.email || '');
        setGender(data.gender || '');
        if (data.birthDate) setBirthDate(data.birthDate.split('T')[0]);
        else setBirthDate('');

        // ✅ Entra a Cliente y abre CHECK-IN primero
        setActiveTab('checkin');
        setView('APP');
      } else setMessage('⚠️ ' + data.error);
    } catch {
      setMessage('🔥 Error de conexión');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setMessage('');
    if (!name.trim()) return setMessage('❌ Nombre requerido');
    if (!isValidPhone(phone)) return setMessage('❌ Teléfono 10 dígitos');
    if (email && !isValidEmail(email)) return setMessage('❌ Email inválido');

    setLoading(true);
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, gender, birthDate }),
      });
      if (res.ok) handleLogin();
      else {
        const d = await res.json();
        setMessage('⚠️ ' + d.error);
      }
    } catch {
      setMessage('🔥 Error de conexión');
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!user?.id) return;
    if (!isValidPhone(phone)) return setMessage('❌ Teléfono inválido');

    setMessage('Guardando...');
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, name, email, gender, birthDate, phone }),
      });

      if (res.ok) {
        setMessage('✅ Datos actualizados');
        setUser({ ...user, name, email, gender, birthDate, phone });
      } else {
        const d = await res.json();
        setMessage('❌ ' + d.error);
      }
    } catch {
      setMessage('🔥 Error de red');
    }
  };

  const handleScan = async (result: string) => {
    if (!result) return;
    setScanning(false);

    let finalCode = result;
    if (result.includes('code=')) finalCode = result.split('code=')[1].split('&')[0];

    try {
      const res = await fetch('/api/check-in/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, code: finalCode }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        handleLogin();
        setManualCode('');
      } else alert('❌ ' + data.error);
    } catch {
      if (user) alert('Error');
    }
  };

  const getPrizeCode = async (tenantId: string, tenantName: string) => {
    if (!confirm(`¿Canjear premio en ${tenantName}?`)) return;
    try {
      const res = await fetch('/api/redeem/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, tenantId }),
      });
      const data = await res.json();
      if (res.ok) setPrizeCode({ code: data.code, tenant: tenantName });
      else alert(data.error);
    } catch {
      alert('Error');
    }
  };

  const goToBusinessMap = (tName: string) => {
    const target = tenants.find((t) => t.name === tName);
    if (target && target.lat && target.lng) {
      setMapFocus([target.lat, target.lng]);
      setActiveTab('map');
    } else {
      alert('Ubicación no disponible.');
    }
  };

  const openPass = (tenantName?: string, tenantId?: string) => {
    if (!user?.id) {
      alert('Primero inicia sesión para ver tu pase.');
      return;
    }

    const label = tenantName ? `&from=${encodeURIComponent(tenantName)}` : '';
    const businessParam = tenantId ? `&business_id=${encodeURIComponent(tenantId)}` : '';
    window.open(`/pass?customer_id=${encodeURIComponent(user.id)}${label}${businessParam}`, '_blank', 'noopener,noreferrer');
  };

  const handleLogout = () => {
    if (confirm('¿Salir?')) {
      setUser(null);
      setView('WELCOME');
      setPhone('');
      setPassword('');
      setMessage('');
    }
  };

  const toggleCard = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return prelaunchMode && !showClientPortal ? (
    <main className={`min-h-screen ${glow} text-white relative overflow-hidden`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.22),transparent_36%),radial-gradient(circle_at_82%_8%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_88%_88%,rgba(255,255,255,0.12),transparent_40%)]" />

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="flex flex-col items-center text-center">
          <BrandLogo />
          <p className="mt-4 inline-block rounded-full border border-white/35 bg-white/10 px-4 py-1 text-xs font-black tracking-widest uppercase">
            PRE-LANZAMIENTO
          </p>
          <h1 className="mt-6 text-4xl md:text-6xl font-black leading-tight max-w-4xl">
            Muy pronto lanzamos Punto IA para transformar la lealtad de tus clientes.
          </h1>
          <p className="mt-6 max-w-2xl text-white/90 text-sm md:text-base font-semibold leading-relaxed">
            Estamos preparando una experiencia de fidelización más inteligente para negocios y clientes. Mientras tanto,
            conoce el teaser y deja tus datos para entrar como aliado fundador.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr,1fr]">
          <div className="rounded-3xl border border-white/30 bg-white/12 backdrop-blur-md p-5 md:p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.22em] font-black text-white/75 mb-3">Teaser video</p>
            <div className="aspect-video rounded-2xl border border-white/30 bg-black/30 overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <iframe
                className="h-full w-full"
                src="https://player.vimeo.com/video/1165202097?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
                title="Genera_un_video_1080p_202602141913"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
                allowFullScreen
              />
            </div>
            <p className="text-white/80 text-xs mt-3">Presentación oficial Punto IA · producto en etapa de pre-lanzamiento.</p>
          </div>

          <div className="rounded-3xl border border-white/35 bg-white/15 backdrop-blur-md p-5 md:p-6 shadow-2xl">
            <h2 className="text-2xl font-black">Preinscripción para negocios</h2>
            <p className="text-sm text-white/85 mt-1 mb-4">Te contactamos para sumarte como aliado fundador.</p>

            <div className="space-y-3">
              <input
                className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"
                placeholder="Nombre del negocio"
                value={leadForm.businessName}
                onChange={(e) => handleLeadField('businessName', e.target.value)}
              />
              <input
                className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"
                placeholder="Tu nombre"
                value={leadForm.contactName}
                onChange={(e) => handleLeadField('contactName', e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"
                  placeholder="Teléfono"
                  value={leadForm.phone}
                  onChange={(e) => handleLeadField('phone', e.target.value)}
                />
                <input
                  className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"
                  placeholder="Ciudad"
                  value={leadForm.city}
                  onChange={(e) => handleLeadField('city', e.target.value)}
                />
              </div>
              <input
                type="email"
                className="w-full rounded-2xl border border-white/35 bg-white/95 text-gray-900 p-3 font-semibold"
                placeholder="Email"
                value={leadForm.email}
                onChange={(e) => handleLeadField('email', e.target.value)}
              />

              <button
                onClick={submitLead}
                disabled={leadLoading}
                className="w-full rounded-2xl bg-white text-pink-600 font-black py-3.5 shadow-xl hover:bg-pink-50 transition disabled:opacity-70"
              >
                {leadLoading ? 'Enviando...' : 'Quiero preinscribirme como negocio'}
              </button>

              {leadStatus ? <p className="text-sm font-semibold text-white/95">{leadStatus}</p> : null}
            </div>
          </div>
        </div>

        <p className="mt-6 text-white/90 max-w-2xl text-sm md:text-base font-semibold mx-auto text-center">
          Sistema de puntos multi-negocio para pymes en México. Deja tus datos y sé de los primeros aliados en activar la plataforma.
        </p>
      </section>
    </main>
  ) : (
    <AnimatePresence mode="wait">
      {view === 'WELCOME' && (
        <motion.div
          key="welcome"
          initial={canAnim ? screenFx.initial : false}
          animate={canAnim ? screenFx.animate : false}
          exit={canAnim ? screenFx.exit : false}
          transition={canAnim ? { ...spring } : undefined}
          className={`min-h-screen ${glow} flex flex-col items-center justify-center p-6 text-white relative overflow-hidden`}
        >
          <motion.div
            aria-hidden
            className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/15 blur-3xl"
            animate={canAnim ? { x: [0, 20, 0], y: [0, 12, 0] } : undefined}
            transition={canAnim ? { duration: 6, repeat: Infinity } : undefined}
          />
          <motion.div
            aria-hidden
            className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
            animate={canAnim ? { x: [0, -18, 0], y: [0, -14, 0] } : undefined}
            transition={canAnim ? { duration: 7, repeat: Infinity } : undefined}
          />

          <div className="w-full max-w-sm flex flex-col items-center py-10 relative">
            <BrandLogo />

            <p className="text-white text-xl font-medium mb-6 mt-0 tracking-wide drop-shadow-md text-center leading-tight">
              Tu experiencia Punto IA,
              <br />
              <span className="font-extrabold italic">más premium, más rápida.</span>
            </p>

            <div className="mb-8 grid w-full grid-cols-3 gap-2">
              {[
                { icon: '🎟️', label: 'Pase universal' },
                { icon: '⚡', label: 'Check-in express' },
                { icon: '🎁', label: 'Premios reales' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/35 bg-white/15 px-3 py-3 text-center backdrop-blur-sm shadow-lg"
                >
                  <div className="text-xl leading-none">{item.icon}</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-white/90">{item.label}</div>
                </div>
              ))}
            </div>

            {pendingCode && (
              <motion.div
                initial={canAnim ? { opacity: 0, y: 10 } : false}
                animate={canAnim ? { opacity: 1, y: 0 } : false}
                transition={canAnim ? { ...spring } : undefined}
                className="bg-white/20 p-4 rounded-2xl mb-4 border border-white/30 backdrop-blur-sm w-full text-center"
              >
                <p className="font-black">🎉 ¡Código detectado!</p>
              </motion.div>
            )}

            <div className="space-y-4 w-full mb-12">
              <motion.button
                whileTap={canAnim ? { scale: 0.97 } : undefined}
                whileHover={canAnim ? { y: -2 } : undefined}
                onClick={() => {
                  setMessage('');
                  setView('LOGIN');
                }}
                className="relative w-full bg-white text-pink-600 py-4 rounded-2xl font-extrabold text-lg shadow-2xl hover:bg-gray-50 transition-all overflow-hidden"
              >
                <Shine />
                ✨ Iniciar Sesión
              </motion.button>

              <motion.button
                whileTap={canAnim ? { scale: 0.97 } : undefined}
                whileHover={canAnim ? { y: -2 } : undefined}
                onClick={() => {
                  setMessage('');
                  setView('REGISTER');
                }}
                className="w-full bg-white/10 border-2 border-white/50 text-white py-4 rounded-2xl font-black text-lg hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                🚀 Crear Cuenta
              </motion.button>
            </div>

            <div className="w-full pt-8 border-t border-white/20">
              <p className="text-center text-white/70 text-xs font-black uppercase tracking-widest mb-6">
                ¿CÓMO FUNCIONA?
              </p>
              <Onboarding />
            </div>

            <Link
              href="/aliados"
              className="mt-12 inline-flex items-center justify-center rounded-full border border-white/50 bg-white/15 px-5 py-3 text-sm font-black tracking-wide text-white shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/25"
            >
              ¿Tienes negocio? <span className="ml-2 underline">Únete a Punto IA</span>
            </Link>
          </div>
        </motion.div>
      )}

      {(view === 'LOGIN' || view === 'REGISTER') && (
        <motion.div
          key={view}
          initial={canAnim ? screenFx.initial : false}
          animate={canAnim ? screenFx.animate : false}
          exit={canAnim ? screenFx.exit : false}
          transition={canAnim ? { ...spring } : undefined}
          className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,#fff7ed,transparent_40%),radial-gradient(circle_at_85%_5%,#fdf2f8,transparent_35%),#f9fafb] flex flex-col"
        >
          <div className={`${glow} p-8 pb-20 pt-16 rounded-b-[3rem] shadow-[0_22px_60px_rgba(249,0,134,0.35)] text-white text-center relative overflow-hidden`}>
            <button
              onClick={() => setView('WELCOME')}
              className="absolute top-12 left-6 text-white/80 hover:text-white font-black text-2xl transition-colors"
            >
              ←
            </button>
            <div className="mt-4 mb-4 flex justify-center scale-[0.75]">
              <BrandLogo animate={false} />
            </div>
            <h2 className="text-3xl font-black mt-2 tracking-tight">
              {view === 'REGISTER' ? 'Crea tu cuenta Punto IA' : 'Bienvenido de vuelta'}
            </h2>
            <p className="text-white/95 text-sm mt-1 font-semibold">
              {view === 'REGISTER' ? 'Activa tu pase universal y comienza a acumular beneficios.' : 'Entra y muestra tu pase para registrar visitas.'}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-1 text-[11px] font-black uppercase tracking-[0.15em]">
              <span>cliente</span>
              <span className="text-white/70">•</span>
              <span>experiencia premium</span>
            </div>
          </div>

          <div className="flex-1 px-6 -mt-12 pb-10">
            <motion.div
              initial={canAnim ? { opacity: 0, y: 14 } : false}
              animate={canAnim ? { opacity: 1, y: 0 } : false}
              transition={canAnim ? { ...spring } : undefined}
              className="bg-white/95 rounded-3xl shadow-[0_24px_70px_rgba(17,24,39,0.16)] p-8 space-y-6 border border-white relative overflow-hidden backdrop-blur"
            >
              <span className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-pink-200/35 blur-3xl" />
              <span className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-orange-200/35 blur-3xl" />

              {view === 'REGISTER' && (
                <div className="relative">
                  <label className={clsLabel}>Nombre Completo</label>
                  <input className={clsInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Pedro" />
                </div>
              )}

              <div className="relative">
                <label className={clsLabel}>Teléfono Celular</label>
                <input
                  type="tel"
                  maxLength={10}
                  className={clsInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10 dígitos"
                />
              </div>

              {view === 'REGISTER' && (
                <>
                  <div className="relative">
                    <label className={clsLabel}>Email (Opcional)</label>
                    <input type="email" className={clsInput} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="flex-1">
                      <label className={clsLabel}>Fecha de nacimiento</label>
                      <input type="date" className={clsInputFixed} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                    </div>

                    <div className="flex-1">
                      <label className={clsLabel}>Género</label>
                      <select className={`${clsInput} h-[58px]`} value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="">-</option>
                        <option value="Hombre">Masculino</option>
                        <option value="Mujer">Femenino</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="relative">
                <label className={clsLabel}>Contraseña</label>
                <input type="password" className={clsInput} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••" />
              </div>

              {message && (
                <motion.div
                  initial={canAnim ? { opacity: 0, y: 8 } : false}
                  animate={canAnim ? { opacity: 1, y: 0 } : false}
                  className="p-4 bg-red-50 text-red-500 rounded-2xl text-center font-black text-sm border border-red-100"
                >
                  {message}
                </motion.div>
              )}

              <motion.button
                whileTap={canAnim ? { scale: 0.98 } : undefined}
                whileHover={canAnim ? { y: -2 } : undefined}
                onClick={view === 'REGISTER' ? handleRegister : handleLogin}
                disabled={loading}
                className={`relative w-full ${glow} text-white py-4 rounded-2xl font-black shadow-2xl transition-all text-lg mt-2 overflow-hidden`}
              >
                <Shine />
                {loading ? 'Procesando...' : view === 'REGISTER' ? '🚀 Crear Cuenta' : 'Entrar'}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}

      {view === 'APP' && (
        <motion.div
          key="app"
          initial={canAnim ? screenFx.initial : false}
          animate={canAnim ? screenFx.animate : false}
          exit={canAnim ? screenFx.exit : false}
          transition={canAnim ? { ...spring } : undefined}
          className="min-h-screen bg-gradient-to-b from-[#fff2f8] via-[#fff9f4] to-[#fffdfd] pb-32"
        >
          {/* Overlays */}
          <AnimatePresence>
            {showTutorial && (
              <motion.div
                key="tutorial"
                initial={canAnim ? { opacity: 0 } : false}
                animate={canAnim ? { opacity: 1 } : false}
                exit={canAnim ? { opacity: 0 } : false}
                className={`fixed inset-0 ${glow} z-[60] flex flex-col items-center justify-center p-8`}
              >
                <motion.div
                  initial={canAnim ? modalFx.initial : false}
                  animate={canAnim ? modalFx.animate : false}
                  exit={canAnim ? modalFx.exit : false}
                  transition={canAnim ? { ...spring } : undefined}
                  className="w-full max-w-sm"
                >
                  <h2 className="text-white text-center font-black text-3xl mb-10">¿Cómo usar PuntoIA?</h2>
                  <Onboarding />
                  <motion.button
                    whileTap={canAnim ? { scale: 0.98 } : undefined}
                    onClick={() => setShowTutorial(false)}
                    className="w-full bg-white text-purple-600 font-black py-4 rounded-2xl mt-12 shadow-2xl hover:bg-gray-100"
                  >
                    ¡Entendido!
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                key="history"
                initial={canAnim ? { opacity: 0 } : false}
                animate={canAnim ? { opacity: 1 } : false}
                exit={canAnim ? { opacity: 0 } : false}
                className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center p-6"
              >
                <motion.div
                  initial={canAnim ? modalFx.initial : false}
                  animate={canAnim ? modalFx.animate : false}
                  exit={canAnim ? modalFx.exit : false}
                  transition={canAnim ? { ...spring } : undefined}
                  className="bg-white p-6 rounded-[2rem] w-full max-w-md h-[70vh] flex flex-col shadow-2xl relative"
                >
                  <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 text-gray-400 font-black p-2 text-xl hover:text-gray-600">
                    ✕
                  </button>

                  <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">✨ Mis premios</h2>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {history.length > 0 ? (
                      history.map((h: any, i: number) => (
                        <motion.div
                          key={i}
                          initial={canAnim ? { opacity: 0, y: 10 } : false}
                          animate={canAnim ? { opacity: 1, y: 0 } : false}
                          transition={canAnim ? { ...spring, delay: i * 0.03 } : undefined}
                          className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex items-center gap-4"
                        >
                          <div className="bg-yellow-100 text-yellow-700 h-12 w-12 rounded-xl flex items-center justify-center text-2xl">✨</div>
                          <div>
                            <h3 className="font-black text-gray-800">{h.prize}</h3>
                            <p className="text-xs text-gray-500 font-semibold">
                              {h.tenant} • {h.date}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 py-10">
                        <p className="text-4xl mb-2">🤷‍♂️</p>
                        <p>Aún no has canjeado premios.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {prizeCode && (
              <motion.div
                key="prize"
                initial={canAnim ? { opacity: 0 } : false}
                animate={canAnim ? { opacity: 1 } : false}
                exit={canAnim ? { opacity: 0 } : false}
                className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md"
              >
                <motion.div
                  initial={canAnim ? modalFx.initial : false}
                  animate={canAnim ? modalFx.animate : false}
                  exit={canAnim ? modalFx.exit : false}
                  transition={canAnim ? { ...spring } : undefined}
                  className="bg-white p-8 rounded-[2rem] text-center w-full max-w-sm relative shadow-2xl overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-orange-500" />

                  <button
                    onClick={() => {
                      setPrizeCode(null);
                      handleLogin();
                    }}
                    className="absolute top-4 right-4 text-gray-400 font-black p-2 text-xl hover:text-gray-600"
                  >
                    ✕
                  </button>

                  <p className="text-pink-500 uppercase text-xs font-black tracking-widest mb-2 mt-4">¡PREMIO DESBLOQUEADO!</p>

                  <h2 className="text-3xl font-black text-gray-900 mb-6 leading-tight">{prizeCode.tenant}</h2>

                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-8 rounded-3xl mb-6 relative overflow-hidden">
                    {canAnim && (
                      <motion.div
                        aria-hidden
                        className="absolute inset-0"
                        animate={{ opacity: [0.2, 0.35, 0.2] }}
                        transition={{ duration: 2.2, repeat: Infinity }}
                        style={{
                          background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,.5) 40%, transparent 70%)',
                          transform: 'translateX(-30%)',
                        }}
                      />
                    )}
                    <p className="text-5xl font-mono font-black text-gray-800 tracking-widest relative">{prizeCode.code}</p>
                  </div>

                  <p className="text-sm text-gray-500 font-semibold">Muestra este código al personal.</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="bg-white/95 backdrop-blur px-8 pt-16 pb-6 sticky top-0 z-20 shadow-sm border-b border-pink-100/80 flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Hola,</p>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{user?.name?.split(' ')?.[0] ?? '👋'}</h1>
            </div>

            <div className="flex gap-2">
              <motion.button
                whileTap={canAnim ? { scale: 0.95 } : undefined}
                onClick={() => setShowTutorial(true)}
                className="h-12 w-12 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-full font-black border border-white/30 flex items-center justify-center hover:brightness-110 transition-all shadow-md"
                title="Ayuda"
              >
                ✨
              </motion.button>

              <motion.button
                whileTap={canAnim ? { scale: 0.95 } : undefined}
                onClick={handleLogout}
                className="h-12 w-12 bg-red-50 text-red-500 rounded-full font-black border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                title="Salir"
              >
                ✕
              </motion.button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* TAB: CHECK-IN */}
            {activeTab === 'checkin' && !scanning && (
              <div className="flex flex-col gap-6">
                <div className="bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-md relative overflow-hidden">
                  <span className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-pink-100/50 blur-3xl" />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-gray-900">Hacer Check-In</h2>
                      <p className="text-sm text-gray-600 mt-1">Escanea el QR del negocio para registrar tu visita.</p>
                    </div>

                    <motion.button
                      whileTap={canAnim ? { scale: 0.98 } : undefined}
                      whileHover={canAnim ? { y: -1 } : undefined}
                      onClick={() => setScanning(true)}
                      className="shrink-0 bg-gradient-to-r from-gray-950 to-gray-800 text-white font-black px-5 py-3 rounded-2xl shadow-md"
                    >
                      Escanear QR
                    </motion.button>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-md relative overflow-hidden">
                  <span className="pointer-events-none absolute -bottom-24 -left-24 h-44 w-44 rounded-full bg-orange-100/40 blur-3xl" />
                  <div>
                    <h3 className="text-base font-black text-gray-900">Escribir manual</h3>
                    <p className="text-sm text-gray-600 mt-1">Si no puedes escanear, escribe el código del QR.</p>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <input
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Ej. ABCD-1234-EFGH"
                      className="w-full sm:flex-1 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
                    />
                    <motion.button
                      whileTap={canAnim ? { scale: 0.98 } : undefined}
                      onClick={() => {
                        if (!manualCode.trim()) return;
                        handleScan(manualCode.trim());
                      }}
                      className="bg-gradient-to-r from-gray-950 to-gray-800 text-white font-black px-6 py-3 rounded-2xl shadow-sm"
                    >
                      OK
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PUNTOS */}
            {activeTab === 'points' && (
              <div className="space-y-4">
                {user?.memberships?.map((m: any, idx: number) => {
                  const logo = (m.logoData ?? m.tenant?.logoData ?? '') as string;
                  const requiredVisits = m.requiredVisits ?? 10;
                  const visits = m.visits ?? Math.round((m.points ?? 0) / 10);
                  const progress = Math.min(Math.round((visits / requiredVisits) * 100), 100);
                  const isWinner = visits >= requiredVisits;
                  const isExpanded = expandedId === m.tenantId;

                  return (
                    <motion.div
                      key={idx}
                      layout
                      transition={canAnim ? spring : undefined}
                      onClick={() => toggleCard(m.tenantId)}
                      whileTap={canAnim ? { scale: 0.99 } : undefined}
                      className={`bg-white p-5 md:p-6 rounded-3xl relative overflow-hidden cursor-pointer border border-gray-100 ${
                        isExpanded ? 'shadow-xl ring-2 ring-pink-100' : 'shadow-md hover:shadow-lg'
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 rounded-bl-full opacity-70" />
                      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-100/50 blur-3xl rounded-full" />

                      <div className="relative z-10">
                        <div className="flex justify-between items-start gap-3 mb-4">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gray-950 to-gray-700 text-white flex items-center justify-center font-black text-2xl shadow-lg overflow-hidden">
                              {logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                              ) : (
                                <span>{m.name?.charAt(0)}</span>
                              )}
                            </div>

                            <div>
                              <h3 className="font-black text-gray-900 text-lg md:text-xl tracking-tight leading-tight">{m.name}</h3>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <motion.span
                                  initial={{ scale: 1 }}
                                  animate={canAnim ? { y: [0, -1, 0], scale: [1, 1.03, 1] } : undefined}
                                  transition={canAnim ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white shadow-md border border-white/30"
                                >
                                  <span className="text-[10px] font-black uppercase tracking-widest opacity-90">Premio</span>
                                  <span className="text-sm font-black leading-none">{m.prize}</span>
                                  <span className="ml-0.5 text-base leading-none">✨</span>
                                </motion.span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="block text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">
                              {visits}
                            </span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">VISITAS</span>
                          </div>
                        </div>

                        {!isWinner ? (
                          <>
                            <div className="mb-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
                              <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                                <span>Meta: <span className="text-gray-900">{requiredVisits} visitas</span></span>
                                <span>Llevas: <span className="text-gray-900">{visits}</span></span>
                              </div>
                              <div className="mt-2 relative w-full h-3 bg-white rounded-full overflow-hidden border border-gray-200">
                                <motion.div
                                  className="h-full rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600"
                                  initial={canAnim ? { width: 0 } : false}
                                  animate={canAnim ? { width: `${progress}%` } : false}
                                  transition={canAnim ? { duration: 0.9, ease: 'easeOut' } : undefined}
                                />
                              </div>
                              <div className="mt-1 text-[11px] font-semibold text-gray-500">
                                Te faltan <span className="text-gray-900">{Math.max(requiredVisits - visits, 0)}</span> visita(s) para canjear.
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                {isExpanded ? '▾ Menos info' : '▸ Ver más'}
                              </span>

                              <div className="text-right leading-tight">
                                <div className="text-[11px] font-extrabold text-gray-800 whitespace-nowrap">
                                  Contador: {formatRewardPeriod(m.rewardPeriod).counter}
                                </div>
                                <div className="text-[11px] font-semibold text-gray-500 whitespace-nowrap mt-0.5">
                                  Vigencia: {formatRewardPeriod(m.rewardPeriod).window}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <motion.button
                            whileTap={canAnim ? { scale: 0.98 } : undefined}
                            whileHover={canAnim ? { y: -2 } : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              getPrizeCode(m.tenantId, m.name);
                            }}
                            className="relative w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-black py-5 rounded-2xl shadow-2xl tracking-wide text-lg overflow-hidden border-4 border-white/20"
                          >
                            <Shine />
                            CANJEAR PREMIO ✨
                            <span className="block text-[11px] font-black text-white/80 mt-1">Listo para canjear</span>
                          </motion.button>
                        )}

                        <motion.div
                          layout
                          className={`grid grid-cols-3 gap-3 mt-4 overflow-hidden ${
                            isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
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
                            <span className="text-2xl mb-1">🧭</span>
                            Ver Mapa
                          </motion.button>

                          <motion.button
                            whileTap={canAnim ? { scale: 0.98 } : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              openPass(m.name, m.tenantId);
                            }}
                            className="bg-white border-2 border-orange-50 text-orange-700 py-4 rounded-2xl font-black text-xs flex flex-col items-center hover:bg-orange-50 transition-colors shadow-sm"
                          >
                            <span className="text-2xl mb-1">🎟️</span>
                            Mi Pase
                          </motion.button>

                          {m.instagram ? (
                            <a
                              href={`https://instagram.com/${m.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-white border-2 border-pink-50 text-pink-700 py-4 rounded-2xl font-black text-xs flex flex-col items-center hover:bg-pink-50 transition-colors no-underline shadow-sm"
                            >
                              <span className="text-2xl mb-1">📲</span>
                              Instagram
                            </a>
                          ) : (
                            <div className="bg-gray-50 border-2 border-gray-100 text-gray-300 py-4 rounded-2xl font-black text-xs flex flex-col items-center opacity-70">
                              <span className="text-2xl mb-1">◎</span>
                              No IG
                            </div>
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* TAB: MAPA */}
            {activeTab === 'map' && (
              <motion.div
                initial={canAnim ? { opacity: 0, y: 10 } : false}
                animate={canAnim ? { opacity: 1, y: 0 } : false}
                transition={canAnim ? { ...spring } : undefined}
                className="h-[52vh] md:h-[58vh] w-full rounded-3xl overflow-hidden shadow-xl border border-gray-100 relative"
              >
                <div className="absolute top-3 left-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-pink-600 shadow">
                  Mapa de aliados Punto IA
                </div>
                <button
                  onClick={() => openPass()}
                  className="absolute top-3 right-3 z-10 rounded-full bg-white px-4 py-2 text-xs font-black text-orange-600 shadow-lg border border-orange-100 hover:bg-orange-50 transition"
                >
                  Ver mi Pase
                </button>
                <BusinessMap tenants={tenants} focusCoords={mapFocus} radiusKm={50} />
              </motion.div>
            )}
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
                className="bg-white p-6 md:p-7 rounded-3xl shadow-md border border-gray-100 relative overflow-hidden"
              >
                <span className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-pink-200/35 blur-3xl" />
                <span className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-orange-200/35 blur-3xl" />

                <div className="flex items-center gap-5 mb-10 relative">
                  <div className="h-20 w-20 bg-gradient-to-br from-orange-100 to-pink-100 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner text-pink-600">
                    PI
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">Mi Perfil</h2>
                    <p className="text-sm text-pink-500 font-bold">Tu identidad Punto IA</p>
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
                      <input type="date" className={clsInputFixed} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
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
                  className="w-full bg-yellow-400 text-yellow-950 p-4 rounded-2xl font-black mt-6 shadow-md hover:bg-yellow-300 transition-all text-base flex items-center justify-center gap-2"
                >
                  <span>🗂️</span> Ver Historial de Premios
                </motion.button>

                <motion.button
                  whileTap={canAnim ? { scale: 0.98 } : undefined}
                  onClick={handleUpdate}
                  className="relative w-full bg-gradient-to-r from-gray-950 to-gray-800 text-white p-4 rounded-2xl font-black mt-3 shadow-lg transition-all text-base hover:from-black hover:to-gray-900 overflow-hidden"
                >
                  <Shine />
                  Guardar Cambios ✨
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
              { key: 'checkin', icon: '⚡', label: 'Check-In' },
              { key: 'points', icon: '🎯', label: 'Puntos' },
              { key: 'map', icon: '🧭', label: 'Mapa' },
              { key: 'profile', icon: '✨', label: 'Perfil' },
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
EOF_web_app_page_tsx

cat > web/app/pass/page.tsx <<'EOF_web_app_pass_page_tsx'
'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

type PassResponse = {
  customer_id: string;
  name: string;
  branding: { app: string; theme: string };
  qr: { token: string; value: string };
  business: {
    id: string;
    name: string;
    currentVisits: number;
    requiredVisits: number;
  } | null;
};

function extractPassQuery() {
  if (typeof window === 'undefined') return { customerId: '', businessId: '' };
  const url = new URL(window.location.href);
  return {
    customerId: url.searchParams.get('customer_id') || '',
    businessId: url.searchParams.get('business_id') || '',
  };
}

export default function PassPage() {
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pass, setPass] = useState<PassResponse | null>(null);
  const [businessId, setBusinessId] = useState('');

  useEffect(() => {
    const query = extractPassQuery();
    if (query.customerId) {
      setCustomerId(query.customerId);
      setBusinessId(query.businessId);
      void loadPass(query.customerId, query.businessId);
      return;
    }

    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('punto_user') : null;
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as { id?: string };
        if (parsed?.id) {
          setCustomerId(parsed.id);
          void loadPass(parsed.id);
        }
      } catch {
        // ignore parse errors, user can paste id manually
      }
    }
  }, []);

  const downloadQrSvg = () => {
    const svg = document.querySelector('#punto-pass-qr svg');
    if (!svg || !pass) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pase-${pass.customer_id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const openAppleWallet = () => {
    if (!pass?.customer_id) return;
    const businessParam = pass.business?.id ? `&businessId=${encodeURIComponent(pass.business.id)}&businessName=${encodeURIComponent(pass.business.name)}` : '';
    const href = `/api/wallet/apple?customerId=${encodeURIComponent(pass.customer_id)}${businessParam}`;
    window.location.href = href;
  };

  const loadPass = async (id: string, selectedBusinessId?: string) => {
    const cleanId = String(id || '').trim();
    if (!cleanId) return;

    setLoading(true);
    setError('');

    try {
      const businessParam = selectedBusinessId ? `?businessId=${encodeURIComponent(selectedBusinessId)}` : '';
      const res = await fetch(`/api/pass/${encodeURIComponent(cleanId)}${businessParam}`);
      const data = (await res.json()) as PassResponse | { error?: string };
      if (!res.ok) {
        setPass(null);
        setError((data as { error?: string }).error || 'No se pudo cargar el pase');
        return;
      }
      setPass(data as PassResponse);
    } catch {
      setPass(null);
      setError('No se pudo cargar el pase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#ff7a59] via-[#ff3f8e] to-[#f90086] p-6 text-white flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-white/35 bg-white/15 backdrop-blur-md p-6 shadow-2xl">
        <p className="text-xs font-black tracking-[0.2em] uppercase text-white/80">Pase de Lealtad</p>
        <h1 className="text-3xl font-black mt-2">Punto IA</h1>
        <p className="mt-2 text-sm text-white/90">Tu QR universal para registrar visitas en cualquier negocio afiliado.</p>

        <div className="mt-5 flex gap-2">
          <input
            className="flex-1 rounded-xl border border-white/40 bg-white/95 text-gray-900 px-3 py-2 font-semibold"
            placeholder="customer_id"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
          <button
            onClick={() => loadPass(customerId, businessId)}
            disabled={loading}
            className="rounded-xl bg-white text-pink-600 px-4 py-2 font-black disabled:opacity-60"
          >
            {loading ? '...' : 'Cargar'}
          </button>
        </div>

        <div className="mt-3">
          <input
            className="w-full rounded-xl border border-white/40 bg-white/95 text-gray-900 px-3 py-2 font-semibold"
            placeholder="business_id (opcional)"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
          />
        </div>

        {error ? <p className="mt-3 text-sm font-bold text-yellow-100">{error}</p> : null}

        {pass ? (
          <div className="mt-5 rounded-2xl bg-white p-5 text-gray-900 shadow-xl">
            <p className="text-xs uppercase tracking-[0.15em] font-black text-pink-600">Cliente</p>
            <p className="text-xl font-black mt-1">{pass.name}</p>
            <p className="text-xs font-semibold text-gray-500 mt-1">ID: {pass.customer_id}</p>
            {pass.business ? (
              <p className="text-xs font-bold text-emerald-700 mt-1">
                {pass.business.name} · {pass.business.currentVisits}/{pass.business.requiredVisits} visitas
              </p>
            ) : null}

            <div id="punto-pass-qr" className="mt-5 rounded-xl border border-pink-100 p-4 flex items-center justify-center bg-white">
              <QRCode value={pass.qr.value} size={240} />
            </div>
            <p className="text-[11px] text-gray-500 mt-3 font-semibold">QR universal firmado. No contiene datos sensibles en texto plano.</p>
            <div className="mt-3 grid gap-2">
              <button onClick={downloadQrSvg} className="w-full rounded-xl border border-pink-100 bg-pink-50 py-2 text-sm font-black text-pink-700 hover:bg-pink-100">
                Descargar QR (SVG)
              </button>
              <button
                type="button"
                onClick={openAppleWallet}
                className="w-full rounded-xl border-2 border-black bg-black py-2 text-sm font-black text-white hover:bg-gray-900"
              >
                🍎 Descargar en Apple Wallet (.pkpass)
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
EOF_web_app_pass_page_tsx

cat > web/app/api/pass/[customer_id]/route.ts <<'EOF_web_app_api_pass__customer_id__route_ts'
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateCustomerPass } from '@/app/lib/customer-pass';

const prisma = new PrismaClient();

type Params = {
  params: Promise<{ customer_id: string }>;
};

export async function GET(req: Request, { params }: Params) {
  try {
    const { customer_id } = await params;
    const customerId = String(customer_id || '').trim();

    if (!customerId) {
      return NextResponse.json({ error: 'customer_id requerido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = String(searchParams.get('businessId') || searchParams.get('business_id') || '').trim();

    const pass = generateCustomerPass(user.id);

    let business: { id: string; name: string; currentVisits: number; requiredVisits: number } | null = null;
    if (businessId) {
      const membership = await prisma.membership.findFirst({
        where: { userId: user.id, tenantId: businessId },
        include: { tenant: { select: { id: true, name: true, requiredVisits: true } } },
      });

      if (membership?.tenant) {
        business = {
          id: membership.tenant.id,
          name: membership.tenant.name,
          currentVisits: membership.currentVisits,
          requiredVisits: membership.tenant.requiredVisits ?? 10,
        };
      } else {
        const tenant = await prisma.tenant.findUnique({
          where: { id: businessId },
          select: { id: true, name: true, requiredVisits: true },
        });
        if (tenant) {
          business = {
            id: tenant.id,
            name: tenant.name,
            currentVisits: 0,
            requiredVisits: tenant.requiredVisits ?? 10,
          };
        }
      }
    }

    return NextResponse.json({
      customer_id: user.id,
      name: user.name || 'Cliente Punto IA',
      branding: {
        app: 'Punto IA',
        theme: 'orange-pink',
      },
      qr: {
        token: pass.token,
        value: pass.qrValue,
      },
      business,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
EOF_web_app_api_pass__customer_id__route_ts

cat > web/app/api/pass/resolve-token/route.ts <<'EOF_web_app_api_pass_resolve-token_route_ts'
import { NextResponse } from 'next/server';
import { verifyCustomerToken } from '@/app/lib/customer-token';

function extractToken(value: string) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get('token');
    if (fromQuery) return fromQuery;

    const path = decodeURIComponent(url.pathname || '');
    const match = path.match(/\/v\/([^/?#]+)\/?$/);
    return match?.[1] || '';
  } catch {
    const decodedRaw = decodeURIComponent(raw);
    if (decodedRaw.includes('/v/')) {
      const match = decodedRaw.match(/\/v\/([^/?#]+)\/?/);
      if (match?.[1]) return match[1];
    }
    return decodedRaw;
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function decodeCidWithoutSignature(token: string) {
  const [encodedPayload] = String(token || '').split('.');
  if (!encodedPayload) return '';

  try {
    const json = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as { cid?: string };
    const cid = String(parsed?.cid || '').trim();
    return isUuid(cid) ? cid : '';
  } catch {
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawInput = String(body?.token || body?.qrValue || '').trim();
    const token = extractToken(rawInput);
    if (!token) {
      return NextResponse.json({ error: 'token requerido' }, { status: 400 });
    }

    try {
      const payload = verifyCustomerToken(token);
      return NextResponse.json({ customerId: payload.cid });
    } catch (error: unknown) {
      const fallbackCustomerId = decodeCidWithoutSignature(token);
      if (fallbackCustomerId) {
        return NextResponse.json({ customerId: fallbackCustomerId, warning: 'token_signature_invalid_fallback' });
      }
      throw error;
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo resolver QR' },
      { status: 400 }
    );
  }
}
EOF_web_app_api_pass_resolve-token_route_ts

cat > web/app/api/pass/page.tsx <<'EOF_web_app_api_pass_page_tsx'
export default function ApiPassPage() {
  return null;
}
EOF_web_app_api_pass_page_tsx

cat > web/app/lib/customer-token.ts <<'EOF_web_app_lib_customer-token_ts'
import { createHmac, timingSafeEqual } from 'crypto';

export type CustomerQrPayload = {
  cid: string;
  iat: number;
  v: 1;
};

function b64url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

export function generateCustomerToken(customerId: string) {
  const cid = String(customerId || '').trim();
  if (!cid) throw new Error('customerId requerido');

  const payload: CustomerQrPayload = {
    cid,
    iat: Math.floor(Date.now() / 1000),
    v: 1,
  };

  const encodedPayload = b64url(JSON.stringify(payload));
  const secret = process.env.QR_TOKEN_SECRET;
  if (!secret) throw new Error('QR_TOKEN_SECRET no configurado');

  const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyCustomerToken(token: string): CustomerQrPayload {
  const raw = String(token || '').trim();
  if (!raw) throw new Error('token requerido');

  const [encodedPayload, signature] = raw.split('.');
  if (!encodedPayload || !signature) throw new Error('token inválido');

  const secret = process.env.QR_TOKEN_SECRET;
  if (!secret) throw new Error('QR_TOKEN_SECRET no configurado');

  const expectedSignature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new Error('token inválido');
  }

  const decodedPayload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
  const parsed = JSON.parse(decodedPayload) as CustomerQrPayload;
  if (!parsed?.cid || parsed?.v !== 1) throw new Error('token inválido');
  return parsed;
}
EOF_web_app_lib_customer-token_ts

cat > web/app/api/wallet/apple/route.ts <<'EOF_web_app_api_wallet_apple_route_ts'
import { createHash } from 'crypto';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateCustomerToken } from '@/app/lib/customer-token';

const execFileAsync = promisify(execFile);
const prisma = new PrismaClient();
let cachedOpenSslBin: string | null = null;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


function getOpenSslEnv() {
  const env = { ...process.env };
  delete env.LD_LIBRARY_PATH;
  delete env.LD_PRELOAD;
  delete env.DYLD_LIBRARY_PATH;
  delete env.DYLD_INSERT_LIBRARIES;
  return env;
}


function pkcs12ArgVariants(baseArgs: string[]) {
  return [baseArgs, ['-legacy', ...baseArgs]];
}

function p12PasswordCandidates(rawPassword: string) {
  const normalized = rawPassword.normalize('NFKC');
  const variants = [
    rawPassword,
    rawPassword.trim(),
    normalized,
    normalized.trim(),
    normalized.replace(/[\u200B-\u200D\uFEFF]/g, ''),
  ];

  const unquoted = rawPassword.trim().replace(/^(?:["'])(.*)(?:["'])$/, '$1');
  variants.push(unquoted);
  variants.push('');

  const seen = new Set<string>();
  return variants.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function decodeP12Base64(rawBase64: string) {
  const withoutDataPrefix = rawBase64.replace(/^data:[^,]+,/, '').trim();
  const normalizedBase64 = withoutDataPrefix
    .replace(/^(?:["'])(.*)(?:["'])$/, '$1')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const decoded = Buffer.from(normalizedBase64, 'base64');
  if (!decoded.length) {
    throw new Error('APPLE_P12_BASE64 está vacío o no es base64 válido.');
  }

  // PKCS#12 is ASN.1 DER and should start with a SEQUENCE tag (0x30).
  if (decoded[0] !== 0x30) {
    throw new Error(
      'APPLE_P12_BASE64 no parece un .p12 válido (formato inesperado al decodificar).'
    );
  }

  return decoded;
}

async function exportPkcs12(
  p12Path: string,
  outputPath: string,
  p12Password: string,
  args: string[]
) {
  let lastError: unknown = null;

  for (const candidatePassword of p12PasswordCandidates(p12Password)) {
    for (const variantArgs of pkcs12ArgVariants(args)) {
      try {
        await runOpenSsl([
          'pkcs12',
          '-in',
          p12Path,
          ...variantArgs,
          '-out',
          outputPath,
          '-passin',
          `pass:${candidatePassword}`,
        ]);
        return;
      } catch (error) {
        lastError = error;
      }
    }
  }

  const baseMessage =
    lastError instanceof Error ? lastError.message : 'No se pudo leer el certificado .p12';
  throw new Error(
    `${baseMessage}
Verifica APPLE_P12_PASSWORD (sin espacios/quotes extra), que APPLE_P12_BASE64 corresponda al mismo .p12 y que no esté entre comillas ni con \\n literales. Si el .p12 fue exportado sin password, deja APPLE_P12_PASSWORD vacío.`
  );
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta env var: ${name}`);
  return value;
}

function optionalEnv(name: string, fallback = '') {
  const value = process.env[name];
  return value == null ? fallback : String(value);
}

function readCustomerId(searchParams: URLSearchParams) {
  const direct = String(searchParams.get('customerId') || '').trim();
  if (direct) return direct;
  // Compatibilidad con enlaces existentes en frontend (`customer_id`).
  return String(searchParams.get('customer_id') || '').trim();
}

async function resolveOpenSslBin() {
  if (cachedOpenSslBin) return cachedOpenSslBin;

  const preferredRaw = String(process.env.OPENSSL_BIN || '').trim();
  const preferred = preferredRaw.startsWith('/') ? preferredRaw : '';
  const candidates = [
    preferred,
    '/usr/local/bin/openssl',
    '/usr/bin/openssl',
    '/bin/openssl',
    '/opt/bin/openssl',
    '/var/lang/bin/openssl',
    '/var/task/bin/openssl',
  ].filter(Boolean);

  const attempted: string[] = [];
  for (const candidate of candidates) {
    attempted.push(candidate);
    try {
      await execFileAsync(candidate, ['version'], { env: getOpenSslEnv() });
      cachedOpenSslBin = candidate;
      return candidate;
    } catch {
      // try next candidate
    }
  }

  const badPreferred = preferredRaw && !preferredRaw.startsWith('/');
  throw new Error(
    `No se encontró un binario OpenSSL funcional en rutas absolutas. Candidatos probados: ${attempted.join(', ')}.` +
      (badPreferred
        ? ` OPENSSL_BIN actual es inválido (${preferredRaw}); debe ser ruta absoluta.`
        : '') +
      ' Configura OPENSSL_BIN con una ruta absoluta (ej: /usr/bin/openssl).'
  );
}

async function runOpenSsl(args: string[]) {
  const env = getOpenSslEnv();
  const opensslBin = await resolveOpenSslBin();

  try {
    return await execFileAsync(opensslBin, args, { env });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (!message.includes('SSL_get_srp_g')) throw error;

    const fallbackBins = ['/usr/bin/openssl', '/usr/local/bin/openssl', '/bin/openssl'];
    for (const bin of fallbackBins) {
      if (bin === opensslBin) continue;
      try {
        await execFileAsync(bin, ['version'], { env });
        cachedOpenSslBin = bin;
        return await execFileAsync(bin, args, { env });
      } catch {
        // keep trying
      }
    }

    throw new Error(
      `${message}
Forza OPENSSL_BIN con ruta absoluta en Vercel/Replit (recomendado: /usr/bin/openssl).`
    );
  }
}


function createCrc32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
}

const crc32Table = createCrc32Table();

function crc32(data: Buffer) {
  let crc = 0xffffffff;
  for (const value of data) {
    crc = crc32Table[(crc ^ value) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(entries: Array<{ name: string; data: Buffer }>) {
  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, 'utf8');
    const fileData = entry.data;
    const checksum = crc32(fileData);

    const localHeader = Buffer.alloc(30 + nameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(fileData.length, 18);
    localHeader.writeUInt32LE(fileData.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuffer.copy(localHeader, 30);

    localChunks.push(localHeader, fileData);

    const centralHeader = Buffer.alloc(46 + nameBuffer.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(fileData.length, 20);
    centralHeader.writeUInt32LE(fileData.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    nameBuffer.copy(centralHeader, 46);

    centralChunks.push(centralHeader);

    offset += localHeader.length + fileData.length;
  }

  const centralDirectory = Buffer.concat(centralChunks);
  const localDirectory = Buffer.concat(localChunks);

  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(localDirectory.length, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([localDirectory, centralDirectory, endRecord]);
}


function buildPkPassArchiveEntries() {
  const required = ['pass.json', 'manifest.json', 'signature', 'icon.png', 'logo.png'] as const;
  const optional = ['icon@2x.png', 'logo@2x.png'] as const;
  return { required, optional };
}

function decodeTenantLogoData(logoData: string) {
  const raw = String(logoData || '').trim();
  if (!raw) return null;

  const dataUrlMatch = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return Buffer.from(dataUrlMatch[2], 'base64');
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) return null;

  try {
    const compact = raw.replace(/\s+/g, '');
    return Buffer.from(compact, 'base64');
  } catch {
    return null;
  }
}

async function createPassPackage(params: {
  customerId: string;
  businessId: string;
  businessName: string;
  requiredVisits: number;
  currentVisits: number;
  tenantLogoData?: string | null;
}) {
  const passTypeIdentifier = requiredEnv('APPLE_PASS_TYPE_ID');
  const teamIdentifier = requiredEnv('APPLE_TEAM_ID');
  const p12Password = optionalEnv('APPLE_P12_PASSWORD');
  const p12Base64 = requiredEnv('APPLE_P12_BASE64');
  const publicBaseUrl = requiredEnv('PUBLIC_BASE_URL').replace(/\/$/, '');

  const qrToken = generateCustomerToken(params.customerId);
  const serialNumber = `${params.customerId}-${params.businessId}`;

  const tempDir = await mkdtemp(join(tmpdir(), 'puntoia-pkpass-'));
  try {
    const p12Path = join(tempDir, 'signer.p12');
    const certPath = join(tempDir, 'signerCert.pem');
    const keyPath = join(tempDir, 'signerKey.pem');
    const chainPath = join(tempDir, 'chain.pem');

    await writeFile(p12Path, decodeP12Base64(p12Base64));

    await exportPkcs12(p12Path, certPath, p12Password, ['-clcerts', '-nokeys']);

    await exportPkcs12(p12Path, keyPath, p12Password, ['-nocerts', '-nodes']);

    // Export all certs from p12 as chain; if user included WWDR chain in p12 this is enough.
    await exportPkcs12(p12Path, chainPath, p12Password, ['-nokeys']);

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier,
      teamIdentifier,
      serialNumber,
      organizationName: params.businessName || 'Negocio afiliado',
      description: `Tarjeta de lealtad · ${params.businessName || 'Negocio afiliado'}`,
      logoText: params.businessName || 'Negocio afiliado',
      foregroundColor: 'rgb(255,255,255)',
      backgroundColor: 'rgb(249,0,134)',
      labelColor: 'rgb(255,199,221)',
      barcode: {
        format: 'PKBarcodeFormatQR',
        message: `${publicBaseUrl}/v/${qrToken}`,
        messageEncoding: 'iso-8859-1',
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: `${publicBaseUrl}/v/${qrToken}`,
          messageEncoding: 'iso-8859-1',
        },
      ],
      storeCard: {
        primaryFields: [{ key: 'visits', label: 'Visitas', value: `${params.currentVisits}/${params.requiredVisits}` }],
        secondaryFields: [
          { key: 'client', label: 'Cliente', value: params.customerId },
          { key: 'business', label: 'Negocio', value: params.businessName || params.businessId },
        ],
        auxiliaryFields: [
          { key: 'brand', label: '', value: 'punto IA' },
        ],
      },
    };

    const assetsDir = join(process.cwd(), 'wallet-assets');
    const requiredFiles = ['icon.png', 'logo.png'];
    for (const name of requiredFiles) {
      await readFile(join(assetsDir, name));
    }

    const tenantLogo = decodeTenantLogoData(String(params.tenantLogoData || ''));
    if (tenantLogo && tenantLogo.length > 0) {
      await writeFile(join(tempDir, 'logo.png'), tenantLogo);
      await writeFile(join(tempDir, 'logo@2x.png'), tenantLogo);
    }

    const passPath = join(tempDir, 'pass.json');
    await writeFile(passPath, JSON.stringify(passJson, null, 2));

    const packageFiles = ['pass.json', 'icon.png', 'logo.png', 'icon@2x.png', 'logo@2x.png'] as const;
    for (const file of packageFiles) {
      const source = file === 'pass.json'
        ? passPath
        : file.startsWith('logo')
          ? join(tempDir, file)
          : join(assetsDir, file);
      try {
        const data = await readFile(source);
        await writeFile(join(tempDir, file), data);
      } catch {
        // optional retina assets can be absent
      }
    }

    const manifest: Record<string, string> = {};
    for (const file of packageFiles) {
      try {
        const data = await readFile(join(tempDir, file));
        manifest[file] = createHash('sha1').update(data).digest('hex');
      } catch {
        // ignore optional files
      }
    }

    const manifestPath = join(tempDir, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    const signaturePath = join(tempDir, 'signature');
    await runOpenSsl([
      'smime',
      '-binary',
      '-sign',
      '-signer',
      certPath,
      '-inkey',
      keyPath,
      '-certfile',
      chainPath,
      '-in',
      manifestPath,
      '-out',
      signaturePath,
      '-outform',
      'DER',
    ]);

    const archive = buildPkPassArchiveEntries();
    const zipEntries: Array<{ name: string; data: Buffer }> = [];

    for (const file of archive.required) {
      const data = await readFile(join(tempDir, file));
      zipEntries.push({ name: file, data });
    }

    for (const file of archive.optional) {
      try {
        const data = await readFile(join(tempDir, file));
        zipEntries.push({ name: file, data });
      } catch {
        // optional files can be absent
      }
    }

    return buildZip(zipEntries);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = readCustomerId(searchParams);
    const businessId = String(searchParams.get('businessId') || '').trim();
    const businessNameInput = String(searchParams.get('businessName') || '').trim();

    if (!customerId) {
      return NextResponse.json({ error: 'customerId requerido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: customerId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    let businessName = businessNameInput || 'Negocio afiliado';
    let requiredVisits = 10;
    let currentVisits = 0;
    let tenantLogoData: string | null = null;

    if (businessId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: businessId },
        select: { id: true, name: true, requiredVisits: true, logoData: true },
      });
      if (tenant) {
        businessName = tenant.name || businessName;
        requiredVisits = tenant.requiredVisits ?? 10;
        tenantLogoData = tenant.logoData || null;

        const membership = await prisma.membership.findFirst({
          where: { tenantId: tenant.id, userId: user.id },
          select: { currentVisits: true },
        });
        currentVisits = membership?.currentVisits ?? 0;
      }
    }

    const pkpass = await createPassPackage({
      customerId: user.id,
      businessId: businessId || 'coalition',
      businessName,
      requiredVisits,
      currentVisits,
      tenantLogoData,
    });

    return new NextResponse(pkpass, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="puntoia.pkpass"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudo generar el .pkpass';
    const status =
      message.startsWith('Falta env var:') ||
      message.includes('APPLE_P12_BASE64') ||
      message.includes('Verifica APPLE_P12_PASSWORD')
        ? 400
        : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
EOF_web_app_api_wallet_apple_route_ts

echo '[OK] Archivos actualizados.'
echo '[INFO] Ejecutando lint rápido...'
cd web
npx eslint app/admin/page.tsx --rule '@typescript-eslint/no-explicit-any: off' --rule '@typescript-eslint/no-unused-vars: off'
npx eslint app/page.tsx --rule '@typescript-eslint/no-explicit-any: off' --rule '@typescript-eslint/no-unused-vars: off'
npx eslint app/pass/page.tsx app/api/pass/[customer_id]/route.ts app/api/pass/resolve-token/route.ts app/api/pass/page.tsx app/lib/customer-token.ts app/api/wallet/apple/route.ts
echo '[DONE] Todo listo ✅'
