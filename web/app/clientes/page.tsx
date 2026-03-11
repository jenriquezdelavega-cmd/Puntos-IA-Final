import { marketingContent } from '@/src/content/marketing-content';
import {
  CTASection,
  HeroSection,
  BentoGrid,
  ScrollJourney,
  PageShell,
  SiteFooter,
  SiteHeader,
} from '@/src/components/marketing';

export default function ClientesPage() {
  const { nav, clientes } = marketingContent;

  return (
    <PageShell>
      <SiteHeader navItems={nav} cta={{ label: clientes.hero.primaryCta.label, href: clientes.hero.primaryCta.href }} />

      <HeroSection
        eyebrow={clientes.hero.eyebrow}
        title={clientes.hero.title}
        description={clientes.hero.description}
        chips={clientes.hero.chips}
        primaryCta={clientes.hero.primaryCta}
        secondaryCta={clientes.hero.secondaryCta}
        b2bImage={clientes.hero.b2bImage}
        b2cImage={clientes.hero.b2cImage}
      />

      <BentoGrid
        title={clientes.bento.title}
        description={clientes.bento.description}
        items={clientes.bento.items}
      />

      <ScrollJourney
        title={clientes.journey.title}
        subtitle={clientes.journey.subtitle}
        steps={clientes.journey.steps}
      />

      <CTASection
        title={clientes.cta.title}
        description={clientes.cta.description}
        primary={clientes.cta.primary}
        secondary={clientes.cta.secondary}
      />

      <SiteFooter navItems={nav} />
    </PageShell>
  );
}
