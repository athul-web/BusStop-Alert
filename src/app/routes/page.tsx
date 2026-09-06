'use client';

import React, { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Compass, AlertCircle, Info } from 'lucide-react';
import { BusRoute } from '@/types/transit';
import { MOCK_ROUTES } from '@/lib/data/mockTransitData';
import RouteCard from '@/components/routes/RouteCard';

function RoutesContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [routes, setRoutes] = useState<BusRoute[]>(MOCK_ROUTES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    const fetchRoutes = async () => {
      setIsLoading(true);
      try {
        const url = searchQuery.trim()
          ? `/api/routes?query=${encodeURIComponent(searchQuery.trim())}`
          : '/api/routes';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.routes) {
            setRoutes(data.routes);
            return;
          }
        }
      } catch (err) {
        console.warn('API error, falling back to local dataset', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }

      if (isMounted) {
        if (!searchQuery.trim()) {
          setRoutes(MOCK_ROUTES);
        } else {
          const q = searchQuery.toLowerCase();
          setRoutes(
            MOCK_ROUTES.filter(
              (r) =>
                r.route_number.toLowerCase().includes(q) ||
                r.route_name.toLowerCase().includes(q) ||
                r.origin.toLowerCase().includes(q) ||
                r.destination.toLowerCase().includes(q) ||
                r.stops?.some((s) => s.stop.name.toLowerCase().includes(q))
            )
          );
        }
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      startTransition(() => {
        fetchRoutes();
      });
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-5 pb-16">
      {/* Title & Filter Header */}
      <div>
        <div className="flex items-center gap-1.5 text-lavender-dark text-xs font-black uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4 text-lavender" />
          <span>Transit Directory</span>
        </div>
        <h1 className="text-2xl font-black text-main tracking-tight">
          Select Your Bus Route
        </h1>
        <p className="text-xs text-secondary mt-1 font-medium">
          Choose a route to view its intermediate stops and set destination alarms.
        </p>
      </div>

      {/* Notice regarding Phase 1 Demo Data vs Phase 2 Real Data */}
      <div className="p-3.5 rounded-2xl bg-lavender-soft/60 border border-lavender/30 flex items-start gap-2.5 text-xs text-main">
        <Info className="w-4 h-4 text-lavender shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-secondary">
          <strong className="text-main font-bold">Phase 1 Preview:</strong> Live local transit schedules (e.g. Cherthala / Kerala RTC lines) will connect in Phase 2. The sample routes below allow you to preview stop tracking and test destination alerts today.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by route number, origin, or stop name..."
          className="w-full pl-11 pr-4 py-3.5 bg-card border border-line rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 shadow-warm text-main placeholder:text-secondary"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary hover:text-main"
          >
            Clear
          </button>
        )}
      </div>

      {/* Routes List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-full h-32 bg-card border border-line rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : routes.length > 0 ? (
          routes.map((route) => <RouteCard key={route.id} route={route} />)
        ) : (
          <div className="text-center py-12 px-4 rounded-3xl bg-card border border-line space-y-3 shadow-warm">
            <AlertCircle className="w-8 h-8 text-gold mx-auto" />
            <h3 className="font-bold text-main text-base">No Routes Found</h3>
            <p className="text-xs text-secondary max-w-xs mx-auto">
              No bus routes matched &quot;{searchQuery}&quot;. Try searching for &quot;101&quot;, &quot;Airport&quot;, or &quot;Downtown&quot;.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-subtle hover:bg-cream text-main text-xs font-bold rounded-xl border border-line"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoutesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-40 bg-card rounded-xl" />
          <div className="h-12 bg-card rounded-2xl" />
          <div className="h-32 bg-card rounded-3xl" />
        </div>
      }
    >
      <RoutesContent />
    </Suspense>
  );
}
