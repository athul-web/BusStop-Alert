'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Clock, AlertCircle } from 'lucide-react';
import { BusRoute } from '@/types/transit';
import { MOCK_ROUTES } from '@/lib/data/mockTransitData';
import StopSelector from '@/components/routes/StopSelector';
import BusMap from '@/components/map/BusMap';

export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = params.id as string;

  const [route, setRoute] = useState<BusRoute | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchRoute = async () => {
      try {
        const res = await fetch(`/api/routes/${routeId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.route) {
            setRoute(data.route);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('API error, falling back to mock route', err);
      }

      if (isMounted) {
        const found = MOCK_ROUTES.find(
          (r) => r.id === routeId || r.route_number.toLowerCase() === routeId?.toLowerCase()
        );
        setRoute(found || null);
        setIsLoading(false);
      }
    };

    fetchRoute();
    return () => {
      isMounted = false;
    };
  }, [routeId]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-32 bg-card rounded-xl" />
        <div className="h-44 bg-card rounded-3xl" />
        <div className="h-64 bg-card rounded-3xl" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-alert mx-auto" />
        <h2 className="text-xl font-bold text-main">Route Not Found</h2>
        <p className="text-xs text-secondary max-w-xs mx-auto">
          The requested bus route could not be found. Please check the route directory.
        </p>
        <Link
          href="/routes"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-white text-xs font-black rounded-xl shadow-gold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Routes</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Top navigation back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-black text-secondary hover:text-main transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Routes</span>
        </button>

        <span className="text-[11px] font-bold text-gold-dark bg-gold-light/40 px-2.5 py-1 rounded-full border border-gold/30">
          Sample Route (Preview)
        </span>
      </div>

      {/* Route Header Card */}
      <div className="p-5 rounded-3xl bg-card border border-line shadow-warm space-y-3.5">
        <div className="flex items-start gap-3.5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-gold shrink-0"
            style={{ backgroundColor: route.color_hex || '#D6A43A' }}
          >
            {route.route_number}
          </div>
          <div>
            <h1 className="text-xl font-black text-main tracking-tight">
              {route.route_name}
            </h1>
            <p className="text-xs text-secondary mt-0.5 line-clamp-2 font-medium">
              {route.description}
            </p>
          </div>
        </div>

        {/* Origin & Destination Bar */}
        <div className="p-3 rounded-2xl bg-subtle border border-line flex items-center justify-between text-xs">
          <div className="truncate max-w-[130px]">
            <span className="text-[10px] uppercase font-black text-secondary block">Origin</span>
            <span className="font-extrabold text-main truncate">{route.origin}</span>
          </div>
          <span className="text-secondary/60 text-sm font-black">➔</span>
          <div className="text-right truncate max-w-[130px]">
            <span className="text-[10px] uppercase font-black text-secondary block">Terminus</span>
            <span className="font-extrabold text-main truncate">{route.destination}</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 text-[11px] text-secondary font-medium">
          <span className="flex items-center gap-1 bg-subtle px-2.5 py-1 rounded-xl">
            <Clock className="w-3 h-3 text-gold-dark" />
            {route.operating_hours || 'Daily Service'}
          </span>
          <span className="flex items-center gap-1 bg-subtle px-2.5 py-1 rounded-xl">
            <MapPin className="w-3 h-3 text-lavender" />
            {route.stops?.length || 0} stops
          </span>
          {route.total_distance_km && (
            <span className="bg-subtle px-2.5 py-1 rounded-xl">
              {route.total_distance_km} km
            </span>
          )}
        </div>
      </div>

      {/* Mini Interactive Map View */}
      <div className="h-52 rounded-3xl overflow-hidden border border-line shadow-warm">
        <BusMap route={route} />
      </div>

      {/* Sequential Stop Selection */}
      <StopSelector route={route} />
    </div>
  );
}
