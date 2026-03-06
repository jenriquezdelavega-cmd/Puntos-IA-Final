import Link from 'next/link';
import Image from 'next/image';

function PuntoIALogo() {
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <Image src="/logo.png" alt="Logo Punto IA" width={420} height={260} priority className="h-40 w-64 sm:h-48 sm:w-80 object-contain" />
      <p className="-mt-6 sm:-mt-7 px-5 py-2 rounded-full border border-white/25 bg-white/10 text-white/95 text-[11px] sm:text-sm font-bold tracking-wide text-center shadow-[0_8px_24px_rgba(0,0,0,0.14)]">
        Premiamos tu lealtad, fácil y YA.
      </p>
    </div>
  );
}

const growthBlocks = [
  { icon: '📱', title: 'Apple Wallet + Google Wallet', description: 'Un solo sistema para iPhone y Android. El cliente usa su pase sin instalar app.' },
  { icon: '🎯', title: 'Retos de gamification', description: 'Aumenta frecuencia y ticket con retos por visitas, temporadas y metas especiales.' },
  { icon: '🔔', title: 'Push notifications', description: 'Envía campañas segmentadas para reactivar clientes y acelerar redenciones.' },
  { icon: '📊', title: 'Data accionable', description: 'Consulta progreso, canjes y comportamiento para optimizar promociones con evidencia.' },
];

const flow = [
  { step: '01', title: 'Onboarding de negocio', description: 'Configuramos reglas de puntos, premio principal y branding del pase.' },
  { step: '02', title: 'Operación diaria simple', description: 'Tu equipo usa QR y check-ins para registrar visitas de forma rápida.' },
  { step: '03', title: 'Campañas de engagement', description: 'Activas retos + push para mantener tracción y retorno semanal.' },
  { step: '04', title: 'Medición y crecimiento', description: 'Analizas resultados, ajustas dinámicas y escalas con más sucursales.' },
];

const capabilities = [
  'Pase digital para Apple Wallet y Google Wallet',
  'Retos de gamification con progreso visible',
  'Push notifications para campañas y recordatorios',
  'Check-in con QR + canje seguro con trazabilidad',
  'Reportes por negocio/sucursal y exportación CSV',
  'Mapa de aliados para descubrimiento cruzado',
];

export default function NegociosPage() {
  return (
    <main className="min-h-screen bg-[#070711] text-white">
      <nav className="mx-auto max-w-6xl px-6 py-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex justify-center md:justify-start"><PuntoIALogo /></Link>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white/60 text-sm font-bold hover:text-white transition hidden sm:block">Inicio</Link>
          <Link href="/clientes" className="bg-white/10 border border-white/20 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/20 transition">
            Soy Cliente
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pt-4 pb-10 md:pt-10 md:pb-14">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#ff7a59]/20 via-[#ff3f8e]/15 to-[#8b5cf6]/10 p-7 md:p-10">
          <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/90">
            Plataforma activa para negocios
          </p>
          <h1 className="mt-4 text-4xl md:text-6xl font-black leading-[1.04] max-w-4xl">
            Lealtad omnicanal para operar hoy,
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7]"> con resultados medibles.</span>
          </h1>
          <p className="mt-5 text-white/75 text-base md:text-lg max-w-3xl font-medium leading-relaxed">
            Punto IA conecta wallets, gamification, push notifications y analítica en una sola operación para PyMEs.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/" className="bg-white text-[#d92f7e] font-black px-6 py-3 rounded-xl hover:bg-white/90 transition">Registrar mi negocio</Link>
            <Link href="/clientes" className="border border-white/25 bg-white/5 px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition">Ver experiencia de cliente</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6 md:py-10">
        <div className="grid gap-4 md:grid-cols-2">
          {growthBlocks.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-3xl">{item.icon}</p>
              <h2 className="mt-3 text-xl font-black">{item.title}</h2>
              <p className="mt-2 text-white/70 text-sm font-medium leading-relaxed">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 md:py-12">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-9">
          <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white/45">Flujo operativo end-to-end</p>
          <h3 className="mt-3 text-3xl md:text-4xl font-black">Cómo se vive Punto IA de punta a punta</h3>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {flow.map((item) => (
              <div key={item.step} className="rounded-2xl border border-white/10 bg-black/25 p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] text-xs font-black">{item.step}</span>
                <h4 className="mt-3 font-black">{item.title}</h4>
                <p className="mt-2 text-sm text-white/65 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 md:py-12">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-9 grid gap-6 md:grid-cols-[1.3fr,1fr]">
          <div>
            <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white/45">Funcionalidades actuales</p>
            <h3 className="mt-3 text-3xl md:text-4xl font-black">Todo lo que ya puedes activar hoy</h3>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {capabilities.map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white/85">✓ {item}</div>
              ))}
            </div>
          </div>
          <aside className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white/50">Resultado esperado</p>
            <h4 className="mt-3 text-xl font-black">Más recurrencia, más control y mejor margen</h4>
            <p className="mt-3 text-sm text-white/70 leading-relaxed">
              Diseñado para dueños y equipos operativos: se implementa rápido, se opera diario y se optimiza con datos reales.
            </p>
            <Link href="/" className="mt-5 inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] px-4 py-3 text-sm font-black text-white">
              Agendar activación
            </Link>
          </aside>
        </div>
      </section>

      <footer className="border-t border-white/10 mt-10">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/35 text-xs font-semibold">Punto IA · Lealtad para PyMEs con wallets, retos y data accionable.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/35 text-xs font-bold hover:text-white/70 transition">Inicio</Link>
            <Link href="/clientes" className="text-white/35 text-xs font-bold hover:text-white/70 transition">Cliente</Link>
            <Link href="/aliados" className="text-white/35 text-xs font-bold hover:text-white/70 transition">Aliados</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
