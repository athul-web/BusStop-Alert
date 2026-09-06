'use client';

import React from 'react';
import { useWakeLock } from '@/lib/hooks/useWakeLock';
import { Eye, EyeOff } from 'lucide-react';

export default function WakeLockToggle() {
  const { isSupported, isActive, requestWakeLock, releaseWakeLock } = useWakeLock();

  if (!isSupported) {
    return null;
  }

  const handleToggle = async () => {
    if (isActive) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
        isActive
          ? 'bg-lavender-soft text-lavender-dark border-lavender/40 shadow-sm'
          : 'bg-card text-secondary border-line hover:text-main hover:border-secondary/30 shadow-warm'
      }`}
      title={isActive ? 'Screen will stay awake' : 'Click to prevent phone screen sleep'}
    >
      {isActive ? <Eye className="w-3.5 h-3.5 text-lavender animate-pulse" /> : <EyeOff className="w-3.5 h-3.5" />}
      <span>{isActive ? 'Screen Awake On' : 'Keep Screen On'}</span>
    </button>
  );
}
