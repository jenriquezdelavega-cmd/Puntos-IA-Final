import {
  CtaPanel,
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  Section,
  SectionBand,
  TrustStrip,
} from '../components/marketing/ui';
import { Reveal, StaggerGrid, StaggerItem } from '../components/marketing/effects';

const partnerTypes = [
  {
    type: 'Agencias de marketing',
    detail: 'Incorpora lealtad digital a tu oferta para entregar resultados de recurrencia medibles.',
  },
  {
    type: 'Consultores e integradores',
    detail: 'Conecta estrategia comercial, operación y seguimiento con una plataforma lista para usar.',
  },
  {
    type: 'Cámaras y ecosistemas PyME',
    detail: 'Ofrece mayor valor a tus afiliados con programas de lealtad modernos y simples.',
  },
];

export default function PartnersPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffaf8] text-[#231644]">
      <MarketingBackground />
      <MarketingHeader badge="Partners de Punto IA" primaryCta={{ href: 'mailto:ventas@puntoia.mx?subject=Programa%20de%20partners%20Punto%20IA', label: 'Contactar partners' }} />

      <section className="relative mx-auto grid w-full max-w-7xl gap-8 px-6 pb-14 pt-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <Reveal>
          <div>
            <p className="inline-flex rounded-full border border-[#eadff8] bg-white px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#7d68a5]">
              Página secundaria de canales
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Programa de
              <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] bg-clip-text text-transparent">
                partners y canales.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#5f4e84] sm:text-lg">
              Esta ruta se mueve fuera de la navegación principal para evitar confusión con “Negocios”. Aquí atendemos solo alianzas comerciales.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-[2rem] border border-[#ebdef8] bg-white p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a74b3]">Perfiles de partner</p>
            <div className="mt-4 grid gap-3">
              {partnerTypes.map((item) => (
                <article key={item.type} className="rounded-2xl border border-[#ebdef8] bg-[#fffafe] p-4">
                  <p className="text-lg font-black">{item.type}</p>
                  <p className="mt-2 text-sm text-[#5f4e84]">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <Reveal><TrustStrip items={['Ruta secundaria, no principal', 'Enfoque exclusivo en partnerships', 'Contacto directo con equipo comercial']} /></Reveal>

      <Section eyebrow="Modelo" title="Cómo colaboramos" description="Un proceso simple para alinear ventas, implementación y seguimiento.">
        <StaggerGrid className="grid gap-4 md:grid-cols-3">
          {['Descubrimiento comercial', 'Enablement y propuesta', 'Co-ejecución con soporte'].map((item) => (
            <StaggerItem key={item}>
              <article className="rounded-3xl border border-[#ebdef8] bg-white p-6">
                <h3 className="text-xl font-black">{item}</h3>
              </article>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <Reveal>
        <SectionBand>
          <CtaPanel
            title="¿Quieres construir canal con Punto IA?"
            description="Contáctanos para revisar territorio, vertical y esquema de colaboración."
            primary={{ href: 'mailto:ventas@puntoia.mx?subject=Programa%20de%20partners%20Punto%20IA', label: 'Contactar partners' }}
            secondary={{ href: '/negocios', label: 'Ver solución para negocios' }}
          />
        </SectionBand>
      </Reveal>

      <MarketingFooter />
    </main>
  );
}
