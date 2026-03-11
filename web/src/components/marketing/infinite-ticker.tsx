'use client';

import React from 'react';

type TickerItem = {
  text: string;
  icon?: string;
};

type InfiniteTickerProps = {
  items: TickerItem[];
};

export function InfiniteTicker({ items }: InfiniteTickerProps) {
  // Duplicate the array to create a seamless infinite scroll effect
  const dItems = [...items, ...items, ...items, ...items];

  return (
    <div className="w-full relative flex overflow-x-hidden border-y border-[#e8daf6]/50 bg-[#faf8fc]/50 py-4">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#faf8fc] to-transparent z-10"></div>
      
      <div className="animate-marquee whitespace-nowrap flex items-center gap-10">
        {dItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-sm font-semibold text-[#564183]">
            {item.icon && <span>{item.icon}</span>}
            <span>{item.text}</span>
            <span className="ml-10 text-[#e8daf6]">|</span>
          </div>
        ))}
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#faf8fc] to-transparent z-10"></div>
    </div>
  );
}
