import type { ReactNode } from 'react';

export function PageShell({
  children,
  variant = 'light',
}: {
  children: ReactNode;
  variant?: 'light' | 'dark';
}) {
  if (variant === 'dark') {
    return (
      <div className="relative min-h-screen flex flex-col overflow-hidden bg-[#0d071a] text-white">
        <div className="pointer-events-none absolute top-[-20%] left-1/2 w-[800px] -translate-x-1/2 opacity-25 mix-blend-screen" aria-hidden="true">
          <div className="aspect-[1/1] rounded-full bg-radial from-[#8a60f6] to-transparent blur-[100px]" />
        </div>
        <div className="relative flex flex-col flex-grow">{children}</div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffdf9] text-[#27184a]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(255,177,124,0.22),transparent_34%),radial-gradient(circle_at_92%_8%,rgba(251,137,179,0.18),transparent_34%),radial-gradient(circle_at_50%_62%,rgba(173,111,255,0.11),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.8)_0%,rgba(255,250,245,0.9)_32%,#fffdf9_100%)]" />
      <div className="relative">{children}</div>
    </main>
  );
}

export function SectionContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto w-full max-w-7xl px-6 ${className}`}>{children}</section>;
}
