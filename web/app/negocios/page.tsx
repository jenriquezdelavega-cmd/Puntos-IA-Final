import {
  CtaPanel,
  FaqBlock,
  FeatureCard,
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  Section,
  SectionBand,
  SocialProof,
  StatCard,
  TrustStrip,
  buttonStyles,
} from '../components/marketing/ui';
import { Reveal, StaggerGrid, StaggerItem } from '../components/marketing/effects';

const features = [
  {
    icon: '💳',
    title: 'Tu wallet está activa desde el día uno',
    description: 'Tus clientes guardan su pase en wallet y comienzan a acumular visitas o puntos sin descargar apps.',
  },
  {
    icon: '🧩',
    title: 'Operación ágil para caja y equipo',
    description: 'Tu equipo registra visitas y canjes en segundos, con un flujo claro y fácil de adoptar.',
  },
  {
    icon: '🎯',
    title: 'Campañas diseñadas para recurrencia',
    description: 'Configuras incentivos por comportamiento para elevar retorno, recompra y frecuencia.',
  },
  {
    icon: '📊',
    title: 'Métricas para decidir mejor',
    description: 'Visualizas activación, visitas y canjes por sucursal o campaña para optimizar resultados.',
  },
];

const implementation = [
  {
    step: 'Paso 1',
    title: 'Diagnóstico comercial',
    description: 'Alineamos objetivos de frecuencia, ticket promedio y tipo de recompensa según tu operación.',
  },
  {
    step: 'Paso 2',
    title: 'Configuración y lanzamiento',
    description: 'Configuramos reglas, mensajes y operación para lanzar con rapidez, normalmente en 3 a 7 días hábiles.',
  },
  {
    step: 'Paso 3',
    title: 'Seguimiento y optimización',
    description: 'Analizamos desempeño y ajustamos campañas para sostener crecimiento mes a mes.',
  },
];

const faqs = [
  {
    question: '¿Qué problema resuelve Punto IA para mi negocio?',
    answer: 'Te ayuda a aumentar visitas repetidas, elevar retención y medir impacto comercial con datos de activación y canje.',
  },
  {
    question: '¿Cuánto tarda implementarse?',
    answer: 'El onboarding suele completarse en 3 a 7 días hábiles, según reglas, contenido y validaciones.',
  },
  {
    question: '¿Puedo usarlo con varias sucursales?',
    answer: 'Sí. Puedes iniciar con una sucursal y escalar al resto con visibilidad centralizada.',
  },
  {
    question: '¿Cómo empiezo?',
    answer: 'Solicita una demo o agenda un diagnóstico; te entregamos un plan de activación por etapas.',
  },
];

