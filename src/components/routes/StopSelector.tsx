'use client';

import React, { useState, useEffect } from 'react';
import { BusRoute, AlertDistanceOption, AlertSoundType } from '@/types/transit';
import { Search, Check, Navigation, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AlertPreferences from '@/components/alerts/AlertPreferences';

interface StopSelectorProps {
  route: BusRoute;
}

export default function StopSelector({ route }: StopSelectorProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStopId, setSelectedStopId] = useState<string | null>(
    route.stops && route.stops.length > 1 ? route.stops[route.stops.length - 1].stop_id : null
  );

  const [alertSound, setAlertSound] = useState<AlertSoundType>('gentle-chime');
  const [alertDistance, setAlertDistance] = useState<AlertDistanceOption>(300);

  useEffect(() => {
    try {
      const savedSound = localStorage.getItem('busstop_pref_sound') as AlertSoundType;
      if (savedSound) setAlertSound(savedSound);

      const savedDist = Number(localStorage.getItem('busstop_pref_dist')) as AlertDistanceOption;
      if ([100, 200, 300, 500, 1000].includes(savedDist)) {
        setAlertDistance(savedDist);
      }
    } catch {
      // Safe fallback
    }
  }, []);

  const stops = route.stops || [];

  const filteredStops = stops.filter((rs) =>
    rs.stop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rs.stop.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rs.stop.landmark && rs.stop.landmark.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedStop = stops.find((rs) => rs.stop_id === selectedStopId)?.stop;

  const handleStartJourney = () => {
    if (!selectedStopId) return;

    try {
      const recent = {
        routeId: route.id,
        routeNumber: route.route_number,
        routeName: route.route_name,
        colorHex: route.color_hex,
        stopId: selectedStopId,
        stopName: selectedStop?.name,
        alertRadius: alertDistance,
        alertSound: alertSound,
        timestamp: Date.now(),
      };
      const existing = JSON.parse(localStorage.getItem('busstop_recent_journeys') || '[]');
      const updated = [
        recent,
        ...existing.filter((item: { stopId: string }) => item.stopId !== selectedStopId),
      ].slice(0, 5);
      localStorage.setItem('busstop_recent_journeys', JSON.stringify(updated));
    } catch {
      // Safe fallback
    }

    router.push(
      `/journey?routeId=${route.id}&stopId=${selectedStopId}&radius=${alertDistance}&sound=${alertSound}`
    );
  };

  return (
    <div className="flex flex-col gap-5 pb-32">
      {/* Search Stops Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter stops by name or landmark..."
          className="w-full pl-11 pr-4 py-3.5 bg-card rounded-2xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 shadow-warm text-main placeholder:text-secondary"
        />
      </div>

      {/* Stops Sequential List */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-black uppercase tracking-wider text-secondary px-1">
          Select Destination Stop ({filteredStops.length} stops)
        </h4>

        <div className="space-y-2">
          {filteredStops.map((rs) => {
            const isSelected = selectedStopId === rs.stop_id;
            const isFirst = rs.stop_order === 1;
            const isLast = rs.stop_order === stops.length;

            return (
              <div
                key={rs.id}
                onClick={() => setSelectedStopId(rs.stop_id)}
                className={`relative flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
                  isSelected
                    ? 'bg-gold-light/25 border-gold shadow-sm ring-2 ring-gold/20'
                    : 'bg-card border-line hover:border-gold/40 shadow-warm'
                }`}
              >
                {/* Step circle badge */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                    isSelected
                      ? 'bg-gold text-white shadow-gold'
                      : isFirst
                      ? 'bg-lavender text-white'
                      : isLast
                      ? 'bg-alert text-white'
                      : 'bg-subtle text-secondary'
                  }`}
                >
                  {isSelected ? <Check className="w-4 h-4" /> : rs.stop_order}
                </div>

                {/* Stop details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5
                      className={`font-black text-sm truncate ${
                        isSelected
                          ? 'text-main'
                          : 'text-main'
                      }`}
                    >
                      {rs.stop.name}
                    </h5>
                    <span className="text-[11px] font-bold text-secondary shrink-0">
                      +{rs.distance_from_start_km} km
                    </span>
                  </div>

                  {rs.stop.landmark && (
                    <p className="text-xs text-secondary mt-0.5 truncate flex items-center gap-1">
                      <span>📍</span>
                      <span>{rs.stop.landmark}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-secondary">
                    {rs.avg_time_mins > 0 && <span>~{rs.avg_time_mins} min travel</span>}
                    {isFirst && <span className="text-lavender-dark font-bold">• Route Origin</span>}
                    {isLast && <span className="text-alert font-bold">• Terminus</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Journey Setup: Choose Alert Sound & Distance */}
      {selectedStop && (
        <AlertPreferences
          selectedSound={alertSound}
          onSelectSound={setAlertSound}
          selectedDistance={alertDistance}
          onSelectDistance={setAlertDistance}
        />
      )}

      {/* Sticky Bottom Action Sheet */}
      {selectedStop && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-xl border-t border-line shadow-warm-lg z-50 safe-pb">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-black text-secondary tracking-wider">
                Destination Selected
              </div>
              <div className="text-sm font-black text-main truncate">
                {selectedStop.name}
              </div>
              <div className="text-xs text-gold-dark font-bold truncate">
                Alert: {alertDistance >= 1000 ? `${alertDistance / 1000} km` : `${alertDistance} m`} • {alertSound}
              </div>
            </div>

            <button
              onClick={handleStartJourney}
              className="px-6 py-3.5 bg-gold hover:bg-gold-hover text-white font-black text-sm rounded-2xl shadow-gold flex items-center gap-2 shrink-0 active:scale-95 transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>Start Journey</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
