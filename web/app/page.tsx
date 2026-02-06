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
      if (c) { setPendingCode(c); if(!user) setMessage('👋 Código detectado.'); }
    }
  }, []);

  useEffect(() => { if (user && pendingCode) { handleScan(pendingCode); setPendingCode(null); window.history.replaceState({}, '', '/'); } }, [user, pendingCode]);

  const handleLogin = async () => {
    setLoading(true); setMessage('');
    try {
      const res = await fetch('/api/user/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ phone, password }) });
      const data = await res.json();
      if (res.ok) { setUser(data); setName(data.name); setView('APP'); } else setMessage(data.error);
    } catch (e) { setMessage('Error'); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!name || !phone || !password) return setMessage('Faltan datos');
    setLoading(true);
    try {
      const res = await fetch('/api/user/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, phone, password, gender: 'Hombre', birthDate }) }); 
      if (res.ok) handleLogin(); else { const d = await res.json(); setMessage(d.error); }
    } catch (e) { setMessage('Error'); }
    setLoading(false);
  };

  // 🧹 LÓGICA DE ESCANEO INTELIGENTE
  const handleScan = async (result: string) => {
    if (!result) return;
    setScanning(false);
    setMessage('Procesando...');
    
    // Si el resultado es una URL (ej: https://app.com/?code=AB-12), extraemos solo 'AB-12'
    let finalCode = result;
    try {
        if (result.includes('code=')) {
            const parts = result.split('code=');
            if (parts.length > 1) {
                finalCode = parts[1].split('&')[0]; // Tomamos lo que sigue a code=
            }
        }
    } catch (e) { console.log("Error parseando código", e); }

    try {
      const res = await fetch('/api/check-in/scan', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId: user?.id, code: finalCode }) });
      const data = await res.json();
      if (res.ok) { alert(data.message); handleLogin(); setManualCode(''); } else alert(data.error);
    } catch (e) { if(user) alert('Error'); }
    setMessage('');
  };

  const getPrizeCode = async (tenantId: string, tenantName: string) => {
    if(!confirm(`¿Canjear puntos en ${tenantName}?`)) return;
    try {
      const res = await fetch('/api/redeem/request', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId: user.id, tenantId }) });
      const data = await res.json();
      if(res.ok) setPrizeCode({ code: data.code, tenant: tenantName }); else alert(data.error);
    } catch(e) { alert('Error'); }
  };

  if (view === 'WELCOME') return (
    <div className="min-h-screen bg-blue-700 flex flex-col items-center justify-center p-6 text-white">
      <h1 className="text-4xl font-bold mb-4">Puntos IA 🤖</h1>
      {pendingCode && <div className="bg-white/20 p-4 rounded-xl mb-6 animate-pulse"><p className="text-sm font-bold">🎉 Código detectado</p></div>}
      <button onClick={() => setView('LOGIN')} className="w-full bg-white text-blue-700 py-4 rounded-xl font-bold mb-4">Iniciar Sesión</button>
      <button onClick={() => setView('REGISTER')} className="w-full border-2 border-white py-4 rounded-xl font-bold">Crear Cuenta</button>
    </div>
  );

  if (view === 'LOGIN') return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col">
      <button onClick={() => setView('WELCOME')} className="mb-6 text-gray-400">← Volver</button>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Hola 👋</h2>
      <input className="w-full p-4 mb-4 rounded-xl border" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} />
      <input type="password" className="w-full p-4 mb-4 rounded-xl border" placeholder="Pass" value={password} onChange={e => setPassword(e.target.value)} />
      {message && <p className="text-red-500 text-center">{message}</p>}
      <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-4">{loading?'...':'Entrar'}</button>
    </div>
  );

  if (view === 'REGISTER') return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col">
      <button onClick={() => setView('WELCOME')} className="mb-6 text-gray-400">← Volver</button>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Registro 🚀</h2>
      <input className="w-full p-3 mb-4 rounded-xl border" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} />
      <input className="w-full p-3 mb-4 rounded-xl border" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} />
      <input type="password" className="w-full p-3 mb-4 rounded-xl border" placeholder="Pass" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleRegister} disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold">{loading?'...':'Crear'}</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {prizeCode && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl text-center w-full max-w-sm relative">
            <button onClick={() => { setPrizeCode(null); handleLogin(); }} className="absolute top-4 right-4 text-gray-400 font-bold">X</button>
            <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-2">CAJA</p>
            <h2 className="text-2xl font-bold text-blue-600 mb-4">{prizeCode.tenant}</h2>
            <div className="bg-yellow-100 border-2 border-yellow-400 p-6 rounded-2xl mb-4"><p className="text-5xl font-mono font-bold tracking-widest">{prizeCode.code}</p></div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 shadow-sm sticky top-0 z-10 flex justify-between items-center">
         <div><h1 className="font-bold text-gray-800">Hola, {user.name.split(' ')[0]}</h1></div>
         <button onClick={() => { setUser(null); setView('WELCOME'); }} className="text-xs text-red-400 border border-red-100 px-3 py-1 rounded-full">Salir</button>
      </div>

      <div className="p-6">
        {activeTab === 'checkin' && !scanning && (
           <div className="flex flex-col gap-6">
             <div className="w-full space-y-4">
               {user.memberships && user.memberships.length > 0 ? (
                 user.memberships.map((m: any, idx: number) => {
                   const progress = Math.min(m.points, 100);
                   const isWinner = m.points >= 100;
                   return (
                     <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                       <div className="flex justify-between items-center mb-2">
                         <h3 className="font-bold text-gray-800 text-lg">{m.name}</h3>
                         <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{m.points} pts</span>
                       </div>
                       {!isWinner ? (
                         <>
                           <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden"><div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }}></div></div>
                           <div className="flex justify-between text-xs text-gray-400 font-bold uppercase"><span>0</span><span>Meta: 100 ({m.tenant?.prize || 'Premio'})</span></div>
                         </>
                       ) : (
                         <div className="animate-pulse">
                           <button onClick={() => getPrizeCode(m.tenantId, m.name)} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 rounded-xl shadow-md">🏆 CANJEAR: {m.tenant?.prize}</button>
                         </div>
                       )}
                     </div>
                   );
                 })
               ) : <div className="text-center py-10 opacity-50"><p>Sin puntos aún</p></div>}
             </div>
             <button onClick={() => setScanning(true)} className="w-full bg-black text-white py-5 rounded-2xl font-bold shadow-lg">📷 Escanear QR</button>
             <div className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex gap-2">
                 <input className="flex-1 p-3 bg-gray-50 rounded-lg text-black uppercase font-mono text-center tracking-widest" placeholder="CÓDIGO" value={manualCode} onChange={e => setManualCode(e.target.value.toUpperCase())} maxLength={7} />
                 <button onClick={() => handleScan(manualCode)} disabled={!manualCode} className="bg-gray-200 text-gray-700 font-bold px-4 rounded-lg">👉</button>
             </div>
           </div>
        )}

        {scanning && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <Scanner onScan={(r) => r[0] && handleScan(r[0].rawValue)} onError={(e) => console.log(e)} />
            <button onClick={() => setScanning(false)} className="absolute bottom-10 left-10 right-10 bg-red-600 text-white p-4 rounded-xl font-bold">Cancelar</button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 pb-6">
        <button onClick={() => setActiveTab('checkin')} className="text-blue-600 p-2">📍 Puntos</button>
      </div>
    </div>
  );
}
