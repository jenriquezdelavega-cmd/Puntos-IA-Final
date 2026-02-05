'use client';
import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

type ViewState = 'WELCOME' | 'LOGIN' | 'REGISTER' | 'APP';

export default function Home() {
  const [view, setView] = useState<ViewState>('WELCOME');
  const [activeTab, setActiveTab] = useState('checkin');
  const [user, setUser] = useState<any>(null);
  
  // Datos Formulario
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  // --- LOGICA DE URL Y AUTH (Igual que antes) ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) { setPendingCode(code); if (!user) setMessage('👋 Código detectado. Inicia sesión.'); }
    }
  }, []);

  useEffect(() => {
    if (user && pendingCode) { handleScan(pendingCode); setPendingCode(null); window.history.replaceState({}, '', '/'); }
  }, [user, pendingCode]);

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
        if (data.birthDate) setBirthDate(data.birthDate.split('T')[0]); else setBirthDate('');
        setView('APP');
      } else setMessage(data.error);
    } catch (e) { setMessage('Error de conexión'); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!name || !phone || !password || !gender || !birthDate) return setMessage('Faltan datos');
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

  const handleScan = async (result: string) => {
    if (!result) return;
    setScanning(false);
    setMessage('Procesando...');
    try {
      const res = await fetch('/api/check-in/scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, code: result })
      });
      const data = await res.json();
      if (res.ok) { 
        alert(data.message);
        // Recargar datos del usuario para actualizar las barras
        // Esto es un truco rápido para refrescar las membresías
        handleLogin(); 
        setManualCode('');
      } else { 
        if(res.status === 400) alert(data.error); else alert('❌ ' + data.error);
      }
    } catch (e) { if (user) alert('Error'); }
    setMessage('');
  };

  // --- VISTAS ---
  if (view === 'WELCOME') return (
    <div className="min-h-screen bg-blue-700 flex flex-col items-center justify-center p-6 text-white">
      <h1 className="text-4xl font-bold mb-4">Puntos IA 🤖</h1>
      {pendingCode && <div className="bg-white/20 p-4 rounded-xl mb-6 animate-pulse"><p className="text-sm font-bold">🎉 ¡Has escaneado un código!</p></div>}
      <button onClick={() => setView('LOGIN')} className="w-full bg-white text-blue-700 py-4 rounded-xl font-bold mb-4 shadow-lg active:scale-95 transition-all">Iniciar Sesión</button>
      <button onClick={() => setView('REGISTER')} className="w-full border-2 border-white py-4 rounded-xl font-bold active:scale-95 transition-all">Crear Cuenta</button>
    </div>
  );

  if (view === 'LOGIN') return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col">
      <button onClick={() => setView('WELCOME')} className="mb-6 text-gray-400 w-fit">← Volver</button>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Hola de nuevo 👋</h2>
      <div className="space-y-4">
        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Teléfono</label><input className="w-full p-4 rounded-xl border border-gray-200 text-black bg-white" placeholder="Ej: 5512345678" value={phone} onChange={e => setPhone(e.target.value)} /></div>
        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Contraseña</label><input type="password" className="w-full p-4 rounded-xl border border-gray-200 text-black bg-white" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} /></div>
      </div>
      {message && <p className="text-blue-600 font-bold mt-4 text-center">{message}</p>}
      <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-8 shadow-lg">{loading ? '...' : 'Entrar'}</button>
    </div>
  );

  if (view === 'REGISTER') return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col">
      <button onClick={() => setView('WELCOME')} className="mb-6 text-gray-400 w-fit">← Volver</button>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Crear Cuenta 🚀</h2>
      <div className="space-y-5 flex-1 overflow-y-auto pb-4">
         <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nombre Completo</label><input className="w-full p-4 rounded-xl border border-gray-200 text-black bg-white" placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} /></div>
         <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Teléfono Celular</label><input className="w-full p-4 rounded-xl border border-gray-200 text-black bg-white" placeholder="Será tu ID" value={phone} onChange={e => setPhone(e.target.value)} /></div>
         <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Fecha Nacimiento</label><input type="date" className="w-full p-4 rounded-xl border border-gray-200 text-black bg-white h-[58px]" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div>
         <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Género</label><select className="w-full p-4 rounded-xl border border-gray-200 text-black bg-white h-[58px]" value={gender} onChange={e => setGender(e.target.value)}><option value="">Seleccionar Género</option><option value="Hombre">Hombre</option><option value="Mujer">Mujer</option></select></div>
         <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Contraseña</label><input type="password" className="w-full p-4 rounded-xl border border-gray-200 text-black bg-white" placeholder="Crea una clave" value={password} onChange={e => setPassword(e.target.value)} /></div>
      </div>
      {message && <p className="text-red-500 mb-4 text-center text-sm">{message}</p>}
      <button onClick={handleRegister} disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg mb-4">{loading ? '...' : 'Registrarme'}</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-white p-6 shadow-sm sticky top-0 z-10 flex justify-between">
         <h1 className="font-bold text-gray-800">Hola, {user.name}</h1>
         <div className="bg-blue-100 text-blue-600 h-8 w-8 rounded-full flex items-center justify-center font-bold">{user.name[0]}</div>
      </div>

      <div className="p-6">
        {activeTab === 'checkin' && !scanning && (
           <div className="flex flex-col items-center animate-fadeIn gap-6">
             
             {/* LISTA DE TARJETAS DE PUNTOS */}
             <div className="w-full space-y-4">
               {user.memberships && user.memberships.length > 0 ? (
                 user.memberships.map((m: any, idx: number) => {
                   // Lógica de progreso: 0 a 100
                   const progress = Math.min(m.points, 100);
                   const isWinner = m.points >= 100;
                   
                   return (
                     <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                       <div className="flex justify-between items-center mb-2">
                         <h3 className="font-bold text-gray-800 text-lg">{m.name}</h3>
                         <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{m.points} pts</span>
                       </div>
                       
                       {/* BARRA DE PROGRESO */}
                       <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
                         <div 
                            className={`h-full rounded-full transition-all duration-1000 ${isWinner ? 'bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse' : 'bg-blue-600'}`} 
                            style={{ width: `${progress}%` }}
                         ></div>
                       </div>
                       
                       <div className="flex justify-between text-xs text-gray-400 font-bold uppercase">
                         <span>0</span>
                         {isWinner ? <span className="text-orange-500">🏆 ¡Premio Disponible!</span> : <span>Meta: 100</span>}
                       </div>
                     </div>
                   );
                 })
               ) : (
                 <div className="text-center py-10 opacity-50">
                    <p className="text-4xl mb-2">🤷‍♂️</p>
                    <p>Aún no tienes puntos.<br/>¡Visita un negocio y escanea!</p>
                 </div>
               )}
             </div>

             {/* BOTONES DE ESCANEO */}
             <div className="w-full">
               <button onClick={() => setScanning(true)} className="w-full bg-black text-white py-5 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mb-4">
                 📷 Escanear QR
               </button>

               <div className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                 <label className="block text-xs font-bold text-gray-400 uppercase mb-2 text-center">¿Problemas con la cámara?</label>
                 <div className="flex gap-2">
                   <input className="flex-1 p-3 bg-gray-50 rounded-lg text-black uppercase font-mono text-center tracking-widest border border-gray-200" placeholder="AB-123" value={manualCode} onChange={e => setManualCode(e.target.value.toUpperCase())} maxLength={7} />
                   <button onClick={() => handleScan(manualCode)} disabled={!manualCode} className="bg-gray-200 text-gray-700 font-bold px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50">👉</button>
                 </div>
               </div>
             </div>

           </div>
        )}

        {scanning && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="flex-1 relative">
                <Scanner onScan={(r) => r[0] && handleScan(r[0].rawValue)} onError={(e) => console.log(e)} />
                <div className="absolute inset-0 border-2 border-white/30 m-10 rounded-3xl pointer-events-none"></div>
            </div>
            <button onClick={() => setScanning(false)} className="bg-red-600 text-white p-6 font-bold text-center">Cancelar</button>
          </div>
        )}

        {activeTab === 'profile' && (
           <div className="bg-white p-6 rounded-2xl shadow-sm">
             <h2 className="text-xl font-bold mb-6 text-gray-800">Mis Datos</h2>
             <div className="space-y-4">
               <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre</label><input className="w-full p-3 bg-gray-50 rounded-lg text-gray-700 border-none" value={name} onChange={e => setName(e.target.value)} /></div>
               <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fecha Nacimiento</label><input type="date" className="w-full p-3 bg-gray-50 rounded-lg text-gray-700 border-none" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div>
               <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Género</label><select className="w-full p-3 bg-gray-50 rounded-lg text-gray-700 border-none" value={gender} onChange={e => setGender(e.target.value)}><option value="Hombre">Hombre</option><option value="Mujer">Mujer</option></select></div>
             </div>
             <button onClick={handleUpdate} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold mt-6 shadow-lg">Guardar Cambios</button>
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
