import Link from 'next/link';

const perks = [
  'Aumenta visitas recurrentes con check-in QR.',
  'Convierte clientes en fans con recompensas claras.',
  'Mide actividad y canjes desde un panel simple.',
  'Lanzamiento rápido pensado para pymes en México.',
];

export default function AliadosPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-fuchsia-50 text-gray-900">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-14 md:py-20">
        <div className="rounded-3xl border border-orange-100 bg-white/90 p-8 shadow-xl">
          <p className="mb-3 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-700">
            Programa para negocios
          </p>
          <h1 className="text-3xl font-black leading-tight md:text-5xl">
            Haz que tu negocio se convierta en <span className="text-fuchsia-600">aliado de Punto IA</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-gray-600 md:text-base">
            Ayudamos a tu negocio a fidelizar clientes con un sistema de puntos fácil de usar. Tus clientes
            registran visitas, acumulan beneficios y regresan más seguido.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {perks.map((perk) => (
              <div key={perk} className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold shadow-sm">
                ✨ {perk}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:ventas@puntoia.mx?subject=Quiero%20ser%20aliado%20de%20Punto%20IA"
              className="inline-flex items-center justify-center rounded-2xl bg-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-fuchsia-700"
            >
              Quiero una demo
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-50"
            >
              Volver a inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
