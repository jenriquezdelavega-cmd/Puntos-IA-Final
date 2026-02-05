'use client';
import { useState } from 'react';

export default function AdminPage() {
  // Estados para manejar el Login y el Panel
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Función para intentar entrar
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('🔒 Acceso Denegado: Contraseña incorrecta');
    }
  };

  // Función para generar el código (ya estando logueado)
  const generateCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }) // Usamos la password que ya ingresó
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

  // 🔒 VISTA 1: PANTALLA DE LOGIN (Candado)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-800">
          <div className="text-center mb-6">
            <span className="text-4xl">🔒</span>
            <h1 className="text-xl font-bold mt-2">Acceso Restringido</h1>
            <p className="text-gray-500 text-sm">Solo personal autorizado</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password"
              placeholder="Ingresa la contraseña..."
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all"
            >
              Entrar al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 🔓 VISTA 2: PANEL DE CONTROL (Generador)
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
      <div className="absolute top-4 right-4">
        <button 
          onClick={() => setIsLoggedIn(false)} 
          className="text-gray-400 hover:text-white text-sm underline"
        >
          Cerrar Sesión
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-blue-400">Panel de Dueño 👨‍🍳</h1>
      
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-sm text-center border border-gray-700">
        <p className="mb-4 text-gray-300">Generar código QR para hoy:</p>
        
        {code ? (
          <div className="bg-green-500/10 text-green-400 p-6 rounded-lg mb-6 border border-green-500/50 animate-pulse">
            <p className="text-xs uppercase tracking-wider mb-1">Código Activo</p>
            <p className="text-5xl font-mono font-bold tracking-widest">{code}</p>
          </div>
        ) : (
          <div className="bg-gray-700/30 p-6 rounded-lg mb-6 h-32 flex items-center justify-center border border-gray-700 border-dashed">
            <p className="text-gray-500 italic">Sin código generado</p>
          </div>
        )}

        <button 
          onClick={generateCode}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Conectando...' : '✨ GENERAR NUEVO CÓDIGO'}
        </button>
      </div>
    </div>
  );
}
