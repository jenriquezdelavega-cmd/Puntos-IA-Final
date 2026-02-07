'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Cargar Mapa
const AdminMap = dynamic(() => import('../components/AdminMap'), { 
  ssr: false, 
  loading: () => <div className="h-40 bg-gray-100 animate-pulse flex items-center justify-center text-gray-500">Cargando Mapa...</div>
});

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

  // 🛠️ EDIT MODE STATES
  const [editingTenant, setEditingTenant] = useState<any>(null); // El negocio que estamos editando
  const [editPrize, setEditPrize] = useState('');
  const [editIg, setEditIg] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCoords, setEditCoords] = useState<[number, number]>([19.4326, -99.1332]);
  
  const [msg, setMsg] = useState('');

  const handleAuth = (e: React.FormEvent) => { e.preventDefault(); if (masterPass === 'superadmin2026') { setAuth(true); loadTenants(); } else alert('No'); };
  const loadTenants = async () => { try { const res = await fetch('/api/master/list-tenants', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ masterPassword: 'superadmin2026' }) }); const data = await res.json(); if(data.tenants) setTenants(data.tenants); } catch(e) {} };

  const createTenant = async () => {
    setMsg('Creando...');
    try {
      const res = await fetch('/api/master/create-tenant', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ masterPassword: masterPass, name: tName, slug: tSlug }) });
      if (res.ok) { setMsg('✅ Negocio Creado'); setTName(''); setTSlug(''); loadTenants(); } else { const d = await res.json(); setMsg('❌ ' + d.error); }
    } catch (e) { setMsg('Error'); }
  };

  const createUser = async () => {
    if(!selectedTenantId) return alert("Selecciona negocio");
    try {
      const res = await fetch('/api/master/create-user', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ masterPassword: masterPass, tenantId: selectedTenantId, name: uName, phone: uPhone, email: uEmail, username: uUser, password: uPass, role: uRole }) });
      if (res.ok) { setMsg('✅ Usuario Agregado'); setUName(''); setUUser(''); setUPass(''); loadTenants(); } else { const d = await res.json(); setMsg('❌ ' + d.error); }
    } catch (e) { setMsg('Error'); }
  };

  // 🛠️ ABRIR MODAL DE EDICIÓN
  const openEdit = (t: any) => {
    setEditingTenant(t);
    setEditPrize(t.prize || '');
    setEditIg(t.instagram || '');
    setEditAddress(t.address || '');
    if (t.lat && t.lng) setEditCoords([t.lat, t.lng]);
    else setEditCoords([19.4326, -99.1332]); // Default
  };

  // 🔍 BUSCAR DIRECCIÓN EN MODAL
  const searchAddress = async () => {
    if (!editAddress) return;
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(editAddress)}`);
        const data = await res.json();
        if (data && data.length > 0) setEditCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        else alert("No encontrado");
    } catch (e) { alert("Error"); }
  };

  // 💾 GUARDAR CAMBIOS
  const saveEdit = async () => {
    if (!editingTenant) return;
    try {
        const res = await fetch('/api/tenant/settings', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                tenantId: editingTenant.id,
                prize: editPrize,
                instagram: editIg,
                address: editAddress,
                lat: editCoords[0],
                lng: editCoords[1]
            })
        });
        if (res.ok) {
            alert('✅ Configuración Actualizada');
            setEditingTenant(null); // Cerrar modal
            loadTenants(); // Recargar lista
        } else alert('Error al guardar');
    } catch (e) { alert('Error de conexión'); }
  };

  if (!auth) return <div className="min-h-screen bg-black flex justify-center items-center p-4"><form onSubmit={handleAuth} className="bg-gray-900 p-8 rounded-xl border border-red-900 text-center"><h1 className="text-red-500 font-bold mb-4">👑 MASTER</h1><input type="password" className="p-3 rounded bg-gray-800 text-white w-full mb-4" value={masterPass} onChange={e=>setMasterPass(e.target.value)}/><button className="bg-red-600 w-full py-3 rounded font-bold text-white">Entrar</button></form></div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 overflow-y-auto relative">
      <h1 className="text-3xl font-bold text-red-500 mb-8">👑 Panel de Super Admin</h1>
      
      {/* FORMULARIOS DE CREACIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-4">🏭 Nuevo Negocio</h2>
          <input className="w-full p-3 bg-gray-700 rounded mb-2" placeholder="Nombre" value={tName} onChange={e=>setTName(e.target.value)} />
          <input className="w-full p-3 bg-gray-700 rounded mb-4" placeholder="Slug (url)" value={tSlug} onChange={e=>setTSlug(e.target.value)} />
          <button onClick={createTenant} className="w-full bg-blue-600 py-3 rounded font-bold">Crear</button>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-4">👤 Nuevo Empleado</h2>
          <div className="bg-black p-2 rounded mb-2 text-yellow-400 font-mono text-sm">ID: {selectedTenantId || 'Selecciona abajo 👇'}</div>
          <div className="grid grid-cols-2 gap-2">
             <input className="p-2 bg-gray-700 rounded" placeholder="Nombre" value={uName} onChange={e=>setUName(e.target.value)} />
             <input className="p-2 bg-gray-700 rounded" placeholder="Tel" value={uPhone} onChange={e=>setUPhone(e.target.value)} />
             <input className="p-2 bg-gray-700 rounded" placeholder="Email" value={uEmail} onChange={e=>setUEmail(e.target.value)} />
             <select className="p-2 bg-gray-700 rounded" value={uRole} onChange={e=>setURole(e.target.value)}><option value="ADMIN">ADMIN</option><option value="STAFF">STAFF</option></select>
             <input className="p-2 bg-gray-700 rounded" placeholder="User" value={uUser} onChange={e=>setUUser(e.target.value)} />
             <input className="p-2 bg-gray-700 rounded" placeholder="Pass" value={uPass} onChange={e=>setUPass(e.target.value)} />
          </div>
          <button onClick={createUser} disabled={!selectedTenantId} className="w-full bg-green-600 py-3 rounded font-bold mt-4 disabled:opacity-50">Agregar</button>
        </div>
      </div>
      {msg && <div className="p-4 bg-white text-black font-bold rounded mt-4 text-center mb-8">{msg}</div>}
      
      {/* LISTA DE NEGOCIOS */}
      <h2 className="text-2xl font-bold mb-4">🏢 Negocios Activos</h2>
      <div className="grid gap-4">
        {tenants.map(t => (
          <div key={t.id} className={`p-4 rounded-xl border ${selectedTenantId===t.id ? 'bg-gray-700 border-green-500 ring-1 ring-green-500' : 'bg-gray-800 border-gray-600'}`}>
             <div className="flex justify-between items-start">
                <div onClick={() => setSelectedTenantId(t.id)} className="cursor-pointer flex-1">
                    <h3 className="font-bold text-lg text-white">{t.name}</h3>
                    <p className="text-xs text-gray-400">/{t.slug}</p>
                    <div className="mt-2 text-xs text-gray-300">
                        <span className="bg-gray-900 px-2 py-1 rounded mr-2">🏆 {t.prize}</span>
                        {t.instagram && <span className="bg-pink-900 px-2 py-1 rounded text-pink-200 mr-2">📸 {t.instagram}</span>}
                        {t.address && <span className="bg-blue-900 px-2 py-1 rounded text-blue-200">📍 {t.address.substring(0, 20)}...</span>}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        Usuarios: {t.users.map((u:any)=>u.username).join(', ')}
                    </div>
                </div>
                
                {/* BOTÓN EDITAR */}
                <button onClick={() => openEdit(t)} className="bg-yellow-600 text-black font-bold px-3 py-1 rounded hover:bg-yellow-500 text-sm ml-2">
                    ✏️ Editar
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* 🛠️ MODAL DE EDICIÓN */}
      {editingTenant && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-lg border border-gray-600 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Editar: {editingTenant.name}</h2>
                    <button onClick={() => setEditingTenant(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Premio</label>
                        <input className="w-full p-3 bg-gray-700 rounded text-white" value={editPrize} onChange={e=>setEditPrize(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Instagram</label>
                        <input className="w-full p-3 bg-gray-700 rounded text-white" value={editIg} onChange={e=>setEditIg(e.target.value)} placeholder="@usuario" />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Ubicación</label>
                        <div className="flex gap-2 mb-2">
                            <input className="flex-1 p-3 bg-gray-700 rounded text-white text-sm" value={editAddress} onChange={e=>setEditAddress(e.target.value)} placeholder="Dirección..." />
                            <button onClick={searchAddress} className="bg-blue-600 px-3 rounded">🔍</button>
                        </div>
                        <div className="h-48 w-full rounded border border-gray-600 overflow-hidden relative z-0">
                            <AdminMap coords={editCoords} setCoords={setEditCoords} />
                        </div>
                    </div>
                </div>

                <button onClick={saveEdit} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl mt-6 hover:bg-green-500">Guardar Cambios</button>
            </div>
        </div>
      )}

    </div>
  );
}
