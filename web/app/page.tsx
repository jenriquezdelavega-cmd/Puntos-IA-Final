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

  // --- LOGO FIEL A LA IMAGEN ---
  const BrandLogo = () => (
    <div className="flex items-center justify-center gap-1 mb-4 select-none">
      <span className="text-7xl font-black tracking-tight text-white drop-shadow-lg" style={{fontFamily: 'sans-serif'}}>punto</span>
      
      {/* Esfera Dorada Brillante */}
      <div className="relative h-14 w-14 mx-1">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 via-orange-400 to-red-500 shadow-[0_0_25px_rgba(255,200,0,0.8)]"></div>
        {/* Reflejo de luz */}
        <div className="absolute top-2 left-3 w-4 h-4 bg-white rounded-full blur-[2px] opacity-90"></div>
      </div>

      <span className="text-7xl font-black tracking-tight text-white drop-shadow-lg" style={{fontFamily: 'sans-serif'}}>IA</span>
    </div>
  );

  // --- VISTAS ---

  if (view === 'WELCOME') return (
    // Gradiente Fiel: Naranja -> Rosa -> Morado
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
      
      {/* Destellos de fondo (Estrellas) */}
      <div className="absolute top-10 left-10 w-1 bg-white h-1 rounded-full shadow-[0_0_10px_white] animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-2 bg-white h-2 rounded-full shadow-[0_0_15px_white] animate-pulse delay-100"></div>
      <div className="absolute top-1/2 left-10 w-1.5 bg-white h-1.5 rounded-full shadow-[0_0_10px_white] animate-pulse delay-300"></div>

      <div className="z-10 text-center w-full max-w-sm flex flex-col items-center">
        <BrandLogo />
        
        {/* Slogan Correcto */}
        <p className="text-white text-xl font-medium mb-12 tracking-wide drop-shadow-md">Tu lealtad, fácil y ya.</p>

        {pendingCode && <div className="bg-white/20 p-4 rounded-2xl mb-8 border border-white/30 backdrop-blur-sm animate-bounce"><p className="font-bold">🎉 ¡Código detectado!</p></div>}

        <div className="space-y-4 w-full">
          <button onClick={() => {setMessage(''); setView('LOGIN');}} className="w-full bg-white text-pink-600 py-4 rounded-2xl font-extrabold text-lg shadow-xl hover:bg-gray-50 active:scale-95 transition-all">
            Iniciar Sesión
          </button>
          <button onClick={() => {setMessage(''); setView('REGISTER');}} className="w-full bg-white/10 border-2 border-white/50 text-white py-4 rounded-2xl font-bold text-lg hover:bg-white/20 active:scale-95 transition-all backdrop-blur-sm">
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
        {/* Header con el gradiente de marca */}
        <div className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 p-8 pb-20 pt-16 rounded-b-[3rem] shadow-xl text-white text-center relative z-0">
           <button onClick={() => setView('WELCOME')} className="absolute top-12 left-6 text-white/80 hover:text-white font-bold text-2xl transition-colors">←</button>
           <h2 className="text-3xl font-extrabold mt-2 tracking-tight">{isReg ? 'Únete al Club' : 'Bienvenido'}</h2>
           <p className="text-white/90 text-sm mt-1 font-medium">{isReg ? 'Tu lealtad, fácil y ya.' : 'Tus premios te esperan'}</p>
        </div>

        <div className="flex-1 px-6 -mt-12 pb-10 z-10">
          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6 border border-gray-100">
             {isReg && <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Nombre Completo</label><input className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-gray-100 focus:bg-white focus:ring-2 focus:ring-pink-400 outline-none transition-all" value={name} onChange={e=>setName(e.target.value)} /></div>}
             <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Teléfono Celular</label><input type="tel" maxLength={10} className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-gray-100 focus:bg-white focus:ring-2 focus:ring-pink-400 outline-none transition-all" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="10 dígitos" /></div>
             {isReg && (
               <>
                 <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Email</label><input type="email" className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-medium border border-gray-100 focus:bg-white focus:ring-2 focus:ring-pink-400 outline-none transition-all" value={email} onChange={e=>setEmail(e.target.value)} /></div>
                 <div className="flex gap-4">
                    <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Fecha</label><input type="date" className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-medium border border-gray-100 h-[58px]" value={birthDate} onChange={e=>setBirthDate(e.target.value)} /></div>
                    <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Género</label><select className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-medium border border-gray-100 h-[58px]" value={gender} onChange={e=>setGender(e.target.value)}><option value="">-</option><option value="Hombre">M</option><option value="Mujer">F</option></select></div>
                 </div>
               </>
             )}
             <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Contraseña</label><input type="password" className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-gray-100 focus:bg-white focus:ring-2 focus:ring-pink-400 outline-none transition-all" value={password} onChange={e=>setPassword(e.target.value)} /></div>
             {message && <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-center font-bold text-sm animate-fadeIn border border-red-100">{message}</div>}
             <button onClick={isReg ? handleRegister : handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl active:scale-95 transition-all text-lg mt-4">
               {loading ? 'Procesando...' : isReg ? 'Crear Cuenta' : 'Entrar'}
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {prizeCode && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 animate-fadeIn backdrop-blur-md">
          <div className="bg-white p-8 rounded-[2rem] text-center w-full max-w-sm relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
            <button onClick={() => { setPrizeCode(null); handleLogin(); }} className="absolute top-4 right-4 text-gray-400 font-bold p-2 text-xl hover:text-gray-600">✕</button>
            <p className="text-pink-500 uppercase text-xs font-black tracking-widest mb-2 mt-4">¡PREMIO DESBLOQUEADO!</p>
            <h2 className="text-3xl font-black text-gray-900 mb-6 leading-tight">{prizeCode.tenant}</h2>
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-8 rounded-3xl mb-6">
               <p className="text-5xl font-mono font-bold text-gray-800 tracking-widest">{prizeCode.code}</p>
            </div>
            <p className="text-sm text-gray-500 font-medium">Muestra este código al personal.</p>
          </div>
        </div>
      )}

      {/* HEADER APP */}
      <div className="bg-white px-8 pt-16 pb-6 sticky top-0 z-20 shadow-sm flex justify-between items-center">
         <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Hola,</p>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{user.name.split(' ')[0]}</h1>
         </div>
         <button onClick={handleLogout} className="h-12 w-12 bg-red-50 text-red-500 rounded-full font-bold border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-xl">✕</button>
      </div>

      <div className="p-6">
        {activeTab === 'checkin' && !scanning && (
           <div className="flex flex-col gap-6">
             <div className="space-y-6">
               {user.memberships && user.memberships.length > 0 ? (
                 user.memberships.map((m: any, idx: number) => {
                   const progress = Math.min(m.points, 100);
                   const isWinner = m.points >= 100;
                   const prizeName = m.prize || "Sorpresa"; 
                   
                   return (
                     <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                       <div className="relative z-10">
                         <div className="flex justify-between items-center mb-6">
                           <h3 className="font-bold text-gray-800 text-xl tracking-tight">{m.name}</h3>
                           <span className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">{m.points} pts</span>
                         </div>
                         {!isWinner ? (
                           <>
                             <div className="w-full bg-gray-100 rounded-full h-4 mb-3 overflow-hidden border border-gray-100">
                               <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-1000 shadow-[0_0_15px_rgba(236,72,153,0.4)]" style={{ width: `${progress}%` }}></div>
                             </div>
                             <div className="flex justify-between text-xs font-bold uppercase tracking-wide">
                               <span className="text-gray-400">Progreso</span>
                               <span className="text-pink-500">Meta: {prizeName}</span>
                             </div>
                           </>
                         ) : (
                           <button onClick={() => getPrizeCode(m.tenantId, m.name)} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black py-4 rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all animate-pulse tracking-wide text-lg">
                             🏆 CANJEAR AHORA
                           </button>
                         )}
                       </div>
                     </div>
                   );
                 })
               ) : (
                 <div className="text-center py-16 opacity-50 bg-white rounded-[2rem] border border-gray-100 border-dashed">
                    <p className="text-6xl mb-4 grayscale">🛸</p>
                    <p className="font-bold text-gray-400 text-lg">Tu billetera está vacía</p>
                    <p className="text-sm text-gray-300 mt-1">Escanea tu primer código para empezar</p>
                 </div>
               )}
             </div>

             <div className="mt-4">
               <button onClick={() => setScanning(true)} className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-bold shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-lg hover:bg-black">
                 <span className="text-2xl">📷</span> Escanear QR
               </button>
               <div className="mt-6 flex gap-3">
                   <input className="flex-1 p-5 bg-white rounded-2xl text-gray-800 font-bold text-center tracking-[0.3em] uppercase border-2 border-gray-100 placeholder-gray-300 shadow-sm outline-none focus:border-pink-400 transition-all" placeholder="AB-12" value={manualCode} onChange={e => setManualCode(e.target.value.toUpperCase())} maxLength={7} />
                   <button onClick={() => handleScan(manualCode)} disabled={!manualCode} className="bg-pink-500 text-white font-bold px-8 rounded-2xl shadow-lg disabled:opacity-50 disabled:shadow-none hover:bg-pink-600 transition-all">OK</button>
               </div>
             </div>
           </div>
        )}

        {scanning && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <Scanner onScan={(r) => r[0] && handleScan(r[0].rawValue)} onError={(e) => console.log(e)} />
            <button onClick={() => setScanning(false)} className="absolute bottom-12 left-8 right-8 bg-white/20 backdrop-blur-md text-white p-5 rounded-3xl font-bold border border-white/20 shadow-2xl">Cancelar Escaneo</button>
          </div>
        )}

        {activeTab === 'profile' && (
           <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
             <div className="flex items-center gap-5 mb-10">
                <div className="h-20 w-20 bg-gradient-to-br from-orange-100 to-pink-100 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner text-pink-500">👤</div>
                <div><h2 className="text-2xl font-black text-gray-900">Mi Perfil</h2><p className="text-sm text-gray-400 font-medium">Gestiona tu identidad</p></div>
             </div>
             
             <div className="space-y-6">
               <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Nombre</label><input className="w-full p-5 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-transparent focus:bg-white focus:border-pink-200 outline-none transition-all" value={name} onChange={e => setName(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Email</label><input type="email" className="w-full p-5 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-transparent focus:bg-white focus:border-pink-200 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} /></div>
               <div className="flex gap-4">
                  <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Fecha</label><input type="date" className="w-full p-5 bg-gray-50 rounded-2xl text-gray-800 font-bold" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div>
                  <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Género</label><select className="w-full p-5 bg-gray-50 rounded-2xl text-gray-800 font-bold appearance-none" value={gender} onChange={e => setGender(e.target.value)}><option value="Hombre">M</option><option value="Mujer">F</option></select></div>
               </div>
             </div>
             <button onClick={handleUpdate} className="w-full bg-gray-900 text-white p-5 rounded-2xl font-bold mt-10 shadow-xl active:scale-95 transition-all text-lg hover:bg-black">Guardar Cambios 💾</button>
             {message && <p className="text-center text-green-600 mt-6 font-bold bg-green-50 p-4 rounded-2xl border border-green-100">{message}</p>}
           </div>
        )}
      </div>

      <div className="fixed bottom-8 left-8 right-8 bg-white/80 backdrop-blur-xl border border-white/40 p-2 rounded-[2.5rem] shadow-2xl flex justify-between items-center z-40 ring-1 ring-black/5">
        <button onClick={() => setActiveTab('checkin')} className={`flex-1 flex flex-col items-center py-4 rounded-[2rem] transition-all duration-300 ${activeTab==='checkin'?'bg-gray-900 text-white shadow-lg scale-105':'text-gray-400 hover:bg-white hover:text-gray-600'}`}>
            <span className="text-xl mb-1">🔥</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Puntos</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex-1 flex flex-col items-center py-4 rounded-[2rem] transition-all duration-300 ${activeTab==='profile'?'bg-gray-900 text-white shadow-lg scale-105':'text-gray-400 hover:bg-white hover:text-gray-600'}`}>
            <span className="text-xl mb-1">👤</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Perfil</span>
        </button>
      </div>
    </div>
  );
}
