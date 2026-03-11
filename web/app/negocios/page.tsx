import { marketingContent } from '@/src/content/marketing-content';
import {
  CTASection,
  HeroSection,
  BentoGrid,
  ScrollJourney,
  MarketingImageSlot,
  PageShell,
  SectionContainer,
  SiteFooter,
  SiteHeader,
} from '@/src/components/marketing';

export default function NegociosPage() {
  const { nav, negocios } = marketingContent;

  return (
    <PageShell>
      <SiteHeader navItems={nav} cta={{ label: negocios.hero.primaryCta.label, href: negocios.hero.primaryCta.href }} />

      <HeroSection
        eyebrow={negocios.hero.eyebrow}
        title={negocios.hero.title}
        description={negocios.hero.description}
        chips={negocios.hero.chips}
        primaryCta={negocios.hero.primaryCta}
        secondaryCta={negocios.hero.secondaryCta}
        b2bImage={negocios.hero.b2bImage}
        b2cImage={negocios.hero.b2cImage}
      />

      <BentoGrid
        title={negocios.bento.title}
        description={negocios.bento.description}
        items={negocios.bento.items}
      />

      <ScrollJourney
        title={negocios.journey.title}
        subtitle={negocios.journey.subtitle}
        steps={negocios.journey.steps}
      />

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
