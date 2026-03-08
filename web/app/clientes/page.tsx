import { marketingContent } from '@/src/content/marketing-content';
import {
  ActionLink,
  CTASection,
  FeatureGrid,
  MarketingHero,
  PageShell,
  SectionContainer,
  SiteFooter,
  SiteHeader,
  StepGrid,
  actionButtonStyles,
} from '@/src/components/marketing';

export default function ClientesPage() {
  const { nav, clientes } = marketingContent;

  return (
    <PageShell>
      <SiteHeader navItems={nav} cta={{ label: clientes.hero.primaryCta.label, href: clientes.hero.primaryCta.href }} />

      <MarketingHero
        eyebrow={clientes.hero.eyebrow}
        title={clientes.hero.title}
        description={clientes.hero.description}
        primaryCta={clientes.hero.primaryCta}
        secondaryCta={clientes.hero.secondaryCta}
        tertiaryCta={clientes.hero.tertiaryCta}
        image={clientes.hero.image}
      />

      <SectionContainer className="py-10">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-[#241548] md:text-4xl">{clientes.actions.title}</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {clientes.actions.items.map((item) => (
            <article key={item.title} className="rounded-3xl border border-[#e8daf6] bg-white p-6">
              <h3 className="text-xl font-black text-[#26184b]">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#564183]">{item.description}</p>
              <div className="mt-5">
                <ActionLink href={item.cta.href} className={actionButtonStyles('primary')}>
                  {item.cta.label}
                </ActionLink>
              </div>
            </article>
          ))}
        </div>
      </SectionContainer>

      <StepGrid
        title={clientes.steps.title}
        description="Un flujo utilitario y claro para que avances rápido."
        steps={clientes.steps.steps}
        image={clientes.steps.image}
      />

      <FeatureGrid title={clientes.benefits.title} features={clientes.benefits.features} />

      <CTASection
        title={clientes.cta.title}
        primary={clientes.cta.primary}
        secondary={clientes.cta.secondary}
        tertiary={clientes.cta.tertiary}
      />

      <SiteFooter navItems={nav} />
    </PageShell>
  );
}
