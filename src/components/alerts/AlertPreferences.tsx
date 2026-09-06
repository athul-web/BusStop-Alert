'use client';

import React, { useState } from 'react';
import { AlertSoundType, AlertDistanceOption } from '@/types/transit';
import { Bell, Play, Check, Volume2 } from 'lucide-react';
import { alertManager } from '@/lib/sound/alertChime';

interface AlertPreferencesProps {
  selectedSound: AlertSoundType;
  onSelectSound: (sound: AlertSoundType) => void;
  selectedDistance: AlertDistanceOption;
  onSelectDistance: (distance: AlertDistanceOption) => void;
  className?: string;
  compact?: boolean;
}

export const ALERT_SOUND_OPTIONS: { id: AlertSoundType; label: string; desc: string; icon: string }[] = [
  { id: 'classic-bell', label: 'Classic Bell', desc: 'Acoustic chime', icon: '🔔' },
  { id: 'gentle-chime', label: 'Gentle Chime', desc: 'Melodic triad', icon: '✨' },
  { id: 'urgent-alarm', label: 'Urgent Alarm', desc: 'Rapid alert', icon: '🚨' },
  { id: 'attention-alert', label: 'Attention Alert', desc: 'Crisp dual ping', icon: '⚡' },
  { id: 'voice-announcement', label: 'Voice Announcement', desc: 'Spoken stop readout', icon: '🗣️' },
  { id: 'vibration-only', label: 'Vibration Only', desc: 'Silent haptic', icon: '📳' },
];

export const ALERT_DISTANCE_OPTIONS: { value: AlertDistanceOption; label: string }[] = [
  { value: 1000, label: '1 km' },
  { value: 500, label: '500 m' },
  { value: 300, label: '300 m' },
  { value: 200, label: '200 m' },
  { value: 100, label: '100 m' },
];

export default function AlertPreferences({
  selectedSound,
  onSelectSound,
  selectedDistance,
  onSelectDistance,
  className = '',
  compact = false,
}: AlertPreferencesProps) {
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  const handleTestAlarm = () => {
    setIsPlayingPreview(true);
    alertManager.previewSound(selectedSound, 'Your Destination');
    setTimeout(() => setIsPlayingPreview(false), 1400);
  };

  return (
    <div className={`bg-card border border-line rounded-3xl p-5 space-y-4 shadow-warm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gold-light/40 text-gold-dark flex items-center justify-center font-bold">
            <Bell className="w-4 h-4 text-gold-dark" />
          </div>
          <div>
            <h3 className="text-sm font-black text-main">Choose Your Alert</h3>
            <p className="text-[11px] text-secondary">Configure alarm sound and alert distance</p>
          </div>
        </div>

        {/* Test Alarm Button */}
        <button
          type="button"
          onClick={handleTestAlarm}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold text-white text-xs font-black shadow-gold transition-all active:scale-95"
          title="Play a preview of the selected alert"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isPlayingPreview ? 'animate-spin' : ''}`} />
          <span>{isPlayingPreview ? 'Playing...' : 'Test Alarm'}</span>
        </button>
      </div>

      {/* Alert Sounds Grid */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-black uppercase tracking-wider text-secondary">
          Alert Sound
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ALERT_SOUND_OPTIONS.map((sound) => {
            const isSelected = selectedSound === sound.id;
            return (
              <button
                key={sound.id}
                type="button"
                onClick={() => {
                  onSelectSound(sound.id);
                  alertManager.previewSound(sound.id);
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between active:scale-[0.98] ${
                  isSelected
                    ? 'bg-gold-light/20 border-gold text-main ring-2 ring-gold/20 shadow-sm'
                    : 'bg-subtle/50 border-line text-secondary hover:border-gold/40 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base">{sound.icon}</span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-gold text-white flex items-center justify-center text-[10px] font-black">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div className="mt-1.5">
                  <div className={`text-xs font-extrabold truncate ${isSelected ? 'text-main' : 'text-secondary'}`}>
                    {sound.label}
                  </div>
                  {!compact && (
                    <div className="text-[10px] text-secondary truncate mt-0.5">
                      {sound.desc}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Announcement Callout if selected */}
      {selectedSound === 'voice-announcement' && (
        <div className="p-3.5 rounded-2xl bg-lavender-soft border border-lavender/30 flex items-center justify-between gap-3 text-xs">
          <div>
            <div className="text-[10px] uppercase font-black tracking-wider text-lavender-dark">
              Spoken Announcement
            </div>
            <div className="text-xs font-bold text-main mt-0.5 italic">
              &ldquo;Your stop is approaching. Please get ready to get off.&rdquo;
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              alertManager.speakAnnouncement('your stop', '300 meters');
            }}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-lavender-light text-lavender-dark text-xs font-black border border-lavender/40 shadow-sm whitespace-nowrap active:scale-95 transition-all"
          >
            Preview Voice
          </button>
        </div>
      )}

      {/* Alert Distance Selector */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-secondary">
            Alert Distance
          </span>
          <span className="text-[11px] text-gold-dark font-bold">
            Alert {selectedDistance >= 1000 ? `${selectedDistance / 1000} km` : `${selectedDistance} m`} before stop
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {ALERT_DISTANCE_OPTIONS.map((dist) => {
            const isSelected = selectedDistance === dist.value;
            return (
              <button
                key={dist.value}
                type="button"
                onClick={() => onSelectDistance(dist.value)}
                className={`py-2 rounded-xl text-xs font-black transition-all text-center ${
                  isSelected
                    ? 'bg-gold text-white shadow-gold ring-2 ring-gold/30'
                    : 'bg-subtle text-secondary hover:text-main hover:bg-white border border-line'
                }`}
              >
                {dist.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
