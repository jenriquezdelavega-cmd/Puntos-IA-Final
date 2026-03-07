import Link from 'next/link';
import {
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  Section,
  SectionBand,
  buttonStyles,
} from '../components/marketing/ui';

export default function ActivarPasePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffaf8] text-[#231644]">
      <MarketingBackground />
      <MarketingHeader badge="Activar pase" primaryCta={{ href: '/ingresar?tipo=cliente', label: 'Entrar a mi cuenta' }} />

      <Section
        eyebrow="Clientes"
        title="Activar mi pase"
        description="Este flujo evita errores: primero activa tu pase desde el QR del negocio y luego entra a tu cuenta para ver tu progreso."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[#eadff8] bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b75b4]">Paso 1</p>
            <h2 className="mt-3 text-lg font-black">Escanea el QR en el negocio</h2>
            <p className="mt-2 text-sm text-[#5f4e84]">El negocio te comparte su QR para activar el pase correcto.</p>
          </article>
          <article className="rounded-2xl border border-[#eadff8] bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b75b4]">Paso 2</p>
            <h2 className="mt-3 text-lg font-black">Guarda tu pase en Wallet</h2>
            <p className="mt-2 text-sm text-[#5f4e84]">Puedes usar Apple Wallet o Google Wallet en segundos.</p>
          </article>
          <article className="rounded-2xl border border-[#eadff8] bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b75b4]">Paso 3</p>
            <h2 className="mt-3 text-lg font-black">Entra a tu cuenta</h2>
            <p className="mt-2 text-sm text-[#5f4e84]">Consulta visitas, puntos y recompensas desde tu sesión.</p>
          </article>
        </div>
      </Section>

      <SectionBand>
        <div className="flex flex-wrap gap-3">
          <Link href="/ingresar?tipo=cliente" className={buttonStyles('primary')}>Entrar a mi cuenta</Link>
          <Link href="/clientes#como-funciona" className={buttonStyles('secondary')}>Ver cómo funciona</Link>
        </div>
      </SectionBand>

      <MarketingFooter />
    </main>
  );
}
