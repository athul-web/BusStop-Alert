'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BusRoute, BusStop, GPSCoordinate } from '@/types/transit';
import { Navigation, Compass } from 'lucide-react';

interface LeafletMapCoreProps {
  route?: BusRoute | null;
  destinationStop?: BusStop | null;
  userCoordinate?: GPSCoordinate | null;
  alertRadiusMeters?: number;
  isSimulating?: boolean;
}

export default function LeafletMapCore({
  route,
  destinationStop,
  userCoordinate,
  alertRadiusMeters = 300,
}: LeafletMapCoreProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const destAlertCircleRef = useRef<L.Circle | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const stopMarkersRef = useRef<L.Marker[]>([]);

  const [isFollowingUser, setIsFollowingUser] = useState<boolean>(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = destinationStop?.latitude || route?.stops?.[0]?.stop.latitude || 9.9312;
    const initialLng = destinationStop?.longitude || route?.stops?.[0]?.stop.longitude || 76.2673;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Clean OpenStreetMap Native Light Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap' }).addTo(map);

    map.on('dragstart', () => {
      setIsFollowingUser(false);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [destinationStop?.latitude, destinationStop?.longitude, route?.stops]);

  // Update Route Polyline & Stop Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Draw route polyline in Primary Gold (#D6A43A)
    if (route?.polyline && route.polyline.length > 0) {
      const latLngs: L.LatLngExpression[] = route.polyline.map(([lat, lng]) => [lat, lng]);
      const polyline = L.polyline(latLngs, {
        color: '#D6A43A',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineRef.current = polyline;
    }

    // Add Stop Markers
    if (route?.stops && route.stops.length > 0) {
      route.stops.forEach((rs) => {
        const isDest = destinationStop && rs.stop_id === destinationStop.id;
        const stopNumber = rs.stop_order;

        // Coral beacon for destination, Lavender pill for intermediate stops
        const iconHtml = isDest
          ? `<div class="relative flex items-center justify-center">
              <span class="absolute -top-1 -right-1 flex h-4 w-4">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert opacity-75"></span>
                <span class="relative inline-flex rounded-full h-4 w-4 bg-alert"></span>
              </span>
              <div class="bg-alert text-white font-bold rounded-full w-9 h-9 flex items-center justify-center shadow-coral text-xs border-2 border-white">
                🎯
              </div>
            </div>`
          : `<div class="bg-white text-lavender-dark font-black rounded-full w-6 h-6 flex items-center justify-center shadow-warm border-2 border-lavender text-[10px]">
              ${stopNumber}
            </div>`;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-stop-icon',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([rs.stop.latitude, rs.stop.longitude], {
          icon: customIcon,
        }).addTo(map);

        marker.bindPopup(`
          <div class="text-xs p-1 font-sans text-main">
            <div class="font-extrabold text-main">${rs.stop.name}</div>
            <div class="text-secondary text-[10px]">Stop #${rs.stop_order} • ${rs.distance_from_start_km} km</div>
            ${isDest ? '<div class="text-alert font-bold mt-1">🎯 Destination Stop</div>' : ''}
          </div>
        `);

        stopMarkersRef.current.push(marker);
      });
    }

    if (!userCoordinate && route?.stops && route.stops.length > 0) {
      const bounds = L.latLngBounds(route.stops.map((s) => [s.stop.latitude, s.stop.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [route, destinationStop, userCoordinate]);

  // Update Destination Alert Radius Circle in Coral (#E87568)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !destinationStop) {
      if (destAlertCircleRef.current) {
        destAlertCircleRef.current.remove();
        destAlertCircleRef.current = null;
      }
      return;
    }

    if (!destAlertCircleRef.current) {
      destAlertCircleRef.current = L.circle([destinationStop.latitude, destinationStop.longitude], {
        radius: alertRadiusMeters,
        color: '#E87568',
        weight: 2,
        fillColor: '#E87568',
        fillOpacity: 0.12,
        dashArray: '5, 6',
      }).addTo(map);
    } else {
      destAlertCircleRef.current.setLatLng([destinationStop.latitude, destinationStop.longitude]);
      destAlertCircleRef.current.setRadius(alertRadiusMeters);
    }
  }, [destinationStop, alertRadiusMeters]);

  // Update User Coordinate Marker & Follow Mode (GPS Green #58A477)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userCoordinate) return;

    const userLatLng: L.LatLngTuple = [userCoordinate.latitude, userCoordinate.longitude];

    const heading = userCoordinate.heading || 0;
    const userIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-gps/25 animate-ping"></div>
        <div class="w-7 h-7 rounded-full bg-gps border-2 border-white shadow-warm-md flex items-center justify-center text-white text-[11px] transform ${
          heading ? `rotate-[${heading}deg]` : ''
        }">
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      </div>
    `;

    const userDivIcon = L.divIcon({
      html: userIconHtml,
      className: 'user-location-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(userLatLng, {
        icon: userDivIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(userLatLng);
      userMarkerRef.current.setIcon(userDivIcon);
    }

    if (userCoordinate.accuracy && userCoordinate.accuracy > 5) {
      if (!accuracyCircleRef.current) {
        accuracyCircleRef.current = L.circle(userLatLng, {
          radius: userCoordinate.accuracy,
          color: '#58A477',
          weight: 1,
          fillColor: '#58A477',
          fillOpacity: 0.1,
        }).addTo(map);
      } else {
        accuracyCircleRef.current.setLatLng(userLatLng);
        accuracyCircleRef.current.setRadius(userCoordinate.accuracy);
      }
    }

    if (isFollowingUser) {
      map.panTo(userLatLng, { animate: true, duration: 0.8 });
    }
  }, [userCoordinate, isFollowingUser]);

  const handleRecenter = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setIsFollowingUser(true);
    if (userCoordinate) {
      map.flyTo([userCoordinate.latitude, userCoordinate.longitude], 16, { duration: 1 });
    } else if (destinationStop) {
      map.flyTo([destinationStop.latitude, destinationStop.longitude], 15, { duration: 1 });
    }
  }, [userCoordinate, destinationStop]);

  const handleFitOverview = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setIsFollowingUser(false);
    const points: L.LatLngTuple[] = [];

    if (userCoordinate) {
      points.push([userCoordinate.latitude, userCoordinate.longitude]);
    }
    if (destinationStop) {
      points.push([destinationStop.latitude, destinationStop.longitude]);
    } else if (route?.stops) {
      route.stops.forEach((s) => points.push([s.stop.latitude, s.stop.longitude]));
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [userCoordinate, destinationStop, route]);

  return (
    <div className="relative w-full h-full min-h-[260px] bg-subtle">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Controls in Light Style */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-[400]">
        <button
          onClick={handleRecenter}
          className={`p-2.5 rounded-2xl backdrop-blur-md shadow-warm-md border transition-all ${
            isFollowingUser
              ? 'bg-gold text-white border-gold shadow-gold'
              : 'bg-card/90 text-main border-line hover:bg-card'
          }`}
          title="Center on my location"
          aria-label="Center on my location"
        >
          <Navigation className={`w-4 h-4 ${isFollowingUser ? 'animate-pulse' : ''}`} />
        </button>

        <button
          onClick={handleFitOverview}
          className="p-2.5 rounded-2xl bg-card/90 text-main backdrop-blur-md shadow-warm-md border border-line hover:bg-card transition-all"
          title="Fit route overview"
          aria-label="Fit route overview"
        >
          <Compass className="w-4 h-4 text-secondary" />
        </button>
      </div>

      {/* Destination indicator badge in Light Style */}
      {destinationStop && (
        <div className="absolute top-3 left-3 z-[400] bg-card/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-warm border border-line flex items-center gap-2 max-w-[220px]">
          <span className="w-2.5 h-2.5 rounded-full bg-alert animate-ping shrink-0"></span>
          <div className="truncate">
            <div className="text-[9px] text-secondary uppercase font-bold tracking-wider">Destination</div>
            <div className="text-xs font-black text-main truncate">
              {destinationStop.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
