import Link from 'next/link';
import Image from 'next/image';

const valueCards = [
  {
    icon: '⚡',
    title: 'Activación rápida',
    description: 'En días, no meses. Configuramos reglas, recompensa principal y onboarding del equipo sin fricción.',
  },
  {
    icon: '📲',
    title: 'Wallet-first',
    description: 'Apple Wallet + Google Wallet para que tus clientes usen su pase sin instalar otra app.',
  },
  {
    icon: '🎯',
    title: 'Más recurrencia',
    description: 'Retos, campañas y notificaciones que impulsan visitas repetidas y mejor ticket promedio.',
  },
  {
    icon: '📊',
    title: 'Control real',
    description: 'Métricas accionables para saber qué campaña funciona y dónde optimizar.',
  },
];

const rolloutPhases = [
  {
    phase: 'Fase 1',
    title: 'Base sólida y marca premium',
    description: 'Landing más clara, propuesta de valor concreta y espacios visuales listos para subir assets.',
  },
  {
    phase: 'Fase 2',
    title: 'Storytelling visual por industria',
    description: 'Banners e imágenes por industria (cafetería, retail, belleza, restaurantes) con variantes por temporada.',
  },
  {
    phase: 'Fase 3',
    title: 'Prueba social y conversión',
    description: 'Casos reales, métricas de impacto y optimización de CTAs por tipo de negocio.',
  },
];

const visualFrames = [
  {
    title: 'Frame 1 · Hero principal',
    filename: '/public/negocios-hero.jpg',
    size: '1600x900',
    objective: 'Transmitir crecimiento, confianza y cercanía desde el primer segundo.',
    upload: 'Foto estilo lifestyle de dueño/a de negocio atendiendo clientes felices en un local moderno.',
  },
  {
    title: 'Frame 2 · Operación diaria',
    filename: '/public/negocios-operacion.jpg',
    size: '1200x900',
    objective: 'Mostrar que el sistema es simple para el equipo y rápido para caja.',
    upload: 'Escena de staff escaneando QR/check-in con cliente sonriendo (momento real de uso).',
  },
  {
    title: 'Frame 3 · Resultado / analítica',
    filename: '/public/negocios-resultado.jpg',
    size: '1200x900',
    objective: 'Reforzar que Punto IA produce resultados medibles.',
    upload: 'Imagen de gerente revisando dashboard/métricas en tablet o laptop, con ambiente cálido.',
  },
];

const imageSlots = [
  {
    label: 'Hero para negocios (1600x900)',
    usage: 'Banner principal para transmitir energía, crecimiento y cercanía.',
    prompt:
      'Create a vibrant hero image for a small-business loyalty SaaS brand called Punto IA. Show a welcoming Latin American café owner interacting with happy returning customers, with subtle neon gradients in orange, magenta, and violet. Include soft lighting, modern atmosphere, and clean composition with negative space on the left for headline text. Style: polished, premium, realistic, warm, optimistic. No readable text, no logos.',
  },
  {
    label: 'Visual de operación diaria (1200x900)',
    usage: 'Sección de flujo operativo para mostrar facilidad del sistema.',
    prompt:
      'Generate a polished realistic scene of a small business cashier scanning a customer loyalty QR while both smile naturally. Add modern point-of-sale context, smartphone wallet interaction, and colorful ambient accents in Punto IA palette (orange, pink, purple). Keep it clean and professional, with soft blur background and no text.',
  },
  {
    label: 'Visual de resultados (1200x900)',
    usage: 'Bloque de prueba social/impacto para reforzar conversión.',
    prompt:
      'Generate a premium realistic image of a small business owner reviewing growth metrics on a laptop dashboard in a cozy modern store. Include subtle brand-like color accents in orange, pink and purple lighting. Mood should feel confident, optimistic and data-driven. No readable text, no logos.',
  },
];

