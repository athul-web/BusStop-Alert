'use client';

import React, { useEffect } from 'react';
import { BusStop, AlertSoundType } from '@/types/transit';
import { Bell, AlertTriangle, Square, Check } from 'lucide-react';
import { alertManager } from '@/lib/sound/alertChime';
import confetti from 'canvas-confetti';

interface DestinationAlertModalProps {
  isOpen: boolean;
  stop: BusStop;
  distanceMeters: number;
  onDismiss: () => void;
  onEndJourney: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  soundType?: AlertSoundType;
  remainingSeconds?: number;
  isAlarmPlaying?: boolean;
}

export default function DestinationAlertModal({
  isOpen,
  stop,
  distanceMeters,
  onDismiss,
  onEndJourney,
  isMuted,
  onToggleMute,
  soundType = 'gentle-chime',
  remainingSeconds = 30,
  isAlarmPlaying = true,
}: DestinationAlertModalProps) {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Safe fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStopAndDismiss = () => {
    alertManager.stopActiveAlarm();
    onDismiss();
  };

  const handleEndJourneyAndStop = () => {
    alertManager.stopActiveAlarm();
    onEndJourney();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 bg-main/40 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-card border-2 border-alert rounded-3xl p-6 text-main shadow-coral transform transition-all animate-bounce-subtle">
        {/* Top pulsing coral beacon & countdown */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-alert/15 text-alert border border-alert/30">
              <span className="absolute w-full h-full rounded-2xl bg-alert/25 animate-ping"></span>
              <Bell className="w-6 h-6 text-alert animate-alarm-ring" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-alert">
                  Destination Alert
                </span>
                {isAlarmPlaying && remainingSeconds > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-alert-light text-alert-dark border border-alert/30 animate-pulse">
                    {remainingSeconds}s
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-main leading-tight">
                Your stop is approaching!
              </h2>
            </div>
          </div>
        </div>

        {/* Coral Alert Box with Distance & Note */}
        <div className="bg-cream border border-line rounded-2xl p-4 my-3 space-y-2">
          <div className="text-xs font-semibold text-secondary">
            Please get ready to get off:
          </div>
          <div className="text-2xl font-black text-main tracking-tight">
            {stop.name}
          </div>
          {stop.landmark && (
            <div className="text-xs text-secondary font-medium flex items-center gap-1.5">
              <span>📍</span>
              <span>{stop.landmark}</span>
            </div>
          )}

          <div className="pt-2.5 border-t border-line flex items-center justify-between">
            <span className="text-xs font-medium text-secondary">Remaining distance:</span>
            <span className="text-xs font-black text-alert bg-alert-light px-2.5 py-1 rounded-full border border-alert/20">
              {Math.max(10, Math.round(distanceMeters))} m away
            </span>
          </div>
        </div>

        {/* Friendly instruction note */}
        <div className="flex items-start gap-2 text-xs text-secondary bg-subtle p-3 rounded-2xl mb-4 font-medium">
          <AlertTriangle className="w-4 h-4 text-alert shrink-0 mt-0.5" />
          <span>Gather your belongings and prepare to disembark safely.</span>
        </div>

        {/* Action Buttons: Dismiss & End Journey */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleStopAndDismiss}
            className="w-full min-h-[54px] bg-alert hover:bg-alert-dark text-white font-black text-base rounded-2xl shadow-coral flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Dismiss</span>
          </button>

          <button
            onClick={handleEndJourneyAndStop}
            className="w-full min-h-[46px] bg-subtle hover:bg-cream text-secondary hover:text-main font-bold text-xs rounded-2xl border border-line flex items-center justify-center gap-2 transition-all"
          >
            End Journey
          </button>
        </div>
      </div>
    </div>
  );
}
