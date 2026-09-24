"use client";

import React from "react";
import { Play, Pause, RotateCcw, Cpu, Skull } from "lucide-react";

interface TacticalControlBarProps {
  decisionCadence: number;
  onSelectCadence: (ms: number) => void;
  wave: number;
  activeHostilesCount: number;
  barrageFrequency: string;
  isRunning: boolean;
  isContinuousBlasters: boolean;
  onToggleContinuousBlasters: (val: boolean) => void;
  onToggleEngage: () => void;
  onReset: () => void;
}

export const TacticalControlBar: React.FC<TacticalControlBarProps> = ({
  decisionCadence,
  onSelectCadence,
  wave,
  activeHostilesCount,
  barrageFrequency,
  isRunning,
  isContinuousBlasters,
  onToggleContinuousBlasters,
  onToggleEngage,
  onReset,
}) => {
  const clockPresets = [
    { ms: 250, label: "250ms", sub: "Human" },
    { ms: 150, label: "150ms", sub: "Pro Gamer" },
    { ms: 100, label: "100ms", sub: "Jev Core" },
    { ms: 50, label: "50ms", sub: "Overdrive" },
  ];

  const getSpeedLabel = (ms: number) => {
    switch (ms) {
      case 250:
        return "Human Biological (~250ms)";
      case 150:
        return "Pro Gamer Focus (~150ms)";
      case 100:
        return "Jev Baseline (~100ms)";
      case 50:
        return "Sub-Neural Overdrive (~50ms)";
      default:
        return `Custom (${ms}ms)`;
    }
  };

  const getWaveTitle = (w: number) => {
    if (w === 1) return "WAVE 1 • DART PATROL";
    if (w % 3 === 0) return `WAVE ${w} • DREADNOUGHT`;
    return `WAVE ${w} • ASSAULT SWARM`;
  };

  const progressPercent = Math.min(100, wave * 18);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 bg-[#0b1121]/95 border border-white/10 px-3 py-1.5 rounded-xl select-none shrink-0 w-full shadow-md">
      {/* 1. Jev Cognitive Decision Interval */}
      <div className="flex flex-col gap-1.5 justify-center">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-slate-300 font-semibold uppercase flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Jev Decision Clock
          </span>
          <span className="text-cyan-400 text-[11px] font-bold">
            {getSpeedLabel(decisionCadence)}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {clockPresets.map((preset) => {
            const isActive = decisionCadence === preset.ms;
            return (
              <button
                key={preset.ms}
                onClick={() => onSelectCadence(preset.ms)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer text-center ${
                  isActive
                    ? "bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,240,255,0.35)]"
                    : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-600"
                }`}
                title={`Set Jev Decision Clock to ${preset.ms}ms`}
              >
                <div>{preset.label}</div>
                <span
                  className={`block text-[8px] ${
                    isActive ? "text-cyan-400" : "text-slate-500"
                  }`}
                >
                  {preset.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Threat Wave Escalation */}
      <div className="flex flex-col justify-center gap-1 px-1 sm:px-2">
        <div className="flex justify-between text-xs font-mono text-slate-300">
          <span className="flex items-center gap-1">
            <Skull className="w-3.5 h-3.5 text-rose-500" /> Swarm Escalation
          </span>
          <span className="text-rose-400 font-bold">{getWaveTitle(wave)}</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 mt-1 flex">
          <div
            className="bg-gradient-to-r from-cyan-500 via-amber-400 to-rose-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>
            Hostile Fleet:{" "}
            <strong className="text-slate-200">{activeHostilesCount} Ships</strong>
          </span>
          <span>
            Barrage Frequency:{" "}
            <strong className="text-slate-200">{barrageFrequency}</strong>
          </span>
        </div>
      </div>

      {/* 3. Session Engagement Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col justify-center">
          <div className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
            <span>A/D, Arrows or Mouse &bull; Space: Fire</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              id="human-autofire"
              checked={isContinuousBlasters}
              onChange={(e) => onToggleContinuousBlasters(e.target.checked)}
              className="accent-amber-500 rounded cursor-pointer w-3.5 h-3.5"
            />
            <label
              htmlFor="human-autofire"
              className="text-[10px] text-slate-300 font-mono cursor-pointer"
            >
              Continuous Blasters (Human)
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleEngage}
            className={`px-5 py-2.5 rounded-xl font-mono font-bold text-xs tracking-wider uppercase shadow-lg active:scale-95 transition flex items-center gap-1.5 cursor-pointer ${
              isRunning
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25"
                : "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-cyan-500/25"
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Halt</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Engage</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500 active:scale-95 transition cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
