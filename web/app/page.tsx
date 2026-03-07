import Link from 'next/link';
import {
  CtaPanel,
  FeatureCard,
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  Section,
  SectionBand,
  SocialProof,
  StatCard,
  TrustStrip,
} from './components/marketing/ui';
import { GlowPulse, Reveal, StaggerGrid, StaggerItem } from './components/marketing/effects';

const journeys = [
  {
    href: '/negocios',
    title: 'Negocios',
    summary: 'Implementa un programa de lealtad completo con wallet, campañas y métricas accionables.',
    points: ['Enfoque en recurrencia y ticket', 'Implementación guiada', 'Operación simple para tu equipo'],
  },
  {
    href: '/clientes',
    title: 'Clientes',
    summary: 'Activa un pase digital, acumula visitas o puntos y canjea recompensas desde wallet.',
    points: ['Sin descargar app', 'Flujo en segundos', 'Beneficios visibles y claros'],
  },
  {
    href: '/aliados',
    title: 'Aliados',
    summary: 'Co-crea crecimiento con un programa de partnership diseñado para PyMEs y ecosistemas locales.',
    points: ['Modelo de co-selling', 'Enablement comercial', 'Acompañamiento de implementación'],
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05050a] text-white">
      <MarketingBackground />
      <MarketingHeader primaryCta={{ href: '/negocios#demo', label: 'Solicitar demo' }} />

      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 pb-14 pt-10 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
        <Reveal>
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white/70">
              Plataforma SaaS para lealtad en PyMEs de México
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Punto IA convierte
              <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] bg-clip-text text-transparent">
                visitas en crecimiento real.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Diseñamos experiencias de lealtad premium para negocio y cliente final: wallet, check-ins, recompensas y seguimiento comercial en una sola plataforma.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/negocios" className="rounded-2xl bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] px-6 py-3.5 text-sm font-black text-white shadow-[0_14px_40px_rgba(255,63,142,0.4)] transition hover:translate-y-[-1px]">
                Ver solución para negocio
              </Link>
              <Link href="/clientes" className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white/90 transition hover:bg-white/10">
                Ver experiencia cliente
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="relative">
            <GlowPulse />
            <div className="relative rounded-[2rem] border border-white/15 bg-black/40 p-4 backdrop-blur-xl sm:p-6">
              <div className="rounded-3xl border border-white/10 bg-[#0c0d16] p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Panel operativo</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <StatCard value="2,340" label="Pases activos" />
                  <StatCard value="64%" label="Visitas recurrentes" />
                  <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-gradient-to-r from-[#ff7a59]/20 via-[#ff3f8e]/12 to-[#a855f7]/8 p-4">
                    <p className="text-xs text-white/55">Campaña en ejecución</p>
                    <p className="mt-1 text-lg font-black">Semana de visitas dobles</p>
                    <p className="mt-2 text-sm text-white/70">+22% check-ins y +14% canjes en 10 días.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <Reveal>
        <TrustStrip items={['Onboarding en 3–7 días hábiles', 'Sin app obligatoria para cliente final', 'Experiencia consistente para negocios, clientes y aliados']} />
      </Reveal>

      <Section
        eyebrow="Arquitectura del sitio"
        title="Home como hub de decisión rápida"
        description="Elegimos un hub premium: mejora claridad, evita ruido narrativo y dirige a cada audiencia con intención comercial específica."
      >
        <StaggerGrid className="grid gap-4 lg:grid-cols-3">
          {journeys.map((item) => (
            <StaggerItem key={item.href}>
              <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20 hover:bg-white/[0.06]">
                <h3 className="text-2xl font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/65">{item.summary}</p>
                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  {item.points.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
                <Link href={item.href} className="mt-6 inline-flex text-sm font-black text-[#ff9f90] transition hover:text-[#ffc3b8]">
                  Explorar ruta →
                </Link>
              </article>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <Reveal>
        <SectionBand>
          <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Cómo opera Punto IA</p>
              <h3 className="mt-3 text-2xl font-black md:text-3xl">Implementación rápida con impacto visible</h3>
              <p className="mt-4 text-sm leading-relaxed text-white/70 md:text-base">
                Levantamos la estrategia, activamos wallet y dejamos a tu equipo operando en días. Después optimizamos con datos reales de visitas y canjes.
              </p>
            </div>
            <ol className="grid gap-3 text-sm text-white/75">
              <li className="rounded-xl border border-white/10 bg-black/25 p-4"><span className="font-black text-white">1.</span> Diagnóstico de ticket, frecuencia y metas comerciales.</li>
              <li className="rounded-xl border border-white/10 bg-black/25 p-4"><span className="font-black text-white">2.</span> Configuración de reglas de visitas/puntos y recompensas.</li>
              <li className="rounded-xl border border-white/10 bg-black/25 p-4"><span className="font-black text-white">3.</span> Lanzamiento con seguimiento y mejora continua.</li>
            </ol>
          </div>
        </SectionBand>
      </Reveal>


      <Section
        eyebrow="Confianza comercial"
        title="Resultados observados en pilotos PyME"
        description="Contexto realista para dimensionar impacto sin promesas exageradas."
      >
        <SocialProof
          cases={[
            { name: 'Café Luna (Monterrey)', result: '+19% recurrencia', context: 'Después de 8 semanas con wallet + visitas dobles en horario valle.' },
            { name: 'Barbería Norte (CDMX)', result: '+24% canjes', context: 'Con campaña por frecuencia y recompensa de mantenimiento.' },
            { name: 'Taquería Centro (Guadalajara)', result: '+17% ticket recurrente', context: 'Al combinar puntos y retos semanales para clientes frecuentes.' },
          ]}
        />
      </Section>

      <Section
        eyebrow="Producto"
        title="Un sistema, múltiples palancas de crecimiento"
        description="Reducimos repetición de bloques con una narrativa funcional: qué resuelve, cómo opera y qué impacto puede generar."
      >
        <StaggerGrid className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StaggerItem><FeatureCard icon="📱" title="Wallet nativo" description="Activación de pase en Apple Wallet y Google Wallet sin descargar apps." /></StaggerItem>
          <StaggerItem><FeatureCard icon="🔁" title="Visitas y puntos" description="Reglas por recurrencia para mantener hábito de compra y retorno." /></StaggerItem>
          <StaggerItem><FeatureCard icon="🎯" title="Campañas" description="Incentivos segmentados por comportamiento, temporada o prioridad comercial." /></StaggerItem>
          <StaggerItem><FeatureCard icon="📈" title="Seguimiento" description="Métricas de activación, visitas y canjes para mejorar decisiones mes a mes." /></StaggerItem>
        </StaggerGrid>
      </Section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-2">
        <Reveal>
          <CtaPanel
            title="¿Qué ruta quieres activar primero?"
            description="Negocio, cliente o aliado: cada perfil tiene una experiencia diseñada para comunicar valor en menos tiempo y convertir con mayor claridad."
            primary={{ href: '/negocios#demo', label: 'Empezar con negocio' }}
            secondary={{ href: '/aliados', label: 'Conocer programa de aliados' }}
          />
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
