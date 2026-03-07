import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export type NavItem = {
  href: string;
  label: string;
};

type HeaderProps = {
  badge?: string;
  primaryCta?: NavItem;
};

const navItems: NavItem[] = [
  { href: '/', label: 'Inicio' },
  { href: '/negocios', label: 'Soy negocio' },
  { href: '/clientes', label: 'Soy cliente' },
];

function ActionLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (href.startsWith('mailto:') || href.startsWith('http')) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function buttonStyles(variant: 'primary' | 'secondary' | 'tertiary' = 'primary') {
  if (variant === 'secondary') {
    return 'inline-flex items-center justify-center rounded-xl border border-[#d8c0f3] bg-white px-5 py-3 text-sm font-semibold text-[#2a184f] transition hover:border-[#be9ce9] hover:bg-[#fef9ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]';
  }

  if (variant === 'tertiary') {
    return 'inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-[#4a3375] transition hover:bg-[#f6efff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]';
  }

  return 'inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#ff8557] via-[#ff4a93] to-[#8754f4] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(236,84,136,0.3)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a59]';
}

export function BrandSpotlight({ caption }: { caption: string }) {
  return (
    <div className="rounded-[1.7rem] border border-[#ead8fb] bg-[linear-gradient(145deg,#ffffff_0%,#fff8f2_45%,#f7efff_100%)] p-5 shadow-[0_20px_48px_rgba(75,44,132,0.12)]">
      <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-[linear-gradient(120deg,#26164a_0%,#1c1138_55%,#2f1b59_100%)] px-6 py-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#ff8e68]/36 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-[#8b5cf6]/34 blur-3xl" />
        <Image src="/logo.png" alt="Punto IA" width={240} height={88} className="relative h-14 w-auto object-contain" />
      </div>
      <p className="mt-4 text-sm font-semibold text-[#3e2b67]">{caption}</p>
    </div>
  );
}

export function MarketingHeader({ badge = 'Lealtad digital para negocios y clientes', primaryCta }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#efdefe] bg-white/90 text-[#29184f] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="rounded-2xl border border-[#3b2668] bg-[linear-gradient(120deg,#2a184f_0%,#1e133b_55%,#3a2368_100%)] px-3 py-2 shadow-[0_10px_24px_rgba(53,30,95,0.32)]">
            <Image src="/logo.png" alt="Punto IA" width={200} height={76} className="h-8 w-auto object-contain sm:h-9" priority />
          </span>
          <span className="hidden rounded-full border border-[#ecdffb] bg-[#fff6fb] px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-[#6b4c9b] lg:inline-flex">
            {badge}
          </span>
        </Link>

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto rounded-full border border-[#ecdffb] bg-white p-1 md:order-2 md:w-auto md:overflow-visible" aria-label="Navegación principal">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap text-[#5a3f8c] transition hover:bg-[#f6eeff] hover:text-[#2d1a55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9c5ff]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {primaryCta ? <ActionLink href={primaryCta.href} className={`order-2 md:order-3 ${buttonStyles('primary')}`}>{primaryCta.label}</ActionLink> : null}
      </div>
    </header>
  );
}

export function MarketingBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[#fffdf9]" />
      <div className="marketing-gradient pointer-events-none absolute inset-0 opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,249,242,0.84)_34%,#fffdf9_100%)]" />
    </>
  );
}

export function TrustStrip({ items }: { items: string[] }) {
  return (
    <div className="relative mx-auto w-full max-w-7xl px-6">
      <div className="grid gap-3 rounded-2xl border border-[#ead8fb] bg-white/95 p-4 text-center shadow-[0_8px_20px_rgba(83,45,149,0.06)] sm:grid-cols-3">
        {items.map((item) => (
          <p key={item} className="text-xs font-semibold tracking-wide text-[#4a3577] sm:text-sm">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

export function SocialProof({ cases }: { cases: Array<{ name: string; result: string; context: string }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cases.map((item) => (
        <article key={item.name} className="rounded-2xl border border-[#ecdef9] bg-white p-5">
          <p className="text-sm font-black text-[#231644]">{item.name}</p>
          <p className="mt-2 text-2xl font-black text-[#d83b77]">{item.result}</p>
          <p className="mt-2 text-xs leading-relaxed text-[#4d3972]">{item.context}</p>
        </article>
      ))}
    </div>
  );
}

type SectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function Section({ id, eyebrow, title, description, children }: SectionProps) {
  return (
    <section id={id} className="relative mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a5aa8]">{eyebrow}</p> : null}
        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-[#20133f] md:text-5xl">{title}</h2>
        {description ? <p className="mt-4 text-base leading-relaxed text-[#4a3577] md:text-lg">{description}</p> : null}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function SectionBand({ children }: { children: ReactNode }) {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-6 py-8 md:py-10">
      <div className="rounded-[2rem] border border-[#ead8fb] bg-[#fffefd] p-6 shadow-[0_14px_32px_rgba(69,37,124,0.07)] md:p-8">{children}</div>
    </section>
  );
}

export function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <article className="rounded-2xl border border-[#e8d8f6] bg-white p-5 transition hover:border-[#d3b9ef]">
      <p className="text-2xl font-black text-[#211440] md:text-3xl">{value}</p>
      <p className="mt-2 text-sm font-semibold leading-snug text-[#4a3577]">{label}</p>
    </article>
  );
}

export function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <article className="group rounded-3xl border border-[#e8d9f6] bg-white p-6 transition duration-300 hover:-translate-y-0.5 hover:border-[#cfb1ec]">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7f0ff] text-xl">{icon}</span>
      <h3 className="mt-5 text-xl font-black text-[#20133f]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#4a3577]">{description}</p>
    </article>
  );
}

export function CtaPanel({ title, description, primary, secondary }: { title: string; description: string; primary: NavItem; secondary?: NavItem }) {
  return (
    <div className="rounded-[2rem] border border-[#ead8fb] bg-[linear-gradient(130deg,#fff7ef_0%,#fff8fd_45%,#f6f0ff_100%)] p-7 shadow-[0_18px_40px_rgba(124,58,237,0.09)] md:p-10">
      <h3 className="text-3xl font-black leading-tight text-[#211440] md:text-4xl">{title}</h3>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#4a3577]">{description}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <ActionLink href={primary.href} className={buttonStyles('primary')}>
          {primary.label}
        </ActionLink>
        {secondary ? (
          <ActionLink href={secondary.href} className={buttonStyles('secondary')}>
            {secondary.label}
          </ActionLink>
        ) : null}
      </div>
    </div>
  );
}

export function FaqBlock({ items }: { items: Array<{ question: string; answer: string }> }) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <details key={item.question} className="group rounded-2xl border border-[#e6d5f7] bg-white p-5 open:border-[#cfb1ec]">
          <summary className="cursor-pointer list-none pr-10 text-base font-black text-[#20133f] marker:content-none">{item.question}</summary>
          <p className="mt-3 text-sm leading-relaxed text-[#47336d]">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-[#ead8fb] bg-[#fff9f3] text-[#281a4a]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.3fr,1fr,1fr]">
        <div>
          <div className="inline-flex rounded-2xl border border-[#3b2668] bg-[linear-gradient(120deg,#2a184f_0%,#1e133b_55%,#3a2368_100%)] px-4 py-3 shadow-[0_10px_24px_rgba(53,30,95,0.28)]">
            <Image src="/logo.png" alt="Punto IA" width={200} height={80} className="h-9 w-auto object-contain" />
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#4a3577]">
            Plataforma de lealtad para PyMEs en México. Menos fricción para tu equipo y más recompra de tus clientes.
          </p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#715396]">Navegación</p>
          <ul className="mt-4 space-y-2 text-sm text-[#4a3577]">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-[#20133f]">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/ingresar" className="transition hover:text-[#20133f]">Ingresar</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#715396]">Contacto</p>
          <ul className="mt-4 space-y-2 text-sm text-[#4a3577]">
            <li><a href="mailto:ventas@puntoia.mx" className="transition hover:text-[#20133f]">ventas@puntoia.mx</a></li>
            <li><Link href="/terminos-privacidad" className="transition hover:text-[#20133f]">Términos y privacidad</Link></li>
            <li>Implementación típica: 3 a 7 días hábiles.</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
