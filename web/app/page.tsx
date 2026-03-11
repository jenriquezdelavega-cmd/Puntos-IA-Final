import { marketingContent } from '@/src/content/marketing-content';
import {
  CTASection,
  HeroSection,
  BentoGrid,
  ScrollJourney,
  InfiniteTicker,
  PageShell,
  SiteFooter,
  SiteHeader,
} from '@/src/components/marketing';

export default function HomePage() {
  const { nav, home } = marketingContent;

  return (
    <PageShell>
      <SiteHeader navItems={nav} cta={{ label: 'Entrar', href: home.hero.secondaryCta.href }} />

      <HeroSection
        eyebrow={home.hero.eyebrow}
        title={home.hero.title}
        description={home.hero.description}
        chips={home.hero.chips}
        primaryCta={home.hero.primaryCta}
        secondaryCta={home.hero.secondaryCta}
        b2bImage={home.hero.b2bImage}
        b2cImage={home.hero.b2cImage}
      />

      <InfiniteTicker items={[
        { text: '✨ +15% Visitas en Cafeterías' },
        { text: '🚀 3x Retención en Barberías' },
        { text: '🌐 Red de Coalición Activa' },
        { text: '🔥 Pagos y Retos Sincronizados' },
        { text: '📈 Métricas en Tiempo Real' },
        { text: '💳 Apple Wallet Integrado' }
      ]} />

      <BentoGrid
        title={home.bento.title}
        description={home.bento.description}
        items={home.bento.items}
      />

      <ScrollJourney
        title={home.journey.title}
        subtitle={home.journey.subtitle}
        steps={home.journey.steps}
      />

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
