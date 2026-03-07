import Link from 'next/link';
import {
  BrandSpotlight,
  CtaPanel,
  FeatureCard,
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  Section,
  SectionBand,
  TrustStrip,
  buttonStyles,
} from '../components/marketing/ui';
import { Reveal, StaggerGrid, StaggerItem } from '../components/marketing/effects';

const actions = [
  {
    title: 'Iniciar sesión',
    description: 'Si ya tienes cuenta, entra con tu número para ver puntos y recompensas.',
    href: '/ingresar?tipo=cliente',
    cta: 'Entrar a mi cuenta',
  },
  {
    title: 'Crear cuenta',
    description: 'Si es tu primera vez, crea tu cuenta en minutos y guarda tu progreso.',
    href: '/ingresar?tipo=cliente&modo=registro',
    cta: 'Crear mi cuenta',
  },
  {
    title: 'Activar pase',
    description: 'Escanea el QR del negocio y activa tu pase para acumular desde hoy.',
    href: '/activar-pase',
    cta: 'Activar mi pase',
  },
];

const flow = [
  {
    step: '1',
    title: 'Elige una acción',
    description: 'Inicia sesión, crea cuenta o activa pase según tu situación.',
  },
  {
    step: '2',
    title: 'Guarda tu pase',
    description: 'Usa Apple Wallet o Google Wallet para tenerlo siempre a la mano.',
  },
  {
    step: '3',
    title: 'Acumula y canjea',
    description: 'Muestra tu pase en caja para sumar visitas o canjear recompensas.',
  },
];

const benefits = [
  { icon: '⚡', title: 'Sin app extra', description: 'Todo funciona desde tu celular y wallet.' },
  { icon: '🎁', title: 'Premios claros', description: 'Sabes qué te falta y cuándo puedes canjear.' },
  { icon: '🔒', title: 'Cuenta protegida', description: 'Tu historial queda guardado para volver cuando quieras.' },
  { icon: '📍', title: 'Negocios locales', description: 'Aprovecha beneficios en lugares que sí frecuentas.' },
];

export default function ClientesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffdfb] text-[#231644]">
      <MarketingBackground />
      <MarketingHeader badge="Ruta para clientes" primaryCta={{ href: '/activar-pase', label: 'Activar pase' }} />

      <section className="relative mx-auto grid w-full max-w-7xl gap-6 px-6 pb-10 pt-10 md:pb-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <Reveal>
          <div>
            <p className="inline-flex rounded-full border border-[#e9def8] bg-white px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#7d69a5]">
              Ruta de clientes simplificada
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Todo claro desde el inicio:
              <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] bg-clip-text text-transparent">
                entrar, crear cuenta o activar pase.
              </span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-[#3f2d63] sm:text-lg">
              Esta página elimina dudas. Solo te mostramos las tres acciones que importan para empezar y usar tus recompensas sin fricción.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <BrandSpotlight caption="Tu pase, tus recompensas y la marca en una experiencia visual más memorable y clara." />
        </Reveal>
      </section>

      <SectionBand>
        <StaggerGrid className="grid gap-4 md:grid-cols-3">
          {actions.map((action) => (
            <StaggerItem key={action.title}>
              <article className="rounded-3xl border border-[#ebdef8] bg-white p-6">
                <h2 className="text-2xl font-black text-[#231644]">{action.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#3f2d63]">{action.description}</p>
                <Link href={action.href} className={`mt-6 ${buttonStyles('secondary')}`}>
                  {action.cta}
                </Link>
              </article>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </SectionBand>

      <Reveal><TrustStrip items={['Acción 1: Iniciar sesión', 'Acción 2: Crear cuenta', 'Acción 3: Activar pase']} /></Reveal>

      <Section eyebrow="Cómo funciona" title="Tres pasos para usar tus recompensas" description="No necesitas aprender nada complejo.">
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

      <Section eyebrow="Beneficios" title="Experiencia rápida y sin carga mental" description="Diseñado para que regreses más fácil a tus negocios favoritos.">
        <StaggerGrid className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <StaggerItem key={benefit.title}><FeatureCard icon={benefit.icon} title={benefit.title} description={benefit.description} /></StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-2">
        <Reveal>
          <CtaPanel
            title="¿Qué necesitas hacer ahora?"
            description="Elige una acción y sigue. Si ya tienes cuenta, entra. Si no, crea tu cuenta o activa pase."
            primary={{ href: '/ingresar?tipo=cliente', label: 'Iniciar sesión' }}
            secondary={{ href: '/activar-pase', label: 'Activar pase' }}
          />
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
