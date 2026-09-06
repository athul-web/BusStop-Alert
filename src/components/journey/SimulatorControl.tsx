'use client';

import React, { useState } from 'react';
import { Play, Pause, FastForward, RotateCcw, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface SimulatorControlProps {
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onJumpNearDestination: () => void;
  onResetSimulation: () => void;
  progressPercent: number;
}

export default function SimulatorControl({
  isSimulating,
  onToggleSimulate,
  onJumpNearDestination,
  onResetSimulation,
  progressPercent,
}: SimulatorControlProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="w-full bg-card border border-line rounded-3xl p-4 text-main shadow-warm">
      {/* Header with expand/collapse */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-xl bg-gold-light/40 text-gold-dark">
            <Sparkles className="w-4 h-4 text-gold-dark" />
          </span>
          <div>
            <div className="text-xs font-black text-main flex items-center gap-1.5">
              <span>Bus Ride Simulator</span>
              <span className="bg-gold text-white font-black text-[9px] px-1.5 py-0.2 rounded-full uppercase">
                Demo
              </span>
            </div>
            <div className="text-[10px] text-secondary font-medium">
              Test live tracking & destination alert without boarding a bus
            </div>
          </div>
        </div>

        <button className="text-secondary hover:text-main p-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-line flex flex-col gap-3">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-secondary font-semibold">
              <span>Simulated Route Progress</span>
              <span className="font-black text-gold-dark">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-subtle overflow-hidden">
              <div
                className="h-full bg-gold transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onToggleSimulate}
              className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                isSimulating
                  ? 'bg-subtle border border-line text-main hover:bg-cream'
                  : 'bg-gold text-white shadow-gold hover:bg-gold-hover'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isSimulating ? 'Pause' : 'Play Ride'}</span>
            </button>

            <button
              onClick={onJumpNearDestination}
              className="py-2 px-3 rounded-xl text-xs font-black bg-subtle hover:bg-cream text-main border border-line flex items-center justify-center gap-1.5 transition-all active:scale-95"
              title="Jump within 250m to test alert immediately"
            >
              <FastForward className="w-3.5 h-3.5 text-lavender" />
              <span>Jump Near</span>
            </button>

            <button
              onClick={onResetSimulation}
              className="py-2 px-3 rounded-xl text-xs font-black bg-subtle hover:bg-cream text-secondary hover:text-main border border-line flex items-center justify-center gap-1.5 transition-all"
              title="Restart simulation from beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
