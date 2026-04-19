import { marketingContent } from '@/src/content/marketing-content';
import {
  CTASection,
  HeroSection,
  PageShell,
  SiteFooter,
  SiteHeader,
} from '@/src/components/marketing';
import { Target, WalletCards, Zap } from 'lucide-react';

export default function NegociosPage() {
  const { nav, negocios } = marketingContent;

  return (
    <PageShell>
      <SiteHeader navItems={nav} />

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

      {/* B2B Storytelling Layout - Replaces generic BentoGrid */}
      <section className="bg-white py-24 sm:py-32 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-20 max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight text-[#241548] sm:text-4xl text-left">
              Todo el poder de una app propia, sin pedirle a tus clientes que la descarguen
            </h2>
            <p className="mt-6 text-lg text-gray-600">Herramientas diseñadas para que el dueño de negocio tome el control absoluto de sus ventas recurrentes.</p>
          </div>

          <div className="space-y-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#f5edff] flex items-center justify-center text-[#7e4fd3] mb-6">
                  <WalletCards className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-[#241548] mb-4">Integración Nativa con iOS y Android</h3>
                <p className="text-gray-600 text-lg leading-relaxed">Punto IA emite pases digitales que viven directamente dentro del Apple Wallet y Google Wallet de tus clientes. Como ya confían y usan estas apps a diario, la tasa de adopción de tu programa se dispara.</p>
              </div>
              <div className="rounded-[2rem] bg-gray-50 border border-gray-200 p-8 flex items-center justify-center relative overflow-hidden aspect-video shadow-xl shadow-gray-200/50">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src="/images/clientes/clientes-hero-wallet.jpg" alt="Apple Wallet UI" className="absolute w-[80%] rounded-xl shadow-2xl rotate-[-5deg]" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
              <div className="order-2 md:order-1 rounded-[2rem] bg-[#160b2b] border border-[#392666] p-8 flex items-center justify-center relative overflow-hidden aspect-video shadow-2xl">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src="/images/negocios/negocios-hero-dashboard.jpg" alt="Dashboard Analytics" className="absolute w-[90%] rounded-xl shadow-[0_0_50px_rgba(126,79,211,0.3)]" />
              </div>
              <div className="order-1 md:order-2">
                <div className="w-12 h-12 rounded-2xl bg-[#fde8eb] flex items-center justify-center text-[#ff5e91] mb-6">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-[#241548] mb-4">Dashboard Analítico en Tiempo Real</h3>
                <p className="text-gray-600 text-lg leading-relaxed">Conoce exactamente quién te visita, con qué frecuencia y cuándo fue su última compra. Usa estos datos para enviar notificaciones push y reactivar a clientes inactivos antes de que decidan irse con la competencia.</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-[#241548] mb-4">Escaneo Ultra-Rápido en POS</h3>
                <p className="text-gray-600 text-lg leading-relaxed">Tus cajeros o meseros registran visitas en segundos usando cualquier celular o tablet. Diseñamos la interfaz operativa para que no sume fricción a tu punto de venta en las horas pico.</p>
              </div>
              <div className="rounded-[2rem] bg-gray-50 border border-gray-200 p-8 flex items-center justify-center relative overflow-hidden aspect-video shadow-xl shadow-gray-200/50">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src="/images/negocios/negocios-operation-scene.jpg" alt="POS Scanner operation" className="absolute h-[110%] rounded-xl shadow-2xl object-cover right-0" />
              </div>
            </div>
          </div>
        </div>
      </section>

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
