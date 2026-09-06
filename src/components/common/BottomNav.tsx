'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Navigation } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/routes', label: 'Routes', icon: Compass },
    { href: '/journey', label: 'Journey', icon: Navigation },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-line shadow-warm-lg safe-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-20 py-1 transition-all rounded-2xl ${
                isActive
                  ? 'text-gold font-black scale-105'
                  : 'text-secondary hover:text-main'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gold/15 text-gold ring-1 ring-gold/30 shadow-sm'
                    : 'text-secondary'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[11px] tracking-tight ${isActive ? 'font-black text-gold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
