import Link from 'next/link';
import type { ReactNode } from 'react';

export type ActionVariant = 'primary' | 'secondary' | 'ghost';

export function actionButtonStyles(variant: ActionVariant = 'primary') {
  if (variant === 'secondary') {
    return 'inline-flex items-center justify-center rounded-xl border border-[#dacbf0] bg-white px-4 py-2.5 text-sm font-semibold text-[#2a1b4d] transition hover:border-[#c4afd9] hover:bg-[#fcf8ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7e4fd3]';
  }

  if (variant === 'ghost') {
    return 'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-[#513579] transition hover:bg-[#f5ecff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7e4fd3]';
  }

  return 'inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#ff8560] via-[#ff5e91] to-[#8a60f6] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(189,89,157,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8560]';
}

type ActionLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

export function ActionLink({ href, className, children }: ActionLinkProps) {
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
