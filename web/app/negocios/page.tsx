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
} from '../components/marketing/ui';
import { Reveal, StaggerGrid, StaggerItem } from '../components/marketing/effects';

const features = [
  {
    icon: '💳',
    title: 'Wallet listo desde día uno',
    description: 'Tus clientes activan su pase en segundos y regresan con menos fricción en cada visita.',
  },
  {
    icon: '🧩',
    title: 'Operación simple para equipo',
    description: 'El flujo de check-in y canje está diseñado para piso/caja, sin complejidad técnica.',
  },
  {
    icon: '🎯',
    title: 'Campañas que sí empujan retorno',
    description: 'Define incentivos según comportamiento real para elevar frecuencia y recompra.',
  },
  {
    icon: '📊',
    title: 'Métricas para decidir mejor',
    description: 'Visualiza activación, visitas, canjes y desempeño por sucursal o segmento.',
  },
];

const implementation = [
  {
    step: 'Semana 1',
    title: 'Diagnóstico comercial',
    description: 'Definimos objetivo de recurrencia, ticket y tipo de recompensa adecuada para tu operación.',
  },
  {
    step: 'Semana 1',
    title: 'Configuración y prueba',
    description: 'Preparamos reglas, mensajes y validación operativa para lanzar sin improvisación.',
  },
  {
    step: 'Semana 2+',
    title: 'Optimización continua',
    description: 'Ajustamos campañas con base en resultados para sostener crecimiento, no picos temporales.',
  },
];

const faqs = [
  {
    question: '¿En cuánto tiempo puedo iniciar?',
    answer: 'Normalmente en 3 a 7 días hábiles, dependiendo de validación de contenidos y reglas comerciales.',
  },
  {
    question: '¿Funciona si tengo varias sucursales?',
    answer: 'Sí. Puedes pilotear en una sucursal y luego escalar a toda tu red con seguimiento centralizado.',
  },
  {
    question: '¿Debo cambiar mi POS o hardware?',
    answer: 'No necesariamente. Nos adaptamos a tu operación actual para evitar fricción de implementación.',
  },
  {
    question: '¿Qué incluye la demo?',
    answer: 'Revisión de contexto, propuesta inicial de estrategia de lealtad y roadmap de activación por etapas.',
  },
];

export default function NegociosPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05050a] text-white">
      <MarketingBackground />
      <MarketingHeader badge="Ruta comercial para negocios" primaryCta={{ href: '#demo', label: 'Agenda diagnóstico' }} />

      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 pb-14 pt-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <Reveal><div>
          <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white/70">
            Landing B2B enfocada en conversión
          </p>
          <h1 className="mt-6 text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            Lealtad diseñada para
            <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] bg-clip-text text-transparent">
              crecer ventas repetidas.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Punto IA conecta experiencia de cliente y operación de negocio: wallet, campañas, recompensas y seguimiento comercial en una sola plataforma.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatCard value="+20%" label="Incremento típico en recurrencia" />
            <StatCard value="3–7 días" label="Tiempo de activación inicial" />
            <StatCard value="1 panel" label="Control de campañas y canjes" />
          </div>
        </div></Reveal>

        <Reveal delay={0.08}><aside id="demo" className="rounded-[2rem] border border-white/15 bg-black/35 p-6 backdrop-blur-xl md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Paso 1 de 2</p>
          <h2 className="mt-3 text-2xl font-black md:text-3xl">Solicita una demo útil</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Pedimos solo lo mínimo para preparar una llamada de diagnóstico enfocada a resultados.
          </p>
          <form className="mt-6 grid gap-3" action="mailto:ventas@puntoia.mx" method="post" encType="text/plain">
            <input name="Negocio" className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-[#ff7a59] focus:outline-none" placeholder="Nombre del negocio" required />
            <input name="Contacto" className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-[#ff7a59] focus:outline-none" placeholder="Persona de contacto" required />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="WhatsApp" className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-[#ff7a59] focus:outline-none" placeholder="WhatsApp" required />
              <input name="Ciudad" className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-[#ff7a59] focus:outline-none" placeholder="Ciudad" required />
            </div>
            <button type="submit" className="mt-1 rounded-xl bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] px-4 py-3 text-sm font-black text-white transition hover:opacity-95">
              Enviar solicitud
            </button>
            <p className="text-xs text-white/45">Respuesta comercial en menos de 24h hábiles.</p>
          </form>
        </aside></Reveal>
      </section>

      <Reveal><TrustStrip items={['Implementación guiada para PyMEs', 'Modelo operativo sin fricción para caja', 'Escalable a una o múltiples sucursales']} /></Reveal>


      <Reveal><SectionBand>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Objetivo</p>
            <p className="mt-3 text-lg font-black">Más frecuencia de visita</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Método</p>
            <p className="mt-3 text-lg font-black">Reglas y campañas por comportamiento</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Resultado</p>
            <p className="mt-3 text-lg font-black">Programa de lealtad medible y escalable</p>
          </article>
        </div>
      </SectionBand></Reveal>

      <Section
        eyebrow="Propuesta de valor"
        title="Qué obtienes al implementar Punto IA"
        description="Una estructura comercial de lealtad que evita campañas aisladas y construye recurrencia sostenible."
      >
        <StaggerGrid className="grid gap-4 md:grid-cols-2">{features.map((feature) => <StaggerItem key={feature.title}><FeatureCard icon={feature.icon} title={feature.title} description={feature.description} /></StaggerItem>)}</StaggerGrid>
      </Section>


      <Section
        eyebrow="Prueba social"
        title="Casos de uso iniciales"
        description="Métricas referenciales de pilotos con negocios de operación similar."
      >
        <SocialProof
          cases={[
            { name: 'Cafetería local', result: '+18% visitas repetidas', context: 'Con pase digital y objetivo mensual de visitas.' },
            { name: 'Estética urbana', result: '+21% canjes mensuales', context: 'Recompensas por frecuencia en servicios recurrentes.' },
            { name: 'Restaurante casual', result: '+15% retorno de cliente', context: 'Campaña de puntos acumulables por ticket.' },
          ]}
        />
      </Section>

      <Section
        eyebrow="Implementación"
        title="Proceso claro para avanzar sin desgaste"
        description="Reducimos incertidumbre con etapas concretas, responsables definidos y objetivos medibles."
      >
        <StaggerGrid className="grid gap-4 md:grid-cols-3">
          {implementation.map((item) => (
            <StaggerItem key={item.title}>
            <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff9d8d]">{item.step}</p>
              <h3 className="mt-3 text-xl font-black">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{item.description}</p>
            </article>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <Section eyebrow="FAQ" title="Resuelve lo esencial antes de decidir" description="Preguntas orientadas a operación, tiempos y alcance comercial.">
        <FaqBlock items={faqs} />
      </Section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-2">
        <Reveal><CtaPanel
          title="Si buscas recurrencia real, empecemos por un diagnóstico corto"
          description="Te mostramos un plan de activación por etapas según tu tipo de negocio y capacidad operativa actual."
          primary={{ href: '#demo', label: 'Agendar diagnóstico' }}
          secondary={{ href: '/clientes', label: 'Revisar experiencia cliente' }}
        /></Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
