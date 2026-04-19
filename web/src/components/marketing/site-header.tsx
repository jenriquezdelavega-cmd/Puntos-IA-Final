'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { label: string; href: string };

export function SiteHeader({
  navItems,
  dark = false,
}: {
  navItems: readonly NavItem[];
  dark?: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerBase = dark
    ? scrolled
      ? 'border-b border-white/10 bg-[#0d071a]/80 backdrop-blur-xl shadow-md'
      : 'bg-transparent border-transparent'
    : scrolled
      ? 'border-b border-white/20 bg-white/70 backdrop-blur-xl shadow-sm'
      : 'bg-transparent border-transparent';

  const navBase = dark
    ? 'border border-white/10 bg-white/5'
    : 'border border-[#eadcf8] bg-white';

  const linkActive = dark ? 'bg-white/15 text-white' : 'bg-[#2d1c52] text-white';
  const linkInactive = dark
    ? 'text-[#dacbf0] hover:bg-white/10 hover:text-white'
    : 'text-[#583e86] hover:bg-[#f5edff] hover:text-[#2d1c52]';

  const isHome = pathname === '/';
  const loginCtaClass = dark
    ? 'border-white/20 text-[#dacbf0] hover:border-white/40 hover:text-white'
    : isHome
      ? 'border-transparent bg-gradient-to-r from-[#7e4fd3] via-[#8f5fe5] to-[#ff5e91] px-6 py-2.5 text-white shadow-lg shadow-[#7e4fd3]/35 hover:brightness-110'
      : 'border-[#d8c0f3] text-[#583e86] hover:border-[#be9ce9] hover:text-[#2d1c52]';

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${headerBase}`}>
      <div className={`mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-6 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}>
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="rounded-2xl border border-[#36235f] bg-[linear-gradient(120deg,#281949_0%,#1f1438_56%,#392666_100%)] px-3 py-2">
            <Image src="/logo.png" alt="Punto IA" width={176} height={68} className="h-8 w-auto object-contain sm:h-9" priority />
          </span>
        </Link>

        <nav className={`order-3 flex w-full items-center gap-1 overflow-x-auto rounded-full p-1 md:order-2 md:w-auto md:overflow-visible ${navBase}`} aria-label="Navegación principal">
          {navItems.filter((item) => !item.href.startsWith('/ingresar')).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7e4fd3] ${
                  active ? linkActive : linkInactive
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="order-2 md:order-3 flex items-center">
          <Link
            href="/ingresar"
            className={`inline-flex items-center justify-center rounded-xl border text-sm font-extrabold tracking-wide transition-all ${loginCtaClass}`}
          >
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}
