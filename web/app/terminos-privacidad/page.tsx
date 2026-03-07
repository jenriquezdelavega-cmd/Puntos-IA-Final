import { MarketingBackground, MarketingFooter, MarketingHeader, Section } from '../components/marketing/ui';

export default function LegalPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffaf8] text-[#231644]">
      <MarketingBackground />
      <MarketingHeader badge="Legal" />
      <Section
        eyebrow="Legal"
        title="Términos y privacidad"
        description="Si necesitas la versión completa o firmada de nuestros términos y aviso de privacidad, escríbenos a ventas@puntoia.mx y te la compartimos por correo."
      >
        <div className="rounded-3xl border border-[#ebdef8] bg-white p-6 text-sm text-[#5f4e84]">
          Esta sección funciona como punto de contacto legal del marketing site y evita enlaces rotos o ambiguos.
        </div>
      </Section>
      <MarketingFooter />
    </main>
  );
}
