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
    summary: 'Quiero aumentar visitas repetidas, activar recompensas y tener métricas claras de desempeño.',
    cta: 'Ver solución para mi negocio',
  },
  {
    href: '/clientes',
    title: 'Soy cliente',
    summary: 'Quiero activar mi pase, entrar a mi cuenta y revisar cómo funcionan mis recompensas.',
    cta: 'Activar mi pase',
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffaf8] text-[#231644]">
      <MarketingBackground />
      <MarketingHeader primaryCta={{ href: '/ingresar', label: 'Entrar' }} />

      <section className="relative mx-auto grid w-full max-w-7xl gap-8 px-6 pb-14 pt-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <Reveal>
          <div>
            <p className="inline-flex rounded-full border border-[#e7daf7] bg-white px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#7c67a5]">
              Lealtad simple para PyMEs y sus clientes
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Punto IA te ayuda a
              <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] bg-clip-text text-transparent">
                activar recurrencia sin fricción.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#5f4e84] sm:text-lg">
              En segundos entiendes qué hacemos y eliges tu camino: solución para negocios o experiencia para clientes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/negocios" className={buttonStyles('primary')}>Ver solución para mi negocio</Link>
              <Link href="/activar-pase" className={buttonStyles('secondary')}>Activar mi pase</Link>
              <Link href="/ingresar" className={buttonStyles('tertiary')}>Entrar</Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-[2rem] border border-[#ebdef8] bg-white p-6 shadow-[0_20px_50px_rgba(87,46,145,0.08)] md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a74b3]">Qué resuelve Punto IA</p>
            <div className="mt-5 grid gap-3">
              <p className="rounded-2xl border border-[#f0e6fb] bg-[#fff9fd] p-4 text-sm text-[#4c3a72]"><strong className="text-[#231644]">Negocios:</strong> más frecuencia de visita y mejor retención con campañas medibles.</p>
              <p className="rounded-2xl border border-[#f0e6fb] bg-[#fff9fd] p-4 text-sm text-[#4c3a72]"><strong className="text-[#231644]">Clientes:</strong> un pase digital para acumular y canjear recompensas sin descargar apps.</p>
              <p className="rounded-2xl border border-[#f0e6fb] bg-[#fff9fd] p-4 text-sm text-[#4c3a72]"><strong className="text-[#231644]">Resultado:</strong> experiencia clara para ambos lados, con menos dudas y más acción.</p>
            </div>
          </div>
        </Reveal>
      </section>

      <Reveal>
        <TrustStrip items={['Home como hub simple: negocio o cliente', 'Navegación principal reducida a 4 rutas', 'CTAs directos y consistentes en todo el sitio']} />
      </Reveal>

      <Section eyebrow="Rutas claras" title="Elige tu camino en un clic" description="Cada ruta responde una intención concreta y muestra una acción principal obvia.">
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
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b75b4]">1. Diagnóstico</p>
              <p className="mt-3 text-lg font-black">Entendemos objetivos de negocio</p>
            </div>
            <div className="rounded-2xl border border-[#ebdef8] bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b75b4]">2. Activación</p>
              <p className="mt-3 text-lg font-black">Configuramos wallet, reglas y recompensas</p>
            </div>
            <div className="rounded-2xl border border-[#ebdef8] bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b75b4]">3. Optimización</p>
              <p className="mt-3 text-lg font-black">Mejoramos con datos reales de visitas y canjes</p>
            </div>
          </div>
        </SectionBand>
      </Reveal>

      <Section eyebrow="Resultados" title="Impacto observado en pilotos PyME" description="Referencias reales para dimensionar beneficios de forma clara.">
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
            title="Empieza por la ruta correcta"
            description="Si eres negocio, agenda una demo. Si eres cliente, activa tu pase y entra a tu cuenta en segundos."
            primary={{ href: '/negocios#demo', label: 'Solicitar demo' }}
            secondary={{ href: '/activar-pase', label: 'Activar mi pase' }}
          />
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
