import { marketingContent } from '@/src/content/marketing-content';
import { CTASection } from '@/src/components/marketing/cta-section';
import { HeroSection } from '@/src/components/marketing/hero-section';
import { BentoGrid } from '@/src/components/marketing/bento-grid';
import { ScrollJourney } from '@/src/components/marketing/scroll-journey';
import { InfiniteTicker } from '@/src/components/marketing/infinite-ticker';
import { PageShell } from '@/src/components/marketing/page-shell';
import { SiteFooter } from '@/src/components/marketing/site-footer';
import { SiteHeader } from '@/src/components/marketing/site-header';
import { Store, Smartphone } from 'lucide-react';

export default function HomePage() {
  const { nav, home } = marketingContent;

  return (
    <PageShell>
      <SiteHeader navItems={nav} cta={{ label: home.hero.primaryCta.label, href: home.hero.primaryCta.href }} />

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

      {/* Unique Home Dual Value Proposition */}
      <section className="relative overflow-hidden bg-white py-24 sm:py-32 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-sm font-black tracking-widest uppercase text-[#7e4fd3] mb-4">Un Ecosistema Conectado</h2>
            <p className="text-4xl font-black tracking-tight text-[#241548] sm:text-5xl">
              Valor inmediato para ambas partes de la caja registradora
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
            <div className="rounded-[2.5rem] bg-[#160b2b] p-8 lg:p-12 text-white relative overflow-hidden group hover:ring-2 hover:ring-[#7e4fd3] transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Store className="w-48 h-48 rotate-12" />
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 mb-6 border border-white/10 backdrop-blur-md">
                <Store className="w-5 h-5 text-[#ff5e91]" />
                <span className="text-xs font-black uppercase tracking-widest text-[#dacbf0]">Para el Negocio</span>
              </div>
              <h3 className="text-3xl font-black mb-4">Retén clientes en piloto automático</h3>
              <p className="text-[#a593c2] text-lg mb-8">Sabrás exactamente quiénes volvieron, quiénes no han venido en un mes, y podrás enviarles notificaciones gratis para traerlos de vuelta.</p>
              <ul className="space-y-4 text-sm font-semibold text-[#dacbf0]">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#7e4fd3]/20 flex items-center justify-center text-[#ff5e91]">✓</div>
                  Dashboard analítico en vivo
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#7e4fd3]/20 flex items-center justify-center text-[#ff5e91]">✓</div>
                  Operación sin hardware en 3 segundos
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#7e4fd3]/20 flex items-center justify-center text-[#ff5e91]">✓</div>
                  Notificaciones push gratuitas
                </li>
              </ul>
              <div className="mt-10">
                <a href="/negocios" className="text-[#ff5e91] font-bold hover:text-white transition-colors flex items-center gap-2">Explorar funciones B2B →</a>
              </div>
            </div>

            <div className="rounded-[2.5rem] bg-[#faf8fc] p-8 lg:p-12 text-[#241548] relative overflow-hidden group border border-[#eadcf8] hover:shadow-2xl hover:shadow-purple-500/10 transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Smartphone className="w-48 h-48 -rotate-12" />
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 mb-6 border border-[#eadcf8] shadow-sm">
                <Smartphone className="w-5 h-5 text-[#7e4fd3]" />
                <span className="text-xs font-black uppercase tracking-widest text-[#583e86]">Para el Cliente</span>
              </div>
              <h3 className="text-3xl font-black mb-4">La billetera que todos ya saben usar</h3>
              <p className="text-[#583e86] text-lg mb-8">Nadie quiere descargar "otra app más". Usamos la tecnología Wallet nativa de iOS y Android para asegurar 100% de adopción.</p>
              <ul className="space-y-4 text-sm font-semibold text-[#583e86]">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#eadcf8] flex items-center justify-center text-[#7e4fd3]">✓</div>
                  Integrado en Apple y Google Wallet
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#eadcf8] flex items-center justify-center text-[#7e4fd3]">✓</div>
                  Actualizaciones en tiempo real
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#eadcf8] flex items-center justify-center text-[#7e4fd3]">✓</div>
                  Sin fricción ni registros larguísimos
                </li>
              </ul>
              <div className="mt-10">
                <a href="/clientes" className="text-[#7e4fd3] font-bold hover:text-[#583e86] transition-colors flex items-center gap-2">Descubrir experiencia del cliente →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

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
