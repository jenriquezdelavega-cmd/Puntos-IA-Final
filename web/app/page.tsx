import Link from 'next/link';
import {
  BrandSpotlight,
  CtaPanel,
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  Section,
  SectionBand,
  TrustStrip,
  buttonStyles,
} from './components/marketing/ui';
import { Reveal, StaggerGrid, StaggerItem } from './components/marketing/effects';

const routes = [
  {
    href: '/negocios',
    title: 'Soy negocio',
    summary: 'Quiero subir recurrencia, ordenar mi operación y medir si mi programa de lealtad realmente vende más.',
    cta: 'Ver solución para mi negocio',
    bullets: ['Qué problema resuelve', 'Cómo funciona en 3 pasos', 'Cómo agendar una demo'],
  },
  {
    href: '/clientes',
    title: 'Soy cliente',
    summary: 'Quiero entrar rápido, crear mi cuenta y activar mi pase para acumular y canjear recompensas.',
    cta: 'Ir a la ruta de clientes',
    bullets: ['Iniciar sesión', 'Crear cuenta', 'Activar pase'],
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffdfb] text-[#1d1238]">
      <MarketingBackground />
      <MarketingHeader primaryCta={{ href: '/negocios', label: 'Quiero vender más' }} />

      <section className="relative mx-auto grid w-full max-w-7xl gap-6 px-6 pb-12 pt-10 md:pb-14 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <Reveal>
          <div className="rounded-[2rem] border border-[#e4d2f6] bg-white p-7 shadow-[0_24px_60px_rgba(45,23,84,0.12)] md:p-10">
            <p className="inline-flex rounded-full border border-[#dfcbf5] bg-[#fef9ff] px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#4f3678]">
              Lealtad digital con Punto IA
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-[#1f133c] sm:text-6xl lg:text-7xl">
              Todo claro desde el inicio
              <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] bg-clip-text text-transparent">
                para negocios y clientes.
              </span>
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#3f2d63] sm:text-lg">
              Esta home ahora es un hub claro. Si eres negocio, te mostramos valor comercial y cómo iniciar. Si eres cliente, te llevamos directo a iniciar sesión, crear cuenta o activar pase.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/negocios" className={buttonStyles('primary')}>Soy negocio</Link>
              <Link href="/clientes" className={buttonStyles('secondary')}>Soy cliente</Link>
              <Link href="/ingresar" className={buttonStyles('tertiary')}>Ya tengo cuenta</Link>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <BrandSpotlight caption="La marca y la promesa comercial se ven más claras, con mejor contraste y mayor recordación visual." />
        </Reveal>
      </section>

      <Reveal>
        <TrustStrip items={['Solo dos rutas principales', 'Mensajes más claros y menos ruido visual', 'CTAs directos para avanzar sin dudas']} />
      </Reveal>

      <Section eyebrow="Inicio" title="Entra por la opción que te corresponde" description="Quitamos secciones ambiguas para que cada persona sepa exactamente dónde ir.">
        <StaggerGrid className="grid gap-4 md:grid-cols-2">
          {routes.map((route) => (
            <StaggerItem key={route.href}>
              <article className="rounded-3xl border border-[#ebdef8] bg-white p-6">
                <h3 className="text-2xl font-black text-[#231644]">{route.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#645489]">{route.summary}</p>
                <ul className="mt-4 space-y-2 text-sm text-[#4f3d76]">
                  {route.bullets.map((bullet) => (
                    <li key={bullet}>• {bullet}</li>
                  ))}
                </ul>
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
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b75b4]">Negocios</p>
              <p className="mt-3 text-lg font-black">Entiende el valor en menos de un minuto y agenda demo.</p>
            </div>
            <div className="rounded-2xl border border-[#ebdef8] bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b75b4]">Clientes</p>
              <p className="mt-3 text-lg font-black">Inicia sesión, crea cuenta o activa pase sin fricción.</p>
            </div>
            <div className="rounded-2xl border border-[#ebdef8] bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b75b4]">Resultado</p>
              <p className="mt-3 text-lg font-black">Menos confusión, mejor flujo y mejor conversión.</p>
            </div>
          </div>
        </SectionBand>
      </Reveal>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-2">
        <Reveal>
          <CtaPanel
            title="¿Desde dónde quieres entrar?"
            description="Si eres negocio, agenda demo. Si eres cliente, activa tu pase o entra a tu cuenta."
            primary={{ href: '/negocios', label: 'Ir a Negocios' }}
            secondary={{ href: '/clientes', label: 'Ir a Clientes' }}
          />
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
