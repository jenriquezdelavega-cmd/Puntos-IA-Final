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
const [walletBackgroundColor, setWalletBackgroundColor] = useState('#1f2937');
const [walletForegroundColor, setWalletForegroundColor] = useState('#ffffff');
const [walletLabelColor, setWalletLabelColor] = useState('#bfdbfe');
const [walletStripImageData, setWalletStripImageData] = useState<string | null>('');

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
setWalletBackgroundColor(String(data.tenant.walletBackgroundColor ?? '#1f2937'));
setWalletForegroundColor(String(data.tenant.walletForegroundColor ?? '#ffffff'));
setWalletLabelColor(String(data.tenant.walletLabelColor ?? '#bfdbfe'));
setWalletStripImageData(data.tenant.walletStripImageData || '');

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
  const toPngStripDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('Formato inválido.'));
    image.onload = () => {
      const targetWidth = 624;
      const targetHeight = 246;
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo procesar la imagen.'));
        return;
      }

      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      const scale = Math.max(targetWidth / image.width, targetHeight / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const offsetX = (targetWidth - drawWidth) / 2;
      const offsetY = (targetHeight - drawHeight) / 2;
      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

      const pngDataUrl = canvas.toDataURL('image/png');
      resolve(pngDataUrl);
      const approxBytes = Math.ceil((pngDataUrl.length - 'data:image/png;base64,'.length) * 0.75);
      if (approxBytes > 400 * 1024) {
        reject(new Error('Imagen muy pesada después de convertirla a PNG (máx 400KB).'));
        return;
      }

      resolve(pngDataUrl);
    };
    image.src = String(reader.result || '');
  };
  reader.readAsDataURL(file);
  });

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
        instagram: instagram,
        walletBackgroundColor: walletBackgroundColor || undefined,
        walletForegroundColor: walletForegroundColor || undefined,
        walletLabelColor: walletLabelColor || undefined,
        walletStripImageData: walletStripImageData,
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
      setWalletBackgroundColor(String(data.tenant.walletBackgroundColor ?? walletBackgroundColor));
      setWalletForegroundColor(String(data.tenant.walletForegroundColor ?? walletForegroundColor));
      setWalletLabelColor(String(data.tenant.walletLabelColor ?? walletLabelColor));
      setWalletStripImageData(data.tenant.walletStripImageData || '');

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
<div className="space-y-6 animate-fadeIn">
<div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 md:p-8 rounded-3xl text-white relative overflow-hidden">
  <div className="absolute -top-20 -right-20 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />
  <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
  <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
    <div>
      <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Panel de administración</p>
      <h2 className="text-2xl md:text-3xl font-black mt-1">¡Hola, {tenant.name}!</h2>
      <p className="text-gray-400 text-sm font-medium mt-1">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
    <div className="flex gap-2">
      <button className="bg-white/10 border border-white/20 px-4 py-2.5 rounded-xl text-white font-bold text-sm hover:bg-white/20 transition" onClick={() => { loadReports(tenant.id); loadTeam(tenant.id); }}>🔄 Actualizar</button>
      <button className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2.5 rounded-xl shadow-lg text-white font-bold text-sm" onClick={downloadCSV}>📥 Exportar CSV</button>
    </div>
  </div>
</div>

