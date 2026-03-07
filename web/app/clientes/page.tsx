import Link from 'next/link';
import {
  CtaPanel,
  FeatureCard,
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  Section,
  SectionBand,
  StatCard,
  TrustStrip,
  buttonStyles,
} from '../components/marketing/ui';
import { Reveal, StaggerGrid, StaggerItem } from '../components/marketing/effects';

const flow = [
  {
    step: '1',
    title: 'Activar mi pase',
    description: 'Escaneas el QR del negocio y guardas tu pase en Apple Wallet o Google Wallet.',
  },
  {
    step: '2',
    title: 'Entrar a mi cuenta',
    description: 'Inicias sesión con tu teléfono para revisar negocios, visitas, puntos y recompensas.',
  },
  {
    step: '3',
    title: 'Canjear recompensas',
    description: 'Presentas tu pase en caja y validas tu premio en segundos.',
  },
];

const benefits = [
  {
    icon: '⚡',
    title: 'Activación rápida',
    description: 'Todo ocurre en minutos, sin instalar una app nueva.',
  },
  {
    icon: '🎁',
    title: 'Premios claros',
    description: 'Ves cuánto te falta y qué recompensa puedes canjear.',
  },
  {
    icon: '🔒',
    title: 'Cuenta segura',
    description: 'Tu historial queda guardado y lo recuperas al entrar con tu número.',
  },
  {
    icon: '📍',
    title: 'Beneficios locales',
    description: 'Acumulas en tus negocios favoritos con una experiencia simple.',
  },
];

export default function ClientesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffaf8] text-[#231644]">
      <MarketingBackground />
      <MarketingHeader badge="Ruta para clientes" primaryCta={{ href: '/ingresar?tipo=cliente', label: 'Entrar a mi cuenta' }} />

      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 pb-14 pt-10 lg:grid-cols-[1fr,1fr] lg:items-center">
        <Reveal>
          <div>
            <p className="inline-flex rounded-full border border-[#e9def8] bg-white px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#7d69a5]">
              Experiencia útil para cliente final
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Activa tu pase,
              <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] bg-clip-text text-transparent">
                entra a tu cuenta y gana recompensas.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#5f4e84] sm:text-lg">
              Esta ruta responde solo lo importante: activar pase, entrar a tu cuenta y entender cómo funciona.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/activar-pase" className={buttonStyles('primary')}>Activar mi pase</Link>
              <Link href="/ingresar?tipo=cliente" className={buttonStyles('secondary')}>Entrar a mi cuenta</Link>
              <Link href="#como-funciona" className={buttonStyles('tertiary')}>Ver cómo funciona</Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-[2rem] border border-[#ebdef8] bg-white p-6 shadow-[0_18px_44px_rgba(95,56,148,0.12)] sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a74b3]">Tu cuenta en un vistazo</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <StatCard value="1 min" label="Para activar pase" />
              <StatCard value="1 login" label="Para ver tu progreso" />
              <StatCard value="Wallet" label="Para canjear en caja" />
            </div>
          </div>
        </Reveal>
      </section>

      <Reveal><TrustStrip items={['CTA principal: Activar mi pase', 'CTA secundario: Entrar a mi cuenta', 'Flujo explicado sin contenido ambiguo']} /></Reveal>

      <Reveal>
        <SectionBand>
          <div className="grid gap-5 lg:grid-cols-[1fr,1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a74b3]">Antes de empezar</p>
              <h3 className="mt-3 text-2xl font-black md:text-3xl">¿No sabes por dónde entrar?</h3>
              <p className="mt-4 text-sm leading-relaxed text-[#5f4e84]">Si ya tienes pase o cuenta, entra directo. Si no, activa tu pase primero desde el QR de tu negocio favorito.</p>
            </div>
            <div className="grid gap-3 text-sm text-[#5f4e84]">
              <p className="rounded-xl border border-[#eadff8] bg-white p-4">• Si ya tienes cuenta: toca <strong>Entrar a mi cuenta</strong>.</p>
              <p className="rounded-xl border border-[#eadff8] bg-white p-4">• Si aún no tienes pase: toca <strong>Activar mi pase</strong>.</p>
              <p className="rounded-xl border border-[#eadff8] bg-white p-4">• Si quieres entender el flujo: baja a <strong>Cómo funciona</strong>.</p>
            </div>
          </div>
        </SectionBand>
      </Reveal>

      <Section id="como-funciona" eyebrow="Cómo funciona" title="Tres pasos, cero confusión" description="Tu objetivo se resuelve rápido: activar, entrar y canjear.">
        <StaggerGrid className="grid gap-4 md:grid-cols-3">
          {flow.map((item) => (
            <StaggerItem key={item.step}>
              <article className="rounded-3xl border border-[#ebdef8] bg-white p-6">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dac6f1] text-xs font-black text-[#7f3cf1]">{item.step}</span>
                <h3 className="mt-4 text-xl font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#645489]">{item.description}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <Section eyebrow="Beneficios" title="Diseñado para usarse de verdad" description="Menos pasos y mejor claridad para que sí regreses y canjees.">
        <StaggerGrid className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <StaggerItem key={benefit.title}><FeatureCard icon={benefit.icon} title={benefit.title} description={benefit.description} /></StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-2">
        <Reveal>
          <CtaPanel
            title="¿Listo para empezar?"
            description="Activa tu pase ahora o entra a tu cuenta si ya estás registrado."
            primary={{ href: '/activar-pase', label: 'Activar mi pase' }}
            secondary={{ href: '/ingresar?tipo=cliente', label: 'Entrar a mi cuenta' }}
          />
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
