'use client';

import React from 'react';
import Link from 'next/link';
import { Bus, Radio } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-cream/90 backdrop-blur-md border-b border-line text-main">
      <div className="max-w-lg mx-auto px-4 h-15 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gold text-white flex items-center justify-center shadow-gold transition-transform group-hover:scale-105">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1 leading-none">
              <span className="font-extrabold text-base tracking-tight text-main">BusStop</span>
              <span className="font-black text-base text-gold">Alert</span>
            </div>
            <div className="text-[10px] text-secondary font-semibold tracking-wider uppercase mt-0.5">
              Smart Transit Guard
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gps-light border border-gps/20 text-gps-dark text-[11px] font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-gps animate-pulse" />
            <span>GPS Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
