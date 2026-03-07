import Link from 'next/link';
import Image from 'next/image';

const pillars = [
  {
    title: 'Wallet nativo, cero fricción',
    description:
      'Tus clientes guardan su pase en Apple Wallet o Google Wallet en segundos. Sin descarga de apps ni capacitación compleja.',
  },
  {
    title: 'Automatización de recurrencia',
    description:
      'Define reglas por visitas, retos y recompensas para mantener activo el hábito de compra y elevar frecuencia de regreso.',
  },
  {
    title: 'Operación simple para tu equipo',
    description:
      'Check-in y canje en flujo claro para caja o piso. Menos dudas operativas, más consistencia en cada sucursal.',
  },
  {
    title: 'Métricas accionables de negocio',
    description:
      'Sigue visitas, canjes y desempeño por campaña para invertir en lo que sí genera retorno en tu negocio.',
  },
];

const journey = [
  {
    step: '01',
    title: 'Diagnóstico comercial',
    description: 'Entendemos ticket promedio, frecuencia y tipo de cliente para diseñar una estrategia de lealtad realista.',
  },
  {
    step: '02',
    title: 'Configuración y activación',
    description: 'Parametrizamos reglas, beneficios y comunicación para que salgas a operación sin fricción.',
  },
  {
    step: '03',
    title: 'Optimización continua',
    description: 'Revisamos resultados y afinamos campañas para mejorar recurrencia y ventas mes a mes.',
  },
];

const faqs = [
  {
    question: '¿Cuánto tardamos en estar operando?',
    answer: 'Normalmente de 3 a 7 días hábiles, según la complejidad de tus reglas y la disponibilidad de tu equipo.',
  },
  {
    question: '¿Necesito hardware especial?',
    answer: 'No. Funciona con flujo digital y wallet móvil; la implementación se adapta a la operación actual del negocio.',
  },
  {
    question: '¿Aplica para una sola sucursal o varias?',
    answer: 'Ambos escenarios. Podemos operar pilotos en una sucursal y escalar después a toda tu red.',
  },
];

export default function NegociosPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05050a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,122,89,0.14),transparent_36%),radial-gradient(circle_at_82%_10%,rgba(139,92,246,0.15),transparent_33%),linear-gradient(180deg,#05050a_0%,#090915_45%,#05050a_100%)]" />

      <nav className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo Punto IA" width={220} height={120} className="h-14 w-auto object-contain" priority />
          <span className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/80 sm:inline-flex">
            Solución para Negocios
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/" className="hidden rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-white/85 transition hover:bg-white/10 sm:block">
            Inicio
          </Link>
          <Link href="/clientes" className="rounded-xl bg-white px-4 py-2 text-sm font-black text-[#161824] transition hover:bg-white/90">
            Soy cliente
          </Link>
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 px-6 pb-10 pt-4 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white/75">
            Plataforma SaaS para PyMEs en México
          </span>
          <h1 className="mt-6 text-4xl font-black leading-[1.03] tracking-tight sm:text-5xl lg:text-7xl">
            Lealtad que sí mueve
            <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] bg-clip-text text-transparent">
              ventas repetidas.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-white/70 sm:text-lg">
            Punto IA convierte tu programa de lealtad en una experiencia premium y medible: wallet, campañas, retos y métricas en un solo sistema.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/#registro" className="rounded-2xl bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] px-7 py-3.5 text-sm font-black text-white shadow-[0_15px_45px_rgba(249,0,134,0.35)] transition hover:translate-y-[-1px] sm:text-base">
              Solicitar demo
            </Link>
            <Link href="/aliados" className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white/90 transition hover:bg-white/10 sm:text-base">
              Ver aliados activos
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { value: '3-7 días', label: 'para salir a operación' },
              { value: 'Wallet', label: 'Apple y Google desde el día 1' },
              { value: '1 panel', label: 'para seguimiento comercial' },
            ].map((item) => (
              <div key={item.value} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xl font-black text-white">{item.value}</p>
                <p className="mt-1 text-xs font-semibold text-white/55">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.03)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/55">Qué incluye</p>
          <h2 className="mt-3 text-2xl font-black leading-tight">Un stack completo de retención para tu negocio.</h2>
          <ul className="mt-5 space-y-3 text-sm text-white/75">
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">Pases digitales por cliente con identificación rápida en tienda.</li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">Retos, recompensas y campañas para elevar frecuencia de visita.</li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">Notificaciones y activaciones para reenganchar clientes inactivos.</li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">Acompañamiento comercial para optimizar resultados cada mes.</li>
          </ul>
          <Link href="/#registro" className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#131524] transition hover:bg-white/90">
            Hablar con un asesor
          </Link>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 py-8">
        <div className="grid gap-3 md:grid-cols-2">
          {pillars.map((item, idx) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">0{idx + 1}</p>
              <h2 className="mt-3 text-xl font-black text-white">{item.title}</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-white/65">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 py-8">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">Implementación</p>
          <h3 className="mt-2 text-2xl font-black md:text-3xl">De idea a resultados en tres etapas claras.</h3>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {journey.map((item) => (
              <article key={item.step} className="rounded-2xl border border-white/10 bg-black/25 p-5">
                <span className="inline-flex rounded-lg bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] px-3 py-1 text-xs font-black tracking-[0.15em]">
                  {item.step}
                </span>
                <h4 className="mt-3 text-lg font-black">{item.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-12 pt-8">
        <div className="grid gap-6 rounded-[30px] border border-white/10 bg-white/[0.03] p-6 md:grid-cols-[1.1fr,0.9fr] md:p-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">Preguntas frecuentes</p>
            <h3 className="mt-2 text-2xl font-black md:text-3xl">Respuestas rápidas antes de activar tu programa.</h3>
            <div className="mt-5 space-y-3">
              {faqs.map((faq) => (
                <article key={faq.question} className="rounded-xl border border-white/10 bg-black/25 p-4">
                  <h4 className="text-sm font-black text-white">{faq.question}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-white/65">{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.02)_100%)] p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">Siguiente paso</p>
            <h4 className="mt-2 text-xl font-black">Agenda una sesión de estrategia.</h4>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Revisamos tu operación, definimos metas y te mostramos cómo Punto IA puede incrementar recurrencia con implementación rápida.
            </p>
            <div className="mt-5 space-y-2">
              <Link href="/#registro" className="block rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-[#111322] transition hover:bg-white/90">
                Quiero mi demo
              </Link>
              <Link href="/" className="block rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10">
                Volver a inicio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
