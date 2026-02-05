'use client';
import { useState, useEffect } from 'react';

// Definimos los tipos para que TypeScript sea feliz
interface StatItem {
  gender: string;
  _count: {
    gender: number;
  };
}

interface StatsData {
  total: number;
  breakdown: StatItem[];
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
      fetchStats();
    } else {
      alert('🔒 Contraseña incorrecta');
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'admin123' })
      });
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Error cargando stats");
    }
    setStatsLoading(false);
  };

  const generateCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.code) setCode(data.code);
      else alert('Error: ' + (data.error || 'Desconocido'));
    } catch (e) {
      alert('Error de conexión');
    }
    setLoading(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-800">
          <div className="text-center mb-6">
            <span className="text-4xl">📊</span>
            <h1 className="text-xl font-bold mt-2">Dashboard Admin</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password"
              placeholder="Contraseña..."
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Panel de Control 🚀</h1>
          <button onClick={() => setIsLoggedIn(false)} className="text-sm text-gray-400 hover:text-white">Salir</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-blue-400">🎲 Código Diario</h2>
            {code ? (
              <div className="bg-green-900/30 border border-green-500 text-green-400 p-4 rounded-lg text-center mb-4">
                <p className="text-4xl font-mono font-bold">{code}</p>
              </div>
            ) : (
              <div className="bg-gray-700/30 p-4 rounded-lg text-center mb-4 h-20 flex items-center justify-center text-gray-500">
                Sin código activo
              </div>
            )}
            <button onClick={generateCode} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition-all">
              {loading ? 'Generando...' : 'Generar Nuevo'}
            </button>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-purple-400">📊 Clientes</h2>
              <button onClick={fetchStats} className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600">Actualizar</button>
            </div>
            {statsLoading ? (
              <p className="text-center text-gray-500 py-10">Cargando datos...</p>
            ) : stats ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold text-white">{stats.total}</span>
                  <p className="text-gray-400 text-sm">Usuarios Totales</p>
                </div>
                <div className="space-y-3">
                  {stats.breakdown && stats.breakdown.map((item, index) => {
                    const percent = stats.total > 0 ? Math.round((item._count.gender / stats.total) * 100) : 0;
                    let color = 'bg-gray-500';
                    if (item.gender === 'Hombre') color = 'bg-blue-500';
                    if (item.gender === 'Mujer') color = 'bg-pink-500';
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.gender}</span>
                          <span className="text-gray-300">{item._count.gender} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-center text-red-400">No hay datos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