export default function NegociosPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f1ff] text-[#1d1238]">
      <MarketingBackground />
      <MarketingHeader badge="Ruta B2B para negocios" primaryCta={{ href: '#demo', label: 'Solicitar demo' }} />

      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 pb-14 pt-10 lg:grid-cols-[1.08fr,0.92fr] lg:items-center">
        <Reveal>
          <div>
            <p className="inline-flex rounded-full border border-[#d4c1f5] bg-[#fdfbff] px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#61488f]">
              Lealtad que impulsa ventas recurrentes
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Más clientes que regresan,
              <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] bg-clip-text text-transparent">
                menos fricción operativa.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#433061] sm:text-lg">
              Punto IA unifica wallet, recompensas y analítica para que tu equipo opere con agilidad y tú decidas con datos.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard value="3-7 días" label="Implementación típica" />
              <StatCard value="1 panel" label="Control centralizado de campañas" />
              <StatCard value="+20%" label="Mejora referencial en recurrencia" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <aside id="demo" className="rounded-[2rem] border border-[#d8c6f7] bg-[#fbf9ff] p-6 shadow-[0_24px_60px_rgba(45,23,84,0.16)] md:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#71539f]">Empieza aquí</p>
            <h2 className="mt-3 text-2xl font-black md:text-3xl">Conversemos sobre tu crecimiento</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#433061]">Déjanos tus datos y te contactamos para preparar una propuesta clara para tu negocio.</p>
            <form className="mt-6 grid gap-3" action="mailto:ventas@puntoia.mx" method="post" encType="text/plain">
              <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="negocio">Nombre del negocio</label>
              <input id="negocio" name="Negocio" className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm text-[#231644] focus:border-[#7c3aed] focus:outline-none" required />
              <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="contacto">Persona de contacto</label>
              <input id="contacto" name="Contacto" className="rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm text-[#231644] focus:border-[#7c3aed] focus:outline-none" required />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="whatsapp">WhatsApp</label>
                  <input id="whatsapp" name="WhatsApp" className="mt-1 w-full rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm text-[#231644] focus:border-[#7c3aed] focus:outline-none" required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#4e3b74]" htmlFor="ciudad">Ciudad</label>
                  <input id="ciudad" name="Ciudad" className="mt-1 w-full rounded-xl border border-[#ddcdf4] bg-[#fffafe] px-4 py-3 text-sm text-[#231644] focus:border-[#7c3aed] focus:outline-none" required />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="submit" className={buttonStyles('primary')}>Solicitar demo</button>
                <a href="mailto:ventas@puntoia.mx?subject=Agendar%20diagn%C3%B3stico%20Punto%20IA" className={buttonStyles('secondary')}>Agendar diagnóstico</a>
              </div>
              <a href="mailto:ventas@puntoia.mx?subject=Hablar%20con%20ventas%20Punto%20IA" className={buttonStyles('tertiary')}>Hablar con ventas</a>
            </form>
          </aside>
        </Reveal>
      </section>

      <Reveal><TrustStrip items={['Impulsa recurrencia y retención', 'Opera con wallet + reglas + campañas', 'Inicia con demo guiada y plan de activación']} /></Reveal>


      <Section
        eyebrow="Producto en acción"
        title="Conoce la experiencia de Punto IA para negocios"
        description="En pocos minutos podrás ver cómo trabaja tu equipo, cómo interactúan tus clientes y dónde se genera el valor comercial."
      >
        <div className="overflow-hidden rounded-[2rem] border border-[#d8c6f7] bg-[#fbf9ff] p-3 shadow-[0_24px_60px_rgba(45,23,84,0.16)]">
          <div className="aspect-video overflow-hidden rounded-2xl bg-[#1a122f]">
            <iframe
              src="https://player.vimeo.com/video/1165202097?badge=0&autopause=0&player_id=0&app_id=58479"
              title="Demo Punto IA Negocios"
              className="h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </Section>

      <Reveal>
        <SectionBand>
          <div className="grid gap-4 md:grid-cols-3">
            {implementation.map((item) => (
              <article key={item.title} className="rounded-2xl border border-[#ebdef8] bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b75b4]">{item.step}</p>
                <h3 className="mt-3 text-lg font-black">{item.title}</h3>
                <p className="mt-2 text-sm text-[#5f4e84]">{item.description}</p>
              </article>
            ))}
          </div>
        </SectionBand>
      </Reveal>

      <Section eyebrow="Qué obtienes" title="Una plataforma lista para escalar" description="Lealtad medible, operación simple y decisiones respaldadas por datos.">
        <StaggerGrid className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <StaggerItem key={feature.title}><FeatureCard icon={feature.icon} title={feature.title} description={feature.description} /></StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <Section eyebrow="Casos de referencia" title="Resultados en negocios con perfiles similares" description="Indicadores reales para evaluar el impacto potencial en tu negocio.">
        <SocialProof
          cases={[
            { name: 'Cafetería local', result: '+18% visitas repetidas', context: 'Con meta mensual de visitas y recompensa desbloqueable.' },
            { name: 'Estética urbana', result: '+21% canjes mensuales', context: 'Con beneficios por frecuencia en servicios recurrentes.' },
            { name: 'Restaurante casual', result: '+15% retorno de cliente', context: 'Con puntos acumulables y recordatorios automáticos.' },
          ]}
        />
      </Section>

      <Section eyebrow="Preguntas clave" title="Resuelve tus dudas antes de empezar" description="Respuestas concretas para tomar una decisión informada.">
        <FaqBlock items={faqs} />
      </Section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-2">
        <Reveal>
          <CtaPanel
            title="Activa tu estrategia de lealtad"
            description="Solicita una demo, agenda un diagnóstico o habla con ventas para definir tu plan de lanzamiento."
            primary={{ href: '#demo', label: 'Solicitar demo' }}
            secondary={{ href: 'mailto:ventas@puntoia.mx?subject=Agendar%20diagn%C3%B3stico%20Punto%20IA', label: 'Agendar diagnóstico' }}
          />
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
