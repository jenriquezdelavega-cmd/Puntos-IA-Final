'use client';
/* eslint-disable @next/next/no-img-element */

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

type JourneyStep = {
  title: string;
  description: string;
  imageSrc: string;
};

type ScrollJourneyProps = {
  title: string;
  subtitle: string;
  steps: readonly JourneyStep[];
};

export function ScrollJourney({ title, subtitle, steps }: ScrollJourneyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Rastrear el scroll dentro de esta sección
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });

  // La altura de la línea de tiempo se llena de 0% a 100% conforme bajas
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section className="bg-gray-50 py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">{title}</h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">{subtitle}</p>
        </div>

        <div ref={containerRef} className="mx-auto mt-16 max-w-5xl relative pb-20">
          
          {/* Línea de fondo inactiva */}
          <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-1 bg-gray-200 -translate-x-1/2 rounded-full" />
          
          {/* Línea activa que se llena con scroll */}
          <motion.div 
            style={{ height: lineHeight }} 
            className="absolute left-8 lg:left-1/2 top-0 w-1 bg-gradient-to-b from-indigo-500 to-pink-500 -translate-x-1/2 rounded-full origin-top" 
          />

          <div className="space-y-24">
            {steps.map((step, index) => (
              <div key={index} className={`relative flex flex-col lg:flex-row items-center gap-12 lg:gap-24 ${index % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                
                {/* Indicador Numérico */}
                <div className="absolute left-8 lg:left-1/2 w-12 h-12 -translate-x-1/2 bg-white border-4 border-indigo-100 rounded-full flex items-center justify-center z-10 shadow-sm">
                   <span className="text-indigo-600 font-black text-xl">{index + 1}</span>
                </div>

                {/* Texto */}
                <div className="w-full lg:w-1/2 pl-24 lg:pl-0 text-left">
                  <motion.div 
                    initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                  >
                     <h3 className="text-2xl font-black text-gray-900">{step.title}</h3>
                     <p className="mt-4 text-base leading-relaxed text-gray-600">{step.description}</p>
                  </motion.div>
                </div>

                {/* Imagen */}
                <div className="w-full lg:w-1/2 px-8 lg:px-0">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-gray-200/50 border border-gray-100 aspect-[4/3]"
                  >
                     <img src={step.imageSrc} alt={step.title} className="w-full h-full object-cover" />
                  </motion.div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
