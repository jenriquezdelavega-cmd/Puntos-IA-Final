import {
  BrandSpotlight,
  CtaPanel,
  FeatureCard,
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  Section,
  SectionBand,
  StatCard,
  TrustStrip,
  buttonStyles,
} from '../components/marketing/ui';
import { Reveal, StaggerGrid, StaggerItem } from '../components/marketing/effects';

const pains = [
  'Tus clientes compran una vez y no regresan con frecuencia.',
  'Tu equipo opera promociones manuales que consumen tiempo en caja.',
  'No tienes claridad de qué campaña realmente genera recompra.',
];

const howItWorks = [
  {
    step: '1',
    title: 'Activamos tu programa',
    description: 'Definimos reglas simples de visitas o puntos para tu negocio y dejamos wallet lista.',
  },
  {
    step: '2',
    title: 'Tu equipo opera en segundos',
    description: 'Check-ins y canjes claros en caja para no frenar la atención al cliente.',
  },
  {
    step: '3',
    title: 'Optimiza con datos reales',
    description: 'Mides activaciones, recurrencia y canjes para ajustar campañas con criterio comercial.',
  },
];

const features = [
  {
    icon: '💳',
    title: 'Wallet sin app adicional',
    description: 'Tus clientes guardan su pase en Apple Wallet o Google Wallet desde el día uno.',
  },
  {
    icon: '🧠',
    title: 'Campañas fáciles de entender',
    description: 'Premios y metas claras que tu cliente entiende en segundos.',
  },
  {
    icon: '📊',
    title: 'Panel para tomar decisiones',
    description: 'Visualiza desempeño por sucursal, campaña y periodo sin hojas de cálculo.',
  },
  {
    icon: '⚙️',
    title: 'Implementación guiada',
    description: 'Normalmente quedas operando en 3 a 7 días hábiles con acompañamiento.',
  },
];

export default function NegociosPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffdfb] text-[#1d1238]">
      <MarketingBackground />
      <MarketingHeader badge="Ruta para negocios" primaryCta={{ href: '#demo', label: 'Agendar demo' }} />

      <section className="relative mx-auto grid w-full max-w-7xl gap-8 px-6 pb-12 pt-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <Reveal>
          <div>
            <p className="inline-flex rounded-full border border-[#e6d5f8] bg-white px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#61488f]">
              Solución para aumentar recurrencia
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Convierte visitas sueltas en
              <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] bg-clip-text text-transparent">
                clientes que regresan.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#433061] sm:text-lg">
              Punto IA resuelve el problema de retención: te ayuda a crear hábitos de compra repetida con un sistema simple para tu equipo y claro para tu cliente.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard value="3-7 días" label="Tiempo típico de implementación" />
              <StatCard value="1 panel" label="Control de campañas y resultados" />
              <StatCard value="+20%" label="Mejora referencial en recurrencia" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="grid gap-4">
            <BrandSpotlight caption="Una presencia de marca más llamativa y profesional para elevar confianza desde el primer scroll." />
          <aside id="demo" className="rounded-[2rem] border border-[#e9dbf7] bg-white p-6 shadow-[0_20px_52px_rgba(45,23,84,0.1)] md:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#71539f]">Acción principal</p>
            <h2 className="mt-3 text-2xl font-black md:text-3xl">Agenda una demo guiada</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#3f2d63]">Te mostramos exactamente cómo funciona en tu tipo de negocio y qué plan conviene para empezar.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="mailto:ventas@puntoia.mx?subject=Demo%20Punto%20IA" className={buttonStyles('primary')}>Quiero mi demo</a>
              <a href="mailto:ventas@puntoia.mx?subject=Diagnostico%20Punto%20IA" className={buttonStyles('secondary')}>Prefiero diagnóstico</a>
            </div>
            <p className="mt-4 text-xs text-[#6f5a99]">También puedes escribir directo a ventas@puntoia.mx.</p>
          </aside>
          </div>
        </Reveal>
      </section>

      <Reveal><TrustStrip items={['Valor explicado en lenguaje comercial', 'Proceso de implementación en 3 pasos', 'CTA principal único: agendar demo']} /></Reveal>

      <Section eyebrow="Qué problema resolvemos" title="Si hoy te cuesta retener clientes, aquí está el cambio" description="El foco no es regalar descuentos; el foco es crear recurrencia medible y sostenible.">
        <div className="grid gap-3">
          {pains.map((pain) => (
            <article key={pain} className="rounded-2xl border border-[#ebdef8] bg-white p-5 text-sm text-[#57467d]">
              • {pain}
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Cómo funciona" title="Tres pasos para empezar sin complejidad" description="Un flujo simple para lanzar, operar y optimizar.">
        <StaggerGrid className="grid gap-4 md:grid-cols-3">
          {howItWorks.map((item) => (
            <StaggerItem key={item.step}>
              <article className="rounded-3xl border border-[#ebdef8] bg-white p-6">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dac6f1] text-xs font-black text-[#7f3cf1]">{item.step}</span>
                <h3 className="mt-4 text-xl font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#645489]">{item.description}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <Reveal>
        <SectionBand>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8c75b5]">Qué incluye</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-[#231644] md:text-5xl">Qué incluye la plataforma</h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#5f4e84] md:text-lg">Todo lo necesario para operar lealtad sin fricción.</p>
          <div className="mt-8">
            <StaggerGrid className="grid gap-4 md:grid-cols-2">
              {features.map((feature) => (
                <StaggerItem key={feature.title}><FeatureCard icon={feature.icon} title={feature.title} description={feature.description} /></StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </SectionBand>
      </Reveal>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-2">
        <Reveal>
          <CtaPanel
            title="¿Listo para ver cómo se vería en tu negocio?"
            description="Agenda una demo y sal con un plan claro de implementación, tiempos y próximos pasos."
            primary={{ href: 'mailto:ventas@puntoia.mx?subject=Demo%20Punto%20IA', label: 'Agendar demo ahora' }}
            secondary={{ href: '/', label: 'Volver al hub principal' }}
          />
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
