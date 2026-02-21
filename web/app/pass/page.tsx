'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

type PassResponse = {
  customer_id: string;
  name: string;
  branding: { app: string; theme: string };
  qr: { token: string; value: string };
};

function extractCustomerIdFromQuery() {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  return url.searchParams.get('customer_id') || '';
}

export default function PassPage() {
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pass, setPass] = useState<PassResponse | null>(null);

  useEffect(() => {
    const idFromQuery = extractCustomerIdFromQuery();
    if (idFromQuery) {
      setCustomerId(idFromQuery);
      void loadPass(idFromQuery);
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

<<<<<<< HEAD
=======
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

>>>>>>> origin/codex/review-my-code
  const loadPass = async (id: string) => {
    const cleanId = String(id || '').trim();
    if (!cleanId) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/pass/${encodeURIComponent(cleanId)}`);
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
            onClick={() => loadPass(customerId)}
            disabled={loading}
            className="rounded-xl bg-white text-pink-600 px-4 py-2 font-black disabled:opacity-60"
          >
            {loading ? '...' : 'Cargar'}
          </button>
        </div>

        {error ? <p className="mt-3 text-sm font-bold text-yellow-100">{error}</p> : null}

        {pass ? (
          <div className="mt-5 rounded-2xl bg-white p-5 text-gray-900 shadow-xl">
            <p className="text-xs uppercase tracking-[0.15em] font-black text-pink-600">Cliente</p>
            <p className="text-xl font-black mt-1">{pass.name}</p>
            <p className="text-xs font-semibold text-gray-500 mt-1">ID: {pass.customer_id}</p>

<<<<<<< HEAD
            <div className="mt-5 rounded-xl border border-pink-100 p-4 flex items-center justify-center bg-white">
              <QRCode value={pass.qr.value} size={240} />
            </div>
            <p className="text-[11px] text-gray-500 mt-3 font-semibold">QR universal firmado. No contiene datos sensibles en texto plano.</p>
=======
            <div id="punto-pass-qr" className="mt-5 rounded-xl border border-pink-100 p-4 flex items-center justify-center bg-white">
              <QRCode value={pass.qr.value} size={240} />
            </div>
            <p className="text-[11px] text-gray-500 mt-3 font-semibold">QR universal firmado. No contiene datos sensibles en texto plano.</p>
            <button onClick={downloadQrSvg} className="mt-3 w-full rounded-xl border border-pink-100 bg-pink-50 py-2 text-sm font-black text-pink-700 hover:bg-pink-100">Descargar QR (SVG)</button>
>>>>>>> origin/codex/review-my-code
          </div>
        ) : null}
      </div>
    </main>
  );
}
