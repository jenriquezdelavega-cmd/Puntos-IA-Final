'use client';
import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('checkin');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (isRegister: boolean) => {
    setMessage('');
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
        setUser(data);
        if (data.name) setNewName(data.name);
        if (data.gender) setNewGender(data.gender);
        setMessage('¡Bienvenido!');
      } else {
        setMessage(data.error || 'Error del servidor');
      }
    } catch (e: any) {
      setMessage('Error Auth: ' + e.message);
    }
  };

  const handleUpdate = async () => {
    setMessage('Guardando...');
    if (!user || !user.id) {
        setMessage("Error: No hay sesión (Falta ID)");
        return;
    }

    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: user.id, 
            name: newName, 
            gender: newGender 
        })
      });
      
      // Intentamos leer el texto primero por si no es JSON
      const text = await res.text();
      try {
          const data = JSON.parse(text);
          if (res.ok) {
            setMessage('✅ Guardado correctamente');
            setUser({ ...user, name: newName, gender: newGender });
          } else {
            setMessage('Error Servidor: ' + (data.error || text));
          }
      } catch (jsonError) {
          setMessage('Error grave: El servidor no devolvió JSON. ' + text.slice(0, 50));
      }

    } catch (e: any) {
      setMessage('Error de Red: ' + e.message);
    }
  };

  // VISTA LOGIN
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">Puntos IA 🤖</h1>
          <input className="w-full p-3 border rounded mb-3 text-black" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} />
          <input type="password" className="w-full p-3 border rounded mb-3 text-black" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
          
          <div className="text-xs text-gray-500 mb-2">Para registro nuevo:</div>
          <input className="w-full p-3 border rounded mb-2 text-black" placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)} />
          <select className="w-full p-3 border rounded mb-4 text-black bg-white" value={newGender} onChange={e => setNewGender(e.target.value)}>
             <option value="">Género</option>
             <option value="Hombre">Hombre</option>
             <option value="Mujer">Mujer</option>
             <option value="Otro">Otro</option>
          </select>

          <div className="flex gap-2">
            <button onClick={() => handleAuth(false)} className="flex-1 bg-blue-600 text-white p-3 rounded font-bold">Entrar</button>
            <button onClick={() => handleAuth(true)} className="flex-1 bg-green-600 text-white p-3 rounded font-bold">Registrar</button>
          </div>
          {message && <p className="mt-4 text-center text-red-500 font-bold text-sm">{message}</p>}
        </div>
      </div>
    );
  }

  // VISTA APP
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 p-4 text-white text-center shadow-md">
        <h1 className="text-lg font-bold">Hola, {user.name} 👋</h1>
        <p className="text-blue-100 text-sm">{user.gender}</p>
      </div>

      <div className="flex bg-white shadow-sm">
        <button onClick={() => setActiveTab('checkin')} className={`flex-1 p-4 font-bold ${activeTab === 'checkin' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>📍 Check-in</button>
        <button onClick={() => setActiveTab('profile')} className={`flex-1 p-4 font-bold ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>👤 Mi Perfil</button>
      </div>

      <div className="p-6">
        {activeTab === 'checkin' ? (
           <div className="text-center">
             <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-6">
                <p className="text-gray-400 text-sm mb-2">PUNTOS</p>
                <p className="text-6xl font-bold text-blue-600">{user.points || 0}</p>
             </div>
           </div>
        ) : (
           <div className="bg-white p-6 rounded-xl shadow-md">
             <h2 className="text-xl font-bold mb-4 text-gray-800">Editar</h2>
             <input className="w-full p-3 border rounded mb-4 text-black" value={newName} onChange={e => setNewName(e.target.value)} />
             <select className="w-full p-3 border rounded mb-6 text-black bg-white" value={newGender} onChange={e => setNewGender(e.target.value)}>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Otro">Otro</option>
             </select>
             <button onClick={handleUpdate} className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold">Guardar</button>
             {message && <p className="mt-4 text-center text-blue-600 font-bold">{message}</p>}
             <button onClick={() => setUser(null)} className="w-full mt-6 text-red-500 text-sm underline">Salir</button>
           </div>
        )}
      </div>
    </div>
  );
}
