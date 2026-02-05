'use client';
import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('checkin');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Estado del Usuario (incluyendo ID y Gender)
  const [user, setUser] = useState<any>(null);
  
  // Estado para formularios
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState('');
  const [message, setMessage] = useState('');

  // 1. LOGIN / REGISTRO
  const handleAuth = async (isRegister: boolean) => {
    const endpoint = isRegister ? '/api/user/register' : '/api/user/login';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            phone, 
            password, 
            name: isRegister ? newName : undefined,
            gender: isRegister ? newGender : undefined 
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setUser(data); // 👈 ¡Aquí guardamos el ID que nos devuelve el server!
        if (data.name) setNewName(data.name);
        if (data.gender) setNewGender(data.gender);
        setMessage('¡Bienvenido!');
      } else {
        setMessage(data.error || 'Error');
      }
    } catch (e) {
      setMessage('Error de conexión');
    }
  };

  // 2. ACTUALIZAR PERFIL
  const handleUpdate = async () => {
    if (!user || !user.id) {
        setMessage("Error: No hay sesión activa (Falta ID)");
        return;
    }

    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: user.id, // 👈 ENVIAMOS EL ID CLAVE
            name: newName, 
            phone: phone, // Mantenemos el mismo teléfono
            gender: newGender 
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Datos actualizados correctamente');
        // Actualizamos el usuario local
        setUser({ ...user, name: newName, gender: newGender });
      } else {
        setMessage(data.error || 'Error al actualizar');
      }
    } catch (e) {
      setMessage('Error de conexión');
    }
  };

  // --- VISTA: LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">Puntos IA 🤖</h1>
          
          <input 
            className="w-full p-3 border rounded mb-3 text-black" 
            placeholder="Teléfono (ID)" 
            value={phone} onChange={e => setPhone(e.target.value)}
          />
          <input 
            type="password"
            className="w-full p-3 border rounded mb-3 text-black" 
            placeholder="Contraseña" 
            value={password} onChange={e => setPassword(e.target.value)}
          />
          
          {/* Campos extra solo si queremos registrarnos (visual simplificado) */}
          <div className="text-xs text-gray-500 mb-2">Si eres nuevo, llena también estos:</div>
          <input 
            className="w-full p-3 border rounded mb-2 text-black" 
            placeholder="Tu Nombre" 
            value={newName} onChange={e => setNewName(e.target.value)}
          />
          <select 
             className="w-full p-3 border rounded mb-4 text-black bg-white"
             value={newGender}
             onChange={e => setNewGender(e.target.value)}
          >
             <option value="">Selecciona Género</option>
             <option value="Hombre">Hombre</option>
             <option value="Mujer">Mujer</option>
             <option value="Otro">Otro</option>
          </select>

          <div className="flex gap-2">
            <button onClick={() => handleAuth(false)} className="flex-1 bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">Entrar</button>
            <button onClick={() => handleAuth(true)} className="flex-1 bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">Registrarme</button>
          </div>
          
          {message && <p className="mt-4 text-center text-red-500 font-medium">{message}</p>}
        </div>
      </div>
    );
  }

  // --- VISTA: APP PRINCIPAL ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-600 p-4 text-white text-center shadow-md">
        <h1 className="text-lg font-bold">Hola, {user.name} 👋</h1>
        <p className="text-blue-100 text-sm">{user.gender !== 'No especificado' ? user.gender : ''}</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white shadow-sm">
        <button 
            onClick={() => setActiveTab('checkin')} 
            className={`flex-1 p-4 font-bold ${activeTab === 'checkin' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
        >
            📍 Check-in
        </button>
        <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex-1 p-4 font-bold ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
        >
            👤 Mi Perfil
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="p-6">
        {activeTab === 'checkin' ? (
           <div className="text-center">
             <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-6">
                <p className="text-gray-400 text-sm mb-2">TUS PUNTOS</p>
                <p className="text-6xl font-bold text-blue-600">{user.points || 0}</p>
             </div>
             <p className="text-gray-500">Escanea el código QR en caja para sumar puntos.</p>
           </div>
        ) : (
           <div className="bg-white p-6 rounded-xl shadow-md">
             <h2 className="text-xl font-bold mb-4 text-gray-800">Editar mis datos</h2>
             
             <label className="block text-sm text-gray-500 mb-1">Nombre</label>
             <input 
                className="w-full p-3 border rounded mb-4 text-black" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
             />

             <label className="block text-sm text-gray-500 mb-1">Género</label>
             <select 
                className="w-full p-3 border rounded mb-6 text-black bg-white"
                value={newGender}
                onChange={e => setNewGender(e.target.value)}
             >
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Otro">Otro</option>
             </select>

             <button 
                onClick={handleUpdate}
                className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
             >
                Guardar Cambios 💾
             </button>

             {message && <p className="mt-4 text-center text-green-600 font-medium">{message}</p>}
             
             <button 
                onClick={() => setUser(null)}
                className="w-full mt-6 text-red-500 text-sm underline"
             >
                Cerrar Sesión
             </button>
           </div>
        )}
      </div>
    </div>
  );
}
