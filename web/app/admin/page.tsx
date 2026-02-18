'use client';
import { useState } from 'react';
import QRCode from 'react-qr-code';
import dynamic from 'next/dynamic';

const AdminMap = dynamic(() => import('../components/AdminMap'), { ssr: false, loading: () => <div className="h-full bg-gray-100 animate-pulse text-center pt-10 text-gray-400">Cargando...</div> });

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

const [team, setTeam] = useState<any[]>([]);
const [newStaff, setNewStaff] = useState({ name: '', username: '', password: '', role: 'STAFF' });

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
setTab('dashboard'); 
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
