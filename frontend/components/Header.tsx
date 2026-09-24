"use client";

import React, { useState } from "react";
import { sound } from "@/lib/audio";
import { Volume2, VolumeX, Rocket } from "lucide-react";

interface HeaderProps {
  decisionCadence: number;
  sessionSeconds: number;
}

export const Header: React.FC<HeaderProps> = ({
  decisionCadence,
  sessionSeconds,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(sound.getIsMuted());

  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  const mins = String(Math.floor(sessionSeconds / 60)).padStart(2, "0");
  const secs = String(sessionSeconds % 60).padStart(2, "0");
  const formattedTime = `${mins}:${secs}`;

  return (
    <header className="border-b border-slate-800 bg-slate-950 px-3 sm:px-4 py-1.5 shadow-lg select-none shrink-0 w-full rounded-xl">
      <div className="w-full flex flex-wrap items-center justify-between gap-2">
        {/* Left: Brand & Title */}
        <div className="flex items-center space-x-2.5 min-w-[260px]">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 border border-cyan-400/40 shrink-0">
            <Rocket className="w-4 h-4 text-slate-950 transform -rotate-45" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-wider text-slate-100 uppercase leading-none font-mono">
                Deep Space Interceptor
              </h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-400/60 text-cyan-300 font-mono font-bold">
                ~100MS COGNITION ENGINE
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Human Neural Delay (~240ms) vs Autonomous Machine Reflex
            </span>
          </div>
        </div>

        {/* Right: JEV CLOCK, TIME, and Audio Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs ml-auto">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-slate-400">JEV CLOCK:</span>
            <span className="font-bold text-cyan-400">{decisionCadence}ms</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center space-x-2">
            <span className="text-slate-400">TIME:</span>
            <span className="text-amber-400 font-bold">{formattedTime}</span>
          </div>

          <button
            onClick={handleToggleSound}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 transition cursor-pointer"
            title={isMuted ? "Unmute Sound Engine" : "Mute Sound Engine"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-slate-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
