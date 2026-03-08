import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  ChartNoAxesCombined,
  CircleUserRound,
  LogIn,
  Sparkles,
  TicketCheck,
} from 'lucide-react';
import {
  CtaPanel,
  FeatureCard,
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  SectionBand,
  buttonStyles,
} from './components/marketing/ui';
import { Reveal, StaggerGrid, StaggerItem } from './components/marketing/effects';

const valueTags = ['Hecho para PyMEs en México', 'Wallet sin app adicional', 'Operación en minutos'];

const premiumPillars = [
  {
    icon: '📈',
    title: 'Evolución comercial continua',
    description: 'Transformamos visitas sueltas en recompra medible con datos claros para tomar mejores decisiones.',
  },
  {
    icon: '🧠',
    title: 'Tecnología + conocimiento',
    description: 'No solo es software: acompañamos a tu equipo para operar campañas con criterio comercial real.',
  },
  {
    icon: '🔐',
    title: 'Experiencia confiable para cliente',
    description: 'Login, pase y recompensas en un flujo simple, rápido y consistente desde cualquier celular.',
  },
];

const businessFlow = [
  'Diagnóstico comercial de tu operación actual.',
  'Implementación guiada con reglas claras para caja y recompensas.',
  'Optimización con métricas de recurrencia, activación y canje.',
];

const customerFlow = [
  'Iniciar sesión con teléfono y contraseña.',
  'Crear cuenta en menos de 2 minutos.',
  'Activar pase y empezar a acumular al instante.',
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffdf9] text-[#1d1238]">
      <MarketingBackground />
      <MarketingHeader badge="Punto IA | Plataforma de lealtad" primaryCta={{ href: '/ingresar?tipo=cliente&modo=login', label: 'Iniciar sesión' }} />

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-10 md:pb-20">
        <Reveal>
          <div className="rounded-[2rem] border border-[#ead8fb] bg-[linear-gradient(130deg,#ffffff_0%,#fff7ef_50%,#f8f0ff_100%)] p-7 shadow-[0_24px_60px_rgba(45,23,84,0.1)] md:p-10">
            <p className="inline-flex rounded-full border border-[#ead8fb] bg-white px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#634294]">
              Plataforma mexicana de lealtad inteligente
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-[#1f133c] sm:text-6xl">
              La forma más avanzada de
              <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] bg-clip-text text-transparent">
                evolucionar PyMEs con lealtad.
              </span>
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#473371] sm:text-lg">
              Punto IA combina tecnología, operación y conocimiento comercial para que los negocios atiendan mejor a sus clientes,
              vendan con más recurrencia y construyan relaciones de largo plazo.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {valueTags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full border border-[#ead8fb] bg-white px-3 py-1 text-xs font-semibold text-[#563d84]">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-[#eddffb] bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7d65a8]">Implementación</p>
                <p className="mt-1 text-2xl font-black text-[#231644]">3-7 días</p>
              </article>
              <article className="rounded-2xl border border-[#eddffb] bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7d65a8]">Operación</p>
                <p className="mt-1 text-2xl font-black text-[#231644]">Simple</p>
              </article>
              <article className="rounded-2xl border border-[#eddffb] bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7d65a8]">Enfoque</p>
                <p className="mt-1 text-2xl font-black text-[#231644]">Recompra</p>
              </article>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#ead8fb] bg-white p-6 shadow-[0_12px_32px_rgba(72,37,126,0.08)] md:p-7">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#8b6bbb]">
                <Building2 className="h-4 w-4" />
                Soy negocio
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#231644]">Eleva tu PyME con tecnología y método comercial.</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4a3577]">
                Diseñado para dueños y equipos que quieren vender más, atender mejor y operar lealtad como una empresa top.
              </p>
              <ol className="mt-5 space-y-2 text-sm text-[#3e2d64]">
                {businessFlow.map((step, index) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#f4ebff] text-[11px] font-black text-[#6f42b8]">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/negocios" className={buttonStyles('primary')}>
                  <span className="inline-flex items-center gap-2">Ver solución <ChartNoAxesCombined className="h-4 w-4" /></span>
                </Link>
                <a href="mailto:ventas@puntoia.mx?subject=Demo%20Punto%20IA" className={buttonStyles('secondary')}>
                  <span className="inline-flex items-center gap-2">Solicitar demo <ArrowRight className="h-4 w-4" /></span>
                </a>
              </div>
            </article>

            <article className="rounded-3xl border border-[#d8c0f3] bg-[linear-gradient(130deg,#ffffff_0%,#fff7ff_50%,#f3eaff_100%)] p-6 shadow-[0_16px_36px_rgba(102,58,170,0.14)] md:p-7">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#8b6bbb]">
                <CircleUserRound className="h-4 w-4" />
                Soy cliente
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#231644]">Entrar a mi cuenta en segundos.</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4a3577]">
                Este es el acceso principal para clientes: login, registro y activación de pase en un solo lugar, sin confusión.
              </p>
              <ol className="mt-5 space-y-2 text-sm text-[#3e2d64]">
                {customerFlow.map((step, index) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#f4ebff] text-[11px] font-black text-[#6f42b8]">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                <Link href="/ingresar?tipo=cliente&modo=login" className={buttonStyles('primary')}>
                  <span className="inline-flex items-center gap-2">Iniciar sesión <LogIn className="h-4 w-4" /></span>
                </Link>
                <Link href="/ingresar?tipo=cliente&modo=registro" className={buttonStyles('secondary')}>
                  <span className="inline-flex items-center gap-2">Crear cuenta <Sparkles className="h-4 w-4" /></span>
                </Link>
                <Link href="/activar-pase" className={buttonStyles('secondary')}>
                  <span className="inline-flex items-center gap-2">Activar pase <TicketCheck className="h-4 w-4" /></span>
                </Link>
              </div>
              <p className="mt-3 text-xs font-semibold text-[#6d57a0]">
                ¿Ya tienes cuenta? Haz clic en <strong>Iniciar sesión</strong> y continúa en tu área de cliente.
              </p>
            </article>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <SectionBand>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8c75b5]">Diferencial Punto IA</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-[#231644] md:text-5xl">
              Tecnología premium para que cada PyME atienda como marca líder.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#5f4e84] md:text-lg">
              Unimos producto digital, disciplina comercial y claridad operativa para profesionalizar la relación con tus clientes.
            </p>
            <div className="mt-8">
              <StaggerGrid className="grid gap-4 md:grid-cols-3">
                {premiumPillars.map((pillar) => (
                  <StaggerItem key={pillar.title}>
                    <FeatureCard icon={pillar.icon} title={pillar.title} description={pillar.description} />
                  </StaggerItem>
                ))}
              </StaggerGrid>
            </div>
          </SectionBand>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="mt-8">
            <CtaPanel
              title="¿Qué quieres hacer ahora?"
              description="Si eres negocio, revisa la solución y agenda demo. Si eres cliente, entra a tu cuenta o activa tu pase en segundos."
              primary={{ href: '/ingresar?tipo=cliente&modo=login', label: 'Entrar como cliente' }}
              secondary={{ href: '/negocios', label: 'Ver solución para negocios' }}
            />
          </div>
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