export default function NegociosPage() {
  return (
    <main className="min-h-screen bg-[#090914] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,122,89,0.16),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.18),transparent_34%),radial-gradient(circle_at_60%_80%,rgba(255,63,142,0.14),transparent_40%)]" />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo Punto IA" width={200} height={110} className="h-14 w-auto object-contain" priority />
          <span className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/80 sm:inline-flex">Para Negocios</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/" className="hidden text-sm font-semibold text-white/70 transition hover:text-white sm:block">
            Inicio
          </Link>
          <Link href="/clientes" className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">
            Soy Cliente
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-6xl gap-8 px-6 pb-8 pt-4 md:grid-cols-[1.2fr,1fr] md:items-center md:pt-10">
        <div>
          <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/90">
            Rediseño fase 1 · Punto IA
          </p>
          <h1 className="mt-5 text-4xl font-black leading-[1.06] md:text-6xl">
            Convierte visitas en
            <span className="bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] bg-clip-text text-transparent"> clientes frecuentes</span>
            , sin complicar tu operación.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/75 md:text-lg">
            Rediseñamos la experiencia para que se vea más premium, más vibrante y más fácil de entender para dueños y equipos.
            Todo manteniendo la identidad de marca de Punto IA.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/#registro" className="rounded-xl bg-white px-6 py-3 text-sm font-black text-[#ce2d7b] transition hover:bg-white/90">
              Activar mi negocio
            </Link>
            <Link href="/aliados" className="rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
              Ver aliados activos
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="rounded-2xl border border-dashed border-white/30 bg-black/25 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Frame principal recomendado</p>
            <h2 className="mt-2 text-lg font-black">Hero negocios</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Sube una imagen en <span className="font-semibold text-white">/public/negocios-hero.jpg</span> (1600x900). Debe mostrar a un dueño/a atendiendo clientes recurrentes en un entorno real.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-8 md:py-10">
        <div className="grid gap-4 md:grid-cols-2">
          {valueCards.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-3xl">{item.icon}</p>
              <h2 className="mt-3 text-xl font-black">{item.title}</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-white/70">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-8 md:py-12">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-9">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">Frames visuales que debes preparar</p>
          <h3 className="mt-3 text-3xl font-black md:text-4xl">Qué subir en cada espacio de imagen</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {visualFrames.map((frame) => (
              <article key={frame.filename} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h4 className="text-base font-black">{frame.title}</h4>
                <p className="mt-2 text-xs text-white/60">Archivo: {frame.filename}</p>
                <p className="text-xs text-white/60">Tamaño: {frame.size}</p>
                <p className="mt-3 text-sm font-semibold text-white/80">Objetivo: {frame.objective}</p>
                <p className="mt-2 text-sm text-white/70">Qué subir: {frame.upload}</p>
                <div className="mt-4 h-28 rounded-xl border border-dashed border-white/25 bg-white/[0.03]" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-8 md:py-12">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-9">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">Roadmap sugerido (por fases)</p>
          <h3 className="mt-3 text-3xl font-black md:text-4xl">Cómo lo llevamos a un nivel top sin perder claridad</h3>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {rolloutPhases.map((item) => (
              <div key={item.phase} className="rounded-2xl border border-white/10 bg-black/25 p-5">
                <span className="inline-flex rounded-lg bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] px-3 py-1 text-xs font-black uppercase tracking-wider">
                  {item.phase}
                </span>
                <h4 className="mt-3 text-lg font-black">{item.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-12 pt-2 md:pb-14">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-9">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">Prompts para generar imágenes</p>
          <h3 className="mt-3 text-2xl font-black md:text-3xl">Listo para copiar/pegar y generar assets de marca</h3>
          <p className="mt-2 text-sm text-white/65">
            Usa los prompts tal cual o cambia el rubro del negocio para crear variantes por industria.
          </p>
          <div className="mt-6 space-y-4">
            {imageSlots.map((slot) => (
              <article key={slot.label} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h4 className="text-lg font-black">{slot.label}</h4>
                <p className="mt-1 text-sm text-white/65">{slot.usage}</p>
                <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-white/80">
                  {slot.prompt}
                </pre>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
