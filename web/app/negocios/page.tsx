import Link from 'next/link';

const benefits = [
  {
    title: 'Fidelización simple y medible',
    desc: 'Convierte visitas en clientes recurrentes con mecánicas claras de check-in y recompensa.',
    icon: '🎯',
  },
  {
    title: 'Clientes compartidos entre aliados',
    desc: 'Tu negocio aparece en el ecosistema Punto IA y gana visibilidad frente a nuevos consumidores.',
    icon: '🤝',
  },
  {
    title: 'Control y operación rápida',
    desc: 'Valida canjes, genera códigos diarios y supervisa actividad desde panel administrativo.',
    icon: '⚡',
  },
  {
    title: 'Data para decisiones',
    desc: 'Exporta reportes de clientes, visitas y preinscritos para ejecutar mejores campañas.',
    icon: '📊',
  },
];

export default function NegociosPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f1020] via-[#171833] to-[#0f1020] text-white">
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-md p-7 md:p-10 shadow-2xl">
          <p className="inline-flex rounded-full border border-fuchsia-300/40 bg-fuchsia-400/10 px-4 py-1 text-xs font-black tracking-[0.2em] uppercase text-fuchsia-200">
            Punto IA para Negocios
          </p>
          <h1 className="mt-5 text-4xl md:text-6xl font-black leading-tight">
            Convierte cada visita en lealtad real.
          </h1>
          <p className="mt-4 max-w-3xl text-white/85 text-base md:text-lg font-semibold">
            Inspirado en experiencias modernas de loyalty, Punto IA ayuda a restaurantes, cafeterías y comercios a
            aumentar recurrencia, atraer nuevos clientes y medir resultados sin complejidad técnica.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/?clientes=1"
              className="rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-400 transition px-6 py-3 font-black text-white shadow-xl"
            >
              Ver experiencia de clientes
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-white/30 bg-white/10 hover:bg-white/20 transition px-6 py-3 font-black"
            >
              Volver al teaser
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {benefits.map((b) => (
            <article key={b.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <div className="text-3xl">{b.icon}</div>
              <h2 className="mt-3 text-2xl font-black">{b.title}</h2>
              <p className="mt-2 text-white/80 font-semibold">{b.desc}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-6 md:p-8">
          <h3 className="text-2xl font-black">¿Qué incluye para tu operación?</h3>
          <ul className="mt-4 grid gap-2 text-white/90 font-semibold md:grid-cols-2">
            <li>✅ Configuración de recompensas por negocio</li>
            <li>✅ Códigos diarios para check-in seguro</li>
            <li>✅ Flujo rápido de validación de canjes</li>
            <li>✅ Reportes CSV para marketing y operación</li>
            <li>✅ Perfil de negocio con mapa e Instagram</li>
            <li>✅ Soporte para red de aliados multi-negocio</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
