'use client';
import { useState, useEffect } from 'react';

export default function MasterPage() {
  const [auth, setAuth] = useState(false);
  const [masterPass, setMasterPass] = useState('');
  const [tenants, setTenants] = useState<any[]>([]);
  
  // Form Create Tenant
  const [tName, setTName] = useState('');
  const [tSlug, setTSlug] = useState('');
  
  // Form Create User
  const [selectedTenant, setSelectedTenant] = useState('');
  const [uName, setUName] = useState('');
  const [uPhone, setUPhone] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uUser, setUUser] = useState('');
  const [uPass, setUPass] = useState('');
  const [uRole, setURole] = useState('ADMIN');

  const [msg, setMsg] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPass === 'superadmin2026') { setAuth(true); loadTenants(); }
    else alert('Clave incorrecta');
  };

  const loadTenants = async () => {
    try {
      const res = await fetch('/api/master/list-tenants', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ masterPassword: 'superadmin2026' }) });
      const data = await res.json();
      if(data.tenants) setTenants(data.tenants);
    } catch(e) {}
  };

  const createTenant = async () => {
    setMsg('Creando Negocio...');
    try {
      const res = await fetch('/api/master/create-tenant', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ masterPassword: masterPass, name: tName, slug: tSlug, username: 'temp', password: 'temp' }) 
      });
      if (res.ok) { setMsg('✅ Negocio Creado'); setTName(''); setTSlug(''); loadTenants(); }
      else setMsg('❌ Error al crear negocio');
    } catch (e) { setMsg('Error'); }
  };

  const createUser = async () => {
    if(!selectedTenant) return alert("Selecciona un negocio abajo");
    setMsg('Creando Usuario...');
    try {
      const res = await fetch('/api/master/create-user', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ masterPassword: masterPass, tenantId: selectedTenant, name: uName, phone: uPhone, email: uEmail, username: uUser, password: uPass, role: uRole }) 
      });
      if (res.ok) { setMsg('✅ Usuario Agregado'); setUName(''); setUUser(''); setUPass(''); loadTenants(); }
      else { const d = await res.json(); setMsg('❌ ' + d.error); }
    } catch (e) { setMsg('Error'); }
  };

  if (!auth) return (
    <div className="min-h-screen bg-black flex justify-center items-center p-4">
      <form onSubmit={handleAuth} className="bg-gray-900 p-8 rounded-xl border border-red-900 text-center">
        <h1 className="text-red-500 font-bold text-2xl mb-4">👑 MASTER</h1>
        <input type="password" className="p-3 rounded bg-gray-800 text-white w-full mb-4" value={masterPass} onChange={e=>setMasterPass(e.target.value)}/>
        <button className="bg-red-600 w-full py-3 rounded font-bold text-white">Entrar</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 overflow-y-auto">
      <h1 className="text-3xl font-bold text-red-500 mb-8">👑 Panel de Super Admin</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CREAR NEGOCIO */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-4">🏭 1. Nuevo Negocio</h2>
          <input className="w-full p-3 bg-gray-700 rounded mb-2" placeholder="Nombre (Pizzería X)" value={tName} onChange={e=>setTName(e.target.value)} />
          <input className="w-full p-3 bg-gray-700 rounded mb-4" placeholder="Slug (pizzeria-x)" value={tSlug} onChange={e=>setTSlug(e.target.value)} />
          <button onClick={createTenant} className="w-full bg-blue-600 py-3 rounded font-bold">Crear Negocio</button>
        </div>

        {/* CREAR USUARIO */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-4">👤 2. Nuevo Empleado</h2>
          <p className="text-xs text-gray-400 mb-2">Selecciona un negocio de la lista de abajo primero.</p>
          <div className="bg-black p-2 rounded mb-2 text-yellow-400 font-mono text-sm">Negocio ID: {selectedTenant || 'Ninguno'}</div>
          
          <div className="grid grid-cols-2 gap-2">
             <input className="p-2 bg-gray-700 rounded" placeholder="Nombre" value={uName} onChange={e=>setUName(e.target.value)} />
             <input className="p-2 bg-gray-700 rounded" placeholder="Teléfono" value={uPhone} onChange={e=>setUPhone(e.target.value)} />
             <input className="p-2 bg-gray-700 rounded" placeholder="Email" value={uEmail} onChange={e=>setUEmail(e.target.value)} />
             <select className="p-2 bg-gray-700 rounded" value={uRole} onChange={e=>setURole(e.target.value)}>
                <option value="ADMIN">ADMIN (Total)</option>
                <option value="STAFF">STAFF (Solo QR/Canje)</option>
             </select>
             <input className="p-2 bg-gray-700 rounded" placeholder="Usuario Login" value={uUser} onChange={e=>setUUser(e.target.value)} />
             <input className="p-2 bg-gray-700 rounded" placeholder="Contraseña" value={uPass} onChange={e=>setUPass(e.target.value)} />
          </div>
          <button onClick={createUser} disabled={!selectedTenant} className="w-full bg-green-600 py-3 rounded font-bold mt-4 disabled:opacity-50">Agregar Usuario</button>
        </div>
      </div>

      {msg && <div className="p-4 bg-white text-black font-bold rounded mt-4 text-center">{msg}</div>}

      {/* LISTA DE NEGOCIOS */}
      <h2 className="text-2xl font-bold mt-10 mb-4">🏢 Negocios Existentes</h2>
      <div className="grid gap-4">
        {tenants.map(t => (
          <div key={t.id} onClick={() => setSelectedTenant(t.id)} className={`p-4 rounded-xl border cursor-pointer hover:bg-gray-700 ${selectedTenant===t.id ? 'bg-gray-700 border-green-500' : 'bg-gray-800 border-gray-600'}`}>
             <div className="flex justify-between">
                <h3 className="font-bold text-lg">{t.name}</h3>
                <span className="text-xs text-gray-400">{t.slug}</span>
             </div>
             <div className="mt-2 text-sm text-gray-400">
                Usuarios: {t.users.map((u:any) => `${u.username} (${u.role})`).join(', ')}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
