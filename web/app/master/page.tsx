'use client';
import { useState } from 'react';

export default function MasterPage() {
  const [auth, setAuth] = useState(false);
  const [masterPass, setMasterPass] = useState('');
  
  // Formulario Nuevo Negocio
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPass === 'superadmin2026') setAuth(true);
    else alert('Contraseña Maestra Incorrecta');
  };

  const createTenant = async () => {
    setMsg('Creando...');
    try {
      const res = await fetch('/api/master/create-tenant', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ masterPassword: masterPass, name, slug, username: user, password: pass })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`✅ Negocio "${data.tenant.name}" creado con éxito.`);
        setName(''); setSlug(''); setUser(''); setPass('');
      } else {
        setMsg('❌ ' + data.error);
      }
    } catch (e) { setMsg('Error de conexión'); }
  };

  if (!auth) return (
    <div className="min-h-screen bg-black flex justify-center items-center p-4">
      <form onSubmit={handleAuth} className="bg-gray-900 p-8 rounded-xl border border-red-900 text-center">
        <h1 className="text-red-500 font-bold text-2xl mb-4">👑 ZONA MAESTRA</h1>
        <input type="password" placeholder="Clave Maestra" className="p-3 rounded bg-gray-800 text-white w-full mb-4" value={masterPass} onChange={e=>setMasterPass(e.target.value)}/>
        <button className="bg-red-600 w-full py-3 rounded font-bold text-white">Acceder</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold text-red-500 mb-8">👑 Panel de Super Admin</h1>
      
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-lg">
        <h2 className="text-xl font-bold mb-4">🏭 Alta de Nuevo Negocio</h2>
        <div className="space-y-4">
          <input className="w-full p-3 bg-gray-700 rounded text-white" placeholder="Nombre (ej: Pizzería Luigi)" value={name} onChange={e=>setName(e.target.value)} />
          <input className="w-full p-3 bg-gray-700 rounded text-white" placeholder="Slug URL (ej: pizzeria-luigi)" value={slug} onChange={e=>setSlug(e.target.value)} />
          <div className="flex gap-2">
            <input className="w-full p-3 bg-gray-700 rounded text-white" placeholder="Usuario Dueño" value={user} onChange={e=>setUser(e.target.value)} />
            <input className="w-full p-3 bg-gray-700 rounded text-white" placeholder="Contraseña Dueño" value={pass} onChange={e=>setPass(e.target.value)} />
          </div>
          <button onClick={createTenant} className="w-full bg-green-600 py-3 rounded font-bold hover:bg-green-500">Crear Negocio</button>
          {msg && <p className="text-center font-mono mt-4">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
