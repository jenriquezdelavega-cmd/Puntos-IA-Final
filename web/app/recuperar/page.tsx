'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function RecuperarContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => String(searchParams.get('token') || '').trim(), [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const requestReset = async () => {
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/user/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data?.emailDelivery === 'not_configured') {
          setMessage('⚠️ Servicio de correo no configurado en este entorno. Contacta soporte.');
        } else if (data?.emailDelivery === 'failed') {
          setMessage('⚠️ No pudimos enviar el correo. Intenta de nuevo en unos minutos.');
        } else {
          setMessage(data.message);
        }
      } else {
        setMessage(`⚠️ ${data.error}`);
      }
    } catch {
      setMessage('🔥 Error de conexión');
    }
    setLoading(false);
  };

  const submitNewPassword = async () => {
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/user/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data?.emailDelivery === 'not_configured') {
          setMessage(`✅ ${data.message} (sin correo de confirmación por configuración SMTP).`);
        } else if (data?.emailDelivery === 'failed') {
          setMessage(`✅ ${data.message} (falló el correo de confirmación).`);
        } else {
          setMessage(`✅ ${data.message}`);
        }
      } else {
        setMessage(`⚠️ ${data.error}`);
      }
    } catch {
      setMessage('🔥 Error de conexión');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fff2f8] via-[#fff9f4] to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-pink-100 shadow-xl p-6 space-y-4">
        <h1 className="text-2xl font-black text-gray-900">Recuperar contraseña</h1>
        {!token ? (
          <>
            <p className="text-sm text-gray-600">Ingresa tu correo y te enviamos un link para recuperar tu contraseña.</p>
            <input
              type="email"
              className="w-full p-3 rounded-xl border border-gray-200"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={requestReset} disabled={loading} className="w-full rounded-xl bg-pink-600 text-white font-bold py-3 disabled:opacity-60">
              {loading ? 'Enviando...' : 'Enviar link de recuperación'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">Define tu nueva contraseña.</p>
            <input
              type="password"
              className="w-full p-3 rounded-xl border border-gray-200"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={submitNewPassword} disabled={loading} className="w-full rounded-xl bg-pink-600 text-white font-bold py-3 disabled:opacity-60">
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </>
        )}
        {message ? <p className="text-sm font-semibold text-gray-700">{message}</p> : null}
      </div>
    </main>
  );
}

export default function RecuperarPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center"><p className="text-sm font-semibold text-gray-500">Cargando recuperación…</p></main>}>
      <RecuperarContent />
    </Suspense>
  );
}
