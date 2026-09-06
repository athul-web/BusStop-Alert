export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

export interface BusStop {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  landmark?: string;
  zone?: string;
  created_at?: string;
}

export interface RouteStop {
  id: string;
  route_id: string;
  stop_id: string;
  stop_order: number;
  distance_from_start_km: number;
  avg_time_mins: number;
  stop: BusStop;
}

export interface BusRoute {
  id: string;
  route_number: string;
  route_name: string;
  description: string;
  color_hex: string;
  origin: string;
  destination: string;
  operating_hours?: string;
  frequency_mins?: number;
  total_distance_km?: number;
  stops?: RouteStop[];
  polyline?: [number, number][]; // [lat, lng] array
  is_sample?: boolean; // Flag to indicate mock/demo data vs real data
  created_at?: string;
}

export type JourneyStatus = 'ready' | 'active' | 'approaching' | 'arrived' | 'cancelled';

export type AlertSoundType =
  | 'classic-bell'
  | 'gentle-chime'
  | 'urgent-alarm'
  | 'attention-alert'
  | 'voice-announcement'
  | 'vibration-only';

export type AlertDistanceOption = 100 | 200 | 300 | 500 | 1000;

export interface Journey {
  id: string;
  route_id: string;
  route: BusRoute;
  destination_stop_id: string;
  destination_stop: BusStop;
  alert_radius_meters: AlertDistanceOption;
  alert_sound: AlertSoundType;
  status: JourneyStatus;
  alert_triggered: boolean;
  alert_dismissed: boolean;
  start_coordinate?: GPSCoordinate;
  current_coordinate?: GPSCoordinate;
  distance_to_destination_meters: number;
  eta_seconds: number;
  created_at: string;
  completed_at?: string;
}

export interface GeolocationState {
  coordinate: GPSCoordinate | null;
  rawCoordinate: GPSCoordinate | null;
  isTracking: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unsupported';
  accuracyStatus: 'high' | 'medium' | 'low' | 'unknown';
  errorMessage: string | null;
  history: GPSCoordinate[];
}
