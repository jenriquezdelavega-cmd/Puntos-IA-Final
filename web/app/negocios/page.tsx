import Link from 'next/link';

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

const pillars = [
  {
    icon: '🔄',
    tag: 'Retención',
    title: 'Clientes que regresan, no que desaparecen',
    desc: 'Cada visita suma puntos reales. Tu cliente ve su avance, siente la recompensa cerca y regresa con intención.',
    detail: 'Deja de regalar descuentos sin retorno. Construye hábitos de compra medibles.',
  },
  {
    icon: '⚡',
    tag: 'Operación',
    title: 'Tu equipo lo usa en 5 minutos',
    desc: 'Genera el QR del día, escanea el pase del cliente y valida canjes. Sin apps complicadas ni capacitación larga.',
    detail: 'Diseñado para meseros, cajeros y encargados, no para ingenieros.',
  },
  {
    icon: '🗺️',
    tag: 'Coalición',
    title: 'Red de negocios que se impulsan entre sí',
    desc: 'Tu negocio aparece en el mapa de aliados. Clientes de otros negocios te descubren por proximidad e interés.',
    detail: 'Tráfico nuevo sin pagar publicidad. La coalición te trae clientes.',
  },
  {
    icon: '📊',
    tag: 'Inteligencia',
    title: 'Datos que entiendes y puedes usar',
    desc: 'Tendencias de visita, distribución de género y edad, días fuertes. Exporta tu base de clientes en un clic.',
    detail: 'Toma decisiones con datos, no con corazonadas.',
  },
];

const howItWorks = [
  { step: '01', title: 'Te registras en 5 minutos', desc: 'Deja tus datos, configuramos tu negocio, premio y pase digital. Sin instalar nada.' },
  { step: '02', title: 'Tu equipo genera el QR diario', desc: 'Un código único cada día. Lo muestras en el mostrador o lo compartes por WhatsApp.' },
  { step: '03', title: 'Tus clientes escanean y suman', desc: 'Abren la cámara, escanean el QR, y sus visitas se acumulan en su pase de Apple Wallet.' },
  { step: '04', title: 'Llegan al premio y regresan', desc: 'Al completar las visitas, generan su código de canje. Tú validas y entregas el premio.' },
];

const plans = [
  {
    name: 'Fundador',
    subtitle: 'Pre-lanzamiento',
    price: '$0',
    cadence: 'sin costo mientras dure',
    cta: 'Unirme gratis',
    features: ['1 sucursal', 'Pase digital Apple Wallet', 'QR diario + check-ins', 'Dashboard con reportes', 'Mapa de negocios aliados'],
  },
  {
    name: 'Crecimiento',
    subtitle: 'Para escalar',
    price: '$1,490',
    cadence: 'MXN / mes',
    cta: 'Quiero este plan',
    highlight: true,
    features: ['Hasta 3 sucursales', 'Todo lo del plan Fundador', 'Reportes avanzados CSV', 'Personalización completa del pase', 'Soporte prioritario WhatsApp'],
  },
  {
    name: 'Enterprise',
    subtitle: 'Multi-sucursal',
    price: 'A medida',
    cadence: 'según operación',
    cta: 'Hablar con ventas',
    features: ['Sucursales ilimitadas', 'Acompañamiento estratégico', 'Integraciones a medida', 'SLA dedicado', 'Onboarding personalizado'],
  },
];

const faqs = [
  { q: '¿Cuánto tiempo toma empezar?', a: 'Menos de una semana. Configuramos tu negocio, capacitamos a tu equipo y activas tu primer QR.' },
  { q: '¿Funciona para mi tipo de negocio?', a: 'Sí. Cafeterías, taquerías, restaurantes, estéticas, gimnasios, tiendas — cualquier negocio con clientes recurrentes.' },
  { q: '¿Mis clientes necesitan descargar una app?', a: 'No. El pase se agrega directo a Apple Wallet desde el navegador. Sin descargas, sin registro complicado.' },
  { q: '¿Qué pasa si cambio de premio o reglas?', a: 'Lo cambias desde tu panel de administración en cualquier momento. Los pases se actualizan automáticamente.' },
  { q: '¿Necesito equipo técnico?', a: 'No. Punto IA está diseñado para dueños y staff operativo. Si sabes usar WhatsApp, sabes usar Punto IA.' },
  { q: '¿Mis clientes de otros negocios me pueden encontrar?', a: 'Sí. Tu negocio aparece en el mapa de la coalición. Clientes de negocios aliados te descubren naturalmente.' },
];

const testimonials = [
  { name: 'María, cafetería', quote: 'Mis clientes ahora me dicen "ya me falta poquito para mi café gratis". Antes ni se acordaban que existía la tarjetita.' },
  { name: 'Roberto, taquería', quote: 'Lo mejor es que no tengo que explicar nada complicado. El cajero escanea, el cliente ve sus puntos, y ya.' },
  { name: 'Lupita, estética', quote: 'Me llegan clientas nuevas que dicen que me encontraron en el mapa de Punto IA. Eso antes no pasaba.' },
];

