'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Navigation,
  Search,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import LocationNearbyRoutes from '@/components/home/LocationNearbyRoutes';
import RecentJourneys from '@/components/home/RecentJourneys';
import BusMap from '@/components/map/BusMap';
import { MOCK_ROUTES } from '@/lib/data/mockTransitData';
import WakeLockToggle from '@/components/common/WakeLockToggle';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState<boolean>(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/routes?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/routes');
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto pb-10">
      {/* 1. Hero Card in Warm Light Palette */}
      <section className="bg-card border border-line rounded-3xl p-6 shadow-warm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-gold bg-gold-light/30 px-3 py-1 rounded-full border border-gold/20">
            BusStop Alert
          </span>
          <WakeLockToggle />
        </div>

        <div className="space-y-1.5 pt-1">
          <h1 className="text-2xl sm:text-3xl font-black text-main tracking-tight leading-tight">
            Never miss your bus stop again.
          </h1>
          <p className="text-xs sm:text-sm text-secondary font-medium leading-relaxed max-w-md">
            Track your journey and get an alert before you reach your stop.
          </p>
        </div>

        {/* Primary Clear Action: Start a Journey */}
        <Link
          href="/routes"
          className="w-full min-h-[54px] bg-gold hover:bg-gold-hover text-white font-black text-base rounded-2xl shadow-gold flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <Navigation className="w-5 h-5" />
          <span>Start a Journey</span>
        </Link>
      </section>

      {/* 2. Simple, Accessible Search Box */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search bus stops, destinations, or routes..."
          className="w-full pl-11 pr-24 py-3.5 bg-card border border-line rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 shadow-warm text-main placeholder:text-secondary"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-subtle hover:bg-cream text-main font-bold text-xs rounded-xl border border-line transition-all"
        >
          Search
        </button>
      </form>

      {/* 3. Location-Based Nearby Routes */}
      <LocationNearbyRoutes />

      {/* 4. Compact Recent Journeys */}
      <RecentJourneys />

      {/* 5. Light Visual Style Transit Map Preview */}
      <section className="bg-card border border-line rounded-3xl p-4 space-y-3 shadow-warm">
        <div
          onClick={() => setShowMap(!showMap)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold-light/30 text-gold-dark flex items-center justify-center">
              <MapPin className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h3 className="text-xs font-black text-main">Transit Map</h3>
              <p className="text-[10px] text-secondary">Light OpenStreetMap preview</p>
            </div>
          </div>

          <button
            type="button"
            className="text-xs font-bold text-secondary hover:text-main flex items-center gap-1"
          >
            <span>{showMap ? 'Hide Map' : 'View Map'}</span>
            {showMap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showMap && (
          <div className="h-60 rounded-2xl overflow-hidden border border-line relative shadow-inner">
            <BusMap route={MOCK_ROUTES[0]} />
          </div>
        )}
      </section>
    </div>
  );
}
