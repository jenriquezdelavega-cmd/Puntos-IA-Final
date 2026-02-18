import Link from 'next/link';

type Pillar = {
  title: string;
  desc: string;
  tag: string;
};

type Plan = {
  name: string;
  subtitle: string;
  price: string;
  cadence: string;
  cta: string;
  highlight?: boolean;
  features: string[];
};

const loyaltyFacts = [
  {
    stat: '5x–7x',
    title: 'más rentable retener',
    desc: 'Retener clientes suele costar mucho menos que adquirir nuevos. La lealtad impacta utilidad neta.',
  },
  {
    stat: '+20%–40%',
    title: 'más frecuencia de compra',
    desc: 'Cuando el cliente ve progreso y recompensa clara, regresa con mayor recurrencia.',
  },
  {
    stat: 'Primeras 4–8 semanas',
    title: 'para crear hábito',
    desc: 'Un sistema simple de visitas acelera el paso de prueba aislada a consumo recurrente.',
  },
];

const pillars: Pillar[] = [
  {
    title: 'Lealtad que sí regresa',
    desc: 'Diseña recompensas que incentiven recurrencia y eleven valor de vida del cliente.',
    tag: 'Retención',
  },
  {
    title: 'Operación sin fricción',
    desc: 'Tu equipo valida check-ins y canjes en segundos desde un flujo intuitivo.',
    tag: 'Operación',
  },
  {
    title: 'Visibilidad en ecosistema',
    desc: 'Tu negocio aparece en red de aliados para atraer clientes por descubrimiento local.',
    tag: 'Adquisición',
  },
  {
    title: 'Decisiones con data real',
    desc: 'Mide visitas, recurrencia y comportamiento para optimizar campañas con confianza.',
    tag: 'Analítica',
  },
];

const roadmap = [
  {
    step: '01',
    title: 'Diagnóstico comercial',
    desc: 'Alineamos objetivo: más frecuencia, mayor ticket o reactivación.',
  },
  {
    step: '02',
    title: 'Diseño de incentivo',
    desc: 'Definimos regla y premio según margen, temporada y tipo de cliente.',
  },
  {
    step: '03',
    title: 'Activación del equipo',
    desc: 'Capacitamos operación para ejecutar check-in y canje desde día uno.',
  },
  {
    step: '04',
    title: 'Optimización continua',
    desc: 'Iteramos con reportes y métricas para crecer de forma sostenible.',
  },
];

const plans: Plan[] = [
  {
    name: 'Starter',
    subtitle: 'Validación rápida',
    price: '$0',
    cadence: 'pre-lanzamiento',
    cta: 'Unirme al pre-lanzamiento',
    features: ['1 sucursal', 'Mecánica base de lealtad', 'Check-ins y leads', 'Soporte por correo'],
  },
  {
    name: 'Growth',
    subtitle: 'Plan recomendado',
    price: '$1,490',
    cadence: 'MXN / mes',
    cta: 'Quiero plan Growth',
    highlight: true,
    features: ['Hasta 3 sucursales', 'Canjes + reportes CSV', 'Mapa y perfil aliado', 'Soporte prioritario'],
  },
  {
    name: 'Scale',
    subtitle: 'Multi-sucursal',
    price: 'Custom',
    cadence: 'según operación',
    cta: 'Hablar con ventas',
    features: ['Sucursales ilimitadas', 'Acompañamiento estratégico', 'Integraciones', 'SLA dedicado'],
  },
];

const faqs = [
  {
    q: '¿Cuánto tiempo toma iniciar?',
    a: 'Normalmente puedes operar en pocos días con onboarding guiado.',
  },
  {
    q: '¿Sirve para cafeterías, restaurantes y retail?',
    a: 'Sí. Se adapta por giro, ticket y objetivo comercial.',
  },
  {
    q: '¿Necesito equipo técnico?',
    a: 'No. El flujo está diseñado para staff operativo y dueños.',
  },
  {
    q: '¿Puedo exportar reportes?',
    a: 'Sí, en CSV desde el panel master para operación y marketing.',
  },
];

function PuntoIALogo() {
  return (
    <div className="inline-flex items-end justify-center gap-3 select-none">
      <span className="brand-punto-wrap">
        <span className="brand-word brand-word-punto">punt</span>
        <span className="brand-o-wrap">
          <span className="brand-word brand-word-punto">o</span>
          <span className="brand-orb">
            <span className="brand-orb-glow" />
            <span className="brand-orb-shine" />
          </span>
        </span>
      </span>
      <span className="brand-word brand-word-ia">IA</span>
    </div>
  );
}

