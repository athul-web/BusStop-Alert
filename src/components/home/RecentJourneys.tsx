'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, History } from 'lucide-react';

interface RecentJourneyItem {
  routeId: string;
  routeNumber: string;
  routeName: string;
  colorHex?: string;
  stopId: string;
  stopName: string;
  alertRadius?: number;
  alertSound?: string;
  timestamp: number;
}

export default function RecentJourneys() {
  const [journeys, setJourneys] = useState<RecentJourneyItem[]>([]);
  const [hasChecked, setHasChecked] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('busstop_recent_journeys');
      if (stored) {
        setJourneys(JSON.parse(stored));
      }
    } catch {
      // Safe fallback
    } finally {
      setHasChecked(true);
    }
  }, []);

  const handleClear = () => {
    localStorage.removeItem('busstop_recent_journeys');
    setJourneys([]);
  };

  if (!hasChecked) return null;

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-wider text-secondary flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-lavender" />
          <span>Recent Journeys</span>
        </h2>
        {journeys.length > 0 && (
          <button
            onClick={handleClear}
            className="text-[11px] font-semibold text-secondary hover:text-alert transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {journeys.length > 0 ? (
        <div className="space-y-2">
          {journeys.slice(0, 3).map((item, idx) => (
            <Link
              key={idx}
              href={`/journey?routeId=${item.routeId}&stopId=${item.stopId}&radius=${item.alertRadius || 300}&sound=${item.alertSound || 'gentle-chime'}`}
              className="flex items-center justify-between p-3.5 bg-card border border-line rounded-2xl hover:border-gold/50 shadow-warm group transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: item.colorHex || '#D6A43A' }}
                >
                  {item.routeNumber}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-main group-hover:text-gold transition-colors truncate">
                    {item.stopName}
                  </div>
                  <div className="text-[11px] text-secondary truncate mt-0.5">
                    Route {item.routeNumber} • <span className="text-gold font-bold">1-tap re-ride</span>
                  </div>
                </div>
              </div>

              <div className="p-1.5 rounded-xl bg-subtle text-secondary group-hover:text-gold group-hover:bg-gold-light/20 transition-all">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-card border border-line text-center space-y-1 shadow-warm">
          <History className="w-5 h-5 text-secondary/60 mx-auto mb-1.5" />
          <div className="text-xs font-bold text-main">No recent journeys yet</div>
          <p className="text-[11px] text-secondary">Your recent trips will appear here.</p>
        </div>
      )}
    </section>
  );
}
