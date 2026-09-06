import { GPSCoordinate } from '@/types/transit';

/**
 * Filter configuration thresholds
 */
export const GPS_CONFIG = {
  // Discard or flag any GPS reading with accuracy circle larger than 120m as low confidence
  MAX_ACCEPTABLE_ACCURACY_METERS: 120,
  // High confidence threshold
  HIGH_CONFIDENCE_ACCURACY_METERS: 35,
  // Smoothing alpha for Exponential Moving Average (0 < alpha <= 1)
  // Higher value trusts new reading more; lower value dampens jumps
  SMOOTHING_ALPHA: 0.65,
  // Consecutive readings inside radius required before firing alert (prevents single GPS glitch)
  CONSECUTIVE_ALERT_READINGS_REQUIRED: 2,
};

/**
 * Classifies accuracy quality into human-readable levels
 */
export function getAccuracyQuality(accuracyMeters?: number): 'high' | 'medium' | 'low' | 'unknown' {
  if (accuracyMeters === undefined || accuracyMeters === null) return 'unknown';
  if (accuracyMeters <= GPS_CONFIG.HIGH_CONFIDENCE_ACCURACY_METERS) return 'high';
  if (accuracyMeters <= GPS_CONFIG.MAX_ACCEPTABLE_ACCURACY_METERS) return 'medium';
  return 'low';
}

/**
 * Applies Exponential Moving Average (EMA) smoothing between previous coordinate and raw new coordinate.
 * Helps prevent map marker jitter and erratic distance jumps.
 */
export function smoothCoordinate(
  prevCoord: GPSCoordinate | null,
  newCoord: GPSCoordinate
): GPSCoordinate {
  if (!prevCoord) {
    return newCoord;
  }

  // If previous reading was too old (> 30 seconds), don't smooth across large time gaps
  if (
    prevCoord.timestamp &&
    newCoord.timestamp &&
    newCoord.timestamp - prevCoord.timestamp > 30000
  ) {
    return newCoord;
  }

  const alpha = GPS_CONFIG.SMOOTHING_ALPHA;

  const smoothedLat = prevCoord.latitude * (1 - alpha) + newCoord.latitude * alpha;
  const smoothedLng = prevCoord.longitude * (1 - alpha) + newCoord.longitude * alpha;

  return {
    latitude: Number(smoothedLat.toFixed(6)),
    longitude: Number(smoothedLng.toFixed(6)),
    accuracy: newCoord.accuracy,
    heading: newCoord.heading ?? prevCoord.heading,
    speed: newCoord.speed ?? prevCoord.speed,
    timestamp: newCoord.timestamp,
  };
}

/**
 * Validates if the GPS reading is sound enough to compute destination arrival.
 */
export function isValidReadingForAlert(coord: GPSCoordinate): boolean {
  if (!coord.latitude || !coord.longitude) return false;
  // If GPS reports accuracy > 120 meters, it is too noisy to trigger an exact 100m/200m alert
  if (coord.accuracy && coord.accuracy > GPS_CONFIG.MAX_ACCEPTABLE_ACCURACY_METERS) {
    return false;
  }
  return true;
}
