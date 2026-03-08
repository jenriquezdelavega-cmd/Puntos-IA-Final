import { marketingContent } from '@/src/content/marketing-content';
import {
  AudienceSplitCards,
  CTASection,
  FeatureGrid,
  MarketingHero,
  PageShell,
  SiteFooter,
  SiteHeader,
  StepGrid,
} from '@/src/components/marketing';

export default function HomePage() {
  const { nav, home } = marketingContent;

  return (
    <PageShell>
      <SiteHeader navItems={nav} cta={{ label: 'Entrar', href: home.hero.secondaryCta.href }} />

      <MarketingHero
        eyebrow={home.hero.eyebrow}
        title={home.hero.title}
        description={home.hero.description}
        chips={home.hero.chips}
        primaryCta={home.hero.primaryCta}
        secondaryCta={home.hero.secondaryCta}
        image={home.hero.image}
      />

      <AudienceSplitCards
        title={home.split.title}
        description={home.split.description}
        items={home.split.items}
      />

      <StepGrid
        title={home.howItWorks.title}
        description={home.howItWorks.description}
        steps={home.howItWorks.steps}
        image={home.howItWorks.image}
      />

      <FeatureGrid title={home.diferencial.title} features={home.diferencial.features} />

      <CTASection
        title={home.cta.title}
        description={home.cta.description}
        primary={home.cta.primary}
        secondary={home.cta.secondary}
      />

      <SiteFooter navItems={nav} />
    </PageShell>
  );
}
