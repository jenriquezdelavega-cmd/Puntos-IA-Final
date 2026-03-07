import {
  CtaPanel,
  FaqBlock,
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

const features = [
  {
    icon: '💳',
    title: 'Wallet listo desde el día uno',
    description: 'Tus clientes activan su pase en segundos y vuelven con menos fricción.',
  },
  {
    icon: '🎯',
    title: 'Campañas para aumentar recurrencia',
    description: 'Configuras incentivos por comportamiento para mejorar visitas y recompra.',
  },
  {
    icon: '🧩',
    title: 'Operación simple para tu equipo',
    description: 'Check-in y canje claros para caja y piso, sin procesos complejos.',
  },
  {
    icon: '📊',
    title: 'Métricas accionables',
    description: 'Ves activación, visitas y canjes para tomar decisiones cada semana.',
  },
];

const faqs = [
  {
    question: '¿Qué problema resuelve Punto IA?',
    answer: 'Te ayuda a subir visitas repetidas y retención con un programa de lealtad medible.',
  },
  {
    question: '¿Cuánto tarda la implementación?',
    answer: 'Normalmente entre 3 y 7 días hábiles para salir en producción.',
  },
  {
    question: '¿Cómo empiezo?',
    answer: 'Solicita demo o agenda diagnóstico. En la llamada definimos el plan de activación.',
  },
];

export default function NegociosPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffaf8] text-[#231644]">
      <MarketingBackground />
      <MarketingHeader badge="Ruta B2B para negocios" primaryCta={{ href: '#demo', label: 'Solicitar demo' }} />

      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 pb-14 pt-10 lg:grid-cols-[1.08fr,0.92fr] lg:items-center">
        <Reveal>
          <div>
            <p className="inline-flex rounded-full border border-[#e8dcf7] bg-white px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#7d68a5]">
              Conversión comercial clara
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Más visitas repetidas,
              <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] bg-clip-text text-transparent">
                menos complejidad operativa.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#5f4e84] sm:text-lg">
              Punto IA centraliza wallet, recompensas y seguimiento para que tu equipo opere simple y tú decidas con datos.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard value="3-7 días" label="Implementación típica" />
              <StatCard value="1 panel" label="Campañas y canjes" />
              <StatCard value="+20%" label="Mejora referencial en recurrencia" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <aside id="demo" className="rounded-[2rem] border border-[#d7c4f2] bg-white p-6 shadow-[0_20px_44px_rgba(95,56,148,0.16)] md:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a74b3]">Empieza aquí</p>
            <h2 className="mt-3 text-2xl font-black md:text-3xl">Solicitar demo</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5f4e84]">Formulario corto para que ventas te contacte y agende diagnóstico.</p>
            <form className="mt-6 grid gap-3" action="mailto:ventas@puntoia.mx" method="post" encType="text/plain">
              <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="negocio">Nombre del negocio</label>
              <input id="negocio" name="Negocio" className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm text-[#231644] focus:border-[#7c3aed] focus:outline-none" required />

              <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="contacto">Persona de contacto</label>
              <input id="contacto" name="Contacto" className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm text-[#231644] focus:border-[#7c3aed] focus:outline-none" required />

              <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="whatsapp">WhatsApp</label>
              <input id="whatsapp" name="WhatsApp" className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm text-[#231644] focus:border-[#7c3aed] focus:outline-none" required />

              <div className="mt-2 flex flex-wrap gap-2">
                <button type="submit" className={buttonStyles('primary')}>Solicitar demo</button>
                <a href="mailto:ventas@puntoia.mx?subject=Agendar%20diagn%C3%B3stico%20Punto%20IA" className={buttonStyles('secondary')}>Agendar diagnóstico</a>
              </div>
              <a href="mailto:ventas@puntoia.mx?subject=Hablar%20con%20ventas%20Punto%20IA" className={buttonStyles('tertiary')}>Hablar con ventas</a>
            </form>
          </aside>
        </Reveal>
      </section>

      <Reveal>
        <TrustStrip items={['Qué resuelve: recurrencia y retención', 'Cómo funciona: wallet + reglas + campañas', 'Cómo se empieza: demo corta y plan de activación']} />
      </Reveal>

      <Reveal>
        <SectionBand tone="dark">
          <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Video demo</p>
              <h2 className="mt-3 text-3xl font-black">Mira cómo se ve Punto IA en operación real</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/80">
                En este video puedes ver el enfoque del producto y cómo se traduce en una experiencia simple para negocio y cliente.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-black/30">
              <div className="aspect-video">
                <iframe
                  src="https://player.vimeo.com/video/1165202097?h=copy"
                  className="h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  title="Video Punto IA para negocios"
                />
              </div>
            </div>
          </div>
        </SectionBand>
      </Reveal>

      <Section eyebrow="Qué obtienes" title="Plataforma lista para crecer con claridad" description="Solo lo necesario para lanzar, operar y mejorar resultados.">
        <StaggerGrid className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <StaggerItem key={feature.title}><FeatureCard icon={feature.icon} title={feature.title} description={feature.description} /></StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <Section eyebrow="Preguntas clave" title="Lo esencial para decidir rápido" description="Respuestas directas para avanzar con claridad.">
        <FaqBlock items={faqs} />
      </Section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-2">
        <Reveal>
          <CtaPanel
            title="Listo para empezar"
            description="Solicita demo, agenda diagnóstico o habla con ventas para definir tu plan de activación."
            primary={{ href: '#demo', label: 'Solicitar demo' }}
            secondary={{ href: 'mailto:ventas@puntoia.mx?subject=Agendar%20diagn%C3%B3stico%20Punto%20IA', label: 'Agendar diagnóstico' }}
          />
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
