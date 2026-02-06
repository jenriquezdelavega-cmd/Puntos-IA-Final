'use client';
import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import dynamic from 'next/dynamic'; // Para cargar el mapa sin SSR

// Cargar Mapa Dinámicamente (Evita error 'window is not defined')
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

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
  
  // 🆕 ESTADO MAPA
  const [tenants, setTenants] = useState<any[]>([]);

  const isValidPhone = (p: string) => /^\d{10}$/.test(p);
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const c = p.get('code');
      if (c) { setPendingCode(c); if(!user) setMessage('👋 Código detectado.'); }
    }
    // Cargar mapa al inicio
    loadMapData();
  }, []);

  useEffect(() => { if (user && pendingCode) { handleScan(pendingCode); setPendingCode(null); window.history.replaceState({}, '', '/'); } }, [user, pendingCode]);

  const loadMapData = async () => {
    try {
      const res = await fetch('/api/map/tenants');
      const data = await res.json();
      if(data.tenants) setTenants(data.tenants);
    } catch(e) {}
  };

  const handleLogin = async () => {
    setLoading(true); setMessage('');
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

  // --- LOGO VECTORIAL HD ---
  const BrandLogo = () => (
    <div className="flex items-center justify-center gap-3 mb-6 animate-fadeIn select-none">
      <h1 className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl" style={{fontFamily: 'Inter, sans-serif'}}>
        punto<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-100">IA</span>
      </h1>
      <div className="h-4 w-4 rounded-full bg-white animate-pulse shadow-[0_0_15px_white]"></div>
    </div>
  );

  // --- VISTAS ---

  if (view === 'WELCOME') return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-400/30 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-400/30 rounded-full blur-[100px]"></div>
      <div className="z-10 text-center w-full max-w-sm flex flex-col items-center">
        <BrandLogo />
        <p className="text-white/80 text-lg font-medium mb-12 tracking-wide mt-2">La forma inteligente de ganar.</p>
        <div className="space-y-4 w-full">
          <button onClick={() => {setMessage(''); setView('LOGIN');}} className="w-full bg-white text-purple-700 py-4 rounded-2xl font-extrabold text-lg shadow-2xl hover:bg-gray-50 active:scale-95 transition-all">Iniciar Sesión</button>
          <button onClick={() => {setMessage(''); setView('REGISTER');}} className="w-full bg-black/20 border border-white/20 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black/30 active:scale-95 transition-all backdrop-blur-sm">Crear Cuenta</button>
        </div>
      </div>
    </div>
  );

  if (view === 'LOGIN' || view === 'REGISTER') {
    const isReg = view === 'REGISTER';
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 pb-20 pt-16 rounded-b-[3rem] shadow-xl text-white text-center relative z-0">
           <button onClick={() => setView('WELCOME')} className="absolute top-12 left-6 text-white/70 hover:text-white font-bold text-2xl transition-colors">←</button>
           <h2 className="text-3xl font-extrabold mt-2 tracking-tight">{isReg ? 'Únete al Club' : 'Bienvenido'}</h2>
           <p className="text-white/70 text-sm mt-1 font-medium">{isReg ? 'Tus recompensas comienzan aquí' : 'Continúa sumando puntos'}</p>
        </div>
        <div className="flex-1 px-6 -mt-12 pb-10 z-10">
          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6 border border-gray-100">
             {isReg && <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Nombre</label><input className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" value={name} onChange={e=>setName(e.target.value)} /></div>}
             <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Teléfono</label><input type="tel" maxLength={10} className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="10 dígitos" /></div>
             {isReg && (
               <>
                 <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Email</label><input type="email" className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" value={email} onChange={e=>setEmail(e.target.value)} /></div>
                 <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Contraseña</label><input type="password" className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" value={password} onChange={e=>setPassword(e.target.value)} /></div>
               </>
             )}
             {!isReg && <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Contraseña</label><input type="password" className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" value={password} onChange={e=>setPassword(e.target.value)} /></div>}
             
             {message && <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-center font-bold text-sm animate-fadeIn border border-red-100">{message}</div>}
             <button onClick={isReg ? handleRegister : handleLogin} disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl active:scale-95 transition-all text-lg mt-4">{loading ? 'Procesando...' : isReg ? 'Crear Cuenta' : 'Entrar'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {prizeCode && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 animate-fadeIn backdrop-blur-md">
          <div className="bg-white p-8 rounded-[2rem] text-center w-full max-w-sm relative shadow-2xl">
            <button onClick={() => { setPrizeCode(null); handleLogin(); }} className="absolute top-4 right-4 text-gray-400 font-bold p-2 text-xl">✕</button>
            <h2 className="text-3xl font-black text-gray-900 mb-6">{prizeCode.tenant}</h2>
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-8 rounded-3xl mb-6"><p className="text-5xl font-mono font-bold text-gray-800 tracking-widest">{prizeCode.code}</p></div>
            <p className="text-sm text-gray-500 font-medium">Muestra este código.</p>
          </div>
        </div>
      )}

      <div className="bg-white px-8 pt-16 pb-6 sticky top-0 z-20 shadow-sm flex justify-between items-center">
         <div><p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Hola,</p><h1 className="text-3xl font-black text-gray-900 tracking-tight">{user.name.split(' ')[0]}</h1></div>
         <button onClick={handleLogout} className="h-12 w-12 bg-red-50 text-red-500 rounded-full font-bold border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-xl">✕</button>
      </div>

      <div className="p-6">
        {activeTab === 'checkin' && !scanning && (
           <div className="flex flex-col gap-6">
             <div className="space-y-6">
               {user.memberships?.map((m: any, idx: number) => {
                   const progress = Math.min(m.points, 100);
                   const isWinner = m.points >= 100;
                   return (
                     <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                       <div className="relative z-10">
                         <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-gray-800 text-xl">{m.name}</h3><span className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">{m.points} pts</span></div>
                         {!isWinner ? (<><div className="w-full bg-gray-100 rounded-full h-4 mb-3 overflow-hidden border border-gray-100"><div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div></div><div className="flex justify-between text-xs font-bold uppercase tracking-wide"><span className="text-gray-400">Progreso</span><span className="text-purple-600">Meta: {m.prize}</span></div></>) : 
                         (<button onClick={() => getPrizeCode(m.tenantId, m.name)} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black py-4 rounded-2xl shadow-xl animate-pulse tracking-wide text-lg">🏆 CANJEAR AHORA</button>)}
                       </div>
                     </div>
                   );
               })}
             </div>
             <button onClick={() => setScanning(true)} className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-bold shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-lg hover:bg-black"><span className="text-2xl">📷</span> Escanear QR</button>
           </div>
        )}

        {/* 🆕 PESTAÑA MAPA */}
        {activeTab === 'map' && (
           <div className="h-[60vh] w-full rounded-[2rem] overflow-hidden shadow-xl border border-gray-200">
             {/* Importante: Leaflet necesita CSS global o cargado en layout, aquí usamos un div placeholder si no carga */}
             <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
             <MapContainer center={[19.4326, -99.1332]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {tenants.map(t => (
                   t.lat && t.lng ? (
                     <Marker key={t.id} position={[t.lat, t.lng]}>
                        <Popup>
                           <strong className="text-lg">{t.name}</strong><br/>
                           {t.address}<br/>
                           <span className="text-pink-500 font-bold">Premio: {t.prize}</span>
                        </Popup>
                     </Marker>
                   ) : null
                ))}
             </MapContainer>
           </div>
        )}

        {scanning && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <Scanner onScan={(r) => r[0] && handleScan(r[0].rawValue)} onError={(e) => console.log(e)} />
            <button onClick={() => setScanning(false)} className="absolute bottom-12 left-8 right-8 bg-white/20 backdrop-blur-md text-white p-5 rounded-3xl font-bold border border-white/20 shadow-2xl">Cancelar</button>
          </div>
        )}

        {activeTab === 'profile' && (
           <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
             <h2 className="text-2xl font-black text-gray-900 mb-6">Mi Perfil</h2>
             <div className="space-y-6">
               <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Nombre</label><input className="w-full p-5 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-transparent focus:bg-white focus:border-purple-200 outline-none transition-all" value={name} onChange={e => setName(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Email</label><input type="email" className="w-full p-5 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-transparent focus:bg-white focus:border-purple-200 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} /></div>
             </div>
             <button onClick={handleUpdate} className="w-full bg-gray-900 text-white p-5 rounded-2xl font-bold mt-10 shadow-xl active:scale-95 transition-all text-lg hover:bg-black">Guardar Cambios 💾</button>
           </div>
        )}
      </div>

      <div className="fixed bottom-8 left-8 right-8 bg-white/80 backdrop-blur-xl border border-white/40 p-2 rounded-[2.5rem] shadow-2xl flex justify-between items-center z-40 ring-1 ring-black/5">
        <button onClick={() => setActiveTab('checkin')} className={`flex-1 flex flex-col items-center py-4 rounded-[2rem] transition-all duration-300 ${activeTab==='checkin'?'bg-gray-900 text-white shadow-lg scale-105':'text-gray-400 hover:bg-white hover:text-gray-600'}`}>
            <span className="text-xl mb-1">🔥</span><span className="text-[10px] font-black uppercase tracking-widest">Puntos</span>
        </button>
        <button onClick={() => setActiveTab('map')} className={`flex-1 flex flex-col items-center py-4 rounded-[2rem] transition-all duration-300 ${activeTab==='map'?'bg-gray-900 text-white shadow-lg scale-105':'text-gray-400 hover:bg-white hover:text-gray-600'}`}>
            <span className="text-xl mb-1">🗺️</span><span className="text-[10px] font-black uppercase tracking-widest">Mapa</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex-1 flex flex-col items-center py-4 rounded-[2rem] transition-all duration-300 ${activeTab==='profile'?'bg-gray-900 text-white shadow-lg scale-105':'text-gray-400 hover:bg-white hover:text-gray-600'}`}>
            <span className="text-xl mb-1">👤</span><span className="text-[10px] font-black uppercase tracking-widest">Perfil</span>
        </button>
      </div>
    </div>
  );
}
