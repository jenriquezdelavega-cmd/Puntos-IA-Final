'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

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
  } | null;
};

function extractPassQuery() {
  if (typeof window === 'undefined') return { customerId: '', businessId: '' };
  const url = new URL(window.location.href);
  return {
    customerId: url.searchParams.get('customer_id') || '',
    businessId: url.searchParams.get('business_id') || '',
  };
}

export default function PassPage() {
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pass, setPass] = useState<PassResponse | null>(null);
  const [businessId, setBusinessId] = useState('');

  useEffect(() => {
    const query = extractPassQuery();
    if (query.customerId) {
      setCustomerId(query.customerId);
      setBusinessId(query.businessId);
      void loadPass(query.customerId, query.businessId);
      return;
    }

    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('punto_user') : null;
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as { id?: string };
        if (parsed?.id) {
          setCustomerId(parsed.id);
          void loadPass(parsed.id);
        }
      } catch {
        // ignore parse errors, user can paste id manually
      }
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


  const openAppleWallet = () => {
    if (!pass?.customer_id || !pass.business?.id) return;
    const businessParam = `&businessId=${encodeURIComponent(pass.business.id)}&businessName=${encodeURIComponent(pass.business.name)}`;
    const href = `/api/wallet/apple?customerId=${encodeURIComponent(pass.customer_id)}${businessParam}`;
    window.location.href = href;
  };

  const loadPass = async (id: string, selectedBusinessId?: string) => {
    const cleanId = String(id || '').trim();
    if (!cleanId) return;

    setLoading(true);
    setError('');

    try {
      const businessParam = selectedBusinessId ? `?businessId=${encodeURIComponent(selectedBusinessId)}` : '';
      const res = await fetch(`/api/pass/${encodeURIComponent(cleanId)}${businessParam}`);
      const data = (await res.json()) as PassResponse | { error?: string };
      if (!res.ok) {
        setPass(null);
        setError((data as { error?: string }).error || 'No se pudo cargar el pase');
        return;
      }
      setPass(data as PassResponse);
    } catch {
      setPass(null);
      setError('No se pudo cargar el pase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#ff7a59] via-[#ff3f8e] to-[#f90086] p-6 text-white flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-white/35 bg-white/15 backdrop-blur-md p-6 shadow-2xl">
        <p className="text-xs font-black tracking-[0.2em] uppercase text-white/80">Pase de Lealtad</p>
        <h1 className="text-3xl font-black mt-2">Punto IA</h1>
        <p className="mt-2 text-sm text-white/90">Tu QR universal para registrar visitas en cualquier negocio afiliado.</p>

        <div className="mt-5 flex gap-2">
          <input
            className="flex-1 rounded-xl border border-white/40 bg-white/95 text-gray-900 px-3 py-2 font-semibold"
            placeholder="customer_id"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
          <button
            onClick={() => loadPass(customerId, businessId)}
            disabled={loading}
            className="rounded-xl bg-white text-pink-600 px-4 py-2 font-black disabled:opacity-60"
          >
            {loading ? '...' : 'Cargar'}
          </button>
        </div>

        <div className="mt-3">
          <input
            className="w-full rounded-xl border border-white/40 bg-white/95 text-gray-900 px-3 py-2 font-semibold"
            placeholder="business_id (requerido para Wallet)"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
          />
          <p className="mt-2 text-[11px] font-semibold text-white/85">
            Tip: tu QR es universal, pero el wallet y contador se generan por negocio (business_id).
          </p>
        </div>

        {error ? <p className="mt-3 text-sm font-bold text-yellow-100">{error}</p> : null}

        {pass ? (
          <div className="mt-5 rounded-2xl bg-white p-5 text-gray-900 shadow-xl">
            <p className="text-xs uppercase tracking-[0.15em] font-black text-pink-600">Cliente</p>
            <p className="text-xl font-black mt-1">{pass.name}</p>
            <p className="text-xs font-semibold text-gray-500 mt-1">ID: {pass.customer_id}</p>
            {pass.business ? (
              <p className="text-xs font-bold text-emerald-700 mt-1">
                {pass.business.name} · {pass.business.currentVisits}/{pass.business.requiredVisits} visitas
              </p>
            ) : (
              <p className="text-xs font-bold text-amber-700 mt-1">
                Selecciona un business_id para crear wallet con marca y contador por negocio.
              </p>
            )}

            <div id="punto-pass-qr" className="mt-5 rounded-xl border border-pink-100 p-4 flex items-center justify-center bg-white">
              <QRCode value={pass.qr.value} size={240} />
            </div>
            <p className="text-[11px] text-gray-500 mt-3 font-semibold">QR universal firmado. No contiene datos sensibles en texto plano.</p>
            <div className="mt-3 grid gap-2">
              <button onClick={downloadQrSvg} className="w-full rounded-xl border border-pink-100 bg-pink-50 py-2 text-sm font-black text-pink-700 hover:bg-pink-100">
                Descargar QR (SVG)
              </button>
              <button
                type="button"
                onClick={() => loadPass(customerId, businessId)}
                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-100"
              >
                🔄 Actualizar contador
              </button>
              <button
                type="button"
                onClick={openAppleWallet}
                disabled={!pass.business?.id}
                className="w-full rounded-xl border-2 border-black bg-black py-2 text-sm font-black text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🍎 Descargar en Apple Wallet (.pkpass)
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
