'use client';
import { useState } from 'react';

export default function AdminPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState(''); // Campo para pass

  const generateCode = async () => {
    setLoading(true);
    try {
      // Enviamos el password que escribiste (o admin123 por defecto si quieres probar rápido)
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password || 'admin123' }) 
      });
      
      const data = await res.json();
      if (data.code) {
        setCode(data.code);
      } else {
        alert('Error: ' + (data.error || 'Desconocido'));
      }
    } catch (e) {
      alert('Error de conexión');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-3xl font-bold mb-8">Panel de Dueño 👨‍🍳</h1>
      
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-sm text-center">
        <p className="mb-4 text-gray-400">Genera el código para hoy:</p>
        
        {/* Campo de contraseña simple */}
        <input 
          type="password"
          placeholder="Contraseña (admin123)"
          className="w-full p-3 rounded bg-gray-700 text-white mb-4 border border-gray-600"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {code ? (
          <div className="bg-green-500/20 text-green-400 p-6 rounded-lg mb-4 border-2 border-green-500">
            <p className="text-sm">CÓDIGO ACTIVO:</p>
            <p className="text-5xl font-mono font-bold tracking-widest my-2">{code}</p>
          </div>
        ) : (
          <div className="bg-gray-700/50 p-6 rounded-lg mb-4 h-32 flex items-center justify-center">
            <p className="text-gray-500">---</p>
          </div>
        )}

        <button 
          onClick={generateCode}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Generando...' : 'GENERAR CÓDIGO NUEVO 🎲'}
        </button>
      </div>
    </div>
  );
}
