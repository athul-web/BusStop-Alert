'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Navigation,
  Compass,
  AlertCircle,
  ArrowRight,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { MOCK_ROUTES } from '@/lib/data/mockTransitData';

interface LocationNearbyRoutesProps {
  onLocationDetected?: (coords: { lat: number; lng: number; name: string }) => void;
}

export default function LocationNearbyRoutes({
  onLocationDetected,
}: LocationNearbyRoutesProps) {
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'detecting' | 'granted' | 'denied' | 'unsupported'
  >('idle');
  const [locationName, setLocationName] = useState<string>('Cherthala');
  const [showDemoRoutes, setShowDemoRoutes] = useState<boolean>(false);

  const handleUseMyLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }

    setLocationStatus('detecting');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocationStatus('granted');

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const town =
              data.address?.town ||
              data.address?.city ||
              data.address?.suburb ||
              data.address?.county ||
              'Nearby Area';
            const state = data.address?.state ? `, ${data.address.state}` : '';
            const detectedName = `${town}${state}`;
            setLocationName(detectedName);
            onLocationDetected?.({ lat, lng, name: detectedName });
            return;
          }
        } catch {
          // Safe fallback
        }

        setLocationName(`${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`);
        onLocationDetected?.({ lat, lng, name: 'Current Location' });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-4">
      {/* Location Box */}
      <div className="bg-card border border-line rounded-3xl p-5 shadow-warm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gps-light text-gps-dark flex items-center justify-center font-bold shrink-0">
              <MapPin className="w-5 h-5 text-gps" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-secondary">
                📍 Your Location
              </div>
              <div className="text-lg font-black text-main">
                {locationStatus === 'granted'
                  ? locationName
                  : locationStatus === 'detecting'
                  ? 'Detecting your position...'
                  : 'Cherthala'}
              </div>
              <p className="text-xs text-secondary font-medium">
                {locationStatus === 'granted'
                  ? 'Location active • Finding nearby bus stops'
                  : 'Find nearby bus routes'}
              </p>
            </div>
          </div>

          {locationStatus === 'granted' && (
            <button
              onClick={handleUseMyLocation}
              className="p-2 rounded-xl bg-subtle hover:bg-cream text-secondary hover:text-main border border-line transition-all"
              title="Refresh location"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {locationStatus === 'idle' && (
          <button
            onClick={handleUseMyLocation}
            className="w-full min-h-[48px] bg-gps hover:bg-gps-dark text-white font-extrabold text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>Use My Current Location</span>
          </button>
        )}

        {locationStatus === 'detecting' && (
          <div className="w-full min-h-[48px] bg-gps-light text-gps-dark text-xs font-bold rounded-2xl flex items-center justify-center gap-2 border border-gps/30">
            <Loader2 className="w-4 h-4 animate-spin text-gps" />
            <span>Requesting GPS coordinates...</span>
          </div>
        )}

        {locationStatus === 'denied' && (
          <div className="p-3.5 bg-alert-light border border-alert/30 rounded-2xl text-xs text-alert-dark space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-alert">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Location Permission Denied</span>
            </div>
            <p className="text-[11px] text-secondary">
              Location access is disabled in your browser settings. You can still search routes or browse sample lines.
            </p>
            <button
              onClick={handleUseMyLocation}
              className="text-xs font-bold text-gold underline hover:text-gold-dark"
            >
              Try Again
            </button>
          </div>
        )}

        {locationStatus === 'unsupported' && (
          <div className="p-3 bg-subtle border border-line rounded-2xl text-xs text-secondary">
            Your browser does not support the Geolocation API.
          </div>
        )}
      </div>

      {/* Nearby Routes Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-lavender" />
              <span>Nearby Routes</span>
            </h2>
            <p className="text-[11px] text-secondary">
              📍 Based on your current location ({locationName})
            </p>
          </div>

          <Link
            href="/routes"
            className="text-xs font-bold text-gold hover:text-gold-dark flex items-center gap-1"
          >
            <span>All Routes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Real Transit Route Empty/Connection State */}
        <div className="rounded-3xl bg-card border border-line p-5 text-center space-y-3 shadow-warm">
          <div className="w-12 h-12 rounded-2xl bg-lavender-soft text-lavender flex items-center justify-center mx-auto">
            <Navigation className="w-6 h-6 text-lavender" />
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-main text-sm">
              Transit routes will appear here
            </h3>
            <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
              Real-time transit route data for <strong>{locationName}</strong> will be connected during Phase 2.
            </p>
          </div>

          <div className="pt-2 border-t border-line">
            <button
              onClick={() => setShowDemoRoutes(!showDemoRoutes)}
              className="text-xs font-bold text-lavender-dark hover:text-lavender inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-lavender-soft border border-lavender/30 transition-all active:scale-95"
            >
              <span>{showDemoRoutes ? 'Hide Sample Demo Routes' : 'Preview with Sample Demo Routes'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Compact Sample Demo Routes */}
        {showDemoRoutes && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-1.5 px-2 text-[11px] font-semibold text-gold-dark">
              <Info className="w-3.5 h-3.5" />
              <span>Temporary Phase 1 Mock Data (For UI / Alert testing only)</span>
            </div>

            {MOCK_ROUTES.slice(0, 2).map((route) => (
              <Link
                key={route.id}
                href={`/routes/${route.id}`}
                className="block p-4 rounded-2xl bg-card border border-line hover:border-gold/50 shadow-warm group transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm"
                      style={{ backgroundColor: route.color_hex || '#D6A43A' }}
                    >
                      {route.route_number}
                    </span>
                    <div>
                      <div className="text-sm font-extrabold text-main group-hover:text-gold transition-colors">
                        {route.route_name}
                      </div>
                      <div className="text-[11px] text-secondary font-medium">
                        {route.origin} ➔ {route.destination}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-black uppercase tracking-wider text-gold-dark bg-gold-light/40 px-2.5 py-0.5 rounded-full border border-gold/30">
                    Sample
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
