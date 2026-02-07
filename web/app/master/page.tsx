'use client';
import { useState } from 'react';

export default function MasterPage() {
  const [auth, setAuth] = useState(false);
  const [masterPass, setMasterPass] = useState('');
  const [tenants, setTenants] = useState<any[]>([]);
  
  // Create Tenant
  const [tName, setTName] = useState('');
  const [tSlug, setTSlug] = useState('');
  
  // Create User
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [uName, setUName] = useState('');
  const [uPhone, setUPhone] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uUser, setUUser] = useState('');
  const [uPass, setUPass] = useState('');
  const [uRole, setURole] = useState('ADMIN');

  // EDIT STATES
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const [msg, setMsg] = useState('');

  const handleAuth = (e: React.FormEvent) => { e.preventDefault(); if (masterPass === 'superadmin2026') { setAuth(true); loadTenants(); } else alert('No'); };
  
  const loadTenants = async () => { 
      try { const res = await fetch('/api/master/list-tenants', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ masterPassword: masterPass }) }); const data = await res.json(); if(data.tenants) setTenants(data.tenants); } catch(e) {} 
  };

  const createTenant = async () => {
    setMsg('Creando...');
    try {
      const res = await fetch('/api/master/create-tenant', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ masterPassword: masterPass, name: tName, slug: tSlug }) });
      if (res.ok) { setMsg('✅ Negocio Creado'); setTName(''); setTSlug(''); loadTenants(); } else { const d = await res.json(); setMsg('❌ ' + d.error); }
    } catch (e) { setMsg('Error'); }
  };

  const deleteTenant = async (id: string, name: string) => {
    if(!confirm(`¿BORRAR NEGOCIO "${name}" Y TODOS SUS DATOS?`)) return;
    try {
        await fetch('/api/master/manage-tenant', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ masterPassword: masterPass, action: 'DELETE', tenantId: id }) });
        loadTenants();
    } catch(e) { alert('Error'); }
  };

  // 🔄 UPDATE INCLUYENDO ESTADO
  const updateTenant = async () => {
    if(!editingTenant) return;
    try {
        await fetch('/api/master/manage-tenant', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ masterPassword: masterPass, action: 'UPDATE', tenantId: editingTenant.id, data: editingTenant }) });
        setEditingTenant(null); loadTenants();
    } catch(e) { alert('Error'); }
  };

  const createUser = async () => {
    if(!selectedTenantId) return alert("Selecciona negocio");
    try {
      const res = await fetch('/api/master/create-user', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ masterPassword: masterPass, tenantId: selectedTenantId, name: uName, phone: uPhone, email: uEmail, username: uUser, password: uPass, role: uRole }) });
      if (res.ok) { setMsg('✅ Usuario Agregado'); setUName(''); setUUser(''); setUPass(''); loadTenants(); } else { const d = await res.json(); setMsg('❌ ' + d.error); }
    } catch (e) { setMsg('Error'); }
  };

  const deleteUser = async (id: string) => {
    if(!confirm("¿Borrar empleado?")) return;
    try { await fetch('/api/master/manage-user', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ masterPassword: masterPass, action: 'DELETE', userId: id }) }); loadTenants(); } catch(e) { alert('Error'); }
  };

  const updateUser = async () => {
    if(!editingUser) return;
    try { await fetch('/api/master/manage-user', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ masterPassword: masterPass, action: 'UPDATE', userId: editingUser.id, data: editingUser }) }); setEditingUser(null); loadTenants(); } catch(e) { alert('Error'); }
  };

  if (!auth) return <div className="min-h-screen bg-black flex justify-center items-center p-4"><form onSubmit={handleAuth} className="bg-gray-900 p-8 rounded-xl border border-red-900 text-center"><h1 className="text-red-500 font-bold mb-4">👑 MASTER</h1><input type="password" className="p-3 rounded bg-gray-800 text-white w-full mb-4" value={masterPass} onChange={e=>setMasterPass(e.target.value)}/><button className="bg-red-600 w-full py-3 rounded font-bold text-white">Entrar</button></form></div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 overflow-y-auto">
      <h1 className="text-3xl font-bold text-red-500 mb-8">👑 Gestión Total</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-blue-400">🏭 Nuevo Negocio</h2>
          <input className="w-full p-3 bg-gray-700 rounded mb-2" placeholder="Nombre" value={tName} onChange={e=>setTName(e.target.value)} />
          <input className="w-full p-3 bg-gray-700 rounded mb-4" placeholder="Slug (url)" value={tSlug} onChange={e=>setTSlug(e.target.value)} />
          <button onClick={createTenant} className="w-full bg-blue-600 py-3 rounded font-bold hover:bg-blue-500">Crear</button>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-green-400">👤 Nuevo Empleado</h2>
          <div className="bg-black p-2 rounded mb-2 text-yellow-400 font-mono text-xs">Para Negocio ID: {selectedTenantId || 'Selecciona abajo 👇'}</div>
          <div className="grid grid-cols-2 gap-2">
             <input className="p-2 bg-gray-700 rounded" placeholder="Nombre" value={uName} onChange={e=>setUName(e.target.value)} />
             <input className="p-2 bg-gray-700 rounded" placeholder="Tel" value={uPhone} onChange={e=>setUPhone(e.target.value)} />
             <input className="p-2 bg-gray-700 rounded" placeholder="User" value={uUser} onChange={e=>setUUser(e.target.value)} />
             <input className="p-2 bg-gray-700 rounded" placeholder="Pass" value={uPass} onChange={e=>setUPass(e.target.value)} />
             <select className="p-2 bg-gray-700 rounded col-span-2" value={uRole} onChange={e=>setURole(e.target.value)}><option value="ADMIN">ADMIN</option><option value="STAFF">STAFF</option></select>
          </div>
          <button onClick={createUser} disabled={!selectedTenantId} className="w-full bg-green-600 py-3 rounded font-bold mt-4 disabled:opacity-50 hover:bg-green-500">Agregar</button>
        </div>
      </div>
      
      {msg && <div className="p-4 bg-white text-black font-bold rounded mt-4 text-center mb-8">{msg}</div>}
      
      <h2 className="text-2xl font-bold mb-4">🏢 Directorio de Negocios</h2>
      <div className="space-y-6">
        {tenants.map(t => (
          <div key={t.id} className={`p-6 rounded-xl border transition-all ${selectedTenantId===t.id ? 'bg-gray-800 border-green-500 ring-1 ring-green-500' : 'bg-gray-800 border-gray-700'}`}>
             <div className="flex justify-between items-start mb-4">
                <div onClick={() => setSelectedTenantId(t.id)} className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-2xl text-white">{t.name}</h3>
                        {/* INDICADOR DE ESTADO */}
                        {t.isActive === false && <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">SUSPENDIDO</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">/{t.slug}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setEditingTenant(t)} className="bg-yellow-600 text-black px-3 py-1 rounded font-bold text-sm hover:bg-yellow-500">✏️ Editar</button>
                    <button onClick={() => deleteTenant(t.id, t.name)} className="bg-red-600 text-white px-3 py-1 rounded font-bold text-sm hover:bg-red-500">🗑️</button>
                </div>
             </div>

             <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Empleados ({t.users.length})</h4>
                {t.users.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {t.users.map((u: any) => (
                            <div key={u.id} className="bg-gray-800 p-3 rounded border border-gray-700 flex justify-between items-center group hover:border-gray-500">
                                <div>
                                    <p className="font-bold text-sm text-white">{u.name}</p>
                                    <p className="text-xs text-blue-400 font-mono">{u.username}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setEditingUser(u)} className="text-gray-400 hover:text-white text-xs">✏️</button>
                                    <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-300 text-xs">🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-xs text-gray-600 italic">Sin empleados asignados.</p>}
             </div>
          </div>
        ))}
      </div>

      {/* MODAL EDITAR NEGOCIO */}
      {editingTenant && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-600">
                <h2 className="text-xl font-bold mb-4">Editar Negocio</h2>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Nombre</label>
                        <input className="w-full p-3 bg-gray-700 rounded" value={editingTenant.name} onChange={e=>setEditingTenant({...editingTenant, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Slug</label>
                        <input className="w-full p-3 bg-gray-700 rounded" value={editingTenant.slug} onChange={e=>setEditingTenant({...editingTenant, slug: e.target.value})} />
                    </div>
                    
                    {/* 🆕 SWITCH DE ESTADO */}
                    <div className="flex items-center gap-3 bg-gray-700 p-3 rounded">
                        <label className="text-sm font-bold">Estado del Negocio:</label>
                        <button 
                            onClick={() => setEditingTenant({...editingTenant, isActive: !editingTenant.isActive})}
                            className={`px-4 py-1 rounded font-bold text-xs ${editingTenant.isActive !== false ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                        >
                            {editingTenant.isActive !== false ? 'ACTIVO ✅' : 'SUSPENDIDO ⛔'}
                        </button>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setEditingTenant(null)} className="px-4 py-2 text-gray-400">Cancelar</button>
                    <button onClick={updateTenant} className="bg-green-600 px-4 py-2 rounded font-bold">Guardar</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL EDITAR USUARIO */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-600">
                <h2 className="text-xl font-bold mb-4">Editar Empleado</h2>
                <div className="space-y-3">
                    <input className="w-full p-3 bg-gray-700 rounded" value={editingUser.name} onChange={e=>setEditingUser({...editingUser, name: e.target.value})} />
                    <input className="w-full p-3 bg-gray-700 rounded" value={editingUser.username} onChange={e=>setEditingUser({...editingUser, username: e.target.value})} />
                    <input className="w-full p-3 bg-gray-700 rounded" value={editingUser.password} onChange={e=>setEditingUser({...editingUser, password: e.target.value})} />
                    <select className="w-full p-3 bg-gray-700 rounded" value={editingUser.role} onChange={e=>setEditingUser({...editingUser, role: e.target.value})}><option value="ADMIN">ADMIN</option><option value="STAFF">STAFF</option></select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-400">Cancelar</button>
                    <button onClick={updateUser} className="bg-green-600 px-4 py-2 rounded font-bold">Guardar</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
