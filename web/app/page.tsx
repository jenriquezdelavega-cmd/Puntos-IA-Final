'use client';
import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

type ViewState = 'WELCOME' | 'LOGIN' | 'REGISTER' | 'APP';

export default function Home() {
  const [view, setView] = useState<ViewState>('WELCOME');
  const [activeTab, setActiveTab] = useState('checkin');
  const [user, setUser] = useState<any>(null);
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [prizeCode, setPrizeCode] = useState<{code: string, tenant: string} | null>(null);

  // Validaciones
  const isValidPhone = (p: string) => /^\d{10}$/.test(p);
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const c = p.get('code');
      if (c) { setPendingCode(c); if(!user) setMessage('👋 Código detectado.'); }
    }
  }, []);

  useEffect(() => { if (user && pendingCode) { handleScan(pendingCode); setPendingCode(null); window.history.replaceState({}, '', '/'); } }, [user, pendingCode]);

  const handleLogin = async () => {
    setMessage('');
    if (!phone) return setMessage('❌ Ingresa tu teléfono');
    setLoading(true);
    try {
      const res = await fetch('/api/user/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ phone, password }) });
      const data = await res.json();
      if (res.ok) {
        setUser(data); setName(data.name); setEmail(data.email||''); setGender(data.gender||'');
        if (data.birthDate) setBirthDate(data.birthDate.split('T')[0]); else setBirthDate('');
        setView('APP');
      } else setMessage('⚠️ ' + data.error);
    } catch (e) { setMessage('🔥 Error de conexión'); }
    setLoading(false);
  };

  const handleRegister = async () => {
    setMessage('');
    if (!name.trim()) return setMessage('❌ Falta nombre');
    if (!isValidPhone(phone)) return setMessage('❌ Teléfono inválido (10 dígitos)');
    setLoading(true);
    try {
      const res = await fetch('/api/user/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, phone, email, password, gender, birthDate }) });
      if (res.ok) handleLogin(); else { const d = await res.json(); setMessage('⚠️ ' + d.error); }
    } catch (e) { setMessage('🔥 Error de conexión'); }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!user?.id) return;
    setMessage('Guardando...');
    try {
      const res = await fetch('/api/user/update', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: user.id, name, email, gender, birthDate }) });
      if (res.ok) { setMessage('✅ Datos actualizados'); setUser({ ...user, name, email, gender, birthDate }); } else setMessage('❌ Error');
    } catch (e) { setMessage('🔥 Error de red'); }
  };

  const handleScan = async (result: string) => {
    if (!result) return;
    setScanning(false);
    let finalCode = result;
    if (result.includes('code=')) finalCode = result.split('code=')[1].split('&')[0];
    try {
      const res = await fetch('/api/check-in/scan', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId: user?.id, code: finalCode }) });
      const data = await res.json();
      if (res.ok) { alert(data.message); handleLogin(); setManualCode(''); } else alert('❌ ' + data.error);
    } catch (e) { if(user) alert('Error'); }
  };

  const getPrizeCode = async (tenantId: string, tenantName: string) => {
    if(!confirm(`¿Canjear premio en ${tenantName}?`)) return;
    try {
      const res = await fetch('/api/redeem/request', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId: user.id, tenantId }) });
      const data = await res.json();
      if(res.ok) setPrizeCode({ code: data.code, tenant: tenantName }); else alert(data.error);
    } catch(e) { alert('Error'); }
  };

  const handleLogout = () => { if(confirm("¿Salir?")) { setUser(null); setView('WELCOME'); setPhone(''); setPassword(''); setMessage(''); } };

  // --- LOGO COMPONENTE ---
  const BrandLogo = () => (
    <div className="flex items-center justify-center gap-1 mb-2">
      <span className="text-5xl font-extrabold tracking-tighter text-white drop-shadow-md">punto</span>
      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-yellow-300 via-orange-400 to-red-500 shadow-[0_0_15px_rgba(255,165,0,0.8)] border-2 border-white/50"></div>
      <span className="text-5xl font-extrabold tracking-tighter text-white drop-shadow-md">IA</span>
    </div>
  );

  // --- VISTAS ---

  if (view === 'WELCOME') return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
      {/* Partículas de fondo */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl"></div>

      <div className="z-10 text-center w-full max-w-sm">
        <BrandLogo />
        <p className="text-white/90 text-lg font-medium mb-12 tracking-wide">Tu lealtad, fácil y ya.</p>

        {pendingCode && <div className="bg-white/20 p-4 rounded-2xl mb-8 border border-white/30 backdrop-blur-sm animate-bounce"><p className="font-bold">🎉 ¡Código detectado!</p></div>}

        <div className="space-y-4">
          <button onClick={() => {setMessage(''); setView('LOGIN');}} className="w-full bg-white text-pink-600 py-4 rounded-2xl font-extrabold text-lg shadow-xl hover:bg-gray-50 active:scale-95 transition-all">
            Iniciar Sesión
          </button>
          <button onClick={() => {setMessage(''); setView('REGISTER');}} className="w-full bg-transparent border-2 border-white/50 text-white py-4 rounded-2xl font-bold text-lg hover:bg-white/10 active:scale-95 transition-all">
            Crear Cuenta
          </button>
        </div>
      </div>
    </div>
  );

  if (view === 'LOGIN' || view === 'REGISTER') {
    const isReg = view === 'REGISTER';
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-orange-400 to-pink-500 p-8 pb-12 rounded-b-[3rem] shadow-lg text-white text-center relative">
           <button onClick={() => setView('WELCOME')} className="absolute top-6 left-6 text-white/80 hover:text-white font-bold text-2xl">←</button>
           <h2 className="text-3xl font-extrabold mt-2">{isReg ? 'Únete a PuntoIA' : 'Bienvenido'}</h2>
           <p className="text-white/80 text-sm mt-1">{isReg ? 'Empieza a ganar hoy' : 'Tus premios te esperan'}</p>
        </div>

        <div className="flex-1 px-6 -mt-8">
          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-5 border border-gray-100">
             
             {isReg && <div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Nombre</label><input className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold focus:ring-2 focus:ring-pink-400 outline-none" value={name} onChange={e=>setName(e.target.value)} /></div>}
             
             <div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Teléfono</label><input type="tel" maxLength={10} className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold focus:ring-2 focus:ring-pink-400 outline-none" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="10 dígitos" /></div>
             
             {isReg && (
               <>
                 <div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Email (Opcional)</label><input type="email" className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-medium focus:ring-2 focus:ring-pink-400 outline-none" value={email} onChange={e=>setEmail(e.target.value)} /></div>
                 <div className="flex gap-3">
                    <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase ml-1">Fecha</label><input type="date" className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-medium" value={birthDate} onChange={e=>setBirthDate(e.target.value)} /></div>
                    <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase ml-1">Género</label><select className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-medium" value={gender} onChange={e=>setGender(e.target.value)}><option value="">-</option><option value="Hombre">M</option><option value="Mujer">F</option></select></div>
                 </div>
               </>
             )}

             <div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Contraseña</label><input type="password" className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold focus:ring-2 focus:ring-pink-400 outline-none" value={password} onChange={e=>setPassword(e.target.value)} /></div>
             
             {message && <div className="p-3 bg-red-50 text-red-500 rounded-xl text-center font-bold text-sm animate-pulse">{message}</div>}

             <button onClick={isReg ? handleRegister : handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all text-lg mt-2">
               {loading ? 'Procesando...' : isReg ? 'Registrarme' : 'Entrar ->'}
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {prizeCode && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 animate-fadeIn backdrop-blur-md">
          <div className="bg-white p-8 rounded-3xl text-center w-full max-w-sm relative shadow-2xl">
            <button onClick={() => { setPrizeCode(null); handleLogin(); }} className="absolute top-4 right-4 text-gray-400 font-bold p-2 text-xl">✕</button>
            <p className="text-pink-500 uppercase text-xs font-black tracking-widest mb-2">¡FELICIDADES!</p>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{prizeCode.tenant}</h2>
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-orange-300 p-6 rounded-3xl mb-4">
               <p className="text-6xl font-mono font-black text-orange-600 tracking-widest">{prizeCode.code}</p>
            </div>
            <p className="text-sm text-gray-500 font-medium">Muestra este código en caja.</p>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="bg-white px-6 pt-12 pb-6 sticky top-0 z-10 shadow-sm flex justify-between items-center">
         <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">Bienvenido,</p>
            <h1 className="text-2xl font-black text-gray-800">{user.name.split(' ')[0]}</h1>
         </div>
         <button onClick={handleLogout} className="h-10 w-10 bg-red-50 text-red-500 rounded-full font-bold border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">✕</button>
      </div>

      <div className="p-6">
        {activeTab === 'checkin' && !scanning && (
           <div className="flex flex-col gap-6">
             {/* LISTA DE TARJETAS */}
             <div className="space-y-5">
               {user.memberships && user.memberships.length > 0 ? (
                 user.memberships.map((m: any, idx: number) => {
                   const progress = Math.min(m.points, 100);
                   const isWinner = m.points >= 100;
                   const prizeName = m.prize || "Sorpresa"; 
                   
                   return (
                     <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                       {/* Fondo sutil de tarjeta */}
                       <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-100 to-pink-100 rounded-bl-full opacity-50"></div>
                       
                       <div className="relative z-10">
                         <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold text-gray-800 text-lg">{m.name}</h3>
                           <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">{m.points} pts</span>
                         </div>
                         
                         {!isWinner ? (
                           <>
                             <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
                               <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-1000 shadow-[0_0_10px_rgba(236,72,153,0.5)]" style={{ width: `${progress}%` }}></div>
                             </div>
                             <div className="flex justify-between text-xs font-bold uppercase tracking-wide">
                               <span className="text-gray-300">Inicio</span>
                               <span className="text-pink-500">Meta: {prizeName}</span>
                             </div>
                           </>
                         ) : (
                           <button onClick={() => getPrizeCode(m.tenantId, m.name)} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg transform hover:scale-[1.02] transition-all animate-pulse">
                             🏆 CANJEAR: {prizeName}
                           </button>
                         )}
                       </div>
                     </div>
                   );
                 })
               ) : (
                 <div className="text-center py-12 opacity-60">
                    <p className="text-6xl mb-4">🚀</p>
                    <p className="font-bold text-gray-500">Aún no tienes puntos</p>
                    <p className="text-sm text-gray-400">Visita un negocio y escanea su código</p>
                 </div>
               )}
             </div>

             <div className="mt-4">
               <button onClick={() => setScanning(true)} className="w-full bg-gray-900 text-white py-5 rounded-3xl font-bold shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-lg">
                 <span className="text-2xl">📷</span> Escanear QR
               </button>
               
               <div className="mt-6 flex gap-3">
                   <input className="flex-1 p-4 bg-white rounded-2xl text-gray-800 font-bold text-center tracking-[0.3em] uppercase border border-gray-200 placeholder-gray-300 shadow-sm outline-none focus:border-pink-400" placeholder="AB-12" value={manualCode} onChange={e => setManualCode(e.target.value.toUpperCase())} maxLength={7} />
                   <button onClick={() => handleScan(manualCode)} disabled={!manualCode} className="bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold px-6 rounded-2xl shadow-lg disabled:opacity-50 disabled:shadow-none">OK</button>
               </div>
             </div>
           </div>
        )}

        {scanning && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <Scanner onScan={(r) => r[0] && handleScan(r[0].rawValue)} onError={(e) => console.log(e)} />
            <button onClick={() => setScanning(false)} className="absolute bottom-10 left-10 right-10 bg-white/20 backdrop-blur text-white p-4 rounded-2xl font-bold border border-white/30">Cancelar</button>
          </div>
        )}

        {activeTab === 'profile' && (
           <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-4 mb-8">
                <div className="h-16 w-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center text-3xl">👤</div>
                <div><h2 className="text-xl font-black text-gray-800">Mi Perfil</h2><p className="text-sm text-gray-400">Edita tu información</p></div>
             </div>
             
             <div className="space-y-5">
               <div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Nombre</label><input className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-transparent focus:bg-white focus:border-pink-300 outline-none transition-all" value={name} onChange={e => setName(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Email</label><input type="email" className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-transparent focus:bg-white focus:border-pink-300 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} /></div>
               <div className="flex gap-3">
                  <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase ml-1">Fecha</label><input type="date" className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div>
                  <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase ml-1">Género</label><select className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold" value={gender} onChange={e => setGender(e.target.value)}><option value="Hombre">M</option><option value="Mujer">F</option></select></div>
               </div>
             </div>
             <button onClick={handleUpdate} className="w-full bg-gray-900 text-white p-4 rounded-2xl font-bold mt-8 shadow-lg active:scale-95 transition-all">Guardar Cambios 💾</button>
             {message && <p className="text-center text-green-600 mt-4 font-bold bg-green-50 p-2 rounded-lg">{message}</p>}
           </div>
        )}
      </div>

      {/* NAVBAR FLOTANTE */}
      <div className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-lg border border-white/50 p-2 rounded-[2rem] shadow-2xl flex justify-between items-center z-40">
        <button onClick={() => setActiveTab('checkin')} className={`flex-1 flex flex-col items-center py-3 rounded-[1.5rem] transition-all ${activeTab==='checkin'?'bg-gray-900 text-white shadow-lg':'text-gray-400 hover:bg-gray-50'}`}>
            <span className="text-xl mb-1">🔥</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Puntos</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex-1 flex flex-col items-center py-3 rounded-[1.5rem] transition-all ${activeTab==='profile'?'bg-gray-900 text-white shadow-lg':'text-gray-400 hover:bg-gray-50'}`}>
            <span className="text-xl mb-1">👤</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Perfil</span>
        </button>
      </div>
    </div>
  );
}
