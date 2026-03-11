'use client';

import { motion } from 'framer-motion';
import { ActionLink, actionButtonStyles } from './action-link';

type Cta = { label: string; href: string };

type HeroImage = {
  src: string;
  alt: string;
};

type HeroSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  chips?: readonly string[];
  primaryCta: Cta;
  secondaryCta?: Cta;
  b2bImage: HeroImage;
  b2cImage: HeroImage;
};

export function HeroSection({
  eyebrow,
  title,
  description,
  chips = [],
  primaryCta,
  secondaryCta,
  b2bImage,
  b2cImage,
}: HeroSectionProps) {
  // Animaciones base
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const staggerContainer = {
    visible: { transition: { staggerChildren: 0.15 } },
  };

  return (
    <section className="relative overflow-hidden bg-[#0d071a] pt-20 pb-28 sm:pt-32 sm:pb-40 lg:pb-48">
      {/* Background Glows (Tech Feel) */}
      <div className="pointer-events-none absolute -top-40 left-1/2 w-[800px] -translate-x-1/2 opacity-40 mix-blend-screen" aria-hidden="true">
         <div className="aspect-[1/1] rounded-full bg-gradient-radial from-[#8a60f6] to-transparent blur-[100px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 relative z-10 text-center">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="mx-auto max-w-3xl">
          {/* Eyebrow */}
          <motion.p variants={fadeUp} className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#e0e7ff] backdrop-blur-md">
            {eyebrow}
          </motion.p>
          
          {/* Title */}
          <motion.h1 variants={fadeUp} className="mt-8 text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-7xl">
            {title}
          </motion.h1>
          
          {/* Description */}
          <motion.p variants={fadeUp} className="mt-6 text-lg leading-relaxed text-[#a593c2] sm:text-xl">
            {description}
          </motion.p>

          {/* Chips */}
          {chips.length > 0 && (
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap justify-center gap-2">
              {chips.map((chip, idx) => (
                <span key={idx} className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/5 px-3 py-1 text-sm font-semibold text-white">
                  <span className="text-[#ff5e91] text-xs">◆</span> {chip}
                </span>
              ))}
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
            <ActionLink href={primaryCta.href} className={actionButtonStyles('primary') + " w-full sm:w-auto text-base py-3 px-8"}>
              {primaryCta.label}
            </ActionLink>
            {secondaryCta && (
              <ActionLink href={secondaryCta.href} className="inline-flex items-center justify-center rounded-xl border border-[#dacbf0]/30 bg-transparent px-8 py-3 w-full sm:w-auto text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#7e4fd3]">
                {secondaryCta.label}
              </ActionLink>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Flotating UI Mockups (B2B + B2C) */}
      <div className="relative mx-auto mt-20 max-w-6xl px-6 lg:mt-24 pointer-events-none">
        <div className="relative h-[300px] sm:h-[450px] lg:h-[550px] w-full perspective-[1000px]">
           {/* Negocio Dashboard */}
           <motion.div 
             initial={{ opacity: 0, x: -50, rotateY: 10 }}
             animate={{ opacity: 1, x: 0, rotateY: 5 }}
             transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
             className="absolute left-0 top-0 w-[70%] lg:w-[65%] rounded-2xl border border-white/10 bg-[#160b2b]/80 shadow-2xl backdrop-blur-xl overflow-hidden"
           >
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
                 <div className="h-3 w-3 rounded-full bg-red-400" />
                 <div className="h-3 w-3 rounded-full bg-yellow-400" />
                 <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <img src={b2bImage.src} alt={b2bImage.alt} className="w-full object-cover opacity-90" />
           </motion.div>

           {/* Cliente Celular */}
           <motion.div 
             initial={{ opacity: 0, x: 50, y: 50, rotateY: -15 }}
             animate={{ opacity: 1, x: 0, y: 0, rotateY: -10 }}
             transition={{ duration: 0.9, delay: 0.6, ease: 'easeOut' }}
             className="absolute -right-4 lg:right-10 top-16 lg:top-10 w-[35%] lg:w-[28%] max-w-[300px] rounded-[2rem] border-4 border-gray-900 bg-black shadow-2xl overflow-hidden object-cover"
           >
              <img src={b2cImage.src} alt={b2cImage.alt} className="w-full h-full object-cover opacity-95" />
           </motion.div>
        </div>
      </div>
    </section>
  );
}
