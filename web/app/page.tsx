import Link from 'next/link';
import {
  CtaPanel,
  FeatureCard,
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  Section,
  SectionBand,
  TrustStrip,
  buttonStyles,
} from './components/marketing/ui';
import { Reveal, StaggerGrid, StaggerItem } from './components/marketing/effects';

const valuePillars = [
  {
    icon: '🎯',
    title: 'Qué es Punto IA',
    description: 'Plataforma de lealtad digital para aumentar recompra en negocios y simplificar la experiencia de recompensas para clientes.',
  },
  {
    icon: '🏪',
    title: 'Ruta para negocios',
    description: 'Implementas un programa claro, operable por tu equipo y medible en ventas y recurrencia.',
  },
  {
    icon: '📲',
    title: 'Ruta para clientes',
    description: 'Entras, creas tu cuenta o activas pase sin fricción para comenzar a acumular y canjear.',
  },
];

const businessChecklist = [
  'Entender en 1 minuto cómo Punto IA mejora la recurrencia.',
  'Ver el flujo de implementación y operación en caja.',
  'Solicitar una demo guiada para tu tipo de negocio.',
];

const customerChecklist = [
  'Iniciar sesión si ya tengo cuenta.',
  'Crear cuenta si es mi primera vez.',
  'Activar pase para empezar a acumular recompensas.',
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffdf9] text-[#1d1238]">
      <MarketingBackground />
      <MarketingHeader badge="Inicio pre-login simplificado" primaryCta={{ href: '/ingresar?tipo=cliente', label: 'Iniciar sesión' }} />

      <section className="relative mx-auto grid w-full max-w-7xl gap-7 px-6 pb-12 pt-10 md:pb-14 lg:grid-cols-[1.03fr,0.97fr] lg:items-start">
        <Reveal>
          <div className="rounded-[2rem] border border-[#ead8fb] bg-white/95 p-7 shadow-[0_24px_60px_rgba(45,23,84,0.1)] md:p-10">
            <p className="inline-flex rounded-full border border-[#ead8fb] bg-[#fff8ff] px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#634294]">
              Punto IA | Inicio
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-[#1f133c] sm:text-6xl lg:text-7xl">
              En 5 segundos entiendes
              <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] bg-clip-text text-transparent">
                cómo avanzar con Punto IA.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#473371] sm:text-lg">
              Diseñamos esta home como un hub de decisión: dos rutas claras, valor explicable y acciones directas para negocio y cliente antes del login.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <article className="rounded-xl border border-[#efe2fb] bg-[#fffdfa] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6bb8]">Negocios</p>
                <p className="mt-2 text-sm font-semibold text-[#2f1f57]">Ver solución y solicitar demo.</p>
              </article>
              <article className="rounded-xl border border-[#efe2fb] bg-[#fffdfa] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6bb8]">Clientes</p>
                <p className="mt-2 text-sm font-semibold text-[#2f1f57]">Iniciar sesión, crear cuenta o activar pase.</p>
              </article>
              <article className="rounded-xl border border-[#efe2fb] bg-[#fffdfa] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6bb8]">Resultado</p>
                <p className="mt-2 text-sm font-semibold text-[#2f1f57]">Menos confusión y mayor conversión.</p>
              </article>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <aside className="rounded-[2rem] border border-[#ead8fb] bg-white p-6 shadow-[0_18px_46px_rgba(45,23,84,0.09)] md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8160b0]">Elige tu camino</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#221542]">
              Dos rutas, cinco CTAs, cero ambigüedad.
            </h2>

            <article className="mt-6 rounded-2xl border border-[#f0e5fc] bg-[#fffdf9] p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6bbb]">Soy negocio</p>
              <h3 className="mt-2 text-2xl font-black text-[#251747]">Quiero vender más y retener mejor.</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#4a3577]">
                Entiende cómo Punto IA convierte visitas sueltas en recompra frecuente con operación simple para tu equipo.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/negocios" className={buttonStyles('primary')}>Ver solución</Link>
                <a href="mailto:ventas@puntoia.mx?subject=Demo%20Punto%20IA" className={buttonStyles('secondary')}>Solicitar demo</a>
              </div>
            </article>

            <article className="mt-4 rounded-2xl border border-[#f0e5fc] bg-[#fffdf9] p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6bbb]">Soy cliente</p>
              <h3 className="mt-2 text-2xl font-black text-[#251747]">Quiero entrar y activar mis recompensas.</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#4a3577]">
                Accede directo a tu cuenta, crea perfil o activa pase para comenzar a acumular y canjear desde hoy.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <Link href="/ingresar?tipo=cliente" className={buttonStyles('primary')}>Iniciar sesión</Link>
                <Link href="/ingresar?tipo=cliente&modo=registro" className={buttonStyles('secondary')}>Crear cuenta</Link>
                <Link href="/activar-pase" className={buttonStyles('secondary')}>Activar pase</Link>
              </div>
            </article>
          </aside>
        </Reveal>
      </section>

      <Reveal>
        <TrustStrip items={['Propuesta de valor clara desde el primer scroll', 'Separación total entre ruta de negocio y cliente', 'Acciones principales visibles sin fricción mental']} />
      </Reveal>

      <Section
        eyebrow="Propuesta de valor"
        title="Qué hace Punto IA antes del login"
        description="Unificamos mensaje, navegación y jerarquía para que cada usuario entienda qué es la plataforma y cuál es su siguiente paso."
      >
        <StaggerGrid className="grid gap-4 md:grid-cols-3">
          {valuePillars.map((pillar) => (
            <StaggerItem key={pillar.title}>
              <FeatureCard icon={pillar.icon} title={pillar.title} description={pillar.description} />
            </StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <Reveal>
        <SectionBand>
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#ecdffb] bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6bbb]">Ruta negocio</p>
              <h3 className="mt-3 text-2xl font-black text-[#231644]">Lo esencial para decidir rápido</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#4b3778]">
                {businessChecklist.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/negocios" className={buttonStyles('secondary')}>Ver solución de negocio</Link>
                <a href="mailto:ventas@puntoia.mx?subject=Demo%20Punto%20IA" className={buttonStyles('tertiary')}>Solicitar demo</a>
              </div>
            </article>

            <article className="rounded-3xl border border-[#ecdffb] bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6bbb]">Ruta cliente</p>
              <h3 className="mt-3 text-2xl font-black text-[#231644]">Todo listo para entrar sin dudas</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#4b3778]">
                {customerChecklist.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/ingresar?tipo=cliente" className={buttonStyles('secondary')}>Iniciar sesión</Link>
                <Link href="/ingresar?tipo=cliente&modo=registro" className={buttonStyles('tertiary')}>Crear cuenta</Link>
                <Link href="/activar-pase" className={buttonStyles('tertiary')}>Activar pase</Link>
              </div>
            </article>
          </div>
        </SectionBand>
      </Reveal>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-4">
        <Reveal>
          <CtaPanel
            title="¿Qué quieres hacer ahora?"
            description="Elige tu siguiente paso sin navegar de más: si eres negocio, revisa la solución. Si eres cliente, entra directo a tu cuenta."
            primary={{ href: '/negocios', label: 'Ver solución para negocio' }}
            secondary={{ href: '/ingresar?tipo=cliente', label: 'Entrar como cliente' }}
          />
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
