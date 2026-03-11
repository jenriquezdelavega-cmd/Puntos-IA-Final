import { marketingContent } from '@/src/content/marketing-content';
import {
  PricingSection,
  PageShell,
  SiteFooter,
  SiteHeader,
} from '@/src/components/marketing';

export const metadata = {
  title: 'Precios - Punto IA',
  description: 'Planes y precios para retener clientes con Punto IA',
};

export default function PreciosPage() {
  const { nav } = marketingContent;

  return (
    <PageShell>
      <SiteHeader navItems={nav} cta={{ label: marketingContent.home.cta.primary.label, href: marketingContent.home.cta.primary.href }} />
      
      <main className="flex-grow">
        <PricingSection />
      </main>

      <SiteFooter navItems={nav} />
    </PageShell>
  );
}
