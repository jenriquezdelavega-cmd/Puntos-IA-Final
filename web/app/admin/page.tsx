'use client';
import { useState } from 'react';
import QRCode from 'react-qr-code';

export default function AdminPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [baseUrl, setBaseUrl] = useState('');
  
  // NUEVOS ESTADOS
  const [prizeName, setPrizeName] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [msg, setMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tenant/login', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if(res.ok) {
        setTenant(data.tenant);
        setPrizeName(data.tenant.prize || ''); // Cargar premio actual
        if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
      } else alert(data.error);
    } catch(e) { alert('Error'); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ tenantId: tenant.id })
      });
      setStats(await res.json());
    } catch (e) {}
  };

  const generateCode = async () => {
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ tenantId: tenant.id })
      });
      const data = await res.json();
      if (data.code) setCode(data.code);
    } catch (e) {}
  };

  // 💾 GUARDAR PREMIO
  const savePrize = async () => {
    try {
      await fetch('/api/tenant/settings', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ tenantId: tenant.id, prize: prizeName })
      });
      alert('Premio actualizado: ' + prizeName);
    } catch(e) { alert('Error'); }
  };

  // 🎁 VALIDAR CANJE
  const validateRedeem = async () => {
    setMsg('Validando...');
    try {
      const res = await fetch('/api/redeem/validate', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ tenantId: tenant.id, code: redeemCode })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`✅ ¡ENTREGAR PREMIO! \nCliente: ${data.user}`);
        setRedeemCode('');
      } else {
        setMsg('❌ ' + data.error);
      }
    } catch(e) { setMsg('Error'); }
  };

  if (!tenant) return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">🏢 Acceso Negocio</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input className="w-full p-3 rounded bg-gray-700 text-white" placeholder="Usuario" value={username} onChange={e=>setUsername(e.target.value)} />
          <input type="password" className="w-full p-3 rounded bg-gray-700 text-white" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="w-full bg-blue-600 font-bold py-3 rounded text-white">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  );

  const qrValue = code ? `${baseUrl}/?code=${code}` : '';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-2xl font-bold">Panel de Control</h1><p className="text-blue-400 font-bold">{tenant.name}</p></div>
          <button onClick={() => setTenant(null)} className="text-sm text-gray-400">Salir</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1. QR */}
          <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl flex flex-col items-center">
            <h2 className="text-lg font-bold mb-4 text-blue-400">🎲 QR del Día</h2>
            <div className="bg-white p-4 rounded-xl mb-4">{qrValue ? <QRCode value={qrValue} size={150} /> : <span className="text-black">Generar...</span>}</div>
            {code && <p className="font-mono text-2xl font-bold mb-4">{code}</p>}
            <button onClick={generateCode} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">Generar QR</button>
          </div>

          {/* 2. CANJEAR PREMIO */}
          <div className="bg-gray-800 p-6 rounded-3xl border border-yellow-600/50 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-yellow-600 text-xs font-bold px-3 py-1 rounded-bl-xl text-black">CAJA</div>
             <h2 className="text-lg font-bold mb-4 text-yellow-400">🎁 Canjear Premio</h2>
             
             <p className="text-sm text-gray-400 mb-2">Ingresa código del cliente:</p>
             <input 
               className="w-full p-4 text-center text-2xl font-mono tracking-widest bg-black border border-gray-600 rounded-xl mb-4 text-yellow-400 placeholder-gray-700 uppercase" 
               placeholder="0000" 
               maxLength={4}
               value={redeemCode}
               onChange={e => setRedeemCode(e.target.value)}
             />
             
             <button onClick={validateRedeem} disabled={!redeemCode} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-xl mb-4 transition-colors">
               ✅ Validar y Entregar
             </button>

             {msg && <div className="p-3 bg-gray-900 rounded-lg text-center whitespace-pre-wrap font-bold">{msg}</div>}
          </div>

          {/* 3. CONFIGURACIÓN */}
          <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-purple-400">⚙️ Configuración</h2>
            <label className="text-xs text-gray-500 uppercase font-bold">Premio por 100 Puntos</label>
            <input className="w-full p-3 bg-gray-700 rounded-lg mt-1 mb-4 text-white" value={prizeName} onChange={e => setPrizeName(e.target.value)} />
            <button onClick={savePrize} className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-bold">Guardar Cambios</button>
            
            <div className="mt-8 pt-6 border-t border-gray-700">
               <div className="flex justify-between items-center">
                 <h3 className="font-bold">Clientes</h3>
                 <button onClick={fetchStats} className="text-xs bg-gray-700 px-2 py-1 rounded">↻</button>
               </div>
               <p className="text-4xl font-bold mt-2">{stats ? stats.total : '-'}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
