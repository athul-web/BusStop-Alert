'use client';

import dynamic from 'next/dynamic';
import { BusRoute, BusStop, GPSCoordinate } from '@/types/transit';
import { MapPin } from 'lucide-react';

const DynamicLeafletMap = dynamic(
  () => import('@/components/map/LeafletMapCore'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[260px] bg-subtle/70 rounded-3xl flex flex-col items-center justify-center text-secondary gap-2 border border-line animate-pulse">
        <MapPin className="w-7 h-7 text-gold animate-bounce" />
        <span className="text-xs font-semibold text-secondary">Loading transit map...</span>
      </div>
    ),
  }
);

interface BusMapProps {
  route?: BusRoute | null;
  destinationStop?: BusStop | null;
  userCoordinate?: GPSCoordinate | null;
  alertRadiusMeters?: number;
  isSimulating?: boolean;
}

export default function BusMap(props: BusMapProps) {
  return <DynamicLeafletMap {...props} />;
}
