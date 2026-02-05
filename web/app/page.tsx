'use client';
import { useState } from 'react';

type ViewState = 'WELCOME' | 'LOGIN' | 'REGISTER' | 'APP';

export default function Home() {
  const [view, setView] = useState<ViewState>('WELCOME');
  const [activeTab, setActiveTab] = useState('checkin');
  const [user, setUser] = useState<any>(null);
  
  // Datos del Formulario
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState(''); // 🎂 Estado para la fecha
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // --- LOGIN ---
  const handleLogin = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setName(data.name);
        setGender(data.gender || '');
        // Formatear fecha para el input (YYYY-MM-DD)
        if (data.birthDate) {
            setBirthDate(data.birthDate.split('T')[0]);
        } else {
            setBirthDate('');
        }
        setView('APP');
      } else {
        setMessage(data.error || 'Credenciales incorrectas');
      }
    } catch (e) { setMessage('Error de conexión'); }
    setLoading(false);
  };

  // --- REGISTRO ---
  const handleRegister = async () => {
    if (!name || !phone || !password) {
      setMessage('Faltan campos obligatorios');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password, gender, birthDate })
      });
      const data = await res.json();
      if (res.ok) {
        handleLogin(); // Autologin
      } else {
        setMessage(data.error || 'Error al registrar');
      }
    } catch (e) { setMessage('Error de conexión'); }
    setLoading(false);
  };

  // --- UPDATE ---
  const handleUpdate = async () => {
    if (!user?.id) return;
    setMessage('Guardando...');
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, name, gender, birthDate })
      });
      if (res.ok) {
        setMessage('✅ Datos actualizados');
        setUser({ ...user, name, gender, birthDate });
      } else {
        setMessage('Error al actualizar');
      }
    } catch (e) { setMessage('Error de red'); }
  };

  // VISTAS
  if (view === 'WELCOME') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col items-center justify-center p-6 text-white">
        <div className="mb-10 text-center">
          <span className="text-6xl">🤖</span>
          <h1 className="text-4xl font-bold mt-4">Puntos IA</h1>
        </div>
        <div className="w-full max-w-sm space-y-4">
          <button onClick={() => setView('LOGIN')} className="w-full bg-white text-blue-700 font-bold py-4 rounded-xl shadow-lg">Iniciar Sesión</button>
          <button onClick={() => setView('REGISTER')} className="w-full bg-blue-700 border-2 border-blue-400 text-white font-bold py-4 rounded-xl">Crear Cuenta</button>
        </div>
      </div>
    );
  }

  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-6">
        <button onClick={() => setView('WELCOME')} className="text-gray-400 mb-6 w-fit">← Volver</button>
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Bienvenido 👋</h2>
        <input className="w-full p-4 bg-white border border-gray-200 rounded-xl mb-4 text-black" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} />
        <input type="password" className="w-full p-4 bg-white border border-gray-200 rounded-xl mb-4 text-black" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
        {message && <p className="text-red-500 text-center mb-4">{message}</p>}
        <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg">{loading ? '...' : 'Entrar'}</button>
      </div>
    );
  }

  if (view === 'REGISTER') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-6">
        <button onClick={() => setView('WELCOME')} className="text-gray-400 mb-6 w-fit">← Volver</button>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Registro 🚀</h2>
        <div className="space-y-4 pb-20 overflow-y-auto">
          <input className="w-full p-3 bg-white border border-gray-200 rounded-xl text-black" placeholder="Nombre Completo *" value={name} onChange={e => setName(e.target.value)} />
          <input className="w-full p-3 bg-white border border-gray-200 rounded-xl text-black" placeholder="Teléfono *" value={phone} onChange={e => setPhone(e.target.value)} />
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Fecha de Nacimiento</label>
            <input type="date" className="w-full p-3 bg-white border border-gray-200 rounded-xl text-black" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
          </div>

          <select className="w-full p-3 bg-white border border-gray-200 rounded-xl text-black" value={gender} onChange={e => setGender(e.target.value)}>
             <option value="">Género</option>
             <option value="Hombre">Hombre</option>
             <option value="Mujer">Mujer</option>
          </select>
          <input type="password" className="w-full p-3 bg-white border border-gray-200 rounded-xl text-black" placeholder="Contraseña *" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {message && <p className="text-red-500 text-center mb-4">{message}</p>}
        <button onClick={handleRegister} disabled={loading} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg mb-8">{loading ? '...' : 'Registrarme'}</button>
      </div>
    );
  }

  // APP PRINCIPAL
  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-white p-6 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div>
            <h1 className="text-xl font-bold text-gray-800">{user.name}</h1>
            <p className="text-xs text-blue-600 font-bold">MIEMBRO</p>
        </div>
        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">{user.name.charAt(0)}</div>
      </div>

      <div className="p-6">
        {activeTab === 'checkin' && (
           <div className="flex flex-col items-center animate-fadeIn">
             <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-3xl shadow-xl text-white text-center mb-8">
                <p className="text-blue-100 text-sm font-medium tracking-widest mb-2 uppercase">Mis Puntos</p>
                <h2 className="text-7xl font-bold">{user.points || 0}</h2>
             </div>
             <p className="text-gray-500 text-sm text-center">Escanea el QR en caja para sumar.</p>
           </div>
        )}

        {activeTab === 'profile' && (
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <h2 className="text-xl font-bold mb-6 text-gray-800">👤 Mis Datos</h2>
             <div className="space-y-4">
               <div><label className="text-xs text-gray-400 font-bold">Nombre</label><input className="w-full p-3 bg-gray-50 rounded-lg text-gray-700" value={name} onChange={e => setName(e.target.value)} /></div>
               
               {/* 🎂 CAMPO DE FECHA EN PERFIL */}
               <div>
                  <label className="text-xs text-gray-400 font-bold">Fecha de Nacimiento</label>
                  <input type="date" className="w-full p-3 bg-gray-50 rounded-lg text-gray-700" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
               </div>

               <div>
                  <label className="text-xs text-gray-400 font-bold">Género</label>
                  <select className="w-full p-3 bg-gray-50 rounded-lg text-gray-700" value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                    <option value="Otro">Otro</option>
                  </select>
               </div>
             </div>
             <div className="mt-6 border-t pt-4">
               <button onClick={handleUpdate} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg">Guardar Cambios</button>
               {message && <p className="mt-4 text-center text-green-600 font-medium">{message}</p>}
               <button onClick={() => { setUser(null); setView('WELCOME'); }} className="w-full mt-4 text-red-400 text-sm">Cerrar Sesión</button>
             </div>
           </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('checkin')} className={`flex flex-col items-center p-2 px-6 rounded-xl ${activeTab === 'checkin' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}><span className="text-2xl">📍</span><span className="text-xs font-bold">Puntos</span></button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center p-2 px-6 rounded-xl ${activeTab === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}><span className="text-2xl">👤</span><span className="text-xs font-bold">Perfil</span></button>
      </div>
    </div>
  );
}