<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 mb-2">
      <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-lg">👥</span>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Clientes</p>
    </div>
    <p className="text-3xl font-black text-gray-900">{totalClients}</p>
    <p className="text-[11px] text-gray-400 font-semibold mt-1">registrados</p>
  </div>
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 mb-2">
      <span className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-lg">✅</span>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Check-ins</p>
    </div>
    <p className="text-3xl font-black text-gray-900">{totalCheckins}</p>
    <p className="text-[11px] text-gray-400 font-semibold mt-1">acumulados</p>
  </div>
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 mb-2">
      <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-lg">🔥</span>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Día top</p>
    </div>
    <p className="text-xl font-black text-gray-900">{peakDay ? peakDay.count : '—'}</p>
    <p className="text-[11px] text-gray-400 font-semibold mt-1 truncate">{peakDay ? String(peakDay.date).slice(5) : 'sin datos'}</p>
  </div>
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 mb-2">
      <span className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-lg">⭐</span>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider">Promedio</p>
    </div>
    <p className="text-3xl font-black text-gray-900">{trendData.length > 0 ? (totalCheckins / trendData.length).toFixed(1) : '—'}</p>
    <p className="text-[11px] text-gray-400 font-semibold mt-1">visitas/día</p>
  </div>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
  <button onClick={() => setTab('qr')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-md hover:border-gray-200 transition-all group">
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📷</span>
      <div>
        <p className="text-sm font-black text-gray-800">Generar QR del día</p>
        <p className="text-[11px] text-gray-400 font-semibold">Abre el código para tus clientes</p>
      </div>
    </div>
  </button>
  <button onClick={() => setTab('redeem')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-md hover:border-gray-200 transition-all group">
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎁</span>
      <div>
        <p className="text-sm font-black text-gray-800">Validar canje</p>
        <p className="text-[11px] text-gray-400 font-semibold">Entrega un premio a tu cliente</p>
      </div>
    </div>
  </button>
  <button onClick={() => setTab('settings')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-md hover:border-gray-200 transition-all group">
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">⚙️</span>
      <div>
        <p className="text-sm font-black text-gray-800">Configuración</p>
        <p className="text-[11px] text-gray-400 font-semibold">Premio, wallet, ubicación</p>
      </div>
    </div>
  </button>
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
<div className="max-w-2xl mx-auto space-y-4 animate-fadeIn">
  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">👥</span>
        <div>
          <h2 className="text-lg font-black">Agregar Personal</h2>
          <p className="text-white/80 text-xs font-semibold">Crea cuentas para tu equipo operativo o administrativo</p>
        </div>
      </div>
    </div>
    <div className="p-6 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="p-3.5 bg-gray-50 rounded-xl outline-none border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-300 focus:bg-white transition text-sm font-semibold" placeholder="Nombre (ej: Pedro)" value={newStaff.name} onChange={e=>setNewStaff({...newStaff, name: e.target.value})} />
        <div className="flex items-center bg-gray-50 rounded-xl px-3.5 border border-gray-200 focus-within:ring-2 focus-within:ring-purple-300 focus-within:bg-white transition">
          <span className="text-gray-400 font-mono text-xs font-bold mr-1 select-none shrink-0">{tenant.codePrefix || '???'}.</span>
          <input className="bg-transparent w-full py-3.5 outline-none font-semibold text-gray-900 placeholder:text-gray-400 text-sm" placeholder="usuario" value={newStaff.username} onChange={e=>setNewStaff({...newStaff, username: e.target.value})} />
        </div>
        <input type="password" className="p-3.5 bg-gray-50 rounded-xl outline-none border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-300 focus:bg-white transition text-sm font-semibold" placeholder="Contraseña" value={newStaff.password} onChange={e=>setNewStaff({...newStaff, password: e.target.value})} />
        <select className="p-3.5 bg-gray-50 rounded-xl outline-none border border-gray-200 text-gray-900 focus:ring-2 focus:ring-purple-300 text-sm font-semibold" value={newStaff.role} onChange={e=>setNewStaff({...newStaff, role: e.target.value})}>
          <option value="STAFF">👤 Operativo (QR + Canje)</option>
          <option value="ADMIN">👑 Administrador (Total)</option>
        </select>
      </div>
      <button onClick={createStaff} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black py-3.5 rounded-xl shadow-md text-sm hover:shadow-lg transition-all">Agregar Empleado</button>
    </div>
  </div>

  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-black text-gray-800">Mi Equipo</h2>
        <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full">{team.length}</span>
      </div>
    </div>
    <div className="divide-y divide-gray-50">
      {team.length > 0 ? team.map((u: any) => (
        <div key={u.id} className="px-6 py-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 ${u.role === 'ADMIN' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-sky-500 to-blue-600'}`}>
              {u.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-sm truncate">{u.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[11px] text-gray-400 font-semibold truncate">{u.username}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{u.role === 'ADMIN' ? 'Admin' : 'Staff'}</span>
              </div>
            </div>
          </div>
          <button onClick={() => deleteStaff(u.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition shrink-0" title="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      )) : (
        <div className="px-6 py-10 text-center">
          <p className="text-gray-300 text-3xl mb-2">👥</p>
          <p className="text-gray-400 text-sm font-semibold">Sin empleados registrados</p>
        </div>
      )}
    </div>
  </div>
</div>
)}

{tab === 'qr' && (
<div className="max-w-lg mx-auto space-y-4 animate-fadeIn">
  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black">Código QR del Día</h2>
          <p className="text-gray-400 text-xs font-semibold mt-0.5">Muestra este QR a tus clientes para que registren su visita</p>
        </div>
        <button onClick={generateCode} className="bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/20 transition shrink-0">
          {code ? '🔄 Nuevo' : '▶ Generar'}
        </button>
      </div>
    </div>
    <div className="p-6 flex flex-col items-center">
      <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100">
        {qrValue ? <QRCode value={qrValue} size={220} /> : <div className="h-[220px] w-[220px] bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-300"><span className="text-5xl mb-2">📷</span><span className="text-xs font-bold">Presiona &quot;Generar&quot;</span></div>}
      </div>
      {code && (
        <div className="mt-4 bg-gray-50 px-6 py-3 rounded-xl border border-gray-100">
          <p className="text-2xl font-mono font-black text-gray-900 tracking-[0.3em] text-center">{code}</p>
        </div>
      )}
    </div>
  </div>

  <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
    <div className="bg-emerald-50 p-5 border-b border-emerald-100">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">📱</span>
        <div>
          <h3 className="text-sm font-black text-emerald-800">Escanear pase de cliente</h3>
          <p className="text-[11px] text-emerald-600 font-semibold">Escanea el QR del Apple Wallet del cliente para registrar su visita</p>
        </div>
      </div>
    </div>
    <div className="p-5">
      <button
        onClick={() => { setScannerOpen(true); setScannerMsg('Apunta al QR del pase del cliente'); }}
        className="w-full px-4 py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-md hover:bg-emerald-700 transition flex items-center justify-center gap-2"
      >
        <span className="text-lg">📷</span> Abrir Cámara
      </button>
      {scannerMsg && <p className="mt-3 text-sm font-bold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">{scannerMsg}</p>}
      {lastScannedCustomerId && <p className="mt-2 text-[11px] font-mono text-gray-400">Último cliente: {lastScannedCustomerId.slice(0, 8)}...</p>}
    </div>
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
<div className="max-w-md mx-auto space-y-4 animate-fadeIn">
  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-r from-orange-500 to-pink-600 p-5 text-white">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🎁</span>
        <div>
          <h2 className="text-lg font-black">Validar Premio</h2>
          <p className="text-white/80 text-xs font-semibold">Ingresa el código de 4 dígitos que muestra el cliente</p>
        </div>
      </div>
    </div>
    <div className="p-6">
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-4">
        <input
          className="w-full p-4 text-center text-4xl font-mono font-black tracking-[0.5em] uppercase bg-white border-2 border-gray-200 rounded-2xl outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all"
          placeholder="0000"
          maxLength={4}
          value={redeemCode}
          onChange={e => setRedeemCode(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
        />
      </div>
      <button
        onClick={validateRedeem}
        disabled={!redeemCode || redeemCode.length < 4}
        className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white font-black py-4 rounded-2xl shadow-md disabled:opacity-40 disabled:shadow-none transition-all text-sm"
      >
        Validar y Entregar Premio
      </button>
      {msg && (
        <div className={`mt-4 p-4 rounded-2xl text-center font-bold text-sm border ${msg.includes('ENTREGAR') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : msg.includes('❌') || msg.includes('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
          {msg}
        </div>
      )}
    </div>
  </div>

  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
    <p className="text-xs text-gray-500 font-semibold text-center">
      💡 El cliente genera su código de 4 dígitos desde la app cuando completa sus visitas. Pídele el código y valídalo aquí antes de entregar el premio.
    </p>
  </div>
</div>
)}

{tab === 'settings' && userRole === 'ADMIN' && (
<div className="max-w-lg mx-auto space-y-4 animate-fadeIn">

<div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
  <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 text-white">
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">⚙️</span>
      <div>
        <h2 className="text-lg font-black">Configuración</h2>
        <p className="text-white/80 text-xs font-semibold">Personaliza tu negocio, premio y pase digital</p>
      </div>
    </div>
  </div>
  <div className="p-6 space-y-4">
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Nombre del Negocio</label>
      <input className="w-full p-3.5 bg-gray-50 rounded-xl mt-1 text-gray-500 font-bold border border-gray-100 cursor-not-allowed text-sm" value={tenant.name} readOnly />
    </div>
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">🎁 Premio al Completar Visitas</label>
      <input className="w-full p-3.5 bg-white rounded-xl mt-1 font-semibold text-gray-900 border border-gray-200 focus:ring-2 focus:ring-pink-300 outline-none transition-all text-sm placeholder:text-gray-400" value={prizeName} onChange={e => setPrizeName(e.target.value)} placeholder="Ej: Café gratis, 2x1, Descuento 20%" />
    </div>
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
        accept="image/png"
        className="w-full p-4 bg-gray-50 rounded-2xl font-medium text-gray-800 border border-transparent focus:bg-white focus:border-gray-200 outline-none transition-all"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 200 * 1024) {
            alert('Imagen inválida o muy pesada. Usa PNG (máx ~400KB) para wallet.');

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
  </div>
</div>

<div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100">
    <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">📱 Personalización Apple Wallet</h3>
    <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Colores e imagen del pase digital de tus clientes</p>
  </div>
  <div className="p-6 space-y-4">
  <div className="space-y-3">
    <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Personalización Apple Wallet</p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <label className="text-xs font-semibold text-gray-600">Fondo
        <input type="color" className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white" value={walletBackgroundColor} onChange={e => setWalletBackgroundColor(e.target.value)} />
      </label>
      <label className="text-xs font-semibold text-gray-600">Texto
        <input type="color" className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white" value={walletForegroundColor} onChange={e => setWalletForegroundColor(e.target.value)} />
      </label>
      <label className="text-xs font-semibold text-gray-600">Etiquetas
        <input type="color" className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white" value={walletLabelColor} onChange={e => setWalletLabelColor(e.target.value)} />
      </label>
    </div>
  <div>
    <label className="text-xs font-semibold text-gray-600">Imagen cabecera del pase (strip)</label>
    <input
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/webp"
      className="w-full p-3 bg-white rounded-xl mt-1 text-sm font-medium text-gray-800 border border-gray-200"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
          alert('Imagen muy pesada. Usa una imagen menor a 2MB para convertirla a strip.');
          return;
        }
        try {
          const pngDataUrl = await toPngStripDataUrl(file);
          setWalletStripImageData(pngDataUrl);
        } catch (error) {
          alert(error instanceof Error ? error.message : 'No se pudo procesar la imagen para Wallet.');
        }
      }}
    />
    <div className="mt-2 flex items-center gap-2">
      <button type="button" onClick={() => setWalletStripImageData(null)} className="px-3 py-1 rounded-lg text-xs font-bold bg-gray-200 text-gray-700">Quitar imagen</button>
      <span className="text-[11px] text-gray-500 font-semibold">
        Puedes subir PNG/JPG/WEBP. Se convierte automático a PNG strip 1242x492 (2.5:1).
      </span>
    </div>
    {walletStripImageData ? (
      <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={walletStripImageData} alt="Preview strip wallet" className="w-full h-24 object-cover" />
      </div>
    ) : null}
  </div>

  </div>
  </div>
</div>

<div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100">
    <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">🎯 Reglas del Programa</h3>
    <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Visitas necesarias y periodo de vigencia</p>
  </div>
  <div className="p-6 space-y-4">
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Visitas para ganar premio</label>
      <input type="number" min="1" className="w-full p-3.5 bg-gray-50 rounded-xl mt-1 font-semibold text-gray-900 border border-gray-200 focus:ring-2 focus:ring-pink-300 outline-none transition-all text-sm" value={requiredVisits} onChange={e => setRequiredVisits(e.target.value)} />
      <p className="text-[11px] text-gray-400 font-semibold mt-1.5 ml-1">El cliente necesita {requiredVisits || 10} visitas para obtener su premio.</p>
    </div>
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Vigencia del contador</label>
      <select className="w-full p-3.5 bg-gray-50 rounded-xl mt-1 font-semibold text-gray-900 border border-gray-200 focus:ring-2 focus:ring-pink-300 outline-none transition-all text-sm" value={rewardPeriod} onChange={e => setRewardPeriod(e.target.value)}>
        <option value="OPEN">♾️ Sin caducidad (acumulan siempre)</option>
        <option value="MONTHLY">📅 Mensual (se reinicia cada mes)</option>
        <option value="QUARTERLY">📊 Trimestral (cada 3 meses)</option>
        <option value="SEMESTER">📆 Semestral (cada 6 meses)</option>
        <option value="ANNUAL">🗓️ Anual (cada año)</option>
      </select>
    </div>
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">📸 Instagram</label>
      <input className="w-full p-3.5 bg-pink-50 rounded-xl mt-1 font-semibold text-pink-600 border border-pink-100 focus:bg-white focus:ring-2 focus:ring-pink-300 outline-none transition-all text-sm" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@tu_negocio" />
    </div>
  </div>
</div>

<div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100">
    <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">📍 Ubicación</h3>
    <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Aparece en el mapa de negocios aliados</p>
  </div>
  <div className="p-6 space-y-3">
    <div className="flex gap-2">
      <input className="flex-1 p-3 bg-gray-50 rounded-xl text-gray-800 text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-blue-200 font-semibold" placeholder="Buscar dirección..." value={addressSearch} onChange={(e) => setAddressSearch(e.target.value)} />
      <button onClick={searchLocation} disabled={isSearching} className="bg-blue-600 text-white px-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shrink-0 text-sm" aria-label="Buscar">{isSearching ? '...' : '🔍'}</button>
    </div>
    <div className="h-[280px] w-full rounded-2xl overflow-hidden border border-gray-200 z-0 relative"><AdminMap coords={coords} setCoords={setCoords} /></div>
  </div>
</div>

<button onClick={saveSettings} className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-4 rounded-2xl font-black shadow-md hover:shadow-lg transition-all text-sm">
  💾 Guardar Todos los Cambios
</button>
</div>
)}
</div>
</div>
);
}
