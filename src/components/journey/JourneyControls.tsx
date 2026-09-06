'use client';

import React from 'react';
import { AlertDistanceOption, AlertSoundType } from '@/types/transit';
import { Bell, Volume2, VolumeX, Eye, StopCircle, RefreshCw } from 'lucide-react';
import AlertPreferences from '@/components/alerts/AlertPreferences';

interface JourneyControlsProps {
  alertRadius: AlertDistanceOption;
  onChangeAlertRadius: (radius: AlertDistanceOption) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  wakeLockActive: boolean;
  wakeLockSupported: boolean;
  onToggleWakeLock: () => void;
  onEndJourney: () => void;
  onResetAlert: () => void;
  alertTriggered: boolean;
  alertSound: AlertSoundType;
  onSelectAlertSound: (sound: AlertSoundType) => void;
}

const RADIUS_OPTIONS: AlertDistanceOption[] = [1000, 500, 300, 200, 100];

export default function JourneyControls({
  alertRadius,
  onChangeAlertRadius,
  isMuted,
  onToggleMute,
  wakeLockActive,
  wakeLockSupported,
  onToggleWakeLock,
  onEndJourney,
  onResetAlert,
  alertTriggered,
  alertSound,
  onSelectAlertSound,
}: JourneyControlsProps) {
  return (
    <div className="w-full bg-card rounded-3xl p-5 shadow-warm border border-line flex flex-col gap-4">
      {/* Alarm Tone Selector — lets the rider change tone while the journey is active.
          Distance section is hidden here since JourneyControls already has its own
          distance-threshold picker just below (unchanged). */}
      <AlertPreferences
        selectedSound={alertSound}
        onSelectSound={onSelectAlertSound}
        selectedDistance={alertRadius}
        onSelectDistance={onChangeAlertRadius}
        compact
        showDistance={false}
        className="!p-0 !border-0 !shadow-none !bg-transparent"
      />

      {/* Alert Distance Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black text-main flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-gold" />
            <span>Alert Distance Threshold</span>
          </label>
          <span className="text-[11px] text-secondary font-medium">Triggers alert before stop</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {RADIUS_OPTIONS.map((dist) => (
            <button
              key={dist}
              onClick={() => onChangeAlertRadius(dist)}
              className={`py-2 px-1 rounded-xl text-xs font-black transition-all ${
                alertRadius === dist
                  ? 'bg-gold text-white shadow-gold ring-2 ring-gold/25'
                  : 'bg-subtle text-secondary hover:text-main hover:bg-cream border border-line'
              }`}
            >
              {dist >= 1000 ? `${dist / 1000} km` : `${dist} m`}
            </button>
          ))}
        </div>
      </div>

      {/* Utility Quick Toggles: Sound & WakeLock */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          onClick={onToggleMute}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold border transition-all ${
            !isMuted
              ? 'bg-gold-light/20 text-main border-gold/30'
              : 'bg-subtle text-secondary border-line'
          }`}
        >
          {!isMuted ? <Volume2 className="w-4 h-4 text-gold-dark" /> : <VolumeX className="w-4 h-4 text-secondary" />}
          <span>{!isMuted ? 'Sound On' : 'Muted'}</span>
        </button>

        <button
          onClick={onToggleWakeLock}
          disabled={!wakeLockSupported}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold border transition-all ${
            wakeLockActive
              ? 'bg-lavender-soft text-lavender-dark border-lavender/40 shadow-sm'
              : 'bg-subtle text-secondary border-line'
          } ${!wakeLockSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Eye className={`w-4 h-4 ${wakeLockActive ? 'text-lavender animate-pulse' : 'text-secondary'}`} />
          <span>{wakeLockActive ? 'Screen Awake' : 'Screen Timeout'}</span>
        </button>
      </div>

      {/* Alert reset if already triggered */}
      {alertTriggered && (
        <button
          onClick={onResetAlert}
          className="w-full py-2.5 px-4 bg-gold-light/20 border border-gold/30 text-main text-xs font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-gold-light/30 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gold-dark" />
          <span>Reset Alert (Allow re-triggering)</span>
        </button>
      )}

      {/* End Journey Button (Prominent, styled cleanly as requested) */}
      <button
        onClick={onEndJourney}
        className="w-full min-h-[50px] bg-subtle hover:bg-cream text-alert font-black text-sm rounded-2xl border border-line flex items-center justify-center gap-2 active:scale-98 transition-all"
      >
        <StopCircle className="w-4 h-4 text-alert" />
        <span>End Journey</span>
      </button>
    </div>
  );
}
