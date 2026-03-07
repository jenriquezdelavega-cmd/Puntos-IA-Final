import {
  CtaPanel,
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  Section,
  SectionBand,
  StatCard,
  TrustStrip,
} from '../components/marketing/ui';
import { Reveal, StaggerGrid, StaggerItem } from '../components/marketing/effects';

const partnerTypes = [
  {
    type: 'Agencias de marketing',
    value: 'Nuevo servicio para tus cuentas',
    detail: 'Integra lealtad digital a tu oferta y entrega resultados medibles de recurrencia.',
  },
  {
    type: 'Consultores y integradores',
    value: 'Más profundidad de implementación',
    detail: 'Conecta estrategia comercial, operación y seguimiento con una plataforma lista para usar.',
  },
  {
    type: 'Cámaras y ecosistemas PyME',
    value: 'Mayor valor para afiliados',
    detail: 'Activa programas de lealtad modernos en grupos empresariales locales sin elevar complejidad.',
  },
];

const model = [
  {
    title: 'Descubrimiento comercial',
    description: 'Alineamos verticales, territorio y perfil de cliente para definir oportunidades reales de colaboración.',
  },
  {
    title: 'Enablement y narrativa',
    description: 'Recibes guía de propuesta de valor, materiales comerciales y playbook para demos claras.',
  },
  {
    title: 'Co-ejecución',
    description: 'Acompañamos cierre y puesta en marcha para sostener una experiencia premium de extremo a extremo.',
  },
];

export default function AliadosPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05050a] text-white">
      <MarketingBackground />
      <MarketingHeader badge="Programa de aliados Punto IA" primaryCta={{ href: 'mailto:ventas@puntoia.mx?subject=Programa%20de%20aliados%20Punto%20IA', label: 'Quiero ser aliado' }} />

      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 pb-14 pt-10 lg:grid-cols-[1.08fr,0.92fr] lg:items-center">
        <Reveal><div>
          <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white/70">
            Ruta independiente, integrada al sistema visual
          </p>
          <h1 className="mt-6 text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            Crece con Punto IA como
            <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] bg-clip-text text-transparent">
              aliado estratégico.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Esta ruta se mantiene separada porque cumple una intención propia: desarrollar partnerships y canales de adopción para PyMEs con una oferta comercial clara.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatCard value="Co-selling" label="Modelo comercial colaborativo" />
            <StatCard value="Enablement" label="Material y playbook para venta" />
            <StatCard value="Soporte" label="Acompañamiento en implementación" />
          </div>
        </div></Reveal>

        <Reveal delay={0.08}><div className="rounded-[2rem] border border-white/15 bg-black/35 p-6 backdrop-blur-xl md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Perfil ideal de aliado</p>
          <h2 className="mt-3 text-2xl font-black md:text-3xl">¿Para quién está pensado?</h2>
          <div className="mt-5 space-y-3">
            {partnerTypes.map((item) => (
              <article key={item.type} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-black text-[#ffad9c]">{item.type}</p>
                <p className="mt-1 text-lg font-black">{item.value}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{item.detail}</p>
              </article>
            ))}
          </div>
        </div></Reveal>
      </section>

      <Reveal><TrustStrip items={['Programa con propósito comercial definido', 'Misma calidad visual que / y /negocios', 'CTA y narrativa coherentes para partners']} /></Reveal>


      <Reveal><SectionBand>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Pipeline</p>
            <p className="mt-3 text-lg font-black">Co-generación de oportunidades</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Enablement</p>
            <p className="mt-3 text-lg font-black">Narrativa y materiales para vender mejor</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Entrega</p>
            <p className="mt-3 text-lg font-black">Implementación acompañada y medible</p>
          </article>
        </div>
      </SectionBand></Reveal>

      <Section eyebrow="Modelo de trabajo" title="Cómo colaboramos contigo" description="Un proceso de partnership simple para evitar ambigüedad de roles y acelerar ejecución.">
        <StaggerGrid className="grid gap-4 md:grid-cols-3">
          {model.map((item) => (
            <StaggerItem key={item.title}>
            <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-xl font-black">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{item.description}</p>
            </article>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-2">
        <Reveal><CtaPanel
          title="¿Ya acompañas PyMEs en crecimiento comercial?"
          description="Podemos construir un esquema conjunto para activar más negocios con una experiencia de lealtad robusta y lista para operar."
          primary={{ href: 'mailto:ventas@puntoia.mx?subject=Quiero%20ser%20aliado%20de%20Punto%20IA', label: 'Contactar partnership' }}
          secondary={{ href: '/negocios', label: 'Ver propuesta para negocios' }}
        /></Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
