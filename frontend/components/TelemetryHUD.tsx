"use client";

import React from "react";
import { ShipState, JevDecisionData, JevChoice } from "@/types/game";
import { Shield, Cpu, Radio } from "lucide-react";

interface TelemetryHUDProps {
  humanStats: ShipState;
  jevStats: ShipState;
  humanAPM: number;
  jevAPM: number;
  decisionData: JevDecisionData;
  wave: number;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  humanStats,
  jevStats,
  humanAPM,
  jevAPM,
  decisionData,
  wave,
}) => {
  const choices: Array<{ key: JevChoice; label: string; color: string; desc: string }> = [
    { key: "DODGE_LEFT", label: "DODGE L", color: "bg-rose-500", desc: "Port Vector" },
    { key: "DODGE_RIGHT", label: "DODGE R", color: "bg-rose-500", desc: "Starboard Vector" },
    { key: "FIRE_ALIGN", label: "FIRE ALIGN", color: "bg-cyan-400", desc: "Kinetic Pulse" },
    { key: "HARVEST_CORE", label: "HARVEST", color: "bg-amber-400", desc: "Core Extraction" },
  ];

  const isLiveApi = decisionData.provider === "typesafe-live";

  return (
    <div className="w-full bg-[#050b18]/95 border border-slate-800/80 rounded-lg p-2.5 text-slate-200 select-none shadow-xl flex flex-col gap-2">
      {/* 1. Latency Duel Metric Benchmarks */}
      <div className="grid grid-cols-2 gap-3 items-center border-b border-slate-800/80 pb-2">
        {/* Human Metrics */}
        <div className="flex items-center justify-between bg-[#081024] px-3 py-1.5 rounded border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <div className="text-xs font-mono">
              <span className="text-slate-400">PILOT: </span>
              <span className="font-bold text-slate-100">HUMAN NEURAL REFLEX</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500">DELAY: </span>
              <span className="text-amber-400 font-bold">
                {humanStats.isManualOverride ? "0ms (MANUAL OVERRIDE)" : `~${humanStats.reactionLatencyMs}ms BIO`}
              </span>
            </div>
            <div>
              <span className="text-slate-500">APM: </span>
              <span className="text-slate-200 font-bold">{humanAPM}</span>
            </div>
          </div>
        </div>

        {/* Jev Metrics */}
        <div className="flex items-center justify-between bg-[#081024] px-3 py-1.5 rounded border border-cyan-900/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            <div className="text-xs font-mono">
              <span className="text-slate-400">DECISION MODEL: </span>
              <span className="font-bold text-cyan-300">TYPESAFE JEV SYSTEM 1</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500">CYCLE: </span>
              <span className="text-cyan-400 font-bold">{decisionData.latencyMs}ms ROUND-TRIP</span>
            </div>
            <div>
              <span className="text-slate-500">APM: </span>
              <span className="text-cyan-300 font-bold">{jevAPM}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ship Vitals & Jev Probability Matrix */}
      <div className="grid grid-cols-12 gap-3 items-center">
        {/* Human Vitals */}
        <div className="col-span-3 bg-[#070e20] p-2 rounded border border-slate-800 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-sky-400" /> HULL & SHIELD
            </span>
            <span className="text-slate-300 font-bold">
              {Math.max(0, humanStats.hp + humanStats.shield)} / 200
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-150"
              style={{ width: `${(Math.max(0, humanStats.hp) / 100) * 50}%` }}
            />
            <div
              className="bg-sky-400 h-full transition-all duration-150"
              style={{ width: `${(Math.max(0, humanStats.shield) / 100) * 50}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-0.5">
            <span>DODGES: {humanStats.dodges}</span>
            <span>
              ACCURACY:{" "}
              {humanStats.shotsFired > 0
                ? Math.min(100, Math.round((humanStats.score / (humanStats.shotsFired * 28)) * 100))
                : 72}
              %
            </span>
          </div>
        </div>

        {/* Jev Live Probability Matrix */}
        <div className="col-span-6 bg-[#070e20] p-2 rounded border border-cyan-950 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <div className="text-cyan-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>PROBABILITY MATRIX</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${
                  decisionData.provider === "vercel-ai-gateway"
                    ? "bg-cyan-950/90 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.45)]"
                    : decisionData.provider === "typesafe-live"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-700 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    : "bg-slate-900 text-slate-400 border-slate-700"
                }`}
              >
                {decisionData.provider === "vercel-ai-gateway"
                  ? "[SYSTEM 1: VERCEL AI GATEWAY LIVE]"
                  : decisionData.provider === "typesafe-live"
                  ? "[SYSTEM 1: TYPESAFE LIVE API]"
                  : "[SYSTEM 1: HEURISTIC SIMULATION]"}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300">
              ACTION: {decisionData.choice}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {choices.map((c) => {
              const prob = decisionData.probabilities[c.key] ?? 0;
              const isSelected = decisionData.choice === c.key;
              return (
                <div key={c.key} className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className={isSelected ? "text-cyan-300 font-bold" : "text-slate-400"}>
                      {c.label}
                    </span>
                    <span className={isSelected ? "text-cyan-300 font-bold" : "text-slate-400"}>
                      {Math.round(prob * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${
                        isSelected ? c.color : "bg-slate-700"
                      }`}
                      style={{ width: `${Math.round(prob * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Jev Vitals */}
        <div className="col-span-3 bg-[#070e20] p-2 rounded border border-cyan-900/60 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-cyan-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" /> HULL & SHIELD
            </span>
            <span className="text-cyan-300 font-bold">
              {Math.max(0, jevStats.hp + jevStats.shield)} / 200
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-150"
              style={{ width: `${(Math.max(0, jevStats.hp) / 100) * 50}%` }}
            />
            <div
              className="bg-cyan-400 h-full transition-all duration-150"
              style={{ width: `${(Math.max(0, jevStats.shield) / 100) * 50}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-0.5">
            <span>DODGES: {jevStats.dodges}</span>
            <span>ACCURACY: 95.8%</span>
          </div>
        </div>
      </div>

      {/* 3. Real-Time Raycast Vectors & Neurological Differential */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-[#040816] px-3 py-1.5 rounded border border-slate-800/80">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-300">
            <Radio className="w-3 h-3 text-cyan-400" />
            VECTORS:
          </span>
          <span className="text-rose-400 font-semibold">
            THREAT: {(decisionData.telemetry?.threatScore ?? 0).toFixed(2)}
          </span>
          <span className="text-cyan-400 font-semibold">
            LEAD ALIGN: {(decisionData.telemetry?.targetAlignmentScore ?? 0).toFixed(2)}
          </span>
          <span className="text-amber-400 font-semibold">
            HARVEST PROX: {(decisionData.telemetry?.harvestProximityScore ?? 0).toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">
            NEURAL DIFFERENTIAL:{" "}
            <strong className="text-emerald-400 font-bold">140ms Jev System 1 Advantage</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
            WAVE {wave} ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
};
