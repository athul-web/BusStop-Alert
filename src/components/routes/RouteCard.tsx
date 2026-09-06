import React from 'react';
import { BusRoute } from '@/types/transit';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin } from 'lucide-react';

interface RouteCardProps {
  route: BusRoute;
}

export default function RouteCard({ route }: RouteCardProps) {
  const stopCount = route.stops?.length || 0;

  return (
    <Link
      href={`/routes/${route.id}`}
      className="block w-full bg-card rounded-3xl p-5 shadow-warm hover:shadow-warm-md transition-all border border-line hover:border-gold/50 group active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl text-white shadow-gold transition-transform group-hover:scale-105 shrink-0"
            style={{ backgroundColor: route.color_hex || '#D6A43A' }}
          >
            {route.route_number}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-main text-sm sm:text-base group-hover:text-gold transition-colors truncate">
                {route.route_name}
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider text-gold-dark bg-gold-light/30 px-2 py-0.5 rounded-full border border-gold/20 shrink-0">
                Sample
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-secondary mt-0.5 truncate font-medium">
              <span className="truncate">{route.origin}</span>
              <ArrowRight className="w-3 h-3 text-secondary/60 shrink-0" />
              <span className="truncate">{route.destination}</span>
            </div>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-subtle text-secondary group-hover:text-gold group-hover:bg-gold-light/20 transition-all shrink-0">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {/* Meta Pills */}
      <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3 border-t border-line text-[11px] font-medium text-secondary">
        <span className="flex items-center gap-1 bg-subtle px-2.5 py-1 rounded-xl">
          <MapPin className="w-3 h-3 text-lavender" />
          {stopCount} stops
        </span>

        {route.frequency_mins && (
          <span className="flex items-center gap-1 bg-subtle px-2.5 py-1 rounded-xl">
            <Clock className="w-3 h-3 text-gold-dark" />
            Every {route.frequency_mins} mins
          </span>
        )}

        <span className="text-[10px] text-secondary ml-auto italic">
          Demo Dataset
        </span>
      </div>
    </Link>
  );
}
