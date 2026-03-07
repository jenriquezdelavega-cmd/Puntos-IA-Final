import Link from 'next/link';
import {
  MarketingBackground,
  MarketingFooter,
  MarketingHeader,
  buttonStyles,
} from './components/marketing/ui';
import { Reveal } from './components/marketing/effects';

const businessFlow = ['Ver solución', 'Solicitar demo', 'Implementar en 3 a 7 días'];
const customerFlow = ['Iniciar sesión', 'Crear cuenta', 'Activar pase'];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffdf9] text-[#1d1238]">
      <MarketingBackground />
      <MarketingHeader badge="Inicio de Punto IA" primaryCta={{ href: '/ingresar?tipo=cliente', label: 'Iniciar sesión' }} />

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-10 md:pb-20">
        <Reveal>
          <div className="rounded-[2rem] border border-[#ead8fb] bg-white/95 p-7 shadow-[0_24px_60px_rgba(45,23,84,0.1)] md:p-10">
            <p className="inline-flex rounded-full border border-[#ead8fb] bg-[#fff8ff] px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#634294]">
              Inicio
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-[#1f133c] sm:text-6xl">
              Elige tu camino:
              <span className="block bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] bg-clip-text text-transparent">
                negocio o cliente.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#473371] sm:text-lg">
              Punto IA ayuda a negocios a aumentar recompra y a clientes a usar recompensas sin fricción.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#ead8fb] bg-white p-6 md:p-7">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6bbb]">Soy negocio</p>
              <h2 className="mt-3 text-3xl font-black text-[#231644]">Quiero vender más.</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4a3577]">
                Activa un programa de lealtad claro para que tus clientes regresen más seguido.
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
                <Link href="/negocios" className={buttonStyles('primary')}>Ver solución</Link>
                <a href="mailto:ventas@puntoia.mx?subject=Demo%20Punto%20IA" className={buttonStyles('secondary')}>Solicitar demo</a>
              </div>
            </article>

            <article className="rounded-3xl border border-[#ead8fb] bg-white p-6 md:p-7">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6bbb]">Soy cliente</p>
              <h2 className="mt-3 text-3xl font-black text-[#231644]">Quiero mis recompensas.</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4a3577]">
                Entra a tu cuenta o activa tu pase para empezar a acumular y canjear.
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
                <Link href="/ingresar?tipo=cliente" className={buttonStyles('primary')}>Iniciar sesión</Link>
                <Link href="/ingresar?tipo=cliente&modo=registro" className={buttonStyles('secondary')}>Crear cuenta</Link>
                <Link href="/activar-pase" className={buttonStyles('secondary')}>Activar pase</Link>
              </div>
            </article>
          </div>
        </Reveal>
      </section>

      <MarketingFooter />
    </main>
  );
}
