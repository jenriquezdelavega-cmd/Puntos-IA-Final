import Link from 'next/link';

type Pillar = {
  title: string;
  desc: string;
  tag: string;
  glyph: string;
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
    desc: 'Retener clientes suele costar mucho menos que conseguir nuevos. La lealtad impacta margen directo.',
  },
  {
    stat: '+20%–40%',
    title: 'más frecuencia de compra',
    desc: 'Cuando el cliente entiende su progreso y premio, regresa más seguido y eleva su ticket acumulado.',
  },
  {
    stat: '1ª visita → hábito',
    title: 'en semanas',
    desc: 'Los programas simples convierten visitas sueltas en comportamiento recurrente medible.',
  },
];

const pillars: Pillar[] = [
  {
    title: 'Lealtad que sí regresa',
    desc: 'Activa campañas de recompensas con reglas claras para que tus clientes vuelvan más seguido.',
    tag: 'Retención',
    glyph: 'LR',
  },
  {
    title: 'Operación en minutos',
    desc: 'Tu staff valida check-ins y canjes en segundos, sin fricción ni procesos complejos.',
    tag: 'Operación',
    glyph: 'OP',
  },
  {
    title: 'Visibilidad en red de aliados',
    desc: 'Tu negocio entra al ecosistema Punto IA para ganar descubrimiento local.',
    tag: 'Adquisición',
    glyph: 'RA',
  },
  {
    title: 'Decisiones con datos',
    desc: 'Mide visitas, recurrencia y comportamiento para ajustar promociones con precisión.',
    tag: 'Analítica',
    glyph: 'DA',
  },
];

const whyNow = [
  'Tus clientes ya comparan experiencias, no solo precios.',
  'El costo de adquisición sube; la recurrencia protege rentabilidad.',
  'Sin datos de visitas reales, se invierte en marketing a ciegas.',
  'La experiencia móvil y rápida ya es estándar esperado.',
];

const roadmap = [
  {
    step: '01',
    title: 'Diagnóstico express',
    desc: 'Definimos objetivo comercial: recurrencia, ticket promedio o reactivación.',
  },
  {
    step: '02',
    title: 'Diseño de recompensa',
    desc: 'Configuramos regla de visitas/puntos y premio alineado a margen.',
  },
  {
    step: '03',
    title: 'Activación del equipo',
    desc: 'Staff listo para operar check-in y canje desde el día 1.',
  },
  {
    step: '04',
    title: 'Optimización continua',
    desc: 'Seguimiento con reportes y ajustes de campañas por temporada.',
  },
];

const plans: Plan[] = [
  {
    name: 'Starter',
    subtitle: 'Validación rápida',
    price: '$0',
    cadence: 'pre-lanzamiento',
    cta: 'Unirme al pre-lanzamiento',
    features: ['1 sucursal', 'Base de lealtad inicial', 'Check-ins y leads', 'Soporte por correo'],
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
    q: '¿Cuánto tarda en implementarse Punto IA?',
    a: 'Puedes iniciar en días, no meses. La activación es guiada y el equipo aprende rápido.',
  },
  {
    q: '¿Funciona para cafeterías, restaurantes y retail?',
    a: 'Sí. Se adapta por industria y objetivo: frecuencia, ticket o reactivación.',
  },
  {
    q: '¿Qué tan difícil es para mi staff?',
    a: 'La operación es simple: validar check-ins/canjes y usar el panel con flujo intuitivo.',
  },
  {
    q: '¿Puedo exportar datos?',
    a: 'Sí, desde Master puedes descargar reportes CSV de clientes y preinscritos.',
  },
];

