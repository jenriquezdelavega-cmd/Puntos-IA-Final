// web/app/admin/page.tsx
'use client';
import { useState } from 'react';
import { RefreshCcw, Lock } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') setIsAuthenticated(true);
    else alert('Contraseña incorrecta');
  };

  const generateNewCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/generate', { method: 'POST' });
      const data = await res.json();
      if (data.success) setCurrentCode(data.code);
    } catch (error) {
      alert('Error');
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <div className="mx-auto bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Acceso Negocio</h2>
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full mb-4 p-3 border rounded-lg text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
        <h1 className="text-xl font-bold text-gray-800">Cafetería Central</h1>
        <p className="text-xs font-bold text-gray-400 mb-8 uppercase">Panel de Admin</p>

        {currentCode ? (
          <div className="mb-8">
            <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-100 mb-4">
              <p className="text-5xl font-black text-blue-600 tracking-widest">{currentCode}</p>
            </div>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${currentCode}`} className="mx-auto rounded-lg" />
          </div>
        ) : (
          <p className="text-gray-400 mb-8">Genera un código para hoy</p>
        )}

        <button onClick={generateNewCode} disabled={loading} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold flex justify-center items-center">
          <RefreshCcw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generando...' : 'GENERAR CÓDIGO'}
        </button>
      </div>
    </div>
  );
}
