'use client';
import { useState } from 'react';
import QRCode from 'react-qr-code';

export default function AdminPage() {
  const [tenant, setTenant] = useState<any>(null); // Guardamos datos del negocio
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  // 1. LOGIN DE NEGOCIO
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/tenant/login', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if(res.ok) {
        setTenant(data.tenant); // Guardamos sesión
        if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
      } else {
        alert(data.error);
      }
    } catch(e) { alert('Error de conexión'); }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ tenantId: tenant.id }) // Enviamos ID
      });
      setStats(await res.json());
    } catch (e) {}
  };

  const generateCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ tenantId: tenant.id }) // Enviamos ID
      });
      const data = await res.json();
      if (data.code) setCode(data.code);
    } catch (e) {}
    setLoading(false);
  };

  // VISTA LOGIN
  if (!tenant) return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">🏢 Acceso Negocio</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600" placeholder="Usuario" value={username} onChange={e=>setUsername(e.target.value)} />
          <input type="password" className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} />
          <button disabled={loading} className="w-full bg-blue-600 font-bold py-3 rounded text-white hover:bg-blue-500">
            {loading ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );

  // VISTA DASHBOARD
  const qrValue = code ? `${baseUrl}/?code=${code}` : '';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
             <h1 className="text-2xl font-bold">Panel de Control</h1>
             <p className="text-blue-400 text-sm font-bold">{tenant.name}</p>
          </div>
          <button onClick={() => setTenant(null)} className="text-sm text-gray-400">Cerrar Sesión</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl flex flex-col items-center">
            <h2 className="text-xl font-bold mb-6 text-blue-400">🎲 QR del Día</h2>
            <div className="w-full flex-1 flex flex-col items-center justify-center bg-gray-900/50 rounded-2xl p-6 border-2 border-dashed border-gray-700 mb-6">
              {code ? (
                <div className="bg-white p-6 rounded-2xl text-center"><QRCode value={qrValue} size={180} /><p className="text-black font-bold text-4xl mt-4">{code}</p></div>
              ) : <div className="text-gray-600 text-center text-4xl">📷</div>}
            </div>
            <button onClick={generateCode} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg">{loading?'...':'Generar QR'}</button>
          </div>

          <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl">
             <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-bold text-purple-400">📊 Clientes</h2><button onClick={fetchStats} className="text-xs bg-gray-700 px-3 py-1 rounded-full">↻</button></div>
             {stats ? (
                <div>
                  <div className="text-center mb-10"><span className="text-7xl font-bold text-white">{stats.total}</span></div>
                  {/* Aquí iría la gráfica, simplificada para el ejemplo */}
                  <p className="text-center text-gray-400">Datos cargados correctamente</p>
                </div>
             ) : <p className="text-center text-gray-500">Cargando...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
