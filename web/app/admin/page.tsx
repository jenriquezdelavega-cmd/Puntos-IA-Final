'use client';
import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';

// Tipos para TypeScript
interface StatItem { gender: string; _count: { gender: number }; }
interface StatsData { total: number; breakdown: StatItem[]; }

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { setIsLoggedIn(true); fetchStats(); }
    else alert('🔒 Contraseña incorrecta');
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'admin123' })
      });
      setStats(await res.json());
    } catch (e) { console.error("Error stats"); }
    setStatsLoading(false);
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
      else alert('Error: ' + (data.error || 'Desconocido'));
    } catch (e) { alert('Error de conexión'); }
    setLoading(false);
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-800">
        <div className="text-center mb-6">
          <span className="text-4xl">👨‍🍳</span>
          <h1 className="text-xl font-bold mt-2">Acceso Dueño</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" placeholder="Contraseña..." className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700" value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg">Entrar</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Panel de Control 🚀</h1>
          <button onClick={() => setIsLoggedIn(false)} className="text-sm text-gray-400 hover:text-white">Salir</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* TARJETA 1: GENERADOR QR */}
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col">
            <h2 className="text-lg font-semibold mb-6 text-blue-400 flex items-center gap-2">
              🎲 Código del Día
            </h2>
            
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] bg-gray-900/50 rounded-xl p-4 border-2 border-dashed border-gray-700 mb-6">
              {code ? (
                <div className="text-center bg-white p-6 rounded-xl animate-fadeIn">
                  {/* EL CÓDIGO QR */}
                  <div className="mb-4">
                    <QRCode value={code} size={200} />
                  </div>
                  <p className="text-black font-mono font-bold text-3xl tracking-widest border-t pt-2 mt-2 border-gray-200">
                    {code}
                  </p>
                  <p className="text-gray-400 text-xs mt-2 uppercase tracking-wide">Escanear para Check-in</p>
                </div>
              ) : (
                <div className="text-gray-500 text-center">
                  <span className="text-4xl opacity-50 block mb-2">📷</span>
                  <p>Presiona generar para crear<br/>el código de hoy</p>
                </div>
              )}
            </div>

            <button 
              onClick={generateCode}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
            >
              {loading ? 'Generando...' : '✨ Generar Nuevo QR'}
            </button>
          </div>

          {/* TARJETA 2: ESTADÍSTICAS */}
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-purple-400">📊 Clientes Registrados</h2>
              <button onClick={fetchStats} className="text-xs bg-gray-700 px-3 py-1 rounded-full hover:bg-gray-600 transition-colors">↻ Actualizar</button>
            </div>

            {statsLoading ? (
              <p className="text-center text-gray-500 py-10">Cargando datos...</p>
            ) : stats ? (
              <div className="space-y-6">
                <div className="text-center p-8 bg-gray-900 rounded-xl border border-gray-700">
                  <span className="text-6xl font-bold text-white block mb-2">{stats.total}</span>
                  <p className="text-gray-400 text-sm uppercase tracking-widest">Usuarios Totales</p>
                </div>

                <div className="space-y-4">
                  {stats.breakdown && stats.breakdown.map((item, index) => {
                    const percent = stats.total > 0 ? Math.round((item._count.gender / stats.total) * 100) : 0;
                    let color = 'bg-gray-500';
                    if (item.gender === 'Hombre') color = 'bg-blue-500';
                    if (item.gender === 'Mujer') color = 'bg-pink-500';
                    return (
                      <div key={index} className="group">
                        <div className="flex justify-between text-sm mb-2 text-gray-300">
                          <span className="font-medium">{item.gender}</span>
                          <span>{item._count.gender} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-center text-red-400">No hay datos disponibles</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
