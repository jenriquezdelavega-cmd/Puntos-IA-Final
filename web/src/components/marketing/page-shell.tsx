import type { ReactNode } from 'react';

export function PageShell({ children }: { children: ReactNode }) {
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
