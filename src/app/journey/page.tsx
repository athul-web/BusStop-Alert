'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  Volume2,
  VolumeX,
  Square,
} from 'lucide-react';
import { BusRoute, BusStop, GPSCoordinate, AlertDistanceOption, AlertSoundType } from '@/types/transit';
import { MOCK_ROUTES } from '@/lib/data/mockTransitData';
import { calculateHaversineDistance, estimateEtaSeconds } from '@/lib/geo/distance';
import { isValidReadingForAlert } from '@/lib/geo/gpsFilter';
import { alertManager, DEFAULT_ALARM_DURATION_SECONDS } from '@/lib/sound/alertChime';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useWakeLock } from '@/lib/hooks/useWakeLock';

import BusMap from '@/components/map/BusMap';
import JourneyProgress from '@/components/journey/JourneyProgress';
import JourneyControls from '@/components/journey/JourneyControls';
import SimulatorControl from '@/components/journey/SimulatorControl';
import DestinationAlertModal from '@/components/alerts/DestinationAlertModal';

function JourneyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const routeIdParam = searchParams.get('routeId');
  const stopIdParam = searchParams.get('stopId');
  const radiusParam = searchParams.get('radius');
  const soundParam = searchParams.get('sound');

  // Selected Route & Destination Stop
  const [selectedRoute] = useState<BusRoute>(() => {
    return MOCK_ROUTES.find((r) => r.id === routeIdParam) || MOCK_ROUTES[0];
  });

  const [destinationStop] = useState<BusStop>(() => {
    if (stopIdParam && selectedRoute.stops) {
      const found = selectedRoute.stops.find((s) => s.stop_id === stopIdParam);
      if (found) return found.stop;
    }
    return selectedRoute.stops?.[selectedRoute.stops.length - 2]?.stop || selectedRoute.stops?.[0]?.stop!;
  });

  const [alertRadius, setAlertRadius] = useState<AlertDistanceOption>(() => {
    const parsed = Number(radiusParam);
    if ([100, 200, 300, 500, 1000].includes(parsed)) {
      return parsed as AlertDistanceOption;
    }
    return 300;
  });

  const [alertSound] = useState<AlertSoundType>(() => {
    const validSounds: AlertSoundType[] = [
      'classic-bell',
      'gentle-chime',
      'urgent-alarm',
      'attention-alert',
      'voice-announcement',
      'vibration-only',
    ];
    if (soundParam && validSounds.includes(soundParam as AlertSoundType)) {
      return soundParam as AlertSoundType;
    }
    return 'gentle-chime';
  });

  // State flags
  const [alertTriggered, setAlertTriggered] = useState<boolean>(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [alertRemainingSeconds, setAlertRemainingSeconds] = useState<number>(DEFAULT_ALARM_DURATION_SECONDS);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState<boolean>(false);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationIndex, setSimulationIndex] = useState<number>(0);
  const [simulatedCoord, setSimulatedCoord] = useState<GPSCoordinate | null>(null);

  // Screen Wake Lock
  const { isSupported: wakeLockSupported, isActive: wakeLockActive, requestWakeLock, releaseWakeLock } =
    useWakeLock();

  // Geolocation Hook
  const {
    coordinate: liveCoordinate,
    permissionState,
    accuracyStatus,
    startTracking,
    stopTracking,
  } = useGeolocation({
    simulatedCoordinate: isSimulating ? simulatedCoord : null,
  });

  // Active Effective Coordinate
  const currentCoordinate = isSimulating ? simulatedCoord : liveCoordinate;

  // Polyline coordinates for simulation
  const simulationPath = useMemo(() => {
    if (selectedRoute.polyline && selectedRoute.polyline.length > 0) {
      return selectedRoute.polyline;
    }
    return (selectedRoute.stops || []).map((s) => [s.stop.latitude, s.stop.longitude] as [number, number]);
  }, [selectedRoute]);

  // Start tracking & request wake lock on mount
  useEffect(() => {
    startTracking();
    requestWakeLock();
    alertManager.requestNotificationPermission();

    return () => {
      stopTracking();
      releaseWakeLock();
      alertManager.stopActiveAlarm();
    };
  }, [startTracking, stopTracking, requestWakeLock, releaseWakeLock]);

  // Calculate distance in meters to destination
  const distanceMeters = useMemo(() => {
    if (!currentCoordinate || !destinationStop) {
      return 1850;
    }
    return calculateHaversineDistance(
      currentCoordinate.latitude,
      currentCoordinate.longitude,
      destinationStop.latitude,
      destinationStop.longitude
    );
  }, [currentCoordinate, destinationStop]);

  // Estimate ETA in seconds
  const etaSeconds = useMemo(() => {
    return estimateEtaSeconds(distanceMeters, currentCoordinate?.speed);
  }, [distanceMeters, currentCoordinate?.speed]);

  // Is currently within alert threshold
  const isApproaching = distanceMeters <= alertRadius;

  // Latch Alert: Trigger once when inside alertRadius, never restart from subsequent GPS updates
  useEffect(() => {
    if (isApproaching && !alertTriggered && destinationStop) {
      if (currentCoordinate && !isSimulating && !isValidReadingForAlert(currentCoordinate)) {
        console.warn('GPS reading too noisy to trigger arrival alert, waiting for clearer reading');
        return;
      }

      setAlertTriggered(true);
      setIsAlertModalOpen(true);
      setIsAlarmPlaying(true);
      setAlertRemainingSeconds(DEFAULT_ALARM_DURATION_SECONDS);

      const distStr = `${Math.max(10, Math.round(distanceMeters))} meters`;

      alertManager.startContinuousDestinationAlert({
        soundType: alertSound,
        stopName: destinationStop.name,
        distanceStr: distStr,
        durationSeconds: DEFAULT_ALARM_DURATION_SECONDS,
        onTick: (rem) => {
          setAlertRemainingSeconds(rem);
        },
        onStop: () => {
          setIsAlarmPlaying(false);
        },
      });
    }
  }, [isApproaching, alertTriggered, destinationStop, distanceMeters, currentCoordinate, isSimulating, alertSound]);

  // Simulation Interval Engine
  useEffect(() => {
    if (!isSimulating || simulationPath.length === 0) return;

    const interval = setInterval(() => {
      setSimulationIndex((prevIdx) => {
        const nextIdx = prevIdx + 1;
        if (nextIdx >= simulationPath.length) {
          setIsSimulating(false);
          return prevIdx;
        }

        const [lat, lng] = simulationPath[nextIdx];
        setSimulatedCoord({
          latitude: lat,
          longitude: lng,
          accuracy: 12,
          speed: 8.5,
          heading: 45,
          timestamp: Date.now(),
        });
        return nextIdx;
      });
    }, 1400);

    return () => clearInterval(interval);
  }, [isSimulating, simulationPath]);

  const handleToggleSimulate = () => {
    if (!isSimulating) {
      if (simulationIndex >= simulationPath.length - 1) {
        setSimulationIndex(0);
        const [lat, lng] = simulationPath[0];
        setSimulatedCoord({
          latitude: lat,
          longitude: lng,
          accuracy: 10,
          speed: 7.0,
          heading: 45,
          timestamp: Date.now(),
        });
      }
      setIsSimulating(true);
    } else {
      setIsSimulating(false);
    }
  };

  const handleJumpNearDestination = () => {
    if (!destinationStop) return;
    const nearLat = destinationStop.latitude - 0.0018;
    const nearLng = destinationStop.longitude - 0.0012;

    setSimulatedCoord({
      latitude: nearLat,
      longitude: nearLng,
      accuracy: 10,
      speed: 6.0,
      heading: 30,
      timestamp: Date.now(),
    });
    setSimulationIndex(Math.max(0, simulationPath.length - 2));
    setIsSimulating(true);
  };

  const handleResetSimulation = () => {
    alertManager.stopActiveAlarm();
    setIsSimulating(false);
    setIsAlarmPlaying(false);
    setSimulationIndex(0);
    setAlertTriggered(false);
    setIsAlertModalOpen(false);
    if (simulationPath.length > 0) {
      const [lat, lng] = simulationPath[0];
      setSimulatedCoord({
        latitude: lat,
        longitude: lng,
        accuracy: 10,
        speed: 0,
        heading: 0,
        timestamp: Date.now(),
      });
    }
  };

  const handleToggleWakeLock = async () => {
    if (wakeLockActive) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    alertManager.setMuted(nextMute);
  };

  const handleStopAlarmManually = () => {
    alertManager.stopActiveAlarm();
    setIsAlarmPlaying(false);
  };

  const handleResetAlert = () => {
    alertManager.stopActiveAlarm();
    setIsAlarmPlaying(false);
    setAlertTriggered(false);
    setIsAlertModalOpen(false);
  };

  const handleEndJourney = () => {
    alertManager.stopActiveAlarm();
    stopTracking();
    releaseWakeLock();
    router.push('/');
  };

  const progressPercent = useMemo(() => {
    if (simulationPath.length <= 1) return 0;
    return (simulationIndex / (simulationPath.length - 1)) * 100;
  }, [simulationIndex, simulationPath.length]);

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between">
        <Link
          href={`/routes/${selectedRoute.id}`}
          className="flex items-center gap-1.5 text-xs font-black text-secondary hover:text-main transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Route Stops</span>
        </Link>

        <div className="flex items-center gap-2">
          {isSimulating && (
            <span className="px-2.5 py-0.5 rounded-full bg-gold-light/40 text-gold-dark text-[10px] font-black uppercase tracking-wider border border-gold/30">
              Simulating
            </span>
          )}

          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-card border border-line text-secondary hover:text-main shadow-sm"
            title={isMuted ? 'Sound Muted' : 'Sound Active'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-alert" /> : <Volume2 className="w-4 h-4 text-gold-dark" />}
          </button>
        </div>
      </div>

      {/* Active Continuous Alarm Bar (Visible when alarm is playing) */}
      {isAlarmPlaying && (
        <div className="p-4 rounded-3xl bg-alert text-white shadow-coral flex items-center justify-between animate-pulse-glow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-alert font-black flex items-center justify-center text-lg shrink-0 shadow-sm">
              🔔
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-white/80">
                Alarm Sounding ({alertRemainingSeconds}s)
              </div>
              <div className="text-sm font-black truncate max-w-[170px] sm:max-w-none">
                {destinationStop.name} is approaching!
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStopAlarmManually}
              className="px-3.5 py-2 bg-white text-alert hover:bg-cream text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
            {!isAlertModalOpen && (
              <button
                onClick={() => setIsAlertModalOpen(true)}
                className="px-3 py-2 bg-alert-dark/40 text-white text-xs font-bold rounded-xl"
              >
                View
              </button>
            )}
          </div>
        </div>
      )}

      {/* Geolocation Permission Denied Notice */}
      {permissionState === 'denied' && !isSimulating && (
        <div className="p-4 rounded-3xl bg-alert-light border border-alert/30 text-alert-dark space-y-2">
          <div className="flex items-center gap-2 text-alert font-black text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>GPS Access Blocked</span>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            Your browser denied location access. Enable location in browser settings or use the <strong>Demo Mode Simulator</strong> below to test.
          </p>
          <button
            onClick={handleToggleSimulate}
            className="mt-1 px-3.5 py-1.5 bg-gold hover:bg-gold-hover text-white text-xs font-black rounded-xl shadow-gold"
          >
            Launch Bus Ride Simulator
          </button>
        </div>
      )}

      {/* MAP PRIORITIZED: Prominent Light Transit Map View */}
      <div className="h-72 sm:h-80 rounded-3xl overflow-hidden border border-line shadow-warm-md relative">
        <BusMap
          route={selectedRoute}
          destinationStop={destinationStop}
          userCoordinate={currentCoordinate}
          alertRadiusMeters={alertRadius}
          isSimulating={isSimulating}
        />
      </div>

      {/* Primary Transit Stats Card: Destination, Remaining Distance & ETA */}
      <JourneyProgress
        route={selectedRoute}
        destinationStop={destinationStop}
        distanceMeters={distanceMeters}
        etaSeconds={etaSeconds}
        accuracyStatus={isSimulating ? 'high' : accuracyStatus}
        userCoordinate={currentCoordinate}
        alertRadiusMeters={alertRadius}
        isApproaching={isApproaching}
      />

      {/* Journey Settings & Threshold Controls (includes End Journey) */}
      <JourneyControls
        alertRadius={alertRadius}
        onChangeAlertRadius={setAlertRadius}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        wakeLockActive={wakeLockActive}
        wakeLockSupported={wakeLockSupported}
        onToggleWakeLock={handleToggleWakeLock}
        onEndJourney={handleEndJourney}
        onResetAlert={handleResetAlert}
        alertTriggered={alertTriggered}
      />

      {/* Commuter Bus Ride Simulator for testing */}
      <SimulatorControl
        isSimulating={isSimulating}
        onToggleSimulate={handleToggleSimulate}
        onJumpNearDestination={handleJumpNearDestination}
        onResetSimulation={handleResetSimulation}
        progressPercent={progressPercent}
      />

      {/* Prominent Destination Alert Modal */}
      <DestinationAlertModal
        isOpen={isAlertModalOpen}
        stop={destinationStop}
        distanceMeters={distanceMeters}
        onDismiss={() => {
          handleStopAlarmManually();
          setIsAlertModalOpen(false);
        }}
        onEndJourney={handleEndJourney}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        soundType={alertSound}
        remainingSeconds={alertRemainingSeconds}
        isAlarmPlaying={isAlarmPlaying}
      />
    </div>
  );
}

export default function JourneyPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-40 bg-card rounded-xl" />
          <div className="h-72 bg-card rounded-3xl" />
          <div className="h-44 bg-card rounded-3xl" />
        </div>
      }
    >
      <JourneyContent />
    </Suspense>
  );
}
