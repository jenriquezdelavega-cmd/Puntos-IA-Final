'use client';

import { motion } from 'framer-motion';

type BentoItem = {
  title: string;
  description: string;
  colSpan?: number;
  rowSpan?: number;
  highlight?: boolean;
  icon?: string;
  imageUrl?: string;
};

type BentoGridProps = {
  title: string;
  description: string;
  items: readonly BentoItem[];
};

export function BentoGrid({ title, description, items }: BentoGridProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">{title}</h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">{description}</p>
        </div>

        <motion.div
           variants={container}
           initial="hidden"
           whileInView="show"
           viewport={{ once: true, margin: '-100px' }}
           className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:max-w-none lg:grid-cols-3 lg:gap-8"
        >
          {items.map((item, index) => (
            <motion.div
              key={index}
              variants={itemAnim}
              className={`relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-8 border border-gray-100 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 ${
                item.colSpan === 2 ? 'lg:col-span-2' : ''
              } ${item.rowSpan === 2 ? 'row-span-2' : ''} ${
                item.highlight ? 'bg-gradient-to-br from-indigo-50 via-white to-pink-50 ring-1 ring-inset ring-indigo-500/10' : ''
              }`}
            >
              <div>
                 {item.icon && <div className="mb-4 text-3xl">{item.icon}</div>}
                 <h3 className={`text-xl font-black tracking-tight ${item.highlight ? 'text-indigo-900' : 'text-gray-900'}`}>{item.title}</h3>
                 <p className="mt-4 text-base leading-relaxed text-gray-600">{item.description}</p>
              </div>

              {item.imageUrl && (
                 <div className="mt-8 flex-1 overflow-hidden rounded-2xl bg-gray-50 border border-gray-100 aspect-video relative">
                    <img src={item.imageUrl} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
                 </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
