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
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [prizeCode, setPrizeCode] = useState<{code: string, tenant: string} | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const c = p.get('code');
      if (c) { setPendingCode(c); if (!user) setMessage('👋 Código detectado.'); }
    }
  }, []);

  useEffect(() => { if (user && pendingCode) { handleScan(pendingCode); setPendingCode(null); window.history.replaceState({}, '', '/'); } }, [user, pendingCode]);

  const handleLogin = async () => {
    setLoading(true); setMessage('');
    try {
      const res = await fetch('/api/user/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ phone, password }) });
      const data = await res.json();
      if (res.ok) {
        setUser(data); setName(data.name); setGender(data.gender || '');
        if (data.birthDate) setBirthDate(data.birthDate.split('T')[0]); else setBirthDate('');
        setView('APP');
      } else setMessage(data.error);
    } catch (e) { setMessage('Error'); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!name || !phone || !password) return setMessage('Faltan datos');
    setLoading(true);
    try {
      const res = await fetch('/api/user/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, phone, password, gender, birthDate }) });
      if (res.ok) handleLogin(); else { const d = await res.json(); setMessage(d.error); }
    } catch (e) { setMessage('Error'); }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!user?.id) return;
    setMessage('Guardando...');
    try {
      const res = await fetch('/api/user/update', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: user.id, name, gender, birthDate }) });
      if (res.ok) { setMessage('✅ Datos actualizados'); setUser({ ...user, name, gender, birthDate }); }
      else setMessage('Error');
    } catch (e) { setMessage('Error'); }
  };

  const handleScan = async (result: string) => {
    if (!result) return;
    setScanning(false);
    
    let finalCode = result;
    if (result.includes('code=')) finalCode = result.split('code=')[1].split('&')[0];

    try {
      const res = await fetch('/api/check-in/scan', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId: user?.id, code: finalCode }) });
      const data = await res.json();
      if (res.ok) { alert(data.message); handleLogin(); setManualCode(''); } else alert(data.error);
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

  const handleLogout = () => {
    if(confirm("¿Salir?")) { setUser(null); setView('WELCOME'); setPhone(''); setPassword(''); }
  };

  if (view === 'WELCOME') return (
    <div className="min-h-screen bg-blue-700 flex flex-col items-center justify-center p-6 text-white">
      <h1 className="text-4xl font-bold mb-4">Puntos IA 🤖</h1>
      <button onClick={() => setView('LOGIN')} className="w-full bg-white text-blue-700 py-4 rounded-xl font-bold mb-4 active:scale-95 transition-all">Iniciar Sesión</button>
      <button onClick={() => setView('REGISTER')} className="w-full border-2 border-white py-4 rounded-xl font-bold active:scale-95 transition-all">Crear Cuenta</button>
    </div>
  );

  if (view === 'LOGIN' || view === 'REGISTER') {
    const isReg = view === 'REGISTER';
    return (
      <div className="min-h-screen p-6 bg-gray-50 flex flex-col">
        <button onClick={() => setView('WELCOME')} className="mb-6 text-gray-500 font-bold w-fit">← Volver</button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{isReg ? 'Crear Cuenta 🚀' : 'Hola de nuevo 👋'}</h2>
        
        <div className="space-y-4 flex-1 overflow-y-auto pb-4">
           {isReg && <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Nombre</label><input className="w-full p-4 rounded-xl border border-gray-300 text-black bg-white font-medium" value={name} onChange={e=>setName(e.target.value)} /></div>}
           
           <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Teléfono</label><input className="w-full p-4 rounded-xl border border-gray-300 text-black bg-white font-medium" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Tu ID único" /></div>
           
           {isReg && (
             <>
               <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Fecha Nacimiento</label><input type="date" className="w-full p-4 rounded-xl border border-gray-300 text-black bg-white font-medium h-[58px]" value={birthDate} onChange={e=>setBirthDate(e.target.value)} /></div>
               <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Género</label><select className="w-full p-4 rounded-xl border border-gray-300 text-black bg-white font-medium h-[58px]" value={gender} onChange={e=>setGender(e.target.value)}><option value="">Seleccionar</option><option value="Hombre">Hombre</option><option value="Mujer">Mujer</option></select></div>
             </>
           )}

           <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Contraseña</label><input type="password" className="w-full p-4 rounded-xl border border-gray-300 text-black bg-white font-medium" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        </div>

        {message && <p className="text-blue-600 font-bold text-center mb-4">{message}</p>}
        <button onClick={isReg ? handleRegister : handleLogin} disabled={loading} className={`w-full text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all ${isReg ? 'bg-green-600' : 'bg-blue-600'}`}>{loading ? '...' : isReg ? 'Registrarme' : 'Entrar'}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {prizeCode && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl text-center w-full max-w-sm relative">
            <button onClick={() => { setPrizeCode(null); handleLogin(); }} className="absolute top-4 right-4 text-gray-400 font-bold p-2">✕</button>
            <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-2">CAJA</p>
            <h2 className="text-2xl font-bold text-blue-600 mb-4">{prizeCode.tenant}</h2>
            <div className="bg-yellow-100 border-2 border-yellow-400 p-6 rounded-2xl mb-4"><p className="text-5xl font-mono font-bold tracking-widest">{prizeCode.code}</p></div>
            <p className="text-sm text-gray-500 font-medium">Muestra este código para recibir tu premio.</p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 shadow-sm sticky top-0 z-10 flex justify-between items-center">
         <div><h1 className="font-bold text-gray-800 text-lg">Hola, {user.name.split(' ')[0]}</h1></div>
         <button onClick={handleLogout} className="h-10 w-10 bg-red-50 text-red-500 rounded-full font-bold border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors">✕</button>
      </div>

      <div className="p-6">
        {activeTab === 'checkin' && !scanning && (
           <div className="flex flex-col gap-6">
             {/* LISTA DE TARJETAS */}
             <div className="w-full space-y-4">
               {user.memberships && user.memberships.length > 0 ? (
                 user.memberships.map((m: any, idx: number) => {
                   const progress = Math.min(m.points, 100);
                   const isWinner = m.points >= 100;
                   // 🆕 TRUCO: Accedemos a m.tenant.prize, o usamos el nombre que venía en la lista plana 'm.prizeName' si lo hubiéramos mandado así.
                   // Como el backend manda memberships: [{name: "Negocio", points: 10, ...}], necesitamos asegurarnos que venga el PREMIO.
                   // Nota: En el backend 'user/login', el include tenant trae todo.
                   const prizeName = m.tenant?.prize || "Premio Sorpresa"; 
                   
                   return (
                     <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                       <div className="flex justify-between items-center mb-3">
                         <h3 className="font-bold text-gray-800 text-lg">{m.name}</h3>
                         <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{m.points} pts</span>
                       </div>
                       {!isWinner ? (
                         <>
                           <div className="w-full bg-gray-100 rounded-full h-4 mb-3 overflow-hidden"><div className="h-full rounded-full bg-blue-600 transition-all duration-1000" style={{ width: `${progress}%` }}></div></div>
                           <div className="flex justify-between text-xs text-gray-500 font-bold uppercase">
                             <span>0</span>
                             {/* 🆕 AQUÍ MOSTRAMOS EL PREMIO CLARAMENTE */}
                             <span className="text-blue-600">Meta: {prizeName}</span>
                           </div>
                         </>
                       ) : (
                         <div className="animate-pulse">
                           <button onClick={() => getPrizeCode(m.tenantId, m.name)} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 rounded-xl shadow-md transform hover:scale-105 transition-all">
                             🏆 CANJEAR: {prizeName}
                           </button>
                         </div>
                       )}
                     </div>
                   );
                 })
               ) : <div className="text-center py-10 opacity-50"><p className="text-gray-500">Sin puntos aún. ¡Visita un negocio!</p></div>}
             </div>

             <button onClick={() => setScanning(true)} className="w-full bg-black text-white py-5 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">📷 Escanear QR</button>
             
             <div className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex gap-2">
                 <input className="flex-1 p-3 bg-gray-50 rounded-lg text-black uppercase font-mono text-center tracking-widest border border-gray-300 font-bold placeholder-gray-400" placeholder="CÓDIGO MANUAL" value={manualCode} onChange={e => setManualCode(e.target.value.toUpperCase())} maxLength={7} />
                 <button onClick={() => handleScan(manualCode)} disabled={!manualCode} className="bg-gray-200 text-gray-700 font-bold px-5 rounded-lg hover:bg-gray-300 disabled:opacity-50">👉</button>
             </div>
           </div>
        )}

        {scanning && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <Scanner onScan={(r) => r[0] && handleScan(r[0].rawValue)} onError={(e) => console.log(e)} />
            <button onClick={() => setScanning(false)} className="absolute bottom-10 left-10 right-10 bg-red-600 text-white p-4 rounded-xl font-bold shadow-lg">Cancelar</button>
          </div>
        )}

        {/* 🆕 SECCIÓN DE PERFIL RESTAURADA */}
        {activeTab === 'profile' && (
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">👤 Editar Datos</h2>
             <div className="space-y-4">
               <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nombre</label><input className="w-full p-4 bg-gray-50 rounded-xl text-gray-800 border border-gray-200 font-medium" value={name} onChange={e => setName(e.target.value)} /></div>
               <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Fecha Nacimiento</label><input type="date" className="w-full p-4 bg-gray-50 rounded-xl text-gray-800 border border-gray-200 font-medium" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div>
               <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Género</label><select className="w-full p-4 bg-gray-50 rounded-xl text-gray-800 border border-gray-200 font-medium" value={gender} onChange={e => setGender(e.target.value)}><option value="Hombre">Hombre</option><option value="Mujer">Mujer</option></select></div>
             </div>
             <button onClick={handleUpdate} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold mt-8 shadow-md active:scale-95 transition-all">Guardar Cambios</button>
             {message && <p className="text-center text-green-600 mt-4 font-bold">{message}</p>}
           </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('checkin')} className={`flex flex-col items-center p-2 px-6 rounded-xl transition-all ${activeTab==='checkin'?'text-blue-600 bg-blue-50':'text-gray-400'}`}>📍<span className="text-xs font-bold">Puntos</span></button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center p-2 px-6 rounded-xl transition-all ${activeTab==='profile'?'text-blue-600 bg-blue-50':'text-gray-400'}`}>👤<span className="text-xs font-bold">Perfil</span></button>
      </div>
    </div>
  );
}
