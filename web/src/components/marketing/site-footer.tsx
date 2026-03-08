import Image from 'next/image';
import Link from 'next/link';

type NavItem = { label: string; href: string };

export function SiteFooter({ navItems }: { navItems: readonly NavItem[] }) {
  return (
    <footer className="border-t border-[#eadcf8] bg-[#fffaf4]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.3fr,1fr,1fr]">
        <div>
          <span className="inline-flex rounded-2xl border border-[#36235f] bg-[linear-gradient(120deg,#281949_0%,#1f1438_56%,#392666_100%)] px-4 py-3">
            <Image src="/logo.png" alt="Punto IA" width={190} height={72} className="h-8 w-auto object-contain" />
          </span>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#4f3b79]">
            Plataforma de lealtad para PyMEs en México: más recompra para el negocio y experiencia simple para el cliente.
          </p>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#785ea3]">Navegación</p>
          <ul className="mt-3 space-y-2 text-sm text-[#4f3b79]">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-[#241548]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#785ea3]">Contacto</p>
          <ul className="mt-3 space-y-2 text-sm text-[#4f3b79]">
            <li>
              <a href="mailto:ventas@puntoia.mx" className="hover:text-[#241548]">
                ventas@puntoia.mx
              </a>
            </li>
            <li>
              <Link href="/terminos-privacidad" className="hover:text-[#241548]">
                Términos y privacidad
              </Link>
            </li>
            <li>Implementación típica: 3 a 7 días hábiles.</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
