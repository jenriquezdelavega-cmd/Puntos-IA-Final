import { marketingRoutes } from '@/src/config/marketing-routes';
import { PageShell } from '@/src/components/marketing/page-shell';
import { SiteHeader } from '@/src/components/marketing/site-header';
import { SiteFooter } from '@/src/components/marketing/site-footer';
import { Section } from '../components/marketing/ui';

const NAV_ITEMS = [
  { label: 'Inicio', href: marketingRoutes.home },
  { label: 'Negocios', href: marketingRoutes.negocios },
  { label: 'Clientes', href: marketingRoutes.clientes },
  { label: 'Precios', href: marketingRoutes.precios },
  { label: 'Entrar', href: marketingRoutes.login },
] as const;

export default function LegalPage() {
  return (
    <PageShell>
      <SiteHeader navItems={NAV_ITEMS} />
      <Section
        eyebrow="Legal"
        title="Términos y privacidad"
        description="Si necesitas la versión completa o firmada de nuestros términos y aviso de privacidad, escríbenos a ventas@puntoia.mx y te la compartimos por correo."
      >
        <div className="rounded-3xl border border-[#ebdef8] bg-white p-6 text-sm text-[#5f4e84]">
          Esta sección funciona como punto de contacto legal del marketing site y evita enlaces rotos o ambiguos.
        </div>
      </Section>
      <SiteFooter navItems={NAV_ITEMS} />
    </PageShell>
  );
}
