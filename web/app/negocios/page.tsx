import { marketingContent } from '@/src/content/marketing-content';
import {
  CTASection,
  FeatureGrid,
  MarketingHero,
  MarketingImageSlot,
  PageShell,
  ProblemList,
  SectionContainer,
  SiteFooter,
  SiteHeader,
  StepGrid,
} from '@/src/components/marketing';

export default function NegociosPage() {
  const { nav, negocios } = marketingContent;

  return (
    <PageShell>
      <SiteHeader navItems={nav} cta={{ label: negocios.hero.primaryCta.label, href: negocios.hero.primaryCta.href }} />

      <MarketingHero
        eyebrow={negocios.hero.eyebrow}
        title={negocios.hero.title}
        description={negocios.hero.description}
        chips={negocios.hero.chips}
        primaryCta={negocios.hero.primaryCta}
        secondaryCta={negocios.hero.secondaryCta}
        image={negocios.hero.image}
      />

      <ProblemList
        title={negocios.problema.title}
        description={negocios.problema.description}
        items={negocios.problema.bullets}
      />

      <StepGrid
        id="como-funciona"
        title={negocios.steps.title}
        description="Implementación clara, operación simple y seguimiento con métricas reales."
        steps={negocios.steps.steps}
        image={negocios.steps.image}
      />

      <FeatureGrid title={negocios.includes.title} features={negocios.includes.features} />

      <SectionContainer className="py-10">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-[#241548] md:text-4xl">{negocios.casos.title}</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {negocios.casos.cards.map((item) => (
            <article key={item.title} className="rounded-3xl border border-[#e8daf6] bg-white p-4">
              <MarketingImageSlot
                src={item.image}
                alt={item.title}
                aspectRatio="4 / 3"
                eyebrow="Caso de uso"
                title={item.title}
                description={item.description}
              />
            </article>
          ))}
        </div>
      </SectionContainer>

      <CTASection
        title={negocios.cta.title}
        description={negocios.cta.description}
        primary={negocios.cta.primary}
        secondary={negocios.cta.secondary}
      />

      <SiteFooter navItems={nav} />
    </PageShell>
  );
}
