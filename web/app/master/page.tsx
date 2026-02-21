'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const AdminMap = dynamic(() => import('../components/AdminMap'), { ssr: false, loading: () => <div className="h-40 bg-gray-100 animate-pulse flex items-center justify-center text-gray-500">Cargando...</div> });

export default function MasterPage() {
  const [auth, setAuth] = useState(false);
  const [masterPass, setMasterPass] = useState('');
  const [tenants, setTenants] = useState<any[]>([]);
  
  const [tName, setTName] = useState('');
  const [tSlug, setTSlug] = useState('');
  
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedTenantPrefix, setSelectedTenantPrefix] = useState(''); // 🆕 Para mostrar prefijo
  
  const [uName, setUName] = useState('');
  const [uPhone, setUPhone] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uUser, setUUser] = useState('');
  const [uPass, setUPass] = useState('');
  const [uRole, setURole] = useState('ADMIN');

  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
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
      if (res.ok) { 
          const data = await res.json();
          setMsg(`✅ Negocio Creado. PREFIJO: ${data.tenant.codePrefix}`); 
          setTName(''); setTSlug(''); loadTenants(); 
      } else { const d = await res.json(); setMsg('❌ ' + d.error); }
    } catch (e) { setMsg('Error'); }
  };

  const deleteTenant = async (id: string, name: string) => { if(!confirm(`¿BORRAR ${name}?`)) return; try { await fetch('/api/master/manage-tenant', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ masterPassword: masterPass, action: 'DELETE', tenantId: id }) }); loadTenants(); } catch(e) { alert('Error'); } };
  const updateTenant = async () => { if(!editingTenant) return; try { await fetch('/api/master/manage-tenant', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ masterPassword: masterPass, action: 'UPDATE', tenantId: editingTenant.id, data: { ...editingTenant, prize: editPrize, instagram: editIg, address: editAddress, lat: editCoords[0], lng: editCoords[1] } }) }); setEditingTenant(null); loadTenants(); } catch(e) { alert('Error'); } };

  const createUser = async () => {
    if(!selectedTenantId) return alert("Selecciona negocio");
    try {
      const res = await fetch('/api/master/create-user', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ masterPassword: masterPass, tenantId: selectedTenantId, name: uName, phone: uPhone, email: uEmail, username: uUser, password: uPass, role: uRole }) });
      if (res.ok) { setMsg('✅ Usuario Agregado'); setUName(''); setUUser(''); setUPass(''); loadTenants(); } else { const d = await res.json(); setMsg('❌ ' + d.error); }
    } catch (e) { setMsg('Error'); }
  };

  const deleteUser = async (id: string) => { if(!confirm("¿Borrar?")) return; try { await fetch('/api/master/manage-user', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ masterPassword: masterPass, action: 'DELETE', userId: id }) }); loadTenants(); } catch(e) { alert('Error'); } };
  const updateUser = async () => { if(!editingUser) return; try { await fetch('/api/master/manage-user', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ masterPassword: masterPass, action: 'UPDATE', userId: editingUser.id, data: editingUser }) }); setEditingUser(null); loadTenants(); } catch(e) { alert('Error'); } };
  
  const openEdit = (t: any) => { setEditingTenant(t); setEditPrize(t.prize||''); setEditIg(t.instagram||''); setEditAddress(t.address||''); if(t.lat) setEditCoords([t.lat,t.lng]); };
  const searchAddress = async () => { if (!editAddress) return; try { const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(editAddress)}`); const data = await res.json(); if (data && data.length > 0) setEditCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]); else alert("No encontrado"); } catch (e) { alert("Error"); } };

  const downloadReport = async (report: 'prelaunch' | 'tenant-users', onlySelectedTenant = false) => {
    try {
      const res = await fetch('/api/master/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterPassword: masterPass, report, tenantId: onlySelectedTenant ? (selectedTenantId || undefined) : undefined }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d?.error || 'No se pudo generar el reporte');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const cd = res.headers.get('content-disposition') || '';
      const m = cd.match(/filename="?([^";]+)"?/i);
      a.href = url;
      a.download = m?.[1] || (report === 'prelaunch' ? 'preinscritos-negocios.csv' : 'clientes-por-negocio.csv');
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error de red al descargar reporte');
    }
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
          <button onClick={createTenant} className="w-full bg-blue-600 py-3 rounded font-bold hover:bg-blue-500">Crear (Genera Prefijo)</button>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-green-400">👤 Nuevo Empleado</h2>
          <div className="bg-black p-2 rounded mb-2 text-yellow-400 font-mono text-xs">Negocio: {selectedTenantPrefix || 'Selecciona 👇'}</div>
          <div className="grid grid-cols-2 gap-2">
             <input className="p-2 bg-gray-700 rounded" placeholder="Nombre" value={uName} onChange={e=>setUName(e.target.value)} />
             <input className="p-2 bg-gray-700 rounded" placeholder="Tel" value={uPhone} onChange={e=>setUPhone(e.target.value)} />
             <div className="flex items-center bg-gray-700 rounded col-span-2 px-2">
                <span className="text-gray-400 text-sm mr-1">{selectedTenantPrefix}.</span>
                <input className="bg-transparent w-full p-2 outline-none" placeholder="Usuario" value={uUser} onChange={e=>setUUser(e.target.value)} />
             </div>
             <input className="p-2 bg-gray-700 rounded" placeholder="Pass" value={uPass} onChange={e=>setUPass(e.target.value)} />
             <select className="p-2 bg-gray-700 rounded" value={uRole} onChange={e=>setURole(e.target.value)}><option value="ADMIN">ADMIN</option><option value="STAFF">STAFF</option></select>
          </div>
          <button onClick={createUser} disabled={!selectedTenantId} className="w-full bg-green-600 py-3 rounded font-bold mt-4 disabled:opacity-50 hover:bg-green-500">Agregar</button>
        </div>
      </div>
      {msg && <div className="p-4 bg-white text-black font-bold rounded mt-4 text-center mb-8">{msg}</div>}

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6">
        <h2 className="text-lg font-bold mb-3">📥 Reportes Master</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button onClick={() => downloadReport('prelaunch')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded">Descargar preinscritos (CSV)</button>
          <button onClick={() => downloadReport('tenant-users')} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded">Clientes de todos los negocios</button>
          <button onClick={() => downloadReport('tenant-users', true)} disabled={!selectedTenantId} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-3 rounded">Clientes del negocio seleccionado</button>
        </div>
        <p className="text-xs text-gray-400 mt-3">Tip: selecciona un negocio en el directorio para exportar solo sus clientes.</p>
      </div>
<<<<<<< HEAD
=======

>>>>>>> origin/codex/review-my-code
      <h2 className="text-2xl font-bold mb-4">🏢 Directorio</h2>
      <div className="space-y-6">
        {tenants.map(t => (
          <div key={t.id} className={`p-6 rounded-xl border transition-all ${selectedTenantId===t.id ? 'bg-gray-800 border-green-500 ring-1 ring-green-500' : 'bg-gray-800 border-gray-700'}`}>
             <div className="flex justify-between items-start mb-4">
                <div onClick={() => { setSelectedTenantId(t.id); setSelectedTenantPrefix(t.codePrefix || '???'); }} className="cursor-pointer flex-1">
                    <h3 className="font-bold text-2xl text-white flex items-center gap-2">{t.name} <span className="text-xs font-mono bg-yellow-900 text-yellow-200 px-2 rounded border border-yellow-700">CODE: {t.codePrefix}</span></h3>
                    <p className="text-sm text-gray-400 mt-1">/{t.slug} {t.isActive===false && '⛔ SUSPENDIDO'}</p>
                </div>
                <div className="flex gap-2"><button onClick={() => openEdit(t)} className="bg-yellow-600 text-black px-3 py-1 rounded font-bold text-sm hover:bg-yellow-500">✏️ Editar</button><button onClick={() => deleteTenant(t.id, t.name)} className="bg-red-600 text-white px-3 py-1 rounded font-bold text-sm hover:bg-red-500">🗑️</button></div>
             </div>
             <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Empleados</h4>
                {t.users.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{t.users.map((u: any) => (<div key={u.id} className="bg-gray-800 p-3 rounded border border-gray-700 flex justify-between items-center group hover:border-gray-500"><div><p className="font-bold text-sm text-white">{u.name}</p><p className="text-xs text-blue-400 font-mono">{u.username}</p><span className={`text-[10px] px-1 rounded ${u.role==='ADMIN'?'bg-purple-900 text-purple-200':'bg-blue-900 text-blue-200'}`}>{u.role}</span></div><div className="flex gap-1"><button onClick={() => setEditingUser(u)} className="text-gray-400 hover:text-white text-xs">✏️</button><button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-300 text-xs">🗑️</button></div></div>))}</div>) : <p className="text-xs text-gray-600 italic">Sin empleados.</p>}
             </div>
          </div>
        ))}
      </div>
      {editingTenant && (<div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4"><div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-600"><h2 className="text-xl font-bold mb-4">Editar Negocio</h2><div className="space-y-3"><input className="w-full p-3 bg-gray-700 rounded" value={editingTenant.name} onChange={e=>setEditingTenant({...editingTenant, name: e.target.value})} /><input className="w-full p-3 bg-gray-700 rounded" value={editingTenant.slug} onChange={e=>setEditingTenant({...editingTenant, slug: e.target.value})} /><div className="flex items-center gap-3 bg-gray-700 p-3 rounded"><label className="text-sm font-bold">Estado:</label><button onClick={() => setEditingTenant({...editingTenant, isActive: !editingTenant.isActive})} className={`px-4 py-1 rounded font-bold text-xs ${editingTenant.isActive !== false ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{editingTenant.isActive !== false ? 'ACTIVO ✅' : 'SUSPENDIDO ⛔'}</button></div><div className="bg-black p-3 rounded border border-yellow-700 text-yellow-500 font-mono text-center text-xl tracking-widest">{editingTenant.codePrefix}</div><p className="text-xs text-gray-500 text-center">El prefijo no se puede cambiar.</p></div><div className="flex justify-end gap-2 mt-4"><button onClick={() => setEditingTenant(null)} className="px-4 py-2 text-gray-400">Cancelar</button><button onClick={updateTenant} className="bg-green-600 px-4 py-2 rounded font-bold">Guardar</button></div></div></div>)}
      {editingUser && (<div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4"><div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-600"><h2 className="text-xl font-bold mb-4">Editar Empleado</h2><div className="space-y-3"><input className="w-full p-3 bg-gray-700 rounded" value={editingUser.name} onChange={e=>setEditingUser({...editingUser, name: e.target.value})} /><input className="w-full p-3 bg-gray-700 rounded font-mono text-yellow-300" value={editingUser.username} onChange={e=>setEditingUser({...editingUser, username: e.target.value})} /><input className="w-full p-3 bg-gray-700 rounded" value={editingUser.password} onChange={e=>setEditingUser({...editingUser, password: e.target.value})} /><select className="w-full p-3 bg-gray-700 rounded" value={editingUser.role} onChange={e=>setEditingUser({...editingUser, role: e.target.value})}><option value="ADMIN">ADMIN</option><option value="STAFF">STAFF</option></select></div><div className="flex justify-end gap-2 mt-4"><button onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-400">Cancelar</button><button onClick={updateUser} className="bg-green-600 px-4 py-2 rounded font-bold">Guardar</button></div></div></div>)}
    </div>
  );
}
