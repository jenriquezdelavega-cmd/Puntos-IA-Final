import {
  CtaPanel,
  FeatureCard,
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  Section,
  SectionBand,
  StatCard,
  TrustStrip,
} from '../components/marketing/ui';
import { GlowPulse, Reveal, StaggerGrid, StaggerItem } from '../components/marketing/effects';

const flow = [
  {
    step: '1',
    title: 'Activa tu pase',
    description: 'Escaneas el QR del negocio y guardas el pase en wallet en menos de un minuto.',
  },
  {
    step: '2',
    title: 'Acumula visitas o puntos',
    description: 'Cada visita suma automáticamente. Tú solo disfrutas tu experiencia normal de compra.',
  },
  {
    step: '3',
    title: 'Canjea en segundos',
    description: 'Cuando desbloqueas un premio lo presentas en caja y se valida al momento.',
  },
];

const benefits = [
  {
    icon: '⚡',
    title: 'Cero fricción',
    description: 'No necesitas crear cuentas complejas ni descargar una app adicional.',
  },
  {
    icon: '🎁',
    title: 'Beneficios reales',
    description: 'Tienes visibilidad clara de progreso y recompensas disponibles.',
  },
  {
    icon: '🔒',
    title: 'Confianza',
    description: 'Tu historial de visitas y canjes queda registrado en un solo pase digital.',
  },
  {
    icon: '📍',
    title: 'Experiencia local',
    description: 'Participas en los negocios que frecuentas, con recompensas relevantes para ti.',
  },
];

export default function ClientesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05050a] text-white">
      <MarketingBackground />
      <MarketingHeader badge="Ruta para cliente final" primaryCta={{ href: '/negocios#demo', label: 'Soy negocio' }} />

      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 pb-14 pt-10 lg:grid-cols-[1fr,1fr] lg:items-center">
        <Reveal><div>
          <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white/70">
            Experiencia cliente clara y real
          </p>
          <h1 className="mt-6 text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            Tu lealtad vive en
            <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] bg-clip-text text-transparent">
              tu wallet diaria.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Con Punto IA activas un pase digital, acumulas beneficios en tus lugares favoritos y canjeas sin complicaciones.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatCard value="1 min" label="Tiempo promedio de activación" />
            <StatCard value="QR" label="Check-in por visita" />
            <StatCard value="Wallet" label="Todo desde tu celular" />
          </div>
        </div></Reveal>

        <Reveal delay={0.08}><div className="relative">
          <GlowPulse />
          <div className="relative mx-auto grid max-w-lg gap-4 rounded-[2rem] border border-white/15 bg-black/30 p-5 backdrop-blur-xl sm:p-6">
            <article className="rounded-3xl border border-white/10 bg-[#0f111c] p-5">
              <p className="text-xs text-white/50">Pase digital activo</p>
              <h2 className="mt-2 text-xl font-black">Café Luna • Lealtad</h2>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7]" />
              </div>
              <p className="mt-2 text-sm text-white/65">6 de 8 visitas para desbloquear bebida gratis</p>
            </article>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-white/50">Próxima recompensa</p>
                <p className="mt-2 text-lg font-black">Postre premium</p>
                <p className="text-xs text-white/60">Se activa con 2 visitas más</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-white/50">Canjes recientes</p>
                <p className="mt-2 text-lg font-black">3 este mes</p>
                <p className="text-xs text-white/60">Historial visible en wallet</p>
              </article>
            </div>
          </div>
        </div></Reveal>
      </section>

      <Reveal><TrustStrip items={['Sin descargas adicionales', 'Flujo simple para cualquier edad', 'Canje con validación rápida en negocio']} /></Reveal>


      <Reveal><SectionBand>
        <div className="grid gap-5 lg:grid-cols-[1fr,1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Experiencia diaria</p>
            <h3 className="mt-3 text-2xl font-black md:text-3xl">Todo en un pase que ya vive en tu celular</h3>
            <p className="mt-4 text-sm leading-relaxed text-white/70">No cambias hábitos ni instalas nuevas apps. Escaneas, sumas y canjeas cuando te convenga.</p>
          </div>
          <div className="grid gap-3 text-sm text-white/75">
            <p className="rounded-xl border border-white/10 bg-black/25 p-4">• Progress bar visible para saber cuánto falta.</p>
            <p className="rounded-xl border border-white/10 bg-black/25 p-4">• Recompensas claras, sin letras chiquitas.</p>
            <p className="rounded-xl border border-white/10 bg-black/25 p-4">• Historial de canjes y visitas en wallet.</p>
          </div>
        </div>
      </SectionBand></Reveal>

      <Section eyebrow="Flujo" title="Activar → acumular → canjear" description="Una experiencia corta, comprensible y consistente en cada negocio participante.">
        <StaggerGrid className="grid gap-4 md:grid-cols-3">
          {flow.map((item) => (
            <StaggerItem key={item.step}>
            <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-xs font-black text-[#ffae9c]">{item.step}</span>
              <h3 className="mt-4 text-xl font-black">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{item.description}</p>
            </article>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <Section eyebrow="Beneficios" title="Diseño pensado para que sí lo uses" description="Esta página elimina contenido interno y comunica la propuesta real con lenguaje simple y directo.">
        <StaggerGrid className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <StaggerItem key={benefit.title}><FeatureCard icon={benefit.icon} title={benefit.title} description={benefit.description} /></StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-2">
        <Reveal><CtaPanel
          title="¿Tu negocio favorito todavía no está?"
          description="Invítalo a usar Punto IA para que puedas activar tu pase y comenzar a acumular beneficios desde tu próxima visita."
          primary={{ href: '/negocios#demo', label: 'Invitar un negocio' }}
          secondary={{ href: '/', label: 'Ir al hub principal' }}
        /></Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
