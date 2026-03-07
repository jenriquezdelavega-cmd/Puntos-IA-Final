import Image from 'next/image';
import Link from 'next/link';

const pillars = [
  {
    title: 'Lealtad que sí regresa clientes',
    description: 'Premia visitas frecuentes con una dinámica simple y fácil de entender.',
  },
  {
    title: 'Operación clara para tu equipo',
    description: 'Check-in y redención en segundos, sin procesos confusos en caja.',
  },
  {
    title: 'Todo desde el celular del cliente',
    description: 'Compatible con Apple Wallet y Google Wallet, sin descargar otra app.',
  },
  {
    title: 'Decisiones con datos reales',
    description: 'Mide visitas, canjes y comportamiento para mejorar tus campañas.',
  },
];

const flow = [
  {
    title: 'Configuras en poco tiempo',
    detail: 'Definimos reglas de puntos, recompensa principal y dinámica de canje.',
  },
  {
    title: 'Tu negocio opera sin fricción',
    detail: 'Tu equipo registra visitas y valida redenciones con una rutina simple.',
  },
  {
    title: 'Ves resultados y optimizas',
    detail: 'Ajustas promociones según datos de uso para aumentar recurrencia.',
  },
];

const trustPoints = ['Activación rápida', 'Experiencia simple', 'Pensado para PyMEs'];

const visualGuides = [
  {
    title: 'Escena principal del negocio',
    path: '/public/negocios-hero.jpg',
    size: '1600x900',
    description: 'Dueño/a atendiendo clientes frecuentes en un entorno moderno, cercano y optimista.',
  },
  {
    title: 'Momento en caja',
    path: '/public/negocios-operacion.jpg',
    size: '1200x900',
    description: 'Cliente mostrando su pase o QR y staff validando de forma rápida.',
  },
];

export default function NegociosPage() {
  return (
    <main className="min-h-screen bg-[#080812] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(255,122,89,0.16),transparent_34%),radial-gradient(circle_at_82%_6%,rgba(168,85,247,0.18),transparent_32%),radial-gradient(circle_at_70%_75%,rgba(255,63,142,0.12),transparent_35%)]" />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo Punto IA" width={210} height={120} className="h-14 w-auto object-contain" priority />
          <span className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90 sm:inline-flex">Para negocios</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/" className="hidden text-sm font-semibold text-white/70 transition hover:text-white sm:block">
            Inicio
          </Link>
          <Link href="/clientes" className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">
            Soy cliente
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-6xl items-center gap-8 px-6 pb-10 pt-4 md:grid-cols-[1.2fr,1fr] md:pt-10">
        <div>
          <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/85">
            Programa de lealtad para crecer
          </p>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] md:text-6xl">
            Convierte visitas en
            <span className="bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] bg-clip-text text-transparent"> clientes frecuentes</span>
            .
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/75 md:text-lg">
            Punto IA te ayuda a premiar mejor, operar más fácil y lograr que tus clientes regresen más seguido.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/#registro" className="rounded-xl bg-white px-6 py-3 text-sm font-black text-[#cc2d7a] transition hover:bg-white/90">
              Activar mi negocio
            </Link>
            <Link href="/aliados" className="rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
              Ver aliados
            </Link>
          </div>
        </div>

        <aside className="rounded-3xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">Por qué elegir Punto IA</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {trustPoints.map((point) => (
              <span key={point} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85">
                {point}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/75">
            Diseñado para negocios locales que quieren una solución moderna, clara y lista para operar todos los días.
          </p>
        </aside>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-4 md:py-8">
        <div className="grid gap-4 md:grid-cols-2">
          {pillars.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-xl font-black">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-8 md:py-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-9">
          <h3 className="text-2xl font-black md:text-3xl">Cómo funciona en tu negocio</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {flow.map((step) => (
              <article key={step.title} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h4 className="text-base font-black">{step.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-12 pt-2 md:pb-14">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-9">
          <h3 className="text-2xl font-black md:text-3xl">Imágenes para esta página</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {visualGuides.map((item) => (
              <article key={item.path} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h4 className="text-base font-black">{item.title}</h4>
                <p className="mt-2 text-xs text-white/60">Archivo: {item.path}</p>
                <p className="text-xs text-white/60">Tamaño recomendado: {item.size}</p>
                <p className="mt-3 text-sm text-white/75">{item.description}</p>
                <div className="mt-4 h-28 rounded-xl border border-dashed border-white/25 bg-white/[0.03]" />
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
