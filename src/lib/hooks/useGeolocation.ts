'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GeolocationState, GPSCoordinate } from '@/types/transit';
import { smoothCoordinate, getAccuracyQuality } from '@/lib/geo/gpsFilter';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  simulatedCoordinate?: GPSCoordinate | null;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 1000,
    simulatedCoordinate = null,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    coordinate: null,
    rawCoordinate: null,
    isTracking: false,
    permissionState: 'prompt',
    accuracyStatus: 'unknown',
    errorMessage: null,
    history: [],
  });

  const watchIdRef = useRef<number | null>(null);
  const prevCoordRef = useRef<GPSCoordinate | null>(null);

  // Check permission state if Permissions API is supported
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((status) => {
          setState((prev) => ({
            ...prev,
            permissionState: status.state as 'prompt' | 'granted' | 'denied',
          }));

          status.onchange = () => {
            setState((prev) => ({
              ...prev,
              permissionState: status.state as 'prompt' | 'granted' | 'denied',
            }));
          };
        })
        .catch(() => {
          // Permissions API might not support 'geolocation' on some browsers
        });
    }
  }, []);

  // Handle simulated coordinate overrides
  useEffect(() => {
    if (simulatedCoordinate) {
      prevCoordRef.current = simulatedCoordinate;
      setState((prev) => ({
        ...prev,
        coordinate: simulatedCoordinate,
        rawCoordinate: simulatedCoordinate,
        isTracking: true,
        accuracyStatus: 'high',
        errorMessage: null,
        history: [...prev.history.slice(-19), simulatedCoordinate],
      }));
    }
  }, [simulatedCoordinate]);

  const startTracking = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        isTracking: false,
        permissionState: 'unsupported',
        errorMessage: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    if (watchIdRef.current !== null) {
      return; // Already tracking
    }

    setState((prev) => ({ ...prev, isTracking: true, errorMessage: null }));

    const handleSuccess = (position: GeolocationPosition) => {
      const raw: GPSCoordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };

      const smoothed = smoothCoordinate(prevCoordRef.current, raw);
      prevCoordRef.current = smoothed;

      setState((prev) => ({
        ...prev,
        coordinate: smoothed,
        rawCoordinate: raw,
        isTracking: true,
        permissionState: 'granted',
        accuracyStatus: getAccuracyQuality(raw.accuracy),
        errorMessage: null,
        history: [...prev.history.slice(-19), smoothed],
      }));
    };

    const handleError = (error: GeolocationPositionError) => {
      let msg = 'Unable to retrieve location.';
      let permState: GeolocationState['permissionState'] = 'prompt';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          msg = 'Location permission was denied. Please allow location access in your browser settings to track your stop.';
          permState = 'denied';
          break;
        case error.POSITION_UNAVAILABLE:
          msg = 'GPS signal temporarily unavailable. Seeking location...';
          break;
        case error.TIMEOUT:
          msg = 'Location request timed out. Retrying GPS lock...';
          break;
      }

      setState((prev) => ({
        ...prev,
        isTracking: error.code !== error.PERMISSION_DENIED,
        permissionState: permState,
        errorMessage: msg,
      }));
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
  };
}
