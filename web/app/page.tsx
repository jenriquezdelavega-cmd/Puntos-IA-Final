'use client';
import { useState } from 'react';

// Tipos de vista para controlar el flujo
type ViewState = 'WELCOME' | 'LOGIN' | 'REGISTER' | 'APP';

export default function Home() {
  const [view, setView] = useState<ViewState>('WELCOME');
  const [activeTab, setActiveTab] = useState('checkin');
  
  // Datos de Usuario
  const [user, setUser] = useState<any>(null);
  
  // Formularios
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // --- LOGICA DE LOGIN ---
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
        // Rellenar datos locales para edición futura
        setName(data.name);
        setGender(data.gender || '');
        setView('APP');
      } else {
        setMessage(data.error || 'Credenciales incorrectas');
      }
    } catch (e) { setMessage('Error de conexión'); }
    setLoading(false);
  };

  // --- LOGICA DE REGISTRO ---
  const handleRegister = async () => {
    if (!name || !phone || !password) {
      setMessage('Por favor completa los campos obligatorios (*)');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password, gender, birthDate })
      });
      const data = await res.json();
      if (res.ok) {
        // Auto-login después de registro exitoso
        handleLogin();
      } else {
        setMessage(data.error || 'Error al registrar');
      }
    } catch (e) { setMessage('Error de conexión'); }
    setLoading(false);
  };

  // --- LOGICA UPDATE PERFIL ---
  const handleUpdate = async () => {
    if (!user?.id) return;
    setMessage('Guardando...');
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, name, gender })
      });
      if (res.ok) {
        setMessage('✅ Datos actualizados');
        setUser({ ...user, name, gender });
      } else {
        setMessage('Error al actualizar');
      }
    } catch (e) { setMessage('Error de red'); }
  };

  // ==========================================
  // 1. VISTA DE BIENVENIDA (Limpieza total)
  // ==========================================
  if (view === 'WELCOME') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col items-center justify-center p-6 text-white">
        <div className="mb-10 text-center">
          <span className="text-6xl">🤖</span>
          <h1 className="text-4xl font-bold mt-4">Puntos IA</h1>
          <p className="text-blue-200 mt-2">Tu lealtad tiene recompensa</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <button 
            onClick={() => setView('LOGIN')}
            className="w-full bg-white text-blue-700 font-bold py-4 rounded-xl shadow-lg hover:bg-gray-100 transition-all"
          >
            Iniciar Sesión
          </button>
          <button 
            onClick={() => setView('REGISTER')}
            className="w-full bg-blue-700 border-2 border-blue-400 text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition-all"
          >
            Crear Cuenta Nueva
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. VISTA DE LOGIN (Solo lo necesario)
  // ==========================================
  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-6">
        <button onClick={() => setView('WELCOME')} className="text-gray-400 mb-6 w-fit">← Volver</button>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Bienvenido de nuevo 👋</h2>
        <p className="text-gray-500 mb-8">Ingresa tus datos para continuar</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Teléfono Celular</label>
            <input 
              type="tel"
              className="w-full p-4 bg-white border border-gray-200 rounded-xl text-black focus:border-blue-500 outline-none"
              placeholder="Ej: 55 1234 5678"
              value={phone} onChange={e => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Contraseña</label>
            <input 
              type="password"
              className="w-full p-4 bg-white border border-gray-200 rounded-xl text-black focus:border-blue-500 outline-none"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
        </div>

        {message && <p className="mt-4 text-red-500 text-center font-medium">{message}</p>}

        <button 
          onClick={handleLogin}
          disabled={loading}
          className="mt-8 w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Ingresar ->'}
        </button>
      </div>
    );
  }

  // ==========================================
  // 3. VISTA DE REGISTRO (Completa y clara)
  // ==========================================
  if (view === 'REGISTER') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-6">
        <button onClick={() => setView('WELCOME')} className="text-gray-400 mb-6 w-fit">← Volver</button>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Crear Cuenta 🚀</h2>
        
        <div className="space-y-4 overflow-y-auto pb-20">
          {/* Nombre */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo *</label>
            <input 
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-black"
              placeholder="Tu nombre"
              value={name} onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Teléfono Celular *</label>
            <input 
              type="tel"
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-black"
              placeholder="Será tu ID de usuario"
              value={phone} onChange={e => setPhone(e.target.value)}
            />
          </div>

          {/* Fecha Nacimiento */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Fecha de Nacimiento 🎂</label>
            <input 
              type="date"
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-black"
              value={birthDate} onChange={e => setBirthDate(e.target.value)}
            />
          </div>

          {/* Género */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Género</label>
            <select 
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-black"
              value={gender} onChange={e => setGender(e.target.value)}
            >
              <option value="">Selecciona una opción</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
              <option value="Otro">Prefiero no decirlo</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Contraseña *</label>
            <input 
              type="password"
              className="w-full p-3 bg-white border border-gray-200 rounded-xl text-black"
              placeholder="Crea una contraseña segura"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
        </div>

        {message && <p className="mb-4 text-red-500 text-center font-medium">{message}</p>}

        <button 
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 disabled:opacity-50 mb-8"
        >
          {loading ? 'Creando cuenta...' : 'Registrarme y Entrar'}
        </button>
      </div>
    );
  }

  // ==========================================
  // 4. VISTA APP PRINCIPAL (Dashboard)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header Bonito */}
      <div className="bg-white p-6 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Hola, {user.name.split(' ')[0]}</h1>
          <p className="text-xs text-blue-600 font-semibold">{user.gender === 'Hombre' ? 'Socio' : user.gender === 'Mujer' ? 'Socia' : 'Miembro'} VIP</p>
        </div>
        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
          {user.name.charAt(0)}
        </div>
      </div>

      {/* Contenido Cambiante */}
      <div className="p-6">
        
        {/* VISTA: CHECK-IN */}
        {activeTab === 'checkin' && (
           <div className="flex flex-col items-center animate-fadeIn">
             <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-3xl shadow-xl text-white text-center mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-white/10 h-20 w-20 rounded-full -mr-10 -mt-10"></div>
                <p className="text-blue-100 text-sm font-medium tracking-widest mb-2 uppercase">Saldo Actual</p>
                <h2 className="text-7xl font-bold">{user.points || 0}</h2>
                <p className="text-sm mt-2 opacity-80">Puntos acumulados</p>
             </div>
             
             <div className="bg-white p-6 rounded-2xl shadow-sm w-full border border-gray-200">
               <h3 className="font-bold text-gray-800 mb-2">💡 ¿Cómo sumar más?</h3>
               <p className="text-gray-500 text-sm leading-relaxed">
                 Visita nuestra sucursal y escanea el código QR que encontrarás en la caja al momento de pagar.
               </p>
             </div>
           </div>
        )}

        {/* VISTA: PERFIL */}
        {activeTab === 'profile' && (
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-fadeIn">
             <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
               👤 Mis Datos Personales
             </h2>
             
             <div className="space-y-4">
               <div>
                  <label className="text-xs text-gray-400 uppercase font-bold">Nombre</label>
                  <input className="w-full p-3 bg-gray-50 rounded-lg border-none text-gray-700" value={name} onChange={e => setName(e.target.value)} />
               </div>
               <div>
                  <label className="text-xs text-gray-400 uppercase font-bold">Teléfono (No editable)</label>
                  <input className="w-full p-3 bg-gray-100 rounded-lg text-gray-500 cursor-not-allowed" value={user.phone} disabled />
               </div>
               <div>
                  <label className="text-xs text-gray-400 uppercase font-bold">Género</label>
                  <select className="w-full p-3 bg-gray-50 rounded-lg border-none text-gray-700" value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                    <option value="Otro">Otro</option>
                  </select>
               </div>
             </div>

             <div className="mt-8 pt-6 border-t border-gray-100">
               <button onClick={handleUpdate} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                 Guardar Cambios
               </button>
               
               {message && <p className="mt-4 text-center text-green-600 font-medium">{message}</p>}

               <button 
                  onClick={() => { setUser(null); setView('WELCOME'); setPhone(''); setPassword(''); }}
                  className="w-full mt-4 text-red-400 text-sm font-medium hover:text-red-600 py-2"
               >
                  Cerrar Sesión
               </button>
             </div>
           </div>
        )}
      </div>

      {/* Barra de Navegación Inferior (Estilo App Nativa) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('checkin')} 
          className={`flex flex-col items-center p-2 px-6 rounded-xl transition-all ${activeTab === 'checkin' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
        >
          <span className="text-2xl">📍</span>
          <span className="text-xs font-bold mt-1">Puntos</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')} 
          className={`flex flex-col items-center p-2 px-6 rounded-xl transition-all ${activeTab === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
        >
          <span className="text-2xl">👤</span>
          <span className="text-xs font-bold mt-1">Perfil</span>
        </button>
      </div>
    </div>
  );
}
