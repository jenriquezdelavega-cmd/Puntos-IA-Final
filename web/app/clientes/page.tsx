import { marketingContent } from '@/src/content/marketing-content';
import {
  CTASection,
  HeroSection,
  PageShell,
  SiteFooter,
  SiteHeader,
} from '@/src/components/marketing';
import { Smartphone, QrCode, Gift } from 'lucide-react';

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

      {/* B2C App Landing Layout */}
      <section className="bg-[#faf8fc] py-24 sm:py-32 border-y border-[#eadcf8]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-sm font-black tracking-widest uppercase text-[#ff5e91] mb-4">¿Cómo funciona?</h2>
            <p className="text-4xl font-black tracking-tight text-[#241548] sm:text-5xl">
              Gana premios en tus lugares favoritos. Tan simple como 1, 2, 3.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-[40%] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-[#eadcf8] via-[#7e4fd3] to-[#eadcf8] z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-[2rem] bg-white border border-[#eadcf8] shadow-xl flex items-center justify-center mb-8 group-hover:-translate-y-2 transition-transform duration-300">
                <QrCode className="w-10 h-10 text-[#7e4fd3]" />
              </div>
              <h3 className="text-2xl font-black text-[#241548] mb-4">1. Escanea tu código</h3>
              <p className="text-gray-600">Al pagar en tu lugar favorito, muestra tu QR de Punto IA. En menos de un segundo, la visita es tuya.</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-[2rem] bg-[#7e4fd3] shadow-xl shadow-purple-500/30 flex items-center justify-center mb-8 group-hover:-translate-y-2 transition-transform duration-300">
                <Smartphone className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-[#241548] mb-4">2. Guarda en Wallet</h3>
              <p className="text-gray-600">Descarga tu pase digital nativo a Apple Wallet o Google Wallet. Se guarda junto a tus tarjetas del banco, 100% seguro.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-[2rem] bg-[#160b2b] shadow-xl shadow-purple-900/40 flex items-center justify-center mb-8 group-hover:-translate-y-2 transition-transform duration-300">
                <Gift className="w-10 h-10 text-[#ff5e91]" />
              </div>
              <h3 className="text-2xl font-black text-[#241548] mb-4">3. Disfruta tu premio</h3>
              <p className="text-gray-600">Alcanza la meta de visitas y el sistema te notificará. Canjéalo automáticamente en caja, sin fricciones ni cupones de papel.</p>
            </div>
          </div>
        </div>
      </section>

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
