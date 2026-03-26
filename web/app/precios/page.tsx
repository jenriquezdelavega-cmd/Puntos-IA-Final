import { marketingRoutes } from '@/src/config/marketing-routes';
import { PricingSection } from '@/src/components/marketing/pricing-section';
import { PageShell } from '@/src/components/marketing/page-shell';
import { SiteFooter } from '@/src/components/marketing/site-footer';
import { SiteHeader } from '@/src/components/marketing/site-header';

const NAV_ITEMS = [
  { label: 'Inicio', href: marketingRoutes.home },
  { label: 'Negocios', href: marketingRoutes.negocios },
  { label: 'Clientes', href: marketingRoutes.clientes },
  { label: 'Precios', href: marketingRoutes.precios },
  { label: 'Entrar', href: marketingRoutes.login },
] as const;

export const metadata = {
  title: 'Precios — Punto IA | Planes de Lealtad para PyMEs',
  description: 'Empieza 15 días gratis. Elige el plan Starter, Pro Coalición o Corporativo y aumenta la retención de tus clientes con Apple Wallet y Google Wallet integrados.',
};

export default function PreciosPage() {
  return (
    <PageShell>
      <SiteHeader navItems={NAV_ITEMS} cta={{ label: 'Comenzar prueba', href: '/ingresar?tipo=negocio&modo=registro' }} />
      
      <main className="flex-grow">
        <PricingSection />
      </main>

      <SiteFooter navItems={NAV_ITEMS} />
    </PageShell>
  );
}
