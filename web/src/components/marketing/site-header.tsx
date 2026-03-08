'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ActionLink, actionButtonStyles } from './action-link';

type NavItem = { label: string; href: string };
type Cta = { label: string; href: string };

export function SiteHeader({ navItems, cta }: { navItems: readonly NavItem[]; cta?: Cta }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[#eadcf8] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="rounded-2xl border border-[#36235f] bg-[linear-gradient(120deg,#281949_0%,#1f1438_56%,#392666_100%)] px-3 py-2">
            <Image src="/logo.png" alt="Punto IA" width={176} height={68} className="h-8 w-auto object-contain sm:h-9" priority />
          </span>
        </Link>

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto rounded-full border border-[#eadcf8] bg-white p-1 md:order-2 md:w-auto md:overflow-visible" aria-label="Navegación principal">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7e4fd3] ${
                  active ? 'bg-[#2d1c52] text-white' : 'text-[#583e86] hover:bg-[#f5edff] hover:text-[#2d1c52]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {cta ? (
          <div className="order-2 md:order-3">
            <ActionLink href={cta.href} className={actionButtonStyles('primary')}>
              {cta.label}
            </ActionLink>
          </div>
        ) : null}
      </div>
    </header>
  );
}
