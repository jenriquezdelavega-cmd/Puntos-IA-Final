'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

const PASS_CACHE_PREFIX = 'punto_pass_cache:';
const PASS_CACHE_TTL_MS = 60_000;

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
  if (typeof window === 'undefined') return { customerId: '', businessId: '', from: '' };
  const url = new URL(window.location.href);
  return {
    customerId: url.searchParams.get('customer_id') || '',
    businessId: url.searchParams.get('business_id') || '',
    from: url.searchParams.get('from') || '',
  };
}


function passCacheKey(customerId: string, businessId: string) {
  return `${PASS_CACHE_PREFIX}${customerId}:${businessId}`;
}

function readPassCache(customerId: string, businessId: string): PassResponse | null {
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

function writePassCache(customerId: string, businessId: string, data: PassResponse) {
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

  const loadPass = async (customerId: string, businessId: string, silent = false) => {
    const cleanCustomerId = String(customerId || '').trim();
    const cleanBusinessId = String(businessId || '').trim();

    if (!cleanCustomerId || !cleanBusinessId) {
      setPass(null);
      setError('No se pudo identificar tu sesión o negocio. Vuelve a entrar desde la tarjeta del negocio en la app.');
      return;
    }

    if (!silent) setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/pass/${encodeURIComponent(cleanCustomerId)}?businessId=${encodeURIComponent(cleanBusinessId)}`);
      const data = (await res.json()) as PassResponse | { error?: string };
      if (!res.ok) {
        setPass(null);
        setError((data as { error?: string }).error || 'No se pudo cargar el pase');
        return;
      }
      const passData = data as PassResponse;
      setPass(passData);
      writePassCache(cleanCustomerId, cleanBusinessId, passData);
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

    if (query.customerId && query.businessId) {
      const cached = readPassCache(query.customerId, query.businessId);
      if (cached) {
        setPass(cached);
        void loadPass(query.customerId, query.businessId, true);
      } else {
        void loadPass(query.customerId, query.businessId);
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
      if (!parsed?.id || !query.businessId) {
        setError('Abre tu pase desde la tarjeta de un negocio para aplicar branding y contador correctos.');
        return;
      }
      void loadPass(parsed.id, query.businessId);
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#ff7a59] via-[#ff3f8e] to-[#f90086] p-6 text-white flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-white/35 bg-white/15 backdrop-blur-md p-6 shadow-2xl">
        <p className="text-xs font-black tracking-[0.2em] uppercase text-white/80">Pase de Lealtad</p>
        <h1 className="text-3xl font-black mt-2">Punto IA</h1>
        <p className="mt-2 text-sm text-white/90">
          Tu QR universal para registrar visitas. Este pase se personaliza automáticamente con el negocio desde donde lo abriste.
        </p>

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
              <p className="text-xs font-bold text-emerald-700 mt-1">
                {pass.business.name} · {pass.business.currentVisits}/{pass.business.requiredVisits} visitas
              </p>
            ) : (
              <p className="text-xs font-bold text-amber-700 mt-1">
                No se pudo resolver el negocio del pase. Regresa a la app y abre el pase desde una tarjeta de negocio.
              </p>
            )}

            <div id="punto-pass-qr" className="mt-5 rounded-xl border border-pink-100 p-4 flex items-center justify-center bg-white">
              <QRCode value={pass.qr.value} size={240} />
            </div>
            <p className="text-[11px] text-gray-500 mt-3 font-semibold">
              QR universal firmado (mismo cliente en todos los negocios). Contador y wallet se muestran por negocio.
            </p>
            <div className="mt-3 grid gap-2">
              <button onClick={downloadQrSvg} className="w-full rounded-xl border border-pink-100 bg-pink-50 py-2 text-sm font-black text-pink-700 hover:bg-pink-100">
                Descargar QR (SVG)
              </button>
              <button
                type="button"
                onClick={openAppleWallet}
                disabled={!pass.business?.id}
                className="w-full rounded-xl border-2 border-black bg-black py-2 text-sm font-black text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🍎 Descargar en Apple Wallet (.pkpass)
              </button>
              <button
                type="button"
                onClick={openGoogleWallet}
                disabled={!pass.business?.id}
                className="w-full rounded-xl border-2 border-slate-900 bg-white py-2 text-sm font-black text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🇬 Descargar en Google Wallet
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
