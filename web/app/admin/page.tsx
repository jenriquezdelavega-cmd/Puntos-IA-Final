'use client';
import { useState } from 'react';
import QRCode from 'react-qr-code';

interface StatItem { gender: string; _count: { gender: number }; }
interface StatsData { total: number; breakdown: StatItem[]; }

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { setIsLoggedIn(true); fetchStats(); }
    else alert('🔒 Contraseña incorrecta');
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'admin123' })
      });
      setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  const generateCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.code) setCode(data.code);
    } catch (e) { alert('Error'); }
    setLoading(false);
  };

  // 💉 FUNCIÓN PARA INYECTAR DATOS
  const injectData = async () => {
    if(!confirm("¿Seguro que quieres crear 12 usuarios falsos de prueba?")) return;
    try {
        await fetch('/api/admin/seed', { method: 'POST' });
        alert("¡Datos inyectados! Actualizando...");
        fetchStats();
    } catch(e) { alert("Error al inyectar"); }
  };

  // Lógica Limpia de Gráfica
  const processData = () => {
    if (!stats?.breakdown) return [];
    // Como ya blindamos el backend, confiamos en los grupos
    const total = stats.total || 1;
    return stats.breakdown.map(item => ({
      label: item.gender || 'Otro',
      count: item._count.gender,
      percent: Math.round((item._count.gender / total) * 100)
    })).sort((a, b) => b.count - a.count);
  };

  const chartData = processData();

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
       <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-sm">
         <h1 className="text-xl font-bold text-center mb-6">👨‍🍳 Acceso Dueño</h1>
         <form onSubmit={handleLogin} className="space-y-4">
           <input type="password" className="w-full p-3 rounded bg-gray-800 border border-gray-700" value={password} onChange={e => setPassword(e.target.value)} />
           <button className="w-full bg-blue-600 font-bold py-3 rounded">Entrar</button>
         </form>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Panel de Control 🚀</h1>
          <button onClick={() => setIsLoggedIn(false)} className="text-sm text-gray-400">Salir</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* QR */}
          <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl flex flex-col items-center">
            <h2 className="text-xl font-bold mb-6 text-blue-400">🎲 Código del Día</h2>
            <div className="w-full flex-1 flex flex-col items-center justify-center bg-gray-900/50 rounded-2xl p-6 border-2 border-dashed border-gray-700 mb-6">
              {code ? (
                <div className="bg-white p-6 rounded-2xl text-center"><QRCode value={code} size={180} /><p className="text-black font-bold text-4xl mt-4">{code}</p></div>
              ) : <div className="text-gray-600 text-center"><span className="text-5xl block mb-4">📷</span>Generar código</div>}
            </div>
            <button onClick={generateCode} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg">{loading ? '...' : 'Generar QR'}</button>
          </div>

          {/* ESTADÍSTICAS */}
          <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl relative">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-purple-400">📊 Clientes</h2>
              <button onClick={fetchStats} className="text-xs bg-gray-700 px-3 py-1 rounded-full">↻</button>
            </div>

            {stats ? (
              <div>
                <div className="text-center mb-10">
                  <span className="text-7xl font-bold text-white block">{stats.total}</span>
                  <span className="text-gray-400 text-xs uppercase tracking-widest">Registrados</span>
                </div>
                <div className="space-y-6">
                  {chartData.map((item, index) => {
                    let color = 'bg-gray-500';
                    if (item.label === 'Hombre') color = 'bg-blue-500';
                    if (item.label === 'Mujer') color = 'bg-pink-500';
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-2 text-gray-300">
                          <span>{item.label}</span><span>{item.count} ({item.percent}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${item.percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : <p className="text-center text-gray-500">Cargando...</p>}
            
            {/* BOTÓN SECRETO PARA DEMO */}
            <button onClick={injectData} className="absolute bottom-4 right-4 text-xs text-gray-700 hover:text-gray-500">
                + Demo Data
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
