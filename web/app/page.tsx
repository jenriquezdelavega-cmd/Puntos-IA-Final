// web/app/page.tsx
'use client';
// 👇 1. Importamos useEffect
import { useState, useEffect } from 'react';
import { QrCode, Smartphone, Star, Gift, CheckCircle, Edit2, Save, X, Lock } from 'lucide-react';

export default function ClientApp() {
  const [activeTab, setActiveTab] = useState('checkin');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isEditing, setIsEditing] = useState(false);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [profileData, setProfileData] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'redeemed'>('idle');
  const [message, setMessage] = useState('');
  const [visits, setVisits] = useState(0);

  const GOAL = 10; 

  // 👇 2. BLOQUE MÁGICO: Auto-borrado de errores
  useEffect(() => {
    if (status === 'error') {
      // Esperar 3 segundos (3000 ms)
      const timer = setTimeout(() => {
        setMessage('');
        setStatus('idle');
      }, 3000);

      // Limpiar el reloj si el usuario hace otra cosa antes
      return () => clearTimeout(timer);
    }
  }, [status]);

  // --- FUNCIONES (Igual que antes) ---

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/check-in', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success'); setMessage(`Visita registrada en ${data.business}`); setVisits(data.visits);
      } else {
        setStatus('error'); setMessage(data.error || 'Error');
      }
    } catch (err) { setStatus('error'); setMessage('Error de conexión'); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileData(data.data);
        setName(data.data.name || '');
        if(data.data.birthDate) setBirthDate(new Date(data.data.birthDate).toISOString().split('T')[0]);
        setGender(data.data.gender || '');
        setStatus('idle'); setIsEditing(false); setMessage('');
      } else {
        setStatus('error'); setMessage(data.error || 'Credenciales incorrectas');
      }
    } catch (err) { setStatus('error'); setMessage('Error de conexión'); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, name, gender, birthDate }),
      });
      if (res.ok) {
        alert("¡Cuenta creada! Iniciando sesión...");
        setAuthMode('login'); handleLogin(e);
      } else {
        const d = await res.json();
        setStatus('error'); setMessage(d.error);
      }
    } catch (err) { setStatus('error'); setMessage('Error de conexión'); }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    // Quitamos el confirm para que sea más fluido, o lo dejamos si prefieres seguridad
    // if (!confirm("¿Confirmar cambios?")) return;

    setStatus('loading'); setMessage('');

    try {
      const res = await fetch('/api/user/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, currentPassword: password, newPassword, name, gender, birthDate }),
      });

      const d = await res.json();

      if (res.ok) {
        alert("Perfil actualizado correctamente");
        if (newPassword) setPassword(newPassword);
        setNewPassword('');
        const refresh = await fetch('/api/user/profile', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password: newPassword || password }),
        });
        const refreshData = await refresh.json();
        setProfileData(refreshData.data);
        setStatus('idle'); setIsEditing(false);
      } else {
        setStatus('error'); setMessage(d.error || "Error al actualizar");
      }
    } catch (err) { setStatus('error'); setMessage("Error de conexión"); }
  };

  const handleRedeem = async () => {
    const passToUse = activeTab === 'profile' ? password : prompt("Ingresa tu contraseña:");
    if (!passToUse) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: passToUse }),
      });
      if (res.ok) {
        setStatus('redeemed');
        if (activeTab === 'profile') handleLogin({ preventDefault: () => {} } as any);
        else setVisits(prev => Math.max(0, prev - 10));
      } else {
        const d = await res.json();
        alert(d.error); setStatus('idle');
      }
    } catch (err) { setStatus('idle'); }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col text-gray-800 relative">
        <div className="bg-indigo-600 p-6 pb-0">
          <h1 className="text-2xl font-black text-white text-center mb-4 tracking-tighter">Puntos IA</h1>
          <div className="flex gap-2">
            <button onClick={() => { setActiveTab('checkin'); setStatus('idle'); setMessage(''); }} className={`flex-1 py-3 text-sm font-bold rounded-t-xl transition-colors ${activeTab === 'checkin' ? 'bg-white text-indigo-900' : 'bg-indigo-800 text-indigo-200'}`}>Check-in</button>
            <button onClick={() => { setActiveTab('profile'); setStatus('idle'); setMessage(''); setProfileData(null); }} className={`flex-1 py-3 text-sm font-bold rounded-t-xl transition-colors ${activeTab === 'profile' ? 'bg-white text-indigo-900' : 'bg-indigo-800 text-indigo-200'}`}>Mi Perfil</button>
          </div>
        </div>

        <div className="p-6 flex-1 bg-gray-50 flex flex-col">
          {activeTab === 'checkin' && (
            status === 'success' ? (
              <div className="text-center animate-fade-in my-auto">
                 <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-lg mb-6">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Saldo</p>
                   <p className="text-4xl font-black">{visits}</p>
                 </div>
                 <h2 className="text-xl font-bold text-green-600 mb-6">¡Registrado!</h2>
                 <button onClick={() => { setStatus('idle'); setCode(''); setMessage(''); }} className="w-full py-4 bg-gray-200 rounded-xl font-bold">Cerrar</button>
              </div>
            ) : (
              <form onSubmit={handleCheckIn} className="space-y-4 my-auto">
                <div><label className="text-xs font-bold text-gray-400">TELÉFONO</label><input type="tel" className="w-full p-4 rounded-xl border-2 border-gray-200 bg-white" placeholder="55 1234 5678" value={phone} onChange={e => setPhone(e.target.value)} required /></div>
                <div><label className="text-xs font-bold text-gray-400">CÓDIGO</label><input type="text" className="w-full p-4 rounded-xl border-2 border-gray-200 bg-white uppercase font-bold" placeholder="EJ: AB-123" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required /></div>
                {/* MENSAJE DE ERROR CON ANIMACIÓN */}
                {status === 'error' && <p className="text-red-500 text-sm text-center font-bold bg-red-50 p-2 rounded-lg animate-pulse">{message}</p>}
                <button disabled={status === 'loading'} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">{status === 'loading' ? '...' : 'Registrar Visita'}</button>
              </form>
            )
          )}

          {activeTab === 'profile' && (
            !profileData ? (
              <div className="my-auto animate-fade-in">
                <div className="text-center mb-6"><h2 className="font-bold text-gray-800 text-xl">{authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2></div>
                <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-3">
                  {authMode === 'register' && (
                    <>
                      <input type="text" className="w-full p-3 rounded-xl border border-gray-200 bg-white" placeholder="Nombre Completo" value={name} onChange={e => setName(e.target.value)} />
                      <div className="flex gap-2">
                        <select className="w-1/2 p-3 rounded-xl border border-gray-200 bg-white text-gray-600" value={gender} onChange={e => setGender(e.target.value)}><option value="">Género</option><option value="M">M</option><option value="F">F</option></select>
                        <input type="date" className="w-1/2 p-3 rounded-xl border border-gray-200 bg-white text-gray-600" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                      </div>
                    </>
                  )}
                  <input type="tel" className="w-full p-3 rounded-xl border border-gray-200 bg-white" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} required />
                  <input type="password" className="w-full p-3 rounded-xl border border-gray-200 bg-white" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />

                  {status === 'error' && <p className="text-red-500 text-sm text-center font-bold bg-red-50 p-2 rounded-lg animate-pulse">{message}</p>}

                  <button disabled={status === 'loading'} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-lg">
                    {status === 'loading' ? 'Procesando...' : (authMode === 'login' ? 'Entrar' : 'Registrarme')}
                  </button>
                </form>
                <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setMessage(''); }} className="block w-full text-center mt-4 text-indigo-600 text-sm font-bold hover:underline">
                  {authMode === 'login' ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
                </button>
              </div>
            ) : (
              <div className="animate-fade-in h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg">Mi Perfil</h2>
                  <button onClick={() => { setIsEditing(!isEditing); setMessage(''); }} className="text-sm font-bold text-indigo-600 flex items-center gap-1">
                    {isEditing ? <X className="w-4 h-4"/> : <Edit2 className="w-4 h-4"/>} {isEditing ? 'Cancelar' : 'Editar'}
                  </button>
                </div>

                {isEditing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-3 flex-1 overflow-y-auto">
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</label><input type="text" className="w-full p-3 rounded-xl border border-gray-200" value={name} onChange={e => setName(e.target.value)} /></div>
                    <div className="flex gap-2">
                       <div className="w-1/2"><label className="text-[10px] font-bold text-gray-400 uppercase">Género</label><select className="w-full p-3 rounded-xl border border-gray-200 bg-white" value={gender} onChange={e => setGender(e.target.value)}><option value="">-</option><option value="M">M</option><option value="F">F</option></select></div>
                       <div className="w-1/2"><label className="text-[10px] font-bold text-gray-400 uppercase">Nacimiento</label><input type="date" className="w-full p-3 rounded-xl border border-gray-200 bg-white" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div>
                    </div>
                    <div className="pt-4 border-t border-gray-100"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Cambiar Contraseña</label><input type="password" placeholder="Nueva Contraseña" className="w-full p-3 rounded-xl border border-gray-200" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>

                    {/* 👇 AQUÍ TAMBIÉN SALE EL MENSAJE Y DESAPARECE */}
                    {status === 'error' && <p className="text-red-500 text-xs text-center font-bold bg-red-50 p-2 rounded-lg border border-red-100 animate-pulse">{message}</p>}

                    <button className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 mt-4"><Save className="w-5 h-5" /> Guardar Cambios</button>
                  </form>
                ) : (
                  <div className="space-y-4 flex-1 overflow-y-auto">
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl">{profileData.name?.[0] || 'U'}</div>
                      <div><h2 className="font-bold text-gray-800">{profileData.name || 'Sin Nombre'}</h2><p className="text-xs text-gray-500">{profileData.phone}</p></div>
                    </div>
                    {profileData.memberships.map((m: any, i: number) => (
                      <div key={i} className="bg-gray-900 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex justify-between mb-2"><span className="text-xs font-bold text-gray-400 uppercase">{m.businessName}</span><span className="font-bold text-yellow-400">{m.currentPoints} Pts</span></div>
                        {m.currentPoints >= GOAL && <button onClick={handleRedeem} className="w-full py-2 bg-yellow-500 text-black font-bold rounded-lg text-sm mt-2 flex items-center justify-center gap-2"><Gift className="w-4 h-4"/> CANJEAR</button>}
                      </div>
                    ))}
                    <button onClick={() => setProfileData(null)} className="w-full py-3 text-gray-400 text-sm font-bold border rounded-xl">Cerrar Sesión</button>
                  </div>
                )}
              </div>
            )
          )}

          {status === 'redeemed' && (
             <div className="absolute inset-0 bg-white/95 flex items-center justify-center z-50 p-6 animate-fade-in">
               <div className="text-center"><CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" /><h2 className="text-2xl font-black text-gray-800">¡Canjeado!</h2><button onClick={() => setStatus('idle')} className="mt-6 bg-gray-900 text-white px-8 py-3 rounded-xl font-bold">Ok</button></div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
