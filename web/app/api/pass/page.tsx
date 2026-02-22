diff --git a/web/app/page.tsx b/web/app/page.tsx
index 1bbc42577131747e64c869ab878e5c3c6590ed83..835328e29164e2d5b1144c7308fb5f6027334486 100644
--- a/web/app/page.tsx
+++ b/web/app/page.tsx
@@ -467,58 +467,59 @@ export default function Home() {
     if (!confirm(`¿Canjear premio en ${tenantName}?`)) return;
     try {
       const res = await fetch('/api/redeem/request', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ userId: user.id, tenantId }),
       });
       const data = await res.json();
       if (res.ok) setPrizeCode({ code: data.code, tenant: tenantName });
       else alert(data.error);
     } catch {
       alert('Error');
     }
   };

   const goToBusinessMap = (tName: string) => {
     const target = tenants.find((t) => t.name === tName);
     if (target && target.lat && target.lng) {
       setMapFocus([target.lat, target.lng]);
       setActiveTab('map');
     } else {
       alert('Ubicación no disponible.');
     }
   };

-  const openPass = (tenantName?: string) => {
+  const openPass = (tenantName?: string, tenantId?: string) => {
     if (!user?.id) {
       alert('Primero inicia sesión para ver tu pase.');
       return;
     }

     const label = tenantName ? `&from=${encodeURIComponent(tenantName)}` : '';
-    window.open(`/pass?customer_id=${encodeURIComponent(user.id)}${label}`, '_blank', 'noopener,noreferrer');
+    const businessParam = tenantId ? `&business_id=${encodeURIComponent(tenantId)}` : '';
+    window.open(`/pass?customer_id=${encodeURIComponent(user.id)}${label}${businessParam}`, '_blank', 'noopener,noreferrer');
   };

   const handleLogout = () => {
     if (confirm('¿Salir?')) {
       setUser(null);
       setView('WELCOME');
       setPhone('');
       setPassword('');
       setMessage('');
     }
   };

   const toggleCard = (id: string) => {
     setExpandedId(expandedId === id ? null : id);
   };

   return prelaunchMode && !showClientPortal ? (
     <main className={`min-h-screen ${glow} text-white relative overflow-hidden`}>
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.22),transparent_36%),radial-gradient(circle_at_82%_8%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_88%_88%,rgba(255,255,255,0.12),transparent_40%)]" />

       <section className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
         <div className="flex flex-col items-center text-center">
           <BrandLogo />
           <p className="mt-4 inline-block rounded-full border border-white/35 bg-white/10 px-4 py-1 text-xs font-black tracking-widest uppercase">
             PRE-LANZAMIENTO
@@ -1167,51 +1168,51 @@ export default function Home() {
                           </motion.button>
                         )}

                         <motion.div
                           layout
                           className={`grid grid-cols-3 gap-3 mt-4 overflow-hidden ${
                             isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                           } transition-all duration-500`}
                         >
                           <motion.button
                             whileTap={canAnim ? { scale: 0.98 } : undefined}
                             onClick={(e) => {
                               e.stopPropagation();
                               goToBusinessMap(m.name);
                             }}
                             className="bg-white border-2 border-blue-50 text-blue-700 py-4 rounded-2xl font-black text-xs flex flex-col items-center hover:bg-blue-50 transition-colors shadow-sm"
                           >
                             <span className="text-2xl mb-1">🧭</span>
                             Ver Mapa
                           </motion.button>

                           <motion.button
                             whileTap={canAnim ? { scale: 0.98 } : undefined}
                             onClick={(e) => {
                               e.stopPropagation();
-                              openPass(m.name);
+                              openPass(m.name, m.tenantId);
                             }}
                             className="bg-white border-2 border-orange-50 text-orange-700 py-4 rounded-2xl font-black text-xs flex flex-col items-center hover:bg-orange-50 transition-colors shadow-sm"
                           >
                             <span className="text-2xl mb-1">🎟️</span>
                             Mi Pase
                           </motion.button>

                           {m.instagram ? (
                             <a
                               href={`https://instagram.com/${m.instagram.replace('@', '')}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               onClick={(e) => e.stopPropagation()}
                               className="bg-white border-2 border-pink-50 text-pink-700 py-4 rounded-2xl font-black text-xs flex flex-col items-center hover:bg-pink-50 transition-colors no-underline shadow-sm"
                             >
                               <span className="text-2xl mb-1">📲</span>
                               Instagram
                             </a>
                           ) : (
                             <div className="bg-gray-50 border-2 border-gray-100 text-gray-300 py-4 rounded-2xl font-black text-xs flex flex-col items-center opacity-70">
                               <span className="text-2xl mb-1">◎</span>
                               No IG
                             </div>
                           )}
                         </motion.div>
