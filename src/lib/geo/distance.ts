/**
 * Geodesic and navigation calculation utilities for BusStop Alert
 */

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates the Haversine distance in meters between two lat/lng coordinates.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculates compass bearing from point 1 to point 2 in degrees (0 - 360).
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const y = Math.sin(toRadians(lon2 - lon1)) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.cos(toRadians(lon2 - lon1));
  const bearing = (toDegrees(Math.atan2(y, x)) + 360) % 360;
  return Math.round(bearing);
}

/**
 * Formats a distance in meters to a readable string (e.g., "350 m" or "1.4 km").
 */
export function formatDistance(meters: number): string {
  if (meters < 0) return '0 m';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km} km`;
}

/**
 * Formats estimated time in seconds to human-readable string (e.g., "Approx. 5 mins" or "Less than 1 min").
 */
export function formatEta(seconds: number): string {
  if (seconds <= 45) {
    return 'Arriving now';
  }
  if (seconds < 60) {
    return 'Less than 1 min';
  }
  const mins = Math.round(seconds / 60);
  if (mins === 1) {
    return 'Approx. 1 minute';
  }
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0
      ? `Approx. ${hours}h ${remainingMins}m`
      : `Approx. ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `Approx. ${mins} minutes`;
}

/**
 * Computes estimated time of arrival (in seconds) based on distance and current or assumed speed.
 * Typical city bus transit speed ~ 22 km/h (6.1 m/s) accounting for signals and stops.
 */
export function estimateEtaSeconds(
  distanceMeters: number,
  currentSpeedMps: number | null | undefined
): number {
  // If moving at reasonable speed (> 2.5 m/s or 9 km/h), use blend of current speed and average transit speed
  const defaultSpeed = 6.1; // ~22 km/h
  let effectiveSpeed = defaultSpeed;

  if (currentSpeedMps && currentSpeedMps > 2.0 && currentSpeedMps < 35.0) {
    // 60% default speed + 40% current speed to prevent erratic ETA when bus pauses at stoplights
    effectiveSpeed = defaultSpeed * 0.6 + currentSpeedMps * 0.4;
  }

  const baseSeconds = distanceMeters / effectiveSpeed;
  return Math.max(15, Math.round(baseSeconds));
}
