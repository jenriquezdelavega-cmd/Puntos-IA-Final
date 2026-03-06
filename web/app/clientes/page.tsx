import Link from 'next/link';
import Image from 'next/image';

const highlights = [
  {
    icon: '📲',
    title: 'Tu pase en Apple y Google Wallet',
    description: 'Guarda tu pase una sola vez y úsalo en iPhone o Android cuando visites negocios aliados.',
  },
  {
    icon: '🎯',
    title: 'Retos que te hacen ganar más',
    description: 'Completa retos de visitas y desbloquea recompensas especiales además de tus premios habituales.',
  },
  {
    icon: '🔔',
    title: 'Notificaciones que sí sirven',
    description: 'Recibe recordatorios, campañas y beneficios personalizados de tus negocios favoritos.',
  },
  {
    icon: '🧭',
    title: 'Descubre nuevos aliados',
    description: 'Encuentra negocios cercanos en el mapa y suma puntos en toda la red Punto IA.',
  },
];

const journey = [
  { step: '01', title: 'Crea tu cuenta', description: 'Te registras en minutos y activas tu pase universal de lealtad.' },
  { step: '02', title: 'Visita y escanea', description: 'Muestra tu pase en caja y suma progreso con cada check-in válido.' },
  { step: '03', title: 'Cumple retos y recibe push', description: 'Mantén el ritmo con metas gamificadas y alertas de campañas activas.' },
  { step: '04', title: 'Canjea tus premios', description: 'Genera tu código de redención y úsalo de forma segura en negocio.' },
];

const benefits = [
  'Sin app adicional: funciona con tu wallet.',
  'Un solo pase para toda la red de aliados.',
  'Premios por frecuencia + campañas especiales.',
  'Canje con código seguro y trazabilidad.',
];

export default function ClientesPage() {
  return (
    <main className="min-h-screen bg-[#080812] text-white">
      <nav className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo Punto IA" width={210} height={120} className="h-14 w-auto object-contain" priority />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/negocios" className="text-white/60 text-sm font-bold hover:text-white transition hidden sm:block">
            Para Negocios
          </Link>
          <Link href="/?clientes=1" className="bg-white/10 border border-white/20 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/20 transition">
            Entrar
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pt-6 pb-10 md:pt-10 md:pb-14">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#ff7a59]/20 via-[#ff3f8e]/15 to-[#8b5cf6]/15 p-8 md:p-12 text-center">
          <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/90">
            Experiencia cliente Punto IA
          </p>
          <h1 className="mt-5 text-4xl md:text-6xl font-black leading-[1.05]">
            Tu lealtad ahora sí
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7]"> te regresa valor real.</span>
          </h1>
          <p className="mt-5 max-w-3xl mx-auto text-white/75 font-medium leading-relaxed">
            Suma puntos, completa retos gamificados, recibe notificaciones útiles y canjea recompensas en una red de negocios reales.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Link href="/?clientes=1" className="bg-white text-[#d92f7e] font-black px-7 py-3 rounded-xl hover:bg-white/90 transition">
              Crear cuenta / Iniciar sesión
            </Link>
            <Link href="/aliados" className="border border-white/25 bg-white/5 px-7 py-3 rounded-xl font-bold hover:bg-white/10 transition">
              Ver negocios aliados
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-4 md:py-8">
        <div className="grid gap-4 md:grid-cols-2">
          {highlights.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-3xl">{item.icon}</p>
              <h2 className="mt-3 text-xl font-black">{item.title}</h2>
              <p className="mt-2 text-sm text-white/70 leading-relaxed font-medium">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6 md:py-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-9 grid gap-6 md:grid-cols-[1.4fr,1fr]">
          <div>
            <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white/45">Flujo end-to-end</p>
            <h3 className="mt-3 text-3xl md:text-4xl font-black">Cómo funciona tu experiencia como cliente</h3>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {journey.map((item) => (
                <div key={item.step} className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] text-xs font-black">
                    {item.step}
                  </span>
                  <h4 className="mt-3 font-black">{item.title}</h4>
                  <p className="mt-2 text-sm text-white/65 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          <aside className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white/50">Lo que incluye hoy</p>
            <ul className="mt-4 space-y-2.5">
              {benefits.map((item) => (
                <li key={item} className="text-sm text-white/80 font-semibold">✓ {item}</li>
              ))}
            </ul>
            <Link href="/?clientes=1" className="mt-5 inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] px-4 py-3 text-sm font-black text-white">
              Empezar ahora
            </Link>
          </aside>
        </div>
      </section>

      <footer className="border-t border-white/10 mt-10">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/35 text-xs font-semibold">Punto IA · Recompensas reales para clientes frecuentes.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/35 text-xs font-bold hover:text-white/70 transition">Inicio</Link>
            <Link href="/negocios" className="text-white/35 text-xs font-bold hover:text-white/70 transition">Negocio</Link>
            <Link href="/?clientes=1" className="text-white/35 text-xs font-bold hover:text-white/70 transition">Entrar</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