export default function NegociosPage() {
  return (
    <main className="min-h-screen bg-[#090913] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,122,89,0.28),transparent_34%),radial-gradient(circle_at_86%_8%,rgba(249,0,134,0.22),transparent_35%),radial-gradient(circle_at_58%_82%,rgba(119,47,255,0.16),transparent_35%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-20">
          <p className="inline-flex rounded-full border border-[#ff3f8e]/40 bg-[#ff3f8e]/15 px-4 py-1 text-[11px] font-black tracking-[0.18em] uppercase text-pink-100 shadow-[0_0_0_1px_rgba(255,63,142,0.15)]">
            Punto IA para negocios
          </p>

          <h1 className="mt-6 max-w-5xl text-4xl md:text-6xl font-black leading-tight">
            Convierte visitas en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6]">
              lealtad medible
            </span>{' '}
            y crecimiento sostenible.
          </h1>

          <p className="mt-5 max-w-3xl text-white/80 text-base md:text-lg font-semibold leading-relaxed">
            Punto IA unifica recompensas, operación y analítica para que cada visita tenga valor y cada decisión se tome con datos reales.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-2xl border border-white/25 bg-white/10 hover:bg-white/20 transition px-6 py-3 font-black shadow-lg"
            >
              Ver teaser
            </Link>
            <Link
              href="/?clientes=1"
              className="rounded-2xl bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] px-6 py-3 font-black text-white shadow-2xl hover:brightness-110 transition"
            >
              Probar experiencia cliente
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {loyaltyFacts.map((fact) => (
            <article
              key={fact.title}
              className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 shadow-[0_12px_36px_rgba(0,0,0,0.35)]"
            >
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e]">{fact.stat}</p>
              <h2 className="mt-2 text-xl font-black">{fact.title}</h2>
              <p className="mt-2 text-white/75 font-semibold leading-relaxed">{fact.desc}</p>
            </article>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-white/45 font-semibold">*Rangos de referencia de mercado para programas de fidelización en retail/hospitality.</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6 md:py-10">
        <div className="grid gap-4 md:grid-cols-2">
          {pillars.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-transparent p-6 md:p-7 shadow-[0_10px_35px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black tracking-[0.12em] uppercase text-white/80">
                  {item.tag}
                </span>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] text-xs font-black tracking-[0.08em] shadow-lg">
                  {item.glyph}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-black">{item.title}</h2>
              <p className="mt-2 text-white/75 font-semibold leading-relaxed">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6 md:py-10">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.08] to-white/[0.03] p-6 md:p-8 shadow-xl">
          <h3 className="text-3xl font-black">¿Por qué ahora?</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {whyNow.map((line) => (
              <p key={line} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/85 font-semibold">
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ff3f8e]/20 text-[#ff82b8] text-xs">•</span>
                {line}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6 md:py-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8 shadow-xl">
          <h3 className="text-3xl font-black">Ruta de implementación</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {roadmap.map((r) => (
              <article key={r.step} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] text-xs font-black">
                    {r.step}
                  </span>
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
                  ? 'border-[#ff3f8e] bg-gradient-to-b from-[#ff3f8e]/20 via-[#8b5cf6]/12 to-transparent ring-2 ring-[#ff3f8e]/35'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              {plan.highlight ? (
                <p className="inline-flex rounded-full bg-[#ff3f8e] text-white text-[10px] font-black uppercase tracking-[0.14em] px-3 py-1">
                  Recomendado
                </p>
              ) : null}
              <h4 className="mt-3 text-2xl font-black">{plan.name}</h4>
              <p className="text-white/70 font-semibold">{plan.subtitle}</p>

              <div className="mt-5">
                <p className="text-4xl font-black leading-none">{plan.price}</p>
                <p className="mt-1 text-white/65 font-semibold text-sm">{plan.cadence}</p>
              </div>

              <ul className="mt-5 space-y-2 text-sm font-semibold text-white/85">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#ff3f8e]/20 text-[#ff8ac0] text-[10px]">•</span>
                    <span>{f}</span>
                  </li>
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
        <div className="rounded-3xl border border-[#ff3f8e]/35 bg-gradient-to-r from-[#ff7a59]/25 via-[#ff3f8e]/25 to-[#8b5cf6]/25 p-7 md:p-10 text-center shadow-2xl">
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
