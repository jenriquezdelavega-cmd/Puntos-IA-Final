import Link from 'next/link';
import {
  CtaPanel,
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  Section,
  SectionBand,
  SocialProof,
  TrustStrip,
  buttonStyles,
} from './components/marketing/ui';
import { Reveal, StaggerGrid, StaggerItem } from './components/marketing/effects';

const routes = [
  {
    href: '/negocios',
    title: 'Soy negocio',
    summary: 'Quiero atraer más clientes recurrentes, automatizar recompensas y tomar decisiones con métricas claras.',
    cta: 'Conocer solución para negocios',
  },
  {
    href: '/clientes',
    title: 'Soy cliente',
    summary: 'Quiero activar mi pase en segundos, consultar mis puntos y canjear recompensas sin complicaciones.',
    cta: 'Entrar como cliente',
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f1ff] text-[#1d1238]">
      <MarketingBackground />
      <MarketingHeader primaryCta={{ href: '/ingresar', label: 'Entrar' }} />

      <section className="relative mx-auto grid w-full max-w-7xl gap-8 px-6 pb-14 pt-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <Reveal>
          <div>
            <p className="inline-flex rounded-full border border-[#d4c1f5] bg-[#fdfbff] px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#61488f]">
              Lealtad inteligente para negocios que crecen
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Convierte cada visita en
              <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] bg-clip-text text-transparent">
                relaciones que regresan.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#433061] sm:text-lg">
              Diseñamos una experiencia clara para ambos lados: tu negocio incrementa recurrencia y tus clientes vuelven con más frecuencia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/negocios" className={buttonStyles('primary')}>Quiero hacerlo en mi negocio</Link>
              <Link href="/activar-pase" className={buttonStyles('secondary')}>Soy cliente: activar pase</Link>
              <Link href="/ingresar" className={buttonStyles('tertiary')}>Ya tengo cuenta</Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-[2rem] border border-[#d8c6f7] bg-[#fbf9ff] p-6 shadow-[0_24px_60px_rgba(45,23,84,0.16)] md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#71539f]">Por qué funciona</p>
            <div className="mt-5 grid gap-3">
              <p className="rounded-2xl border border-[#dfcff8] bg-white p-4 text-sm text-[#392657]"><strong className="text-[#1d1238]">Para negocio:</strong> activas campañas enfocadas en recurrencia y observas resultados en tiempo real.</p>
              <p className="rounded-2xl border border-[#dfcff8] bg-white p-4 text-sm text-[#392657]"><strong className="text-[#1d1238]">Para cliente:</strong> acumula visitas o puntos desde su wallet, sin descargas ni fricción.</p>
              <p className="rounded-2xl border border-[#dfcff8] bg-white p-4 text-sm text-[#392657]"><strong className="text-[#1d1238]">Resultado:</strong> más recompra, mejor experiencia y una operación simple para tu equipo.</p>
            </div>
          </div>
        </Reveal>
      </section>

      <Reveal>
        <TrustStrip items={['Ruta clara para negocio y cliente', 'Mensajes directos que explican valor en segundos', 'Acciones principales visibles en cada sección']} />
      </Reveal>

      <Section eyebrow="Experiencia guiada" title="Elige tu ruta y avanza en segundos" description="Cada pantalla tiene un objetivo claro para que tomes acción sin dudas.">
        <StaggerGrid className="grid gap-4 md:grid-cols-2">
          {routes.map((route) => (
            <StaggerItem key={route.href}>
              <article className="rounded-3xl border border-[#ebdef8] bg-white p-6">
                <h3 className="text-2xl font-black text-[#231644]">{route.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#645489]">{route.summary}</p>
                <Link href={route.href} className={`mt-6 ${buttonStyles('secondary')}`}>
                  {route.cta}
                </Link>
              </article>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </Section>

      <Reveal>
        <SectionBand>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#ebdef8] bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b75b4]">1. Estrategia</p>
              <p className="mt-3 text-lg font-black">Definimos metas comerciales y propuesta de valor</p>
            </div>
            <div className="rounded-2xl border border-[#ebdef8] bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b75b4]">2. Implementación</p>
              <p className="mt-3 text-lg font-black">Lanzamos wallet, reglas y recompensas listas para operar</p>
            </div>
            <div className="rounded-2xl border border-[#ebdef8] bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b75b4]">3. Optimización</p>
              <p className="mt-3 text-lg font-black">Optimizamos con datos reales de visitas y canjes</p>
            </div>
          </div>
        </SectionBand>
      </Reveal>

      <Section eyebrow="Resultados" title="Indicadores iniciales en negocios PyME" description="Ejemplos de desempeño para estimar el potencial en tu operación.">
        <SocialProof
          cases={[
            { name: 'Café Luna (Monterrey)', result: '+19% recurrencia', context: 'Con visitas dobles en horarios de baja demanda durante 8 semanas.' },
            { name: 'Barbería Norte (CDMX)', result: '+24% canjes', context: 'Con recompensas por frecuencia y recordatorios semanales.' },
            { name: 'Taquería Centro (Guadalajara)', result: '+17% ticket recurrente', context: 'Al combinar puntos acumulables y retos semanales.' },
          ]}
        />
      </Section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-2">
        <Reveal>
          <CtaPanel
            title="Da el siguiente paso con claridad"
            description="Si lideras un negocio, agenda una demo. Si eres cliente, activa tu pase y empieza a acumular recompensas hoy."
            primary={{ href: '/negocios#demo', label: 'Solicitar demo' }}
            secondary={{ href: '/activar-pase', label: 'Activar mi pase' }}
          />
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
