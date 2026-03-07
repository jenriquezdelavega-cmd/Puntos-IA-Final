import Link from 'next/link';
import { ArrowRight, Building2, ChartNoAxesCombined, CircleUserRound, LogIn, Sparkles, TicketCheck } from 'lucide-react';
import {
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  buttonStyles,
} from './components/marketing/ui';
import { Reveal } from './components/marketing/effects';

const valueTags = ['Operación simple en caja', 'Wallet sin app adicional', 'Métricas de recompra'];

const businessFlow = [
  'Explora la solución para tu operación.',
  'Solicita una demo aplicada a tu giro.',
  'Implementa en 3 a 7 días con acompañamiento.',
];

const customerFlow = [
  'Inicia sesión con tu teléfono.',
  'Crea tu cuenta en minutos.',
  'Activa tu pase para acumular y canjear.',
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffdf9] text-[#1d1238]">
      <MarketingBackground />
      <MarketingHeader badge="Punto IA | Plataforma de lealtad" primaryCta={{ href: '/ingresar?tipo=cliente&modo=login', label: 'Iniciar sesión' }} />

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-10 md:pb-20">
        <Reveal>
          <div className="rounded-[2rem] border border-[#ead8fb] bg-white/95 p-7 shadow-[0_24px_60px_rgba(45,23,84,0.1)] md:p-10">
            <p className="inline-flex rounded-full border border-[#ead8fb] bg-[#fff8ff] px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#634294]">
              Punto IA
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-[#1f133c] sm:text-6xl">
              Lealtad digital para
              <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] bg-clip-text text-transparent">
                negocios y clientes.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#473371] sm:text-lg">
              Si administras un negocio, revisa la solución y agenda una demo. Si eres cliente, entra a tu cuenta o activa tu pase para empezar a usar recompensas.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {valueTags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full border border-[#ead8fb] bg-white px-3 py-1 text-xs font-semibold text-[#563d84]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#ead8fb] bg-white p-6 md:p-7">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#8b6bbb]">
                <Building2 className="h-4 w-4" />
                Negocios
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#231644]">Gestiona lealtad con enfoque comercial.</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4a3577]">
                Diseñado para equipos que necesitan más recurrencia, operación clara y decisiones basadas en datos.
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

            <article className="rounded-3xl border border-[#ead8fb] bg-white p-6 md:p-7">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#8b6bbb]">
                <CircleUserRound className="h-4 w-4" />
                Clientes
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#231644]">Accede a tu cuenta y tu pase.</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4a3577]">
                Todo el flujo de acceso está centralizado para que entrar, registrarte y activar pase sea directo.
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
            </article>
          </div>
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