export default function NegociosPage() {
  return (
    <main className="min-h-screen bg-[#080812] text-white">
      <nav className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <Link href="/" className="scale-[0.6] origin-left"><PuntoIALogo /></Link>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white/50 text-sm font-bold hover:text-white transition hidden sm:block">Inicio</Link>
          <Link href="/?clientes=1" className="bg-white/10 border border-white/20 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/20 transition">
            Soy Cliente
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff7a59]/25 via-[#ff2f87]/15 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-br from-[#ff7a59]/20 via-[#ff3f8e]/15 to-transparent rounded-full blur-[100px]" />

        <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ff3f8e]/40 bg-[#ff3f8e]/15 px-4 py-1.5 text-[11px] font-black tracking-[0.18em] uppercase text-pink-200">
            Para dueños de negocio
          </span>

          <h1 className="mt-7 text-4xl md:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight max-w-5xl mx-auto">
            Que tus clientes regresen
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7]">
              no sea cuestión de suerte
            </span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-white/65 text-base md:text-lg font-medium leading-relaxed">
            Punto IA te da un programa de lealtad profesional sin complicaciones.
            Pase digital en Apple Wallet, QR diario, dashboard con datos reales
            y una red de negocios aliados que se impulsan entre sí.
          </p>

          <div className="mt-9 flex flex-wrap gap-3 justify-center">
            <Link href="/" className="bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] text-white font-black px-8 py-4 rounded-2xl shadow-[0_8px_32px_rgba(255,63,142,0.4)] hover:shadow-[0_12px_40px_rgba(255,63,142,0.5)] transition-all text-lg">
              Registrar mi negocio
            </Link>
            <Link href="/?clientes=1" className="border border-white/25 bg-white/5 text-white font-bold px-6 py-4 rounded-2xl hover:bg-white/10 transition">
              Ver como cliente →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { stat: '5x–7x', desc: 'más rentable retener que buscar clientes nuevos' },
            { stat: '+40%', desc: 'más visitas con un programa de lealtad activo' },
            { stat: '4 sem', desc: 'para convertir un visitante ocasional en habitual' },
          ].map((f) => (
            <div key={f.stat} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e]">{f.stat}</p>
              <p className="mt-2 text-white/60 text-sm font-medium">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 md:py-14">
        <div className="text-center mb-10">
          <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white/40">Por qué Punto IA</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black max-w-3xl mx-auto leading-tight">Todo lo que necesitas para que tus clientes regresen</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {pillars.map((item) => (
            <article key={item.title} className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6 md:p-7 hover:border-white/20 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-[10px] font-black tracking-[0.15em] uppercase text-pink-300/80">{item.tag}</span>
              </div>
              <h3 className="text-xl font-black leading-tight">{item.title}</h3>
              <p className="mt-2 text-white/70 font-medium leading-relaxed">{item.desc}</p>
              <p className="mt-3 text-sm text-white/45 font-medium italic">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 md:py-14">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
          <div className="text-center mb-8">
            <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white/40">Así funciona</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-black">De cero a recurrencia en 4 pasos</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((r) => (
              <div key={r.step} className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] text-sm font-black mb-3">{r.step}</span>
                <h4 className="text-base font-black">{r.title}</h4>
                <p className="mt-2 text-white/60 text-sm font-medium leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-8 md:py-14">
        <div className="text-center mb-8">
          <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white/40">Lo que dicen nuestros aliados</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-black">Negocios reales, resultados reales</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-white/80 font-medium leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e]">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="text-center mb-8">
          <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white/40">Planes</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-black">Empieza gratis, crece cuando quieras</h2>
          <p className="mt-2 text-white/50 font-medium">Sin contratos, sin letras chiquitas.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`rounded-3xl border p-6 md:p-7 ${plan.highlight ? 'border-[#ff3f8e]/50 bg-gradient-to-b from-[#ff3f8e]/15 to-transparent ring-1 ring-[#ff3f8e]/20' : 'border-white/10 bg-white/[0.03]'}`}>
              {plan.highlight && (
                <span className="inline-flex rounded-full bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] text-white text-[10px] font-black uppercase tracking-[0.12em] px-3 py-1 mb-3">
                  Más popular
                </span>
              )}
              <h4 className="text-2xl font-black">{plan.name}</h4>
              <p className="text-white/60 font-medium text-sm">{plan.subtitle}</p>
              <div className="mt-4">
                <p className="text-4xl font-black">{plan.price}</p>
                <p className="text-white/50 font-medium text-sm mt-1">{plan.cadence}</p>
              </div>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm font-medium text-white/80">
                    <span className="text-pink-400 mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/" className={`mt-6 flex items-center justify-center w-full rounded-xl py-3 font-black text-sm transition ${plan.highlight ? 'bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] text-white shadow-lg hover:shadow-xl' : 'border border-white/20 bg-white/5 text-white hover:bg-white/10'}`}>
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-8 md:py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black">Preguntas frecuentes</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h4 className="font-black text-base">{f.q}</h4>
              <p className="mt-2 text-white/60 font-medium text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10 md:py-14">
        <div className="rounded-3xl border border-[#ff3f8e]/30 bg-gradient-to-r from-[#ff7a59]/15 via-[#ff3f8e]/15 to-[#a855f7]/15 p-8 md:p-12 text-center">
          <h3 className="text-3xl md:text-4xl font-black leading-tight">
            ¿Listo para que tus clientes
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a59] to-[#a855f7]">regresen con ganas?</span>
          </h3>
          <p className="mt-4 text-white/60 font-medium max-w-xl mx-auto">
            Regístrate hoy como aliado fundador. Sin costo durante el pre-lanzamiento, sin contratos, sin riesgo.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] text-white font-black px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all">
              Registrar mi negocio gratis
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="scale-[0.5] origin-left"><PuntoIALogo /></div>
            <p className="text-white/30 text-xs font-semibold">Coalición de PyMEs · Hecho en México 🇲🇽</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/30 text-xs font-bold hover:text-white/60 transition">Inicio</Link>
            <Link href="/?clientes=1" className="text-white/30 text-xs font-bold hover:text-white/60 transition">Soy Cliente</Link>
            <Link href="/aliados" className="text-white/30 text-xs font-bold hover:text-white/60 transition">Aliados</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
