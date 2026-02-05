'use client';
import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

type ViewState = 'WELCOME' | 'LOGIN' | 'REGISTER' | 'APP';

export default function Home() {
  const [view, setView] = useState<ViewState>('WELCOME');
  const [activeTab, setActiveTab] = useState('checkin');
  const [user, setUser] = useState<any>(null);
  
  // Datos Auth
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  
  // Estado Cámara
  const [scanning, setScanning] = useState(false);
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // --- LOGIN ---
  const handleLogin = async () => {
    setLoading(true); setMessage('');
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data); setName(data.name); setGender(data.gender || '');
        if (data.birthDate) setBirthDate(data.birthDate.split('T')[0]);
        else setBirthDate('');
        setView('APP');
      } else setMessage(data.error);
    } catch (e) { setMessage('Error de conexión'); }
    setLoading(false);
  };

  // --- REGISTRO ---
  const handleRegister = async () => {
    if (!name || !phone || !password) return setMessage('Faltan datos');
    setLoading(true);
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password, gender, birthDate })
      });
      if (res.ok) handleLogin();
      else { const d = await res.json(); setMessage(d.error); }
    } catch (e) { setMessage('Error de conexión'); }
    setLoading(false);
  };

  // --- UPDATE ---
  const handleUpdate = async () => {
    if (!user?.id) return;
    setMessage('Guardando...');
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, name, gender, birthDate })
      });
      if (res.ok) { setMessage('✅ Actualizado'); setUser({ ...user, name, gender, birthDate }); }
      else setMessage('Error');
    } catch (e) { setMessage('Error de red'); }
  };

  // --- ESCANEAR QR ---
  const handleScan = async (result: string) => {
    if (!result) return;
    setScanning(false); // Apagar cámara
    setMessage('Procesando código...');
    
    try {
      const res = await fetch('/api/check-in/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, code: result })
      });
      const data = await res.json();
      
      if (res.ok) {
        alert(data.message || '¡Puntos sumados!');
        // Actualizar puntos locales (sumar 10)
        setUser({ ...user, points: (user.points || 0) + 10 });
      } else {
        alert('❌ ' + data.error);
      }
    } catch (e) {
      alert('Error de conexión al escanear');
    }
    setMessage('');
  };

  // VISTAS
  if (view === 'WELCOME') return (
    <div className="min-h-screen bg-blue-700 flex flex-col items-center justify-center p-6 text-white">
      <h1 className="text-4xl font-bold mb-10">Puntos IA 🤖</h1>
      <button onClick={() => setView('LOGIN')} className="w-full bg-white text-blue-700 py-4 rounded-xl font-bold mb-4 shadow-lg">Entrar</button>
      <button onClick={() => setView('REGISTER')} className="w-full border-2 border-white py-4 rounded-xl font-bold">Crear Cuenta</button>
    </div>
  );

  if (view === 'LOGIN') return (
    <div className="min-h-screen p-6 bg-gray-50">
      <button onClick={() => setView('WELCOME')} className="mb-6 text-gray-400">← Volver</button>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Hola de nuevo 👋</h2>
      <input className="w-full p-4 mb-4 rounded-xl border text-black" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} />
      <input type="password" className="w-full p-4 mb-4 rounded-xl border text-black" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
      {message && <p className="text-red-500 mb-4 text-center">{message}</p>}
      <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">{loading ? '...' : 'Entrar'}</button>
    </div>
  );

  if (view === 'REGISTER') return (
    <div className="min-h-screen p-6 bg-gray-50">
      <button onClick={() => setView('WELCOME')} className="mb-6 text-gray-400">← Volver</button>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Registro 🚀</h2>
      <div className="space-y-4 mb-6">
         <input className="w-full p-3 rounded-xl border text-black" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} />
         <input className="w-full p-3 rounded-xl border text-black" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} />
         <input type="date" className="w-full p-3 rounded-xl border text-black" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
         <select className="w-full p-3 rounded-xl border text-black bg-white" value={gender} onChange={e => setGender(e.target.value)}>
             <option value="">Género</option><option value="Hombre">Hombre</option><option value="Mujer">Mujer</option>
         </select>
         <input type="password" className="w-full p-3 rounded-xl border text-black" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      {message && <p className="text-red-500 mb-4 text-center">{message}</p>}
      <button onClick={handleRegister} disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold">{loading ? '...' : 'Registrarme'}</button>
    </div>
  );

  // APP DASHBOARD
  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-white p-6 shadow-sm sticky top-0 z-10 flex justify-between">
         <h1 className="font-bold text-gray-800">Hola, {user.name}</h1>
         <div className="bg-blue-100 text-blue-600 h-8 w-8 rounded-full flex items-center justify-center font-bold">{user.name[0]}</div>
      </div>

      <div className="p-6">
        {activeTab === 'checkin' && !scanning && (
           <div className="flex flex-col items-center animate-fadeIn">
             <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-3xl shadow-xl text-white text-center mb-8">
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-2">Tus Puntos</p>
                <h2 className="text-7xl font-bold">{user.points || 0}</h2>
             </div>
             
             <button 
               onClick={() => setScanning(true)}
               className="w-full bg-black text-white py-5 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
             >
               📷 Escanear Código QR
             </button>
           </div>
        )}

        {/* PANTALLA DE CÁMARA */}
        {scanning && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="flex-1 relative">
                <Scanner 
                    onScan={(result) => result[0] && handleScan(result[0].rawValue)} 
                    onError={(error) => console.log(error)}
                />
                {/* Marco visual */}
                <div className="absolute inset-0 border-2 border-white/30 m-10 rounded-3xl pointer-events-none"></div>
            </div>
            <button 
                onClick={() => setScanning(false)}
                className="bg-red-600 text-white p-6 font-bold text-center"
            >
                Cancelar Escaneo
            </button>
          </div>
        )}

        {activeTab === 'profile' && (
           <div className="bg-white p-6 rounded-2xl shadow-sm">
             <h2 className="text-xl font-bold mb-6 text-gray-800">Mis Datos</h2>
             <div className="space-y-4">
               <input className="w-full p-3 bg-gray-50 rounded-lg text-gray-700" value={name} onChange={e => setName(e.target.value)} />
               <input type="date" className="w-full p-3 bg-gray-50 rounded-lg text-gray-700" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
               <select className="w-full p-3 bg-gray-50 rounded-lg text-gray-700" value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="Hombre">Hombre</option><option value="Mujer">Mujer</option><option value="Otro">Otro</option>
               </select>
             </div>
             <button onClick={handleUpdate} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold mt-6">Guardar Cambios</button>
             {message && <p className="text-center text-green-600 mt-4">{message}</p>}
             <button onClick={() => { setUser(null); setView('WELCOME'); }} className="w-full mt-6 text-red-400 text-sm">Cerrar Sesión</button>
           </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 pb-6">
        <button onClick={() => setActiveTab('checkin')} className={`flex flex-col items-center p-2 px-6 rounded-xl ${activeTab === 'checkin' ? 'text-blue-600' : 'text-gray-400'}`}>📍<span className="text-xs font-bold">Puntos</span></button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center p-2 px-6 rounded-xl ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}>👤<span className="text-xs font-bold">Perfil</span></button>
      </div>
    </div>
  );
}
