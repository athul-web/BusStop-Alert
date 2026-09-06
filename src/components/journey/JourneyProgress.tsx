'use client';

import React from 'react';
import { BusRoute, BusStop, GPSCoordinate } from '@/types/transit';
import { formatDistance, formatEta } from '@/lib/geo/distance';
import { Radio, Gauge, Clock, MapPin, AlertCircle } from 'lucide-react';

interface JourneyProgressProps {
  route: BusRoute;
  destinationStop: BusStop;
  distanceMeters: number;
  etaSeconds: number;
  accuracyStatus: 'high' | 'medium' | 'low' | 'unknown';
  userCoordinate: GPSCoordinate | null;
  alertRadiusMeters: number;
  isApproaching: boolean;
}

export default function JourneyProgress({
  route,
  destinationStop,
  distanceMeters,
  etaSeconds,
  accuracyStatus,
  userCoordinate,
  alertRadiusMeters,
  isApproaching,
}: JourneyProgressProps) {
  const destIndex = route.stops?.findIndex((s) => s.stop_id === destinationStop.id) ?? -1;
  const totalStops = route.stops?.length || 0;

  const speedKmh =
    userCoordinate?.speed && userCoordinate.speed > 0.5
      ? Math.round(userCoordinate.speed * 3.6)
      : null;

  return (
    <div className="w-full bg-card rounded-3xl p-5 shadow-warm-md border border-line transition-all space-y-3.5">
      {/* Journey Active & GPS Status Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Journey Active Status Badge in GPS Green */}
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gps-light text-gps-dark border border-gps/20 text-xs font-black tracking-wide">
            <span className="w-2 h-2 rounded-full bg-gps animate-pulse" />
            <span>Journey Active</span>
          </span>

          <span
            className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white shadow-sm"
            style={{ backgroundColor: route.color_hex || '#D6A43A' }}
          >
            Route {route.route_number}
          </span>
        </div>

        {/* GPS Quality Pill */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-subtle text-secondary">
          <Radio
            className={`w-3 h-3 ${
              accuracyStatus === 'high'
                ? 'text-gps animate-pulse'
                : accuracyStatus === 'medium'
                ? 'text-gold'
                : 'text-alert'
            }`}
          />
          <span className="capitalize">
            {accuracyStatus === 'high'
              ? 'GPS Lock'
              : accuracyStatus === 'medium'
              ? 'Moderate GPS'
              : 'Seeking GPS'}
          </span>
        </div>
      </div>

      {/* Destination Card (Highlighted) */}
      <div className="p-4 rounded-2xl bg-cream border border-line flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-alert/15 text-alert flex items-center justify-center font-black text-base shadow-sm">
            🎯
          </div>
          <div>
            <div className="text-[10px] uppercase font-black text-secondary tracking-wider">
              Destination
            </div>
            <div className="text-base sm:text-lg font-black text-main truncate max-w-[200px] sm:max-w-[260px]">
              {destinationStop.name}
            </div>
          </div>
        </div>

        {destIndex >= 0 && (
          <div className="text-right">
            <span className="text-xs font-black text-lavender-dark bg-lavender-soft px-2.5 py-1 rounded-xl">
              Stop {destIndex + 1}/{totalStops}
            </span>
          </div>
        )}
      </div>

      {/* Primary Transit Numbers: Remaining Distance & Estimated Time */}
      <div className="grid grid-cols-2 gap-3">
        {/* Remaining Distance */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isApproaching
              ? 'bg-alert-light border-alert/40 text-alert-dark'
              : 'bg-card border-line shadow-sm'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-secondary">
            <Gauge className="w-3.5 h-3.5 text-gold" />
            <span>Remaining Distance</span>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-black mt-1 tracking-tight ${
              isApproaching ? 'text-alert' : 'text-main'
            }`}
          >
            {formatDistance(distanceMeters)} remaining
          </div>
          <div className="text-[11px] text-secondary font-medium mt-0.5">
            Alert set at {alertRadiusMeters >= 1000 ? `${alertRadiusMeters / 1000} km` : `${alertRadiusMeters} m`}
          </div>
        </div>

        {/* Estimated Time */}
        <div className="p-4 rounded-2xl bg-card border border-line shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-secondary">
            <Clock className="w-3.5 h-3.5 text-lavender" />
            <span>Estimated Time</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-main mt-1 tracking-tight">
            ~{Math.max(1, Math.round(etaSeconds / 60))} min
          </div>
          <div className="text-[11px] text-secondary font-medium mt-0.5">
            {speedKmh ? `${speedKmh} km/h` : 'Avg transit speed'}
          </div>
        </div>
      </div>

      {/* Weak GPS signal notice */}
      {accuracyStatus === 'low' && (
        <div className="p-2.5 rounded-2xl bg-gold-light/20 border border-gold/30 text-gold-dark text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-gold" />
          <span>GPS signal is low confidence inside vehicle. Tracking continues with available readings.</span>
        </div>
      )}
    </div>
  );
}
