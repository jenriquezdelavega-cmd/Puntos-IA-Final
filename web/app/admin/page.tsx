'use client';
import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';

export default function AdminPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [code, setCode] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [baseUrl, setBaseUrl] = useState('');
  
  // Tabs
  const [tab, setTab] = useState('dashboard'); // dashboard | qr | settings

  const [prizeName, setPrizeName] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [msg, setMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tenant/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if(res.ok) {
        setTenant(data.tenant);
        setPrizeName(data.tenant.prize || '');
        if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
        loadReports(data.tenant.id); // Cargar datos iniciales
      } else alert(data.error);
    } catch(e) { alert('Error'); }
  };

  const loadReports = async (tid: string) => {
    try {
      const res = await fetch('/api/admin/reports', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ tenantId: tid }) });
      setReportData(await res.json());
    } catch(e) {}
  };

  const generateCode = async () => {
    try {
      const res = await fetch('/api/admin/generate', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ tenantId: tenant.id }) });
      const data = await res.json();
      if (data.code) setCode(data.code);
    } catch (e) {}
  };

  const savePrize = async () => {
    try {
      await fetch('/api/tenant/settings', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ tenantId: tenant.id, prize: prizeName }) });
      alert('Guardado');
    } catch(e) { alert('Error'); }
  };

  const validateRedeem = async () => {
    setMsg('Validando...');
    try {
      const res = await fetch('/api/redeem/validate', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ tenantId: tenant.id, code: redeemCode }) });
      const data = await res.json();
      if (res.ok) { setMsg(`✅ ENTREGAR A: ${data.user}`); setRedeemCode(''); loadReports(tenant.id); } 
      else setMsg('❌ ' + data.error);
    } catch(e) { setMsg('Error'); }
  };

  // EXPORTAR A EXCEL (CSV)
  const downloadCSV = () => {
    if (!reportData?.csvData) return;
    const headers = Object.keys(reportData.csvData[0]).join(',');
    const rows = reportData.csvData.map((obj: any) => Object.values(obj).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clientes_${tenant.slug}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  // --- LOGIN VIEW ---
  if (!tenant) return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
           <h1 className="text-3xl font-black text-white tracking-tighter">punto<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">IA</span></h1>
           <p className="text-gray-400 text-sm mt-2">Panel de Negocios</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input className="w-full p-4 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-pink-500 outline-none transition-all" placeholder="Usuario" value={username} onChange={e=>setUsername(e.target.value)} />
          <input type="password" className="w-full p-4 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-pink-500 outline-none transition-all" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="w-full bg-gradient-to-r from-orange-500 to-pink-600 font-bold py-4 rounded-xl text-white shadow-lg hover:shadow-xl active:scale-95 transition-all">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  );

  const qrValue = code ? `${baseUrl}/?code=${code}` : '';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-gray-900 text-white hidden md:flex flex-col p-6 fixed h-full">
        <h1 className="text-2xl font-black tracking-tighter mb-10">punto<span className="text-pink-500">IA</span></h1>
        
        <nav className="space-y-2 flex-1">
          <button onClick={() => setTab('dashboard')} className={`w-full text-left p-3 rounded-xl font-medium transition-all ${tab==='dashboard'?'bg-gray-800 text-white':'text-gray-400 hover:text-white'}`}>📊 Dashboard</button>
          <button onClick={() => setTab('qr')} className={`w-full text-left p-3 rounded-xl font-medium transition-all ${tab==='qr'?'bg-gray-800 text-white':'text-gray-400 hover:text-white'}`}>🎲 Generar QR</button>
          <button onClick={() => setTab('redeem')} className={`w-full text-left p-3 rounded-xl font-medium transition-all ${tab==='redeem'?'bg-gray-800 text-white':'text-gray-400 hover:text-white'}`}>🎁 Canjear</button>
          <button onClick={() => setTab('settings')} className={`w-full text-left p-3 rounded-xl font-medium transition-all ${tab==='settings'?'bg-gray-800 text-white':'text-gray-400 hover:text-white'}`}>⚙️ Configuración</button>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-800">
           <p className="text-xs text-gray-500 mb-2">Conectado como:</p>
           <p className="font-bold text-sm truncate">{tenant.name}</p>
           <button onClick={() => setTenant(null)} className="text-xs text-red-400 mt-2 hover:text-red-300">Cerrar Sesión</button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 md:ml-64 p-8 overflow-y-auto">
        
        {/* HEADER MOVIL (Solo visible en cel) */}
        <div className="md:hidden flex justify-between items-center mb-8">
           <h1 className="text-xl font-black text-gray-900">punto<span className="text-pink-500">IA</span></h1>
           <button onClick={() => setTenant(null)} className="text-sm text-red-500 font-bold">Salir</button>
        </div>

        {/* --- VISTA DASHBOARD --- */}
        {tab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-bold text-gray-800">Resumen General</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <p className="text-gray-400 text-xs font-bold uppercase">Clientes Totales</p>
                  <p className="text-4xl font-black text-gray-900 mt-2">{reportData?.csvData?.length || 0}</p>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <p className="text-gray-400 text-xs font-bold uppercase">Premio Actual</p>
                  <p className="text-xl font-bold text-pink-500 mt-2">{prizeName || 'No definido'}</p>
               </div>
               <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-6 rounded-3xl shadow-lg text-white cursor-pointer hover:scale-[1.02] transition-transform" onClick={downloadCSV}>
                  <p className="font-bold uppercase text-xs opacity-80">Base de Datos</p>
                  <p className="text-2xl font-black mt-2">📥 Descargar Excel</p>
               </div>
            </div>

            {/* GRÁFICA DE VISITAS */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <h3 className="text-lg font-bold text-gray-800 mb-6">Tendencia de Visitas</h3>
               <div className="h-64 flex items-end justify-between gap-2">
                  {reportData?.chartData?.length > 0 ? reportData.chartData.map((d: any, i: number) => {
                     const height = Math.min(d.count * 20, 200); // Escala simple
                     return (
                       <div key={i} className="flex flex-col items-center flex-1 group">
                          <div className="relative w-full flex justify-center">
                             <span className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
                             <div style={{ height: `${height}px` }} className="w-full max-w-[40px] bg-indigo-100 rounded-t-xl group-hover:bg-indigo-500 transition-colors"></div>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 transform -rotate-45 origin-left truncate w-full">{d.date.slice(5)}</p>
                       </div>
                     )
                  }) : <p className="text-gray-400 w-full text-center">Sin datos suficientes</p>}
               </div>
            </div>
          </div>
        )}

        {/* --- VISTA QR --- */}
        {tab === 'qr' && (
          <div className="flex flex-col items-center justify-center h-full animate-fadeIn">
             <div className="bg-white p-10 rounded-[3rem] shadow-xl text-center border border-gray-100 max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Código de Hoy</h2>
                <div className="bg-gray-50 p-6 rounded-3xl mb-6 flex justify-center">
                   {qrValue ? <QRCode value={qrValue} size={200} /> : <div className="h-[200px] w-[200px] bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">Sin QR</div>}
                </div>
                {code && <p className="text-4xl font-mono font-black text-gray-900 tracking-widest mb-6">{code}</p>}
                <button onClick={generateCode} className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-gray-800 transition-all">Generar Nuevo</button>
             </div>
          </div>
        )}

        {/* --- VISTA CANJE --- */}
        {tab === 'redeem' && (
          <div className="max-w-md mx-auto mt-10 animate-fadeIn">
             <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-pink-100">
                <div className="bg-pink-50 p-4 rounded-2xl mb-6 text-center">
                   <p className="text-pink-600 font-bold uppercase text-xs tracking-widest">Validar Premio</p>
                </div>
                <input 
                  className="w-full p-6 text-center text-3xl font-mono font-bold tracking-[0.5em] uppercase border-2 border-gray-100 rounded-2xl mb-6 focus:border-pink-500 outline-none" 
                  placeholder="0000" 
                  maxLength={4}
                  value={redeemCode}
                  onChange={e => setRedeemCode(e.target.value)}
                />
                <button onClick={validateRedeem} disabled={!redeemCode} className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50">
                  Validar Código
                </button>
                {msg && <div className="mt-6 p-4 bg-gray-50 rounded-2xl text-center font-bold text-gray-800 whitespace-pre-line border border-gray-200">{msg}</div>}
             </div>
          </div>
        )}

        {/* --- VISTA CONFIG --- */}
        {tab === 'settings' && (
          <div className="max-w-lg mx-auto mt-10 animate-fadeIn">
             <div className="bg-white p-8 rounded-[2.5rem] shadow-xl">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Configuración del Negocio</h2>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Premio (Meta de 100 pts)</label>
                <input className="w-full p-4 bg-gray-50 rounded-2xl mt-2 mb-6 font-medium text-gray-800 border border-transparent focus:bg-white focus:border-gray-200 outline-none transition-all" value={prizeName} onChange={e => setPrizeName(e.target.value)} />
                <button onClick={savePrize} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all">Guardar Cambios</button>
             </div>
          </div>
        )}

      </div>

      {/* NAVBAR MOVIL (Solo visible en cel) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-4 z-50">
         <button onClick={()=>setTab('dashboard')} className={`text-2xl ${tab==='dashboard'?'grayscale-0':'grayscale opacity-50'}`}>📊</button>
         <button onClick={()=>setTab('qr')} className={`text-2xl ${tab==='qr'?'grayscale-0':'grayscale opacity-50'}`}>🎲</button>
         <button onClick={()=>setTab('redeem')} className={`text-2xl ${tab==='redeem'?'grayscale-0':'grayscale opacity-50'}`}>🎁</button>
         <button onClick={()=>setTab('settings')} className={`text-2xl ${tab==='settings'?'grayscale-0':'grayscale opacity-50'}`}>⚙️</button>
      </div>

    </div>
  );
}
