'use client';
import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import dynamic from 'next/dynamic';

const BusinessMap = dynamic(
  () => import('./components/BusinessMap'), 
  { ssr: false, loading: () => <div className="h-full w-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 animate-pulse"><span className="text-4xl mb-2">🗺️</span><span className="text-xs font-bold uppercase tracking-widest">Cargando...</span></div> }
);

type ViewState = 'WELCOME' | 'LOGIN' | 'REGISTER' | 'APP';

const Onboarding = () => {
  const [slide, setSlide] = useState(0);
  const slides = [{icon:"📸",title:"1. Escanea",text:"Visita y escanea el código QR."},{icon:"🔥",title:"2. Suma",text:"Acumula puntos automáticamente."},{icon:"🎁",title:"3. Canjea",text:"Genera tu código de premio."},{icon:"🏆",title:"4. Gana",text:"Recibe tu recompensa."}];
  useEffect(() => { const i = setInterval(() => setSlide(p => (p+1)%4), 4000); return () => clearInterval(i); }, []);
  return (
    <div className="flex flex-col items-center w-full transition-all duration-500">
      <div className="text-5xl mb-3 animate-bounce drop-shadow-md">{slides[slide].icon}</div>
      <h2 className="text-xl font-black text-white mb-2 drop-shadow-md">{slides[slide].title}</h2>
      <p className="text-white/90 text-center text-xs h-8 px-4">{slides[slide].text}</p>
      <div className="flex gap-2 mt-4">{slides.map((_,i)=><div key={i} onClick={()=>setSlide(i)} className={`h-1.5 w-1.5 rounded-full transition-all cursor-pointer ${i===slide?'bg-white w-4':'bg-white/40'}`}/>)}</div>
    </div>
  );
};

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
  const [tenants, setTenants] = useState<any[]>([]);
  const [mapFocus, setMapFocus] = useState<[number, number] | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // 🆕 ESTADOS HISTORIAL
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const isValidPhone = (p: string) => /^\d{10}$/.test(p);
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  useEffect(() => {
    if (typeof window !== 'undefined') { const p = new URLSearchParams(window.location.search); const c = p.get('code'); if (c) { setPendingCode(c); if(!user) setMessage('👋 Código detectado.'); } }
    loadMapData();
  }, []);
  useEffect(() => { if (user && pendingCode) { handleScan(pendingCode); setPendingCode(null); window.history.replaceState({}, '', '/'); } }, [user, pendingCode]);

  const loadMapData = async () => { try { const res = await fetch('/api/map/tenants'); const d = await res.json(); if(d.tenants) setTenants(d.tenants); } catch(e){} };

  const loadHistory = async () => {
    if(!user?.id) return;
    try {
        const res = await fetch('/api/user/history', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId: user.id }) });
        const data = await res.json();
        if(data.history) setHistory(data.history);
        setShowHistory(true);
    } catch(e) { alert("Error cargando historial"); }
  };

  const handleLogin = async () => {
    setMessage(''); if (!phone) return setMessage('❌ Teléfono requerido'); setLoading(true);
    try { const res = await fetch('/api/user/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ phone, password }) }); const data = await res.json(); if (res.ok) { setUser(data); setName(data.name); setEmail(data.email||''); setGender(data.gender||''); if(data.birthDate) setBirthDate(data.birthDate.split('T')[0]); else setBirthDate(''); setView('APP'); } else setMessage('⚠️ ' + data.error); } catch (e) { setMessage('🔥 Error de conexión'); } setLoading(false);
  };
  const handleRegister = async () => {
    setMessage(''); if (!name.trim()) return setMessage('❌ Nombre requerido'); if (!isValidPhone(phone)) return setMessage('❌ Teléfono 10 dígitos'); setLoading(true);
    try { const res = await fetch('/api/user/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, phone, email, password, gender, birthDate }) }); if (res.ok) handleLogin(); else { const d = await res.json(); setMessage('⚠️ ' + d.error); } } catch (e) { setMessage('🔥 Error de conexión'); } setLoading(false);
  };
  const handleUpdate = async () => { 
    if (!user?.id) return; 
    if (!isValidPhone(phone)) return setMessage('❌ Teléfono inválido');
    setMessage('Guardando...'); 
    try { 
      const res = await fetch('/api/user/update', { 
        method: 'POST', headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify({ id: user.id, name, email, gender, birthDate, phone }) 
      }); 
      if (res.ok) { setMessage('✅ Datos actualizados'); setUser({ ...user, name, email, gender, birthDate, phone }); } 
      else { const d = await res.json(); setMessage('❌ ' + d.error); }
    } catch (e) { setMessage('🔥 Error de red'); } 
  };
  
  const handleScan = async (result: string) => {
    if (!result) return; setScanning(false); let finalCode = result; if (result.includes('code=')) finalCode = result.split('code=')[1].split('&')[0];
    try { const res = await fetch('/api/check-in/scan', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId: user?.id, code: finalCode }) }); const data = await res.json(); if (res.ok) { alert(data.message); handleLogin(); setManualCode(''); } else alert('❌ ' + data.error); } catch (e) { if(user) alert('Error'); }
  };
  const getPrizeCode = async (tenantId: string, tenantName: string) => {
    if(!confirm(`¿Canjear premio en ${tenantName}?`)) return;
    try { const res = await fetch('/api/redeem/request', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId: user.id, tenantId }) }); const data = await res.json(); if(res.ok) setPrizeCode({ code: data.code, tenant: tenantName }); else alert(data.error); } catch(e) { alert('Error'); }
  };
  const goToBusinessMap = (tName: string) => { const target = tenants.find(t => t.name === tName); if (target && target.lat && target.lng) { setMapFocus([target.lat, target.lng]); setActiveTab('map'); } else { alert("Ubicación no disponible."); } };
  const handleLogout = () => { if(confirm("¿Salir?")) { setUser(null); setView('WELCOME'); setPhone(''); setPassword(''); setMessage(''); } };
  const toggleCard = (id: string) => { setExpandedId(expandedId === id ? null : id); };

  const BrandLogo = () => (
    <div className="flex items-center justify-center gap-1 mb-2 select-none scale-90">
      <span className="text-6xl font-black tracking-tight text-white drop-shadow-lg" style={{fontFamily: 'sans-serif'}}>punto</span>
      <div className="relative h-12 w-12 mx-1"><div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 via-orange-400 to-red-500 shadow-[0_0_25px_rgba(255,200,0,0.8)]"></div><div className="absolute top-2 left-3 w-3 h-3 bg-white rounded-full blur-[2px] opacity-90"></div></div>
      <span className="text-6xl font-black tracking-tight text-white drop-shadow-lg" style={{fontFamily: 'sans-serif'}}>IA</span>
    </div>
  );

  if (view === 'WELCOME') return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex flex-col items-center justify-center p-6 text-white relative overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col items-center py-10">
        <BrandLogo />
        <p className="text-white text-xl font-medium mb-10 mt-0 tracking-wide drop-shadow-md text-center leading-tight">Premiamos tu lealtad,<br/><span className="font-extrabold italic">fácil y YA.</span></p>
        {pendingCode && <div className="bg-white/20 p-4 rounded-2xl mb-4 border border-white/30 backdrop-blur-sm animate-bounce w-full text-center"><p className="font-bold">🎉 ¡Código detectado!</p></div>}
        <div className="space-y-4 w-full mb-12">
          <button onClick={() => {setMessage(''); setView('LOGIN');}} className="w-full bg-white text-pink-600 py-4 rounded-2xl font-extrabold text-lg shadow-xl hover:bg-gray-50 active:scale-95 transition-all">Iniciar Sesión</button>
          <button onClick={() => {setMessage(''); setView('REGISTER');}} className="w-full bg-white/10 border-2 border-white/50 text-white py-4 rounded-2xl font-bold text-lg hover:bg-white/20 active:scale-95 transition-all backdrop-blur-sm">Crear Cuenta</button>
        </div>
        <div className="w-full pt-8 border-t border-white/20"><p className="text-center text-white/60 text-xs font-bold uppercase tracking-widest mb-6">¿CÓMO FUNCIONA?</p><Onboarding /></div>
      </div>
    </div>
  );

  if (view === 'LOGIN' || view === 'REGISTER') {
    const isReg = view === 'REGISTER';
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 p-8 pb-20 pt-16 rounded-b-[3rem] shadow-xl text-white text-center relative z-0">
           <button onClick={() => setView('WELCOME')} className="absolute top-12 left-6 text-white/80 hover:text-white font-bold text-2xl transition-colors">←</button>
           <h2 className="text-3xl font-extrabold mt-2 tracking-tight">{isReg ? 'Únete al Club' : 'Bienvenido'}</h2>
           <p className="text-white/90 text-sm mt-1 font-medium">{isReg ? 'Premiamos tu lealtad, fácil y YA.' : 'Tus premios te esperan'}</p>
        </div>
        <div className="flex-1 px-6 -mt-12 pb-10 z-10">
          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6 border border-gray-100">
             {isReg && <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Nombre Completo</label><input className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-gray-100 focus:bg-white focus:ring-2 focus:ring-pink-400 outline-none transition-all" value={name} onChange={e=>setName(e.target.value)} /></div>}
             <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Teléfono Celular</label><input type="tel" maxLength={10} className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-gray-100 focus:bg-white focus:ring-2 focus:ring-pink-400 outline-none transition-all" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="10 dígitos" /></div>
             {isReg && (<><div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Email (Opcional)</label><input type="email" className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-medium border border-gray-100 focus:bg-white focus:ring-2 focus:ring-pink-400 outline-none transition-all" value={email} onChange={e=>setEmail(e.target.value)} /></div><div className="flex gap-4"><div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Fecha</label><input type="date" className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-medium border border-gray-100 h-[58px]" value={birthDate} onChange={e=>setBirthDate(e.target.value)} /></div><div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Género</label><select className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-medium border border-gray-100 h-[58px]" value={gender} onChange={e=>setGender(e.target.value)}><option value="">-</option><option value="Hombre">M</option><option value="Mujer">F</option></select></div></div></>)}
             <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Contraseña</label><input type="password" className="w-full p-4 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-gray-100 focus:bg-white focus:ring-2 focus:ring-pink-400 outline-none transition-all" value={password} onChange={e=>setPassword(e.target.value)} /></div>
             {message && <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-center font-bold text-sm animate-fadeIn border border-red-100">{message}</div>}
             <button onClick={isReg ? handleRegister : handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl active:scale-95 transition-all text-lg mt-4">{loading ? 'Procesando...' : isReg ? 'Crear Cuenta' : 'Entrar'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {showTutorial && (<div className="fixed inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 z-[60] flex flex-col items-center justify-center p-8 animate-fadeIn"><div className="w-full max-w-sm"><h2 className="text-white text-center font-black text-3xl mb-10">¿Cómo usar PuntoIA?</h2><Onboarding /><button onClick={() => setShowTutorial(false)} className="w-full bg-white text-purple-600 font-bold py-4 rounded-2xl mt-12 shadow-xl hover:bg-gray-100">¡Entendido!</button></div></div>)}
      {showHistory && (<div className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center p-6 animate-fadeIn"><div className="bg-white p-6 rounded-[2rem] w-full max-w-md h-[70vh] flex flex-col shadow-2xl relative"><button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 text-gray-400 font-bold p-2 text-xl hover:text-gray-600">✕</button><h2 className="text-2xl font-black text-gray-900 mb-6 text-center">🏆 Mis Victorias</h2><div className="flex-1 overflow-y-auto space-y-4 pr-2">{history.length > 0 ? history.map((h: any, i: number) => (<div key={i} className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex items-center gap-4"><div className="bg-yellow-200 text-yellow-700 h-12 w-12 rounded-xl flex items-center justify-center text-2xl">🎁</div><div><h3 className="font-bold text-gray-800">{h.prize}</h3><p className="text-xs text-gray-500">{h.tenant} • {h.date}</p></div></div>)) : (<div className="text-center text-gray-400 py-10"><p className="text-4xl mb-2">🤷‍♂️</p><p>Aún no has canjeado premios.</p></div>)}</div></div></div>)}
      {prizeCode && (<div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 animate-fadeIn backdrop-blur-md"><div className="bg-white p-8 rounded-[2rem] text-center w-full max-w-sm relative shadow-2xl overflow-hidden"><div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-orange-500"></div><button onClick={() => { setPrizeCode(null); handleLogin(); }} className="absolute top-4 right-4 text-gray-400 font-bold p-2 text-xl hover:text-gray-600">✕</button><p className="text-pink-500 uppercase text-xs font-black tracking-widest mb-2 mt-4">¡PREMIO DESBLOQUEADO!</p><h2 className="text-3xl font-black text-gray-900 mb-6 leading-tight">{prizeCode.tenant}</h2><div className="bg-gray-50 border-2 border-dashed border-gray-200 p-8 rounded-3xl mb-6"><p className="text-5xl font-mono font-bold text-gray-800 tracking-widest">{prizeCode.code}</p></div><p className="text-sm text-gray-500 font-medium">Muestra este código al personal.</p></div></div>)}

      <div className="bg-white px-8 pt-16 pb-6 sticky top-0 z-20 shadow-sm flex justify-between items-center">
         <div><p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Hola,</p><h1 className="text-3xl font-black text-gray-900 tracking-tight">{user.name.split(' ')[0]}</h1></div>
         <div className="flex gap-2"><button onClick={() => setShowTutorial(true)} className="h-12 w-12 bg-blue-50 text-blue-500 rounded-full font-bold border border-blue-100 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm" title="Ayuda"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg></button><button onClick={handleLogout} className="h-12 w-12 bg-red-50 text-red-500 rounded-full font-bold border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">✕</button></div>
      </div>

      <div className="p-6">
        {activeTab === 'checkin' && !scanning && (
           <div className="flex flex-col gap-6">
             <div className="space-y-4">
               {user.memberships?.map((m: any, idx: number) => {
                   const progress = Math.min(m.points, 100);
                   const isWinner = m.points >= 100;
                   const isExpanded = expandedId === m.tenantId;
                   return (
                     <div key={idx} onClick={() => toggleCard(m.tenantId)} className={`bg-white p-6 rounded-[2rem] relative overflow-hidden transition-all duration-500 cursor-pointer border border-gray-100 ${isExpanded ? 'shadow-2xl ring-4 ring-pink-50 scale-[1.02]' : 'shadow-lg hover:shadow-xl hover:scale-[1.01]'}`}>
                       <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 rounded-bl-full opacity-60 z-0"></div>
                       <div className="relative z-10">
                         <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4"><div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center font-black text-2xl shadow-lg">{m.name.charAt(0)}</div><div><h3 className="font-bold text-gray-800 text-xl tracking-tight leading-none">{m.name}</h3></div></div>
                            <div className="text-right"><span className="block text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">{m.points}</span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PUNTOS</span></div>
                         </div>
                         {!isWinner ? (
                           <><div className="relative w-full h-5 bg-gray-100 rounded-full overflow-hidden mb-3 shadow-inner"><div className="absolute inset-0 bg-gray-200/50"></div><div className="h-full rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 transition-all duration-1000 relative" style={{ width: `${progress}%` }}><div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer w-full h-full"></div></div></div><div className="flex justify-between items-center text-xs font-bold uppercase tracking-wide"><span className="text-gray-400 flex items-center gap-1">{isExpanded ? '🔽 Menos info' : '▶️ Ver opciones'}</span><span className="text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">🏆 Meta: {m.prize}</span></div></>
                         ) : (<button onClick={(e) => {e.stopPropagation(); getPrizeCode(m.tenantId, m.name);}} className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-black py-5 rounded-2xl shadow-xl animate-pulse tracking-wide text-lg relative z-20 hover:scale-[1.02] transition-transform border-4 border-white/20">🎁 CANJEAR PREMIO</button>)}
                         <div className={`grid grid-cols-2 gap-3 mt-4 overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}><button onClick={(e) => { e.stopPropagation(); goToBusinessMap(m.name); }} className="bg-white border-2 border-blue-50 text-blue-600 py-4 rounded-2xl font-bold text-xs flex flex-col items-center hover:bg-blue-50 transition-colors shadow-sm group"><span className="text-2xl mb-1 group-hover:scale-110 transition-transform">📍</span> Ver Mapa</button>{m.instagram ? (<a href={`https://instagram.com/${m.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-white border-2 border-pink-50 text-pink-600 py-4 rounded-2xl font-bold text-xs flex flex-col items-center hover:bg-pink-50 transition-colors no-underline shadow-sm group"><span className="text-2xl mb-1 group-hover:scale-110 transition-transform">📸</span> Instagram</a>) : (<div className="bg-gray-50 border-2 border-gray-100 text-gray-300 py-4 rounded-2xl font-bold text-xs flex flex-col items-center grayscale opacity-50"><span className="text-2xl mb-1">📸</span> No IG</div>)}</div>
                       </div>
                     </div>
                   );
               })}
             </div>
             <button onClick={() => setScanning(true)} className="w-full bg-gray-900 text-white py-6 rounded-[2.5rem] font-bold shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-xl hover:bg-black group"><span className="group-hover:rotate-12 transition-transform duration-300">📷</span> Escanear Nuevo QR</button>
             <div className="mt-8 flex justify-center"><div className="flex bg-white p-2 rounded-full shadow-sm border border-gray-100 w-full max-w-xs"><input className="flex-1 p-2 bg-transparent text-gray-800 font-bold text-center tracking-[0.2em] uppercase text-sm outline-none placeholder-gray-300" placeholder="CÓDIGO MANUAL" value={manualCode} onChange={e => setManualCode(e.target.value.toUpperCase())} maxLength={7} /><button onClick={() => handleScan(manualCode)} disabled={!manualCode} className="bg-gray-200 text-gray-600 font-bold px-4 rounded-full disabled:opacity-50 hover:bg-gray-300 transition-all">OK</button></div></div>
           </div>
        )}

        {activeTab === 'map' && (<div className="h-[65vh] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white relative z-0"><BusinessMap tenants={tenants} focusCoords={mapFocus} /></div>)}

        {scanning && (<div className="fixed inset-0 bg-black z-50 flex flex-col"><Scanner onScan={(r) => r[0] && handleScan(r[0].rawValue)} onError={(e) => console.log(e)} /><button onClick={() => setScanning(false)} className="absolute bottom-12 left-8 right-8 bg-white/20 backdrop-blur-md text-white p-5 rounded-3xl font-bold border border-white/20 shadow-2xl">Cancelar Escaneo</button></div>)}

        {activeTab === 'profile' && (
           <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
             <div className="flex items-center gap-5 mb-10"><div className="h-20 w-20 bg-gradient-to-br from-orange-100 to-pink-100 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner text-pink-500">👤</div><div><h2 className="text-2xl font-black text-gray-900">Mi Perfil</h2><p className="text-sm text-gray-400 font-medium">Gestiona tu identidad</p></div></div>
             <div className="space-y-6">
               <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Nombre</label><input className="w-full p-5 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-transparent focus:bg-white focus:border-pink-200 outline-none transition-all" value={name} onChange={e => setName(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Teléfono</label><input type="tel" maxLength={10} className="w-full p-5 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-transparent focus:bg-white focus:border-pink-200 outline-none transition-all" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} /></div>
               <div><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Email</label><input type="email" className="w-full p-5 bg-gray-50 rounded-2xl text-gray-800 font-bold border border-transparent focus:bg-white focus:border-pink-200 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} /></div>
               <div className="flex gap-4"><div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Fecha</label><input type="date" className="w-full p-5 bg-gray-50 rounded-2xl text-gray-800 font-bold" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div><div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2 tracking-wider">Género</label><select className="w-full p-5 bg-gray-50 rounded-2xl text-gray-800 font-bold appearance-none" value={gender} onChange={e => setGender(e.target.value)}><option value="Hombre">M</option><option value="Mujer">F</option></select></div></div>
             </div>
             
             {/* BOTÓN HISTORIAL */}
             <button onClick={loadHistory} className="w-full bg-yellow-400 text-yellow-900 p-5 rounded-2xl font-bold mt-8 shadow-lg active:scale-95 transition-all text-lg hover:bg-yellow-300 flex items-center justify-center gap-2">
                <span>📜</span> Ver Historial de Premios
             </button>

             <button onClick={handleUpdate} className="w-full bg-gray-900 text-white p-5 rounded-2xl font-bold mt-4 shadow-xl active:scale-95 transition-all text-lg hover:bg-black">Guardar Cambios 💾</button>
             {message && <p className="text-center text-green-600 mt-6 font-bold bg-green-50 p-4 rounded-2xl border border-green-100">{message}</p>}
           </div>
        )}
      </div>

      <div className="fixed bottom-8 left-8 right-8 bg-white/80 backdrop-blur-xl border border-white/40 p-2 rounded-[2.5rem] shadow-2xl flex justify-between items-center z-40 ring-1 ring-black/5">
        <button onClick={() => setActiveTab('checkin')} className={`flex-1 flex flex-col items-center py-4 rounded-[2rem] transition-all duration-300 ${activeTab==='checkin'?'bg-gray-900 text-white shadow-lg scale-105':'text-gray-400 hover:bg-white hover:text-gray-600'}`}><span className="text-xl mb-1">🔥</span><span className="text-[10px] font-black uppercase tracking-widest">Puntos</span></button>
        <button onClick={() => setActiveTab('map')} className={`flex-1 flex flex-col items-center py-4 rounded-[2rem] transition-all duration-300 ${activeTab==='map'?'bg-gray-900 text-white shadow-lg scale-105':'text-gray-400 hover:bg-white hover:text-gray-600'}`}><span className="text-xl mb-1">🗺️</span><span className="text-[10px] font-black uppercase tracking-widest">Mapa</span></button>
        <button onClick={() => setActiveTab('profile')} className={`flex-1 flex flex-col items-center py-4 rounded-[2rem] transition-all duration-300 ${activeTab==='profile'?'bg-gray-900 text-white shadow-lg scale-105':'text-gray-400 hover:bg-white hover:text-gray-600'}`}><span className="text-xl mb-1">👤</span><span className="text-[10px] font-black uppercase tracking-widest">Perfil</span></button>
      </div>
    </div>
  );
}
