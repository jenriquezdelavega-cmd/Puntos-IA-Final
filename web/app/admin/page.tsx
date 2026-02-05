'use client';
import { useState } from 'react';
import QRCode from 'react-qr-code';

interface StatItem { gender: string | null; _count: { gender: number }; }
interface StatsData { total: number; breakdown: StatItem[]; }

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // 1. LOGIN
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { setIsLoggedIn(true); fetchStats(); }
    else alert('🔒 Contraseña incorrecta');
  };

  // 2. FETCH STATS (Con limpieza de datos)
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'admin123' })
      });
      const data = await res.json();
      setStats(data);
    } catch (e) { console.error("Error stats"); }
    setStatsLoading(false);
  };

  // 3. GENERAR CÓDIGO
  const generateCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.code) setCode(data.code);
      else alert('Error: ' + (data.error || 'Desconocido'));
    } catch (e) { alert('Error de conexión'); }
    setLoading(false);
  };

  // PROCESAR DATOS PARA GRÁFICA (Limpieza)
  const processData = () => {
    if (!stats?.breakdown) return [];
    
    // Normalizar (M -> Hombre, F -> Mujer)
    const groups: Record<string, number> = { 'Hombre': 0, 'Mujer': 0, 'Otro': 0 };
    
    stats.breakdown.forEach(item => {
      let g = item.gender || 'Otro';
      if (g === 'M' || g === 'Male') g = 'Hombre';
      if (g === 'F' || g === 'Female') g = 'Mujer';
      if (!groups[g]) groups['Otro'] += item._count.gender;
      else groups[g] += item._count.gender;
    });

    const total = stats.total || 1; // Evitar división por cero
    return Object.keys(groups).map(key => ({
      label: key,
      count: groups[key],
      percent: Math.round((groups[key] / total) * 100)
    })).filter(g => g.count > 0); // Solo mostrar los que tienen gente
  };

  const chartData = processData();

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-800">
        <h1 className="text-xl font-bold text-center mb-6">👨‍🍳 Acceso Dueño</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" placeholder="Contraseña..." className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700" value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="w-full bg-blue-600 font-bold py-3 rounded-lg">Entrar</button>
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
          
          {/* TARJETA 1: QR */}
          <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl flex flex-col items-center">
            <h2 className="text-xl font-bold mb-6 text-blue-400">🎲 Código del Día</h2>
            
            <div className="w-full flex-1 flex flex-col items-center justify-center bg-gray-900/50 rounded-2xl p-6 border-2 border-dashed border-gray-700 mb-6 min-h-[300px]">
              {code ? (
                <div className="text-center bg-white p-6 rounded-2xl animate-fadeIn shadow-lg">
                  <div className="mb-4">
                    <QRCode value={code} size={180} />
                  </div>
                  <p className="text-black font-mono font-bold text-4xl tracking-widest">{code}</p>
                </div>
              ) : (
                <div className="text-gray-600 text-center">
                  <span className="text-5xl block mb-4">📷</span>
                  <p>Genera un código para<br/>empezar el día</p>
                </div>
              )}
            </div>

            <button onClick={generateCode} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95">
              {loading ? 'Generando...' : '✨ Generar Nuevo QR'}
            </button>
          </div>

          {/* TARJETA 2: ESTADÍSTICAS (MEJORADA) */}
          <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-purple-400">📊 Clientes</h2>
              <button onClick={fetchStats} className="text-xs bg-gray-700 px-3 py-1 rounded-full hover:bg-gray-600">↻</button>
            </div>

            {statsLoading ? <p className="text-center text-gray-500">Cargando...</p> : stats ? (
              <div>
                <div className="text-center mb-10">
                  <span className="text-7xl font-bold text-white block">{stats.total}</span>
                  <span className="text-gray-400 text-xs uppercase tracking-[0.2em]">Usuarios Totales</span>
                </div>

                <div className="space-y-6">
                  {chartData.map((item, index) => {
                    let color = 'bg-gray-500';
                    if (item.label === 'Hombre') color = 'bg-blue-500';
                    if (item.label === 'Mujer') color = 'bg-pink-500';
                    
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-2 font-medium text-gray-300">
                          <span>{item.label}</span>
                          <span>{item.count} ({item.percent}%)</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden">
                          <div className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${item.percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {chartData.length === 0 && <p className="text-center text-gray-600 text-sm">Aún no hay datos de género.</p>}
                </div>
              </div>
            ) : <p className="text-center text-red-400">Sin datos</p>}
          </div>

        </div>
      </div>
    </div>
  );
}
