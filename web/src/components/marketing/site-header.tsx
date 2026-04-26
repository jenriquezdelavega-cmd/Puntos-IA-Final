'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { label: string; href: string };

export function SiteHeader({
  navItems,
  dark = true,
  position = 'sticky',
}: {
  navItems: readonly NavItem[];
  dark?: boolean;
  position?: 'sticky' | 'fixed' | 'absolute';
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
      ? 'border-b border-white/10 bg-[#0d071a]/95 backdrop-blur-xl shadow-md'
      : 'bg-[#0d071a]/90 backdrop-blur-lg border-transparent'
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

  const isLoginPage = pathname?.startsWith('/ingresar');
  const loginCtaClass = dark
    ? 'border-white/15 bg-white/5 px-6 py-2.5 text-[#dacbf0] shadow-sm backdrop-blur-md hover:bg-white/15 hover:text-white hover:border-white/30'
    : 'border-[#2d1c52] bg-[#2d1c52] px-6 py-2.5 text-white shadow-md shadow-[#2d1c52]/25 hover:border-[#231543] hover:bg-[#231543]';

  return (
    <header className={`${position} top-0 w-full z-50 transition-all duration-300 ${headerBase}`}>
      <div className={`mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-6 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}>
        
        <div className="flex items-center md:flex-1">
          <Link 
            href="/" 
            className="inline-flex items-center transition-transform hover:scale-105 hover:opacity-90 active:scale-95"
            aria-label="Ir al inicio"
          >
            <Image 
              src="/logo.png" 
              alt="Punto IA" 
              width={176} 
              height={68} 
              className="h-7 w-auto object-contain sm:h-8 drop-shadow-lg" 
              priority 
            />
          </Link>
        </div>

        <nav
          className={`order-3 flex w-full items-center justify-start sm:justify-center gap-1 overflow-x-auto rounded-full p-1 md:order-2 md:flex-none md:w-auto md:overflow-visible ${navBase}`}
          aria-label="Navegación principal"
        >
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

        <div className="order-2 flex items-center justify-end md:order-3 md:flex-1">
          {!isLoginPage && (
            <Link
              href="/ingresar"
              className={`inline-flex items-center justify-center rounded-xl border text-sm font-extrabold tracking-wide transition-all ${loginCtaClass}`}
            >
              Entrar
            </Link>
          )}
        </div>
        
      </div>
    </header>
  );
}
