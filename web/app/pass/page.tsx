'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';

const PASS_CACHE_PREFIX = 'punto_pass_cache:';
const PASS_CACHE_TTL_MS = 60_000;

type MilestoneData = { id: string; visitTarget: number; reward: string; emoji: string; redeemed: boolean };

type PassResponse = {
  customer_id: string;
  name: string;
  branding: { app: string; theme: string };
  qr: { token: string; value: string };
  business: {
    id: string;
    name: string;
    currentVisits: number;
    requiredVisits: number;
    milestones: MilestoneData[];
  } | null;
};

function extractPassQuery() {
  if (typeof window === 'undefined') return { customerId: '', businessId: '', from: '' };
  const url = new URL(window.location.href);
  return {
    customerId: url.searchParams.get('customer_id') || '',
    businessId: url.searchParams.get('business_id') || '',
    from: url.searchParams.get('from') || '',
  };
}


function passCacheKey(customerId: string, businessId?: string) {
  return `${PASS_CACHE_PREFIX}${customerId}:${businessId || '__none__'}`;
}

function readPassCache(customerId: string, businessId?: string): PassResponse | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(passCacheKey(customerId, businessId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts?: number; data?: PassResponse };
    if (!parsed?.ts || !parsed?.data) return null;
    if (Date.now() - parsed.ts > PASS_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writePassCache(customerId: string, businessId: string | undefined, data: PassResponse) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(passCacheKey(customerId, businessId), JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // ignoramos problemas de storage para no bloquear el flujo principal
  }
}

export default function PassPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pass, setPass] = useState<PassResponse | null>(null);
  const [sourceBusinessName, setSourceBusinessName] = useState('');
  // milestoneCode: maps milestoneId -> { code, loading }
  const [milestoneCodes, setMilestoneCodes] = useState<Record<string, { code: string; loading: boolean }>>({});

  const requestMilestoneCode = async (milestone: MilestoneData) => {
    if (!pass) return;
    const sessionToken = typeof window !== 'undefined' ? (localStorage.getItem('punto_session_token') || '') : '';
    const userId = pass.customer_id;
    const tenantId = pass.business?.id;
    if (!tenantId) return;

    // If we already have a code for this milestone, toggle hide it
    if (milestoneCodes[milestone.id]?.code) {
      setMilestoneCodes(prev => ({ ...prev, [milestone.id]: { code: '', loading: false } }));
      return;
    }

    setMilestoneCodes(prev => ({ ...prev, [milestone.id]: { code: '', loading: true } }));
    try {
      const res = await fetch('/api/redeem/milestone-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tenantId, sessionToken, milestoneId: milestone.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'No se pudo generar el código');
        setMilestoneCodes(prev => ({ ...prev, [milestone.id]: { code: '', loading: false } }));
      } else {
        setMilestoneCodes(prev => ({ ...prev, [milestone.id]: { code: String(data.code), loading: false } }));
      }
    } catch {
      setMilestoneCodes(prev => ({ ...prev, [milestone.id]: { code: '', loading: false } }));
    }
  };


  const loadPass = async (customerId: string, businessId?: string, silent = false) => {
    const cleanCustomerId = String(customerId || '').trim();
    const cleanBusinessId = String(businessId || '').trim();

    if (!cleanCustomerId) {
      setPass(null);
      setError('No se pudo identificar tu sesión. Inicia sesión nuevamente.');
      return;
    }

    if (!silent) setLoading(true);
    setError('');

    try {
      const query = cleanBusinessId ? `?businessId=${encodeURIComponent(cleanBusinessId)}` : '';
      const res = await fetch(`/api/pass/${encodeURIComponent(cleanCustomerId)}${query}`);
      const data = (await res.json()) as PassResponse | { error?: string };
      if (!res.ok) {
        setPass(null);
        setError((data as { error?: string }).error || 'No se pudo cargar el pase');
        return;
      }
      const passData = data as PassResponse;
      setPass(passData);
      writePassCache(cleanCustomerId, cleanBusinessId || undefined, passData);
    } catch {
      setPass(null);
      setError('No se pudo cargar el pase');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const query = extractPassQuery();
    setSourceBusinessName(query.from);

    if (query.customerId) {
      const cacheKeyBusiness = query.businessId || undefined;
      const cached = readPassCache(query.customerId, cacheKeyBusiness);
      if (cached) {
        setPass(cached);
        void loadPass(query.customerId, cacheKeyBusiness, true);
      } else {
        void loadPass(query.customerId, cacheKeyBusiness);
      }
      return;
    }

    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('punto_user') : null;
    if (!storedUser) {
      setError('Inicia sesión y abre tu pase desde el negocio para cargarlo automáticamente.');
      return;
    }

    try {
      const parsed = JSON.parse(storedUser) as { id?: string };
      if (!parsed?.id) {
        setError('No se pudo leer tu sesión. Inicia sesión de nuevo.');
        return;
      }
      void loadPass(parsed.id, query.businessId || undefined);
    } catch {
      setError('No se pudo leer tu sesión. Inicia sesión de nuevo.');
    }
  }, []);

  const downloadQrSvg = () => {
    const svg = document.querySelector('#punto-pass-qr svg');
    if (!svg || !pass) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pase-${pass.customer_id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openGoogleWallet = async () => {
    if (!pass?.customer_id || !pass.business?.id) return;

    const href = `/api/wallet/google?customerId=${encodeURIComponent(pass.customer_id)}&businessId=${encodeURIComponent(pass.business.id)}`;

    try {
      const res = await fetch(href, { cache: 'no-store' });
      const data = (await res.json()) as { saveUrl?: string; error?: string };

      if (!res.ok || !data?.saveUrl) {
        throw new Error(data?.error || 'No se pudo generar el pase de Google Wallet');
      }

      window.location.assign(data.saveUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo generar el pase de Google Wallet';
      setError(message);
    }
  };

  const openAppleWallet = async () => {
    if (!pass?.customer_id || !pass.business?.id) return;

    const businessParam = `&businessId=${encodeURIComponent(pass.business.id)}&businessName=${encodeURIComponent(pass.business.name)}`;
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
    const safariParam = isIos && isSafari ? '&safari=1' : '';
    const href = `/api/wallet/apple?customerId=${encodeURIComponent(pass.customer_id)}${businessParam}${safariParam}`;

    // En iOS Safari conviene abrir directo la URL del .pkpass para que Wallet lo maneje.
    if (isIos && isSafari) {
      window.location.assign(href);
      return;
    }

    try {
      const res = await fetch(href, { cache: 'no-store' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'No se pudo generar el pase para Wallet');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'puntoia.pkpass';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.location.assign(href);
    }
  };
  const goToPoints = () => {
    if (typeof window === 'undefined') return;
    if (pass?.customer_id) {
      window.location.assign('/clientes/app');
      return;
    }
    window.location.assign('/ingresar?tipo=cliente&modo=login');
  };


  return (
    <main className="min-h-screen bg-gradient-to-br from-[#ff7a59] via-[#ff3f8e] to-[#f90086] p-6 text-white flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-white/35 bg-white/15 backdrop-blur-md p-6 shadow-2xl">
        <p className="text-xs font-black tracking-[0.2em] uppercase text-white/80">Pase de Lealtad</p>
        <h1 className="text-3xl font-black mt-2">Punto IA</h1>
        <p className="mt-2 text-sm text-white/90">
          Muestra este QR en caja para registrar visitas y acumular puntos en el negocio actual.
        </p>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-3 bg-white/20 px-3 py-2 rounded-xl border border-white/20 flex items-center gap-2">
          <span className="text-xl">☀️</span>
          <span className="text-xs font-bold text-white">Sube el brillo de tu pantalla para facilitar el escaneo</span>
        </motion.div>

        {sourceBusinessName ? (
          <p className="mt-3 text-xs font-bold text-white/90">Negocio seleccionado: {sourceBusinessName}</p>
        ) : null}

        {loading ? <p className="mt-3 text-sm font-bold text-white">Cargando pase...</p> : null}
        {error ? <p className="mt-3 text-sm font-bold text-yellow-100">{error}</p> : null}

        {pass ? (
          <div className="mt-5 rounded-2xl bg-white p-5 text-gray-900 shadow-xl">
            <p className="text-xs uppercase tracking-[0.15em] font-black text-pink-600">Cliente</p>
            <p className="text-xl font-black mt-1">{pass.name}</p>

            {pass.business ? (
              <>
                <p className="text-xs font-bold text-emerald-700 mt-1">
                  {pass.business.name} · {pass.business.currentVisits}/{pass.business.requiredVisits} visitas
                </p>
                {pass.business.milestones && pass.business.milestones.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-pink-500 mb-2">Escalera de beneficios</p>
                    <div className="flex flex-col gap-2">
                      {pass.business.milestones.map((m) => {
                        const unlocked = (pass.business?.currentVisits ?? 0) >= m.visitTarget;
                        const redeemed = m.redeemed;
                        const codeEntry = milestoneCodes[m.id];
                        const showCode = Boolean(codeEntry?.code);
                        const codeLoading = Boolean(codeEntry?.loading);

                        return (
                          <div key={m.id} className={`rounded-xl border transition-all ${
                            redeemed ? 'bg-gray-50 border-gray-100 opacity-60' :
                            unlocked ? 'bg-emerald-50 border-emerald-200' :
                            'bg-gray-50 border-gray-100 opacity-50'
                          }`}>
                            <div className="flex items-center gap-2.5 px-3 py-2">
                              <span className="text-base shrink-0">{redeemed ? '✅' : unlocked ? m.emoji : '🔒'}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold text-xs truncate ${redeemed ? 'text-gray-400 line-through' : unlocked ? 'text-emerald-800' : 'text-gray-500'}`}>{m.reward}</p>
                                <p className={`text-[10px] font-semibold ${redeemed ? 'text-gray-400' : unlocked ? 'text-emerald-600' : 'text-gray-400'}`}>
                                  {redeemed ? '¡Ya canjeado!' : unlocked ? '¡Desbloqueado!' : `Faltan ${m.visitTarget - (pass.business?.currentVisits ?? 0)} visita(s)`} · Visita {m.visitTarget}
                                </p>
                              </div>
                              {unlocked && !redeemed ? (
                                <button
                                  onClick={() => requestMilestoneCode(m)}
                                  disabled={codeLoading}
                                  className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                                    showCode
                                      ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  } disabled:opacity-60`}
                                >
                                  {codeLoading ? '...' : showCode ? 'Ocultar' : 'Canjear'}
                                </button>
                              ) : null}
                            </div>
                            {showCode ? (
                              <div className="border-t border-emerald-200 px-3 py-2.5 bg-white rounded-b-xl">
                                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700 mb-1">Código de canje</p>
                                <p className="text-3xl font-black tracking-[0.25em] text-emerald-800">{codeEntry?.code}</p>
                                <p className="text-[10px] text-emerald-600 font-semibold mt-1">Muestra este código al encargado del negocio</p>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-xs font-bold text-amber-700 mt-1">
                No se pudo resolver el negocio del pase. Regresa a la app y abre el pase desde una tarjeta de negocio.
              </p>
            )}

            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              id="punto-pass-qr" 
              className="mt-5 rounded-xl border border-pink-100 p-4 flex items-center justify-center bg-white"
            >
              <QRCode value={pass.qr.value} size={240} />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="mt-4 grid gap-2"
            >
              <motion.button whileTap={{ scale: 0.95 }} onClick={downloadQrSvg} className="w-full rounded-xl border border-pink-100 bg-pink-50 py-2 text-sm font-black text-pink-700 hover:bg-pink-100">
                Descargar QR (SVG)
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={openAppleWallet}
                disabled={!pass.business?.id}
                className="w-full rounded-xl border-2 border-black bg-black py-2 text-sm font-black text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🍎 Descargar en Apple Wallet (.pkpass)
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={openGoogleWallet}
                disabled={!pass.business?.id}
                className="w-full rounded-xl border-2 border-slate-900 bg-white py-2 text-sm font-black text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🇬 Descargar en Google Wallet
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={goToPoints}
                className="w-full rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-sm font-black text-indigo-700 hover:bg-indigo-100"
              >
                ⬅️ Ir a mi área de cliente
              </motion.button>
            </motion.div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
