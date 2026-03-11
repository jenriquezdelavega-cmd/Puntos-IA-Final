import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar — Punto IA | Accede a tu Wallet o Panel',
  description: 'Inicia sesión o crea tu cuenta en Punto IA. Clientes: accede a tu Wallet Pass con puntos y recompensas. Negocios: ingresa a tu panel de operación.',
  robots: 'noindex, nofollow',
};

export default function IngresarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
