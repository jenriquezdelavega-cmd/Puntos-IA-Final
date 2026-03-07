'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGrid({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function GlowPulse() {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#ff7a59]/35 via-[#ff3f8e]/12 to-transparent blur-2xl" />;
  }

  return (
    <motion.div
      className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#ff7a59]/35 via-[#ff3f8e]/12 to-transparent blur-2xl"
      animate={{ opacity: [0.45, 0.75, 0.5], scale: [0.98, 1.02, 1] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
