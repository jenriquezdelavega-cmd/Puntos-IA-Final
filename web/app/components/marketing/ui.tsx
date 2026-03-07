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
  { href: '/negocios', label: 'Negocios' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/ingresar', label: 'Ingresar' },
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
    return 'inline-flex items-center justify-center rounded-xl border border-[#cab8f0] bg-[#f8f5ff] px-5 py-3 text-sm font-bold text-[#241646] transition hover:border-[#b59be8] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]';
  }

  if (variant === 'tertiary') {
    return 'inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-[#4d3a75] transition hover:bg-[#f1ebff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]';
  }

  return 'inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#8b5cf6] px-5 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(255,99,146,0.28)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a59]';
}

export function MarketingHeader({ badge = 'Plataforma de lealtad para PyMEs', primaryCta }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#3a2c63]/90 bg-[#1f1737]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Punto IA" width={200} height={76} className="h-10 w-auto object-contain sm:h-11" priority />
          <span className="hidden rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 lg:inline-flex">
            {badge}
          </span>
        </Link>

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto rounded-full border border-white/15 bg-white/10 p-1 md:order-2 md:w-auto md:overflow-visible" aria-label="Navegación principal">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap text-white/85 transition hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4a7ff]"
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
      <div className="pointer-events-none absolute inset-0 bg-[#f6f1ff]" />
      <div className="marketing-gradient pointer-events-none absolute inset-0 opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,14,38,0.08)_0%,rgba(246,241,255,0.88)_22%,#f6f1ff_100%)]" />
    </>
  );
}

export function TrustStrip({ items }: { items: string[] }) {
  return (
    <div className="relative mx-auto w-full max-w-7xl px-6">
      <div className="grid gap-3 rounded-2xl border border-[#d8c6f7] bg-[#fbf9ff] p-4 text-center sm:grid-cols-3">
        {items.map((item) => (
          <p key={item} className="text-xs font-semibold tracking-wide text-[#46336d] sm:text-sm">
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
          <p className="mt-2 text-2xl font-black text-[#e5507e]">{item.result}</p>
          <p className="mt-2 text-xs leading-relaxed text-[#645489]">{item.context}</p>
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
        {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8c75b5]">{eyebrow}</p> : null}
        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-[#231644] md:text-5xl">{title}</h2>
        {description ? <p className="mt-4 text-base leading-relaxed text-[#5f4e84] md:text-lg">{description}</p> : null}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function SectionBand({ children }: { children: ReactNode }) {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-6 py-8 md:py-10">
      <div className="rounded-[2rem] border border-[#ebdef8] bg-[#fffdfd] p-6 md:p-8">{children}</div>
    </section>
  );
}

export function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <article className="rounded-2xl border border-[#ecdff9] bg-white p-5 transition hover:border-[#d7c4f2]">
      <p className="text-2xl font-black text-[#26184a] md:text-3xl">{value}</p>
      <p className="mt-2 text-sm font-medium leading-snug text-[#62518a]">{label}</p>
    </article>
  );
}

export function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <article className="group rounded-3xl border border-[#ebdef8] bg-white p-6 transition duration-300 hover:-translate-y-0.5 hover:border-[#d7c4f2]">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f9f4ff] text-xl">{icon}</span>
      <h3 className="mt-5 text-xl font-black text-[#231644]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#645489]">{description}</p>
    </article>
  );
}

export function CtaPanel({ title, description, primary, secondary }: { title: string; description: string; primary: NavItem; secondary?: NavItem }) {
  return (
    <div className="rounded-[2rem] border border-[#eadcf8] bg-[linear-gradient(130deg,#fff5ef_0%,#fff5fb_42%,#f6f0ff_100%)] p-7 shadow-[0_18px_40px_rgba(124,58,237,0.1)] md:p-10">
      <h3 className="text-3xl font-black leading-tight text-[#241646] md:text-4xl">{title}</h3>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#604f83]">{description}</p>
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
        <details key={item.question} className="group rounded-2xl border border-[#eadff8] bg-white p-5 open:border-[#d9c8f3]">
          <summary className="cursor-pointer list-none pr-10 text-base font-black text-[#231644] marker:content-none">{item.question}</summary>
          <p className="mt-3 text-sm leading-relaxed text-[#645489]">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-[#2e2251] bg-[#1f1737] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.3fr,1fr,1fr]">
        <div>
          <Image src="/logo.png" alt="Punto IA" width={200} height={80} className="h-11 w-auto object-contain" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Plataforma SaaS de lealtad para PyMEs en México. Activa visitas, wallet y recompensas con una experiencia simple para negocio y cliente.
          </p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Navegación</p>
          <ul className="mt-4 space-y-2 text-sm text-white/85">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/partners" className="transition hover:text-white">Partners</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Legal y contacto</p>
          <ul className="mt-4 space-y-2 text-sm text-white/85">
            <li><a href="mailto:ventas@puntoia.mx" className="transition hover:text-white">Contacto</a></li>
            <li><Link href="/terminos-privacidad" className="transition hover:text-white">Términos y privacidad</Link></li>
            <li>Onboarding típico: 3 a 7 días hábiles</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