export default function NegociosPage() {
  return (
    <main className="min-h-screen bg-[#0b0b16] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff7a59] via-[#ff2f87] to-[#f90086] opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.22),transparent_36%),radial-gradient(circle_at_88%_20%,rgba(255,255,255,0.15),transparent_38%)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-20">
          <PuntoIALogo />

          <h1 className="mt-8 max-w-5xl text-4xl md:text-6xl font-black leading-tight text-white">
            La plataforma de lealtad para negocios que quieren crecer con estrategia, no con improvisación.
          </h1>

          <p className="mt-5 max-w-3xl text-white/90 text-base md:text-lg font-semibold leading-relaxed">
            Punto IA convierte visitas en datos accionables, recompensas inteligentes y clientes que vuelven.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/" className="rounded-2xl border border-white/35 bg-white/15 px-6 py-3 font-black hover:bg-white/25 transition shadow-lg">
              Volver al teaser
            </Link>
            <Link
              href="/?clientes=1"
              className="rounded-2xl bg-white text-[#f90086] px-6 py-3 font-black hover:bg-pink-50 transition shadow-2xl"
            >
              Ver experiencia cliente
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {loyaltyFacts.map((fact) => (
            <article key={fact.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#f90086]">{fact.stat}</p>
              <h2 className="mt-2 text-xl font-black">{fact.title}</h2>
              <p className="mt-2 text-white/75 font-semibold leading-relaxed">{fact.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6 md:py-10">
        <div className="grid gap-4 md:grid-cols-2">
          {pillars.map((item) => (
            <article key={item.title} className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 md:p-7 shadow-xl">
              <span className="inline-flex rounded-full border border-[#ff3f8e]/35 bg-[#ff3f8e]/15 px-3 py-1 text-[10px] font-black tracking-[0.12em] uppercase text-pink-100">
                {item.tag}
              </span>
              <h2 className="mt-4 text-2xl font-black">{item.title}</h2>
              <p className="mt-2 text-white/75 font-semibold leading-relaxed">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6 md:py-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8 shadow-xl">
          <h3 className="text-3xl font-black">Ruta de implementación</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {roadmap.map((r) => (
              <article key={r.step} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] text-xs font-black">{r.step}</span>
                  <h4 className="text-xl font-black">{r.title}</h4>
                </div>
                <p className="mt-3 text-white/75 font-semibold">{r.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-black tracking-[0.18em] uppercase text-white/60">Pricing</p>
            <h3 className="text-3xl md:text-4xl font-black">Planes para cada etapa de tu negocio</h3>
          </div>
          <p className="text-sm text-white/70 font-semibold">Precios de referencia para lanzamiento en México.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-3xl border p-6 md:p-7 shadow-xl ${
                plan.highlight
                  ? 'border-[#ff3f8e] bg-gradient-to-b from-[#ff3f8e]/18 via-[#a044ff]/12 to-transparent ring-2 ring-[#ff3f8e]/30'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              {plan.highlight ? <p className="inline-flex rounded-full bg-[#ff3f8e] text-white text-[10px] font-black uppercase tracking-[0.14em] px-3 py-1">Recomendado</p> : null}
              <h4 className="mt-3 text-2xl font-black">{plan.name}</h4>
              <p className="text-white/70 font-semibold">{plan.subtitle}</p>

              <div className="mt-5">
                <p className="text-4xl font-black leading-none">{plan.price}</p>
                <p className="mt-1 text-white/65 font-semibold text-sm">{plan.cadence}</p>
              </div>

              <ul className="mt-5 space-y-2 text-sm font-semibold text-white/85">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>

              <Link
                href="/"
                className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl py-3 font-black transition ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] text-white hover:brightness-110'
                    : 'border border-white/25 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6 md:py-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8 shadow-xl">
          <h3 className="text-3xl font-black">Preguntas frecuentes</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {faqs.map((f) => (
              <article key={f.q} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h4 className="text-lg font-black">{f.q}</h4>
                <p className="mt-2 text-white/75 font-semibold">{f.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="rounded-3xl border border-[#ff3f8e]/35 bg-gradient-to-r from-[#ff7a59]/22 via-[#ff3f8e]/24 to-[#8b5cf6]/22 p-7 md:p-10 text-center shadow-2xl">
          <h3 className="text-3xl md:text-4xl font-black">¿Listo para subir tu recurrencia?</h3>
          <p className="mt-3 text-white/90 font-semibold max-w-2xl mx-auto">
            Únete al pre-lanzamiento y sé de los primeros negocios en operar fidelización moderna con Punto IA.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="rounded-2xl bg-white text-pink-600 px-6 py-3 font-black hover:bg-pink-50 transition">
              Quiero preinscribirme
            </Link>
            <Link href="/?clientes=1" className="rounded-2xl border border-white/50 bg-white/10 px-6 py-3 font-black text-white hover:bg-white/20 transition">
              Ver experiencia cliente
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
