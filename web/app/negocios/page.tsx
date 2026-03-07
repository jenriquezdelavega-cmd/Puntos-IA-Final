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
    title: 'Activas wallet desde el día uno',
    description: 'Tus clientes guardan su pase digital y empiezan a acumular visitas o puntos sin descargar apps.',
  },
  {
    icon: '🧩',
    title: 'Operación simple para caja y piso',
    description: 'El equipo puede registrar visitas y canjes en segundos, sin procesos complejos.',
  },
  {
    icon: '🎯',
    title: 'Campañas enfocadas a recurrencia',
    description: 'Diseñas incentivos por comportamiento para aumentar retorno y recompra.',
  },
  {
    icon: '📊',
    title: 'Métricas para decidir mejor',
    description: 'Visualizas activación, visitas y canjes por sucursal o campaña para mejorar resultados.',
  },
];

const implementation = [
  {
    step: 'Paso 1',
    title: 'Diagnóstico comercial',
    description: 'Alineamos objetivos de frecuencia, ticket y tipo de recompensa para tu negocio.',
  },
  {
    step: 'Paso 2',
    title: 'Configuración y lanzamiento',
    description: 'Implementamos reglas, mensajes y flujos de operación para iniciar en 3 a 7 días hábiles.',
  },
  {
    step: 'Paso 3',
    title: 'Seguimiento y optimización',
    description: 'Revisamos resultados y ajustamos campañas para sostener crecimiento mensual.',
  },
];

const faqs = [
  {
    question: '¿Qué problema resuelve Punto IA para mi negocio?',
    answer: 'Te ayuda a aumentar visitas repetidas, mejorar retención y medir impacto comercial con datos de activación y canje.',
  },
  {
    question: '¿Cuánto tarda implementarse?',
    answer: 'El onboarding normal toma entre 3 y 7 días hábiles, según validación de reglas y contenido.',
  },
  {
    question: '¿Puedo usarlo con varias sucursales?',
    answer: 'Sí. Puedes iniciar con una sucursal y escalar al resto con visibilidad centralizada.',
  },
  {
    question: '¿Cómo empiezo?',
    answer: 'Solicita una demo o agenda un diagnóstico. Te compartimos un plan de activación por etapas.',
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
              Punto IA centraliza wallet, recompensas y seguimiento para que tu equipo opere simple y tú tomes decisiones con datos.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard value="3-7 días" label="Tiempo típico de implementación" />
              <StatCard value="1 panel" label="Control de campañas y canjes" />
              <StatCard value="+20%" label="Mejora referencial en recurrencia" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <aside id="demo" className="rounded-[2rem] border border-[#ebdef8] bg-white p-6 shadow-[0_20px_44px_rgba(95,56,148,0.12)] md:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a74b3]">Empieza aquí</p>
            <h2 className="mt-3 text-2xl font-black md:text-3xl">Solicita demo o agenda diagnóstico</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5f4e84]">Formulario corto para contactarte rápido y preparar una conversación útil.</p>
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

      <Reveal><TrustStrip items={['Qué resuelve: recurrencia y retención', 'Cómo funciona: wallet + reglas + campañas', 'Cómo se empieza: demo corta y plan de activación']} /></Reveal>

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

      <Section eyebrow="Qué obtienes" title="Plataforma lista para crecer sin fricción" description="Una estructura de lealtad medible, escalable y fácil de operar.">
        <StaggerGrid className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <StaggerItem key={feature.title}><FeatureCard icon={feature.icon} title={feature.title} description={feature.description} /></StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <Section eyebrow="Casos de referencia" title="Resultados iniciales en negocios similares" description="Señales de impacto para tomar una decisión informada.">
        <SocialProof
          cases={[
            { name: 'Cafetería local', result: '+18% visitas repetidas', context: 'Con meta mensual de visitas y recompensa desbloqueable.' },
            { name: 'Estética urbana', result: '+21% canjes mensuales', context: 'Con beneficios por frecuencia en servicios recurrentes.' },
            { name: 'Restaurante casual', result: '+15% retorno de cliente', context: 'Con puntos acumulables y recordatorios automáticos.' },
          ]}
        />
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
