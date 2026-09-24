"use client";

import React from "react";
import { Atom } from "lucide-react";

interface DecisionHorizonDeckProps {
  humanScore: number;
  jevScore: number;
  decisionCadence: number;
}

export const DecisionHorizonDeck: React.FC<DecisionHorizonDeckProps> = ({
  humanScore,
  jevScore,
  decisionCadence,
}) => {
  const scoreDiff = jevScore - humanScore;

  let deltaText = `Tied Benchmark (${humanScore.toLocaleString()} Pts)`;
  let deltaClass = "font-bold text-slate-300";

  if (scoreDiff > 0) {
    deltaText = `Jev Dominance: +${scoreDiff.toLocaleString()} Pts (Sub-Pixel Precision)`;
    deltaClass = "font-bold text-cyan-400";
  } else if (scoreDiff < 0) {
    deltaText = `Human Lead: +${Math.abs(scoreDiff).toLocaleString()} Pts (Biological Intuition!)`;
    deltaClass = "font-bold text-amber-400";
  }

  return (
    <section className="bg-[#0b1121]/95 border border-white/10 rounded-xl px-3 py-1.5 flex flex-col md:flex-row gap-3 items-center justify-between shrink-0 select-none shadow-md w-full">
      {/* Left: Explanatory paragraph */}
      <div className="w-full md:w-2/5 space-y-1">
        <h3 className="font-mono text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
          <Atom className="w-3.5 h-3.5 text-cyan-400" />
          The ~{decisionCadence}ms Decision Horizon
        </h3>
        <p className="text-[10px] text-slate-400 leading-snug font-sans">
          While humans suffer from ocular-motor lag (~240ms) under bullet clusters,{" "}
          <strong className="text-slate-200">Jev calculates complete raycast flight corridors every {decisionCadence}ms</strong>,
          prioritizing absolute survival corridors and leading agile shots for effortless evasion.
        </p>
      </div>

      {/* Right: 4 Stat Cards & Performance Delta */}
      <div className="w-full md:w-3/5 space-y-1.5 font-mono text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-center">
            <div className="text-[9px] text-slate-400">SCOUT DART</div>
            <div className="text-cyan-400 font-bold text-[11px]">+100 PTS</div>
            <div className="text-[8px] text-slate-500">Fast Evasion</div>
          </div>

          <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-center">
            <div className="text-[9px] text-slate-400">HEAVY CRUISER</div>
            <div className="text-purple-400 font-bold text-[11px]">+300 PTS</div>
            <div className="text-[8px] text-purple-300">Triple Plasma</div>
          </div>

          <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-center">
            <div className="text-[9px] text-slate-400">OVERDRIVE CORE</div>
            <div className="text-amber-400 font-bold text-[11px]">+350 PTS</div>
            <div className="text-[8px] text-amber-400/80">Continuous Blaster</div>
          </div>

          <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 text-center">
            <div className="text-[9px] text-slate-400">EMP SHOCKWAVE</div>
            <div className="text-emerald-400 font-bold text-[11px]">WIPE FLEET</div>
            <div className="text-[8px] text-slate-500">Board Cleanse</div>
          </div>
        </div>

        <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/95 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Benchmark Performance Lead:</span>
          <span className={`${deltaClass} text-[11px]`}>{deltaText}</span>
        </div>
      </div>
    </section>
  );
};
