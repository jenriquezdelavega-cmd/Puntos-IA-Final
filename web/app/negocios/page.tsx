import Link from 'next/link';

const pillars = [
  {
    title: 'Lealtad que sí regresa',
    desc: 'Activa campañas de recompensas con reglas claras para que tus clientes vuelvan más seguido.',
    icon: '🎯',
  },
  {
    title: 'Operación en minutos',
    desc: 'Implementación rápida para tu staff: check-ins, canjes y validaciones sin fricción.',
    icon: '⚡',
  },
  {
    title: 'Visibilidad en red de aliados',
    desc: 'Aparece en el ecosistema Punto IA y gana nuevos clientes por descubrimiento local.',
    icon: '🤝',
  },
  {
    title: 'Decisiones con datos',
    desc: 'Mide visitas, recurrencia y comportamiento para optimizar promociones y temporadas.',
    icon: '📊',
  },
];

const steps = [
  {
    title: 'Onboarding guiado',
    desc: 'Definimos contigo objetivo, premio y frecuencia de recompensas para tu giro.',
  },
  {
    title: 'Activación del negocio',
    desc: 'Configuramos panel, códigos y perfil de aliado para salir en mapa y red Punto IA.',
  },
  {
    title: 'Escala y optimiza',
    desc: 'Monitoreamos métricas y exportas reportes para crecer con decisiones informadas.',
  },
];

const plans = [
  {
    name: 'Starter',
    subtitle: 'Para iniciar validación',
    price: '$0',
    cadence: 'durante pre-lanzamiento',
    cta: 'Unirme al pre-lanzamiento',
    highlight: false,
    features: ['Hasta 1 sucursal', 'Panel básico de lealtad', 'Captura de leads y check-ins', 'Soporte por correo'],
  },
  {
    name: 'Growth',
    subtitle: 'Plan recomendado',
    price: '$1,490',
    cadence: 'MXN / mes',
    cta: 'Quiero plan Growth',
    highlight: true,
    features: ['Hasta 3 sucursales', 'Canjes y reportes CSV', 'Mapa + perfil de aliado', 'Soporte prioritario'],
  },
  {
    name: 'Scale',
    subtitle: 'Para cadena o multi-sucursal',
    price: 'Custom',
    cadence: 'según operación',
    cta: 'Hablar con ventas',
    highlight: false,
    features: ['Sucursales ilimitadas', 'Acompañamiento estratégico', 'Integraciones y automatizaciones', 'SLA y soporte dedicado'],
  },
];

export default function NegociosPage() {
  return (
    <main className="min-h-screen bg-[#0b0b16] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(255,122,89,0.28),transparent_35%),radial-gradient(circle_at_80%_12%,rgba(249,0,134,0.22),transparent_38%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.08),transparent_42%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-20">
          <p className="inline-flex rounded-full border border-pink-300/35 bg-pink-400/10 px-4 py-1 text-xs font-black tracking-[0.2em] uppercase text-pink-100">
            Punto IA para negocios
          </p>

          <h1 className="mt-6 max-w-4xl text-4xl md:text-6xl font-black leading-tight">
            Convierte visitas en <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#f90086]">lealtad medible</span>.
          </h1>

          <p className="mt-5 max-w-3xl text-white/80 text-base md:text-lg font-semibold leading-relaxed">
            Punto IA está diseñado para comercios que quieren crecer sin complejidad: recompensa, datos y visibilidad en una sola plataforma.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="rounded-2xl border border-white/25 bg-white/10 hover:bg-white/20 transition px-6 py-3 font-black">
              Ver teaser
            </Link>
            <Link href="/?clientes=1" className="rounded-2xl bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#f90086] px-6 py-3 font-black text-white shadow-xl hover:brightness-110 transition">
              Probar experiencia cliente
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6 md:py-10">
        <div className="grid gap-4 md:grid-cols-2">
          {pillars.map((item) => (
            <article key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-7 shadow-[0_10px_35px_rgba(0,0,0,0.35)]">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff7a59] to-[#f90086] text-2xl shadow-lg">
                {item.icon}
              </div>
              <h2 className="mt-4 text-2xl font-black">{item.title}</h2>
              <p className="mt-2 text-white/75 font-semibold leading-relaxed">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6 md:py-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <h3 className="text-3xl font-black">Cómo empezamos contigo</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((step, idx) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-black tracking-[0.16em] uppercase text-pink-200">Paso {idx + 1}</p>
                <h4 className="mt-2 text-xl font-black">{step.title}</h4>
                <p className="mt-2 text-white/75 font-semibold">{step.desc}</p>
              </div>
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
                  ? 'border-pink-400 bg-gradient-to-b from-pink-500/15 to-purple-500/10 ring-2 ring-pink-400/40'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              {plan.highlight ? (
                <p className="inline-flex rounded-full bg-pink-500 text-white text-[10px] font-black uppercase tracking-[0.14em] px-3 py-1">Recomendado</p>
              ) : null}
              <h4 className="mt-3 text-2xl font-black">{plan.name}</h4>
              <p className="text-white/70 font-semibold">{plan.subtitle}</p>

              <div className="mt-5">
                <p className="text-4xl font-black leading-none">{plan.price}</p>
                <p className="mt-1 text-white/65 font-semibold text-sm">{plan.cadence}</p>
              </div>

              <ul className="mt-5 space-y-2 text-sm font-semibold text-white/85">
                {plan.features.map((f) => (
                  <li key={f}>✅ {f}</li>
                ))}
              </ul>

              <Link
                href="/"
                className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl py-3 font-black transition ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#f90086] text-white hover:brightness-110'
                    : 'border border-white/25 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
