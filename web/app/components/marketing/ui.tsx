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
  { href: '/aliados', label: 'Aliados' },
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

export function MarketingHeader({ badge = 'Plataforma de lealtad para PyMEs', primaryCta }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/55 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Punto IA" width={200} height={76} className="h-10 w-auto object-contain sm:h-11" priority />
          <span className="hidden rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65 lg:inline-flex">
            {badge}
          </span>
        </Link>

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.03] p-1 md:order-2 md:w-auto md:overflow-visible">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a59]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {primaryCta ? (
          <ActionLink
            href={primaryCta.href}
            className="order-2 rounded-xl bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] px-4 py-2.5 text-sm font-black text-white shadow-[0_10px_30px_rgba(255,63,142,0.35)] transition hover:translate-y-[-1px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a59] md:order-3"
          >
            {primaryCta.label}
          </ActionLink>
        ) : null}
      </div>
    </header>
  );
}

export function MarketingBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[#05050a]" />
      <div className="marketing-gradient pointer-events-none absolute inset-0 opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,10,0.15)_0%,rgba(5,5,10,0.72)_24%,#05050a_100%)]" />
    </>
  );
}

export function TrustStrip({ items }: { items: string[] }) {
  return (
    <div className="relative mx-auto w-full max-w-7xl px-6">
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center sm:grid-cols-3">
        {items.map((item) => (
          <p key={item} className="text-xs font-semibold tracking-wide text-white/65 sm:text-sm">
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
        <article key={item.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-black text-white">{item.name}</p>
          <p className="mt-2 text-2xl font-black text-[#ffad9c]">{item.result}</p>
          <p className="mt-2 text-xs leading-relaxed text-white/60">{item.context}</p>
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
        {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">{eyebrow}</p> : null}
        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">{title}</h2>
        {description ? <p className="mt-4 text-base leading-relaxed text-white/70 md:text-lg">{description}</p> : null}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function SectionBand({ children }: { children: ReactNode }) {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-6 py-8 md:py-10">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">{children}</div>
    </section>
  );
}

export function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.07]">
      <p className="text-2xl font-black text-white md:text-3xl">{value}</p>
      <p className="mt-2 text-sm font-medium leading-snug text-white/60">{label}</p>
    </article>
  );
}

export function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <article className="group rounded-3xl border border-white/10 bg-black/20 p-6 transition duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.04]">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-xl backdrop-blur">{icon}</span>
      <h3 className="mt-5 text-xl font-black text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/65">{description}</p>
    </article>
  );
}

export function CtaPanel({ title, description, primary, secondary }: { title: string; description: string; primary: NavItem; secondary?: NavItem }) {
  return (
    <div className="rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,rgba(255,122,89,0.16),rgba(255,63,142,0.07)_38%,rgba(8,8,14,0.9)_100%)] p-7 shadow-[0_18px_60px_rgba(0,0,0,0.35)] md:p-10">
      <h3 className="text-3xl font-black leading-tight text-white md:text-4xl">{title}</h3>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">{description}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <ActionLink
          href={primary.href}
          className="rounded-2xl bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] px-6 py-3.5 text-sm font-black text-white shadow-[0_16px_40px_rgba(255,63,142,0.4)] transition hover:translate-y-[-1px]"
        >
          {primary.label}
        </ActionLink>
        {secondary ? (
          <ActionLink href={secondary.href} className="group inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white/90 transition hover:bg-white/10">
            {secondary.label}
            <span className="transition-transform group-hover:translate-x-1">→</span>
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
        <details key={item.question} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 open:border-white/20 open:bg-white/[0.06]">
          <summary className="cursor-pointer list-none pr-10 text-base font-black text-white marker:content-none">{item.question}</summary>
          <p className="mt-3 text-sm leading-relaxed text-white/70">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-black/55">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.4fr,1fr,1fr]">
        <div>
          <Image src="/logo.png" alt="Punto IA" width={200} height={80} className="h-11 w-auto object-contain" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
            Plataforma SaaS de lealtad para PyMEs en México. Activación rápida, experiencia premium y seguimiento comercial continuo.
          </p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Rutas</p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">Comercial</p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>ventas@puntoia.mx</li>
            <li>Onboarding típico: 3 a 7 días hábiles</li>
            <li>Implementación para una o múltiples sucursales</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
