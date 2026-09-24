"use client";

import React from "react";
import { Header } from "@/components/Header";
import { TacticalControlBar } from "@/components/TacticalControlBar";
import { DecisionHorizonDeck } from "@/components/DecisionHorizonDeck";
import { useInterceptorEngine } from "@/hooks/useInterceptorEngine";
import {
  Zap,
  RotateCw,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Settings,
} from "lucide-react";

export default function DeepSpaceInterceptorPage() {
  const {
    humanCanvasRef,
    jevCanvasRef,
    isRunning,
    isLiveApi,
    latencyMs,
    decisionCadence,
    setDecisionCadence,
    wave,
    sessionSeconds,
    activeHostilesCount,
    barrageFrequency,
    isContinuousBlasters,
    setIsContinuousBlasters,
    tickerText,
    humanStats,
    jevStats,
    isGameOver,
    modalConclusion,
    finalStats,
    handleToggleEngage,
    handleReset,
    setManualControl,
    handleHumanMouseDown,
    handleHumanMouseMove,
    handleHumanMouseUp,
    humanKeys,
  } = useInterceptorEngine();

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col p-2 sm:p-2.5 gap-1.5 sm:gap-2 bg-[#030712] text-slate-100 font-sans select-none antialiased">
      {/* 1. Top Header (Zero duplicate buttons: Only Title, Badges, JEV CLOCK, TIME, Audio Toggle) */}
      <Header
        decisionCadence={decisionCadence}
        sessionSeconds={sessionSeconds}
      />

      {/* 2. Configuration Deck (4-pill Clock, Swarm Escalation, Pilot Controls) */}
      <TacticalControlBar
        decisionCadence={decisionCadence}
        onSelectCadence={setDecisionCadence}
        wave={wave}
        activeHostilesCount={activeHostilesCount}
        barrageFrequency={barrageFrequency}
        isRunning={isRunning}
        isContinuousBlasters={isContinuousBlasters}
        onToggleContinuousBlasters={setIsContinuousBlasters}
        onToggleEngage={handleToggleEngage}
        onReset={handleReset}
      />

      {/* 3. Live Decision Ticker */}
      <div className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl flex items-center gap-2 font-mono text-xs overflow-hidden shadow shrink-0">
        {isLiveApi ? (
          <span className="px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-cyan-300 font-bold uppercase shrink-0 text-[10px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.45)]">
            <Zap className="w-3 h-3 text-cyan-300 fill-cyan-400 inline" />
            <span>⚡ JEV LIVE API (VERCEL GATEWAY)</span>
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded bg-[#09152b] border border-amber-500/50 text-amber-300 font-bold uppercase shrink-0 text-[10px] flex items-center gap-1.5 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
            <Settings className="w-3 h-3 text-amber-400 inline animate-[spin_8s_linear_infinite]" />
            <span>⚙️ JEV SYSTEM 1: LOCAL HEURISTIC</span>
          </span>
        )}
        <div className="text-slate-300 truncate text-[11px] font-mono tracking-wide">
          {tickerText}
        </div>
      </div>

      {/* 4. Dual Elastic Viewports & Cockpits (100% elastic, no hardcoded heights) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
        {/* Cockpit 1: Human Pilot Arena */}
        <div className="relative bg-slate-950 rounded-xl clean-border-human p-2 flex flex-col gap-1.5 shadow-2xl overflow-hidden h-full min-h-0 flex-1">
          {/* Top Status Bar: Clean Flexbox with Zero Overlap */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-amber-500/20 pb-1.5 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${humanStats.isIdle ? "bg-slate-500" : "bg-amber-400 animate-pulse"}`} />
              <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-amber-300 uppercase">
                COCKPIT 1: HUMAN PILOT
              </span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold transition-all duration-200 ${
                  humanStats.isIdle
                    ? "bg-slate-900 border border-slate-700 text-slate-400"
                    : "bg-amber-950/90 border border-amber-500/60 text-amber-300 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                }`}
              >
                {humanStats.isIdle
                  ? "STATUS: STANDBY (AWAITING PILOT)"
                  : "STATUS: MANUAL OVERRIDE (ACTIVE)"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-mono ml-auto">
              <span className="text-slate-400">
                SCORE:{" "}
                <strong className="text-amber-400 text-xs sm:text-sm font-bold">
                  {humanStats.score.toLocaleString()}
                </strong>
              </span>
              <span className="text-slate-400">
                SHIELD:{" "}
                <strong className="text-emerald-400 font-bold">
                  {Math.round(humanStats.shield)}%
                </strong>
              </span>
            </div>
          </div>

          {/* Telemetry Ribbons */}
          <div className="grid grid-cols-4 gap-1.5 text-center font-mono shrink-0">
            <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <div className="text-[8px] sm:text-[9px] text-slate-500 uppercase">ENEMIES DOWN</div>
              <div className="text-xs font-bold text-amber-300">
                {humanStats.kills}
              </div>
            </div>
            <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <div className="text-[8px] sm:text-[9px] text-slate-500 uppercase">CORES HARVESTED</div>
              <div className="text-xs font-bold text-cyan-400">
                {humanStats.powerupsCollected}
              </div>
            </div>
            <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <div className="text-[8px] sm:text-[9px] text-slate-500 uppercase">NEURAL DELAY</div>
              <div className="text-xs font-bold text-amber-400">
                {humanStats.neuralDelay || "~240 ms"}
              </div>
            </div>
            <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <div className="text-[8px] sm:text-[9px] text-slate-500 uppercase">HIT ACCURACY</div>
              <div className="text-xs font-bold text-slate-300">
                {humanStats.accuracy}%
              </div>
            </div>
          </div>

          {/* Elastic Canvas Viewport */}
          <div className="relative w-full h-full min-h-0 flex-1 overflow-hidden rounded-xl bg-[#02050f] border border-slate-800">
            <canvas
              ref={humanCanvasRef}
              onMouseDown={handleHumanMouseDown}
              onMouseMove={handleHumanMouseMove}
              onMouseUp={handleHumanMouseUp}
              onMouseLeave={handleHumanMouseUp}
              className="w-full h-full block cursor-crosshair"
            />

            {/* Awaiting Pilot Idle Prompt (Fades out the instant any input occurs) */}
            <div
              className={`absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300 z-10 ${
                humanStats.isIdle && humanStats.alive
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
              <div className="bg-slate-950/90 border border-amber-500/60 px-3.5 py-1.5 rounded-lg font-mono text-[11px] font-bold text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <span>[ A / D TO STEER • SPACE TO FIRE ]</span>
              </div>
            </div>

            {/* Destroyed Overlay */}
            <div
              className={`absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-200 ${
                !humanStats.alive ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-rose-400 uppercase">
                HULL BREACHED: DESTROYED
              </span>
              <span className="font-mono text-[11px] text-rose-300 mt-1">
                Biological Reaction Lag & Target Fixation Overwhelmed
              </span>
            </div>

            {/* On-screen mobile touch pad */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center sm:hidden z-20">
              <div className="flex gap-1.5">
                <button
                  onTouchStart={(e) => {
                    e.preventDefault();
                    setManualControl();
                    humanKeys.left = true;
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    humanKeys.left = false;
                  }}
                  className="w-10 h-10 rounded-lg bg-slate-900/90 border border-slate-700 text-amber-400 flex items-center justify-center active:bg-amber-500 active:text-black cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onTouchStart={(e) => {
                    e.preventDefault();
                    setManualControl();
                    humanKeys.right = true;
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    humanKeys.right = false;
                  }}
                  className="w-10 h-10 rounded-lg bg-slate-900/90 border border-slate-700 text-amber-400 flex items-center justify-center active:bg-amber-500 active:text-black cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  setManualControl();
                  humanKeys.fire = true;
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  humanKeys.fire = false;
                }}
                className="w-12 h-10 rounded-lg bg-amber-500/90 text-slate-950 font-bold flex items-center justify-center active:bg-amber-400 cursor-pointer"
              >
                <Crosshair className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Hint Footer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 shrink-0">
            <span className="text-amber-400/90 truncate">
              Move mouse or tap A/D to assume manual pilot
            </span>
            <span className="text-[10px] text-slate-500 shrink-0">
              Biological lag active
            </span>
          </div>
        </div>

        {/* Cockpit 2: Jev AI Cockpit Arena */}
        <div className="relative bg-slate-950 rounded-xl clean-border-jev p-2 flex flex-col gap-1.5 shadow-2xl overflow-hidden h-full min-h-0 flex-1">
          {/* Top Status Bar: Clean Flexbox with Zero Overlap */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-cyan-500/20 pb-1.5 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-cyan-300 uppercase">
                COCKPIT 2: JEV AUTONOMOUS AI
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-400/60 text-cyan-300 font-mono font-bold">
                GOD-TIER EVASION
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-mono ml-auto">
              <span className="text-slate-400">
                SCORE:{" "}
                <strong className="text-cyan-400 text-xs sm:text-sm font-bold">
                  {jevStats.score.toLocaleString()}
                </strong>
              </span>
              <span className="text-slate-400">
                SHIELD:{" "}
                <strong className="text-emerald-400 font-bold">
                  {Math.round(jevStats.shield)}%
                </strong>
              </span>
            </div>
          </div>

          {/* Telemetry Ribbons */}
          <div className="grid grid-cols-4 gap-1.5 text-center font-mono shrink-0">
            <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <div className="text-[8px] sm:text-[9px] text-slate-500 uppercase">ENEMIES DOWN</div>
              <div className="text-xs font-bold text-cyan-300">
                {jevStats.kills}
              </div>
            </div>
            <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <div className="text-[8px] sm:text-[9px] text-slate-500 uppercase">CORES HARVESTED</div>
              <div className="text-xs font-bold text-amber-400">
                {jevStats.powerupsCollected}
              </div>
            </div>
            <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <div className="text-[8px] sm:text-[9px] text-slate-500 uppercase">DECISION DELAY</div>
              <div className="text-xs font-bold text-purple-400">
                {decisionCadence} ms
              </div>
            </div>
            <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <div className="text-[8px] sm:text-[9px] text-slate-500 uppercase">HIT ACCURACY</div>
              <div className="text-xs font-bold text-cyan-400">
                {jevStats.accuracy}%
              </div>
            </div>
          </div>

          {/* Elastic Canvas Viewport with Jev Tactical HUD */}
          <div className="relative w-full h-full min-h-0 flex-1 overflow-hidden rounded-xl bg-[#02050f] border border-slate-800">
            <canvas ref={jevCanvasRef} className="w-full h-full block" />

            {/* Tactical Overlay Floating Window */}
            <div className="absolute top-2 left-2 bg-slate-950/95 border border-cyan-500/50 p-2 rounded-lg font-mono text-[9px] w-72 shadow-2xl pointer-events-none z-10">
              <div className="flex items-center justify-between text-cyan-300 border-b border-slate-800 pb-1 mb-1 font-bold">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="tracking-tight shrink-0">JEV COGNITIVE MATRIX</span>
                  <span
                    className={`text-[7.5px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase ${
                      isLiveApi
                        ? "text-cyan-300 bg-cyan-950 border border-cyan-400/70 shadow-[0_0_8px_rgba(6,182,212,0.35)]"
                        : "text-amber-300 bg-[#09152b] border border-amber-500/50"
                    }`}
                  >
                    {isLiveApi ? `SOURCE: LIVE API (${latencyMs}ms)` : "SOURCE: LOCAL HEURISTIC"}
                  </span>
                </div>
                <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 uppercase text-[8px] shrink-0">
                  {jevStats.action}
                </span>
              </div>

              <div className="space-y-1">
                <div>
                  <div className="flex justify-between text-slate-400 text-[8px]">
                    <span>SURVIVAL INTEGRITY / THREAT AVOIDANCE</span>
                    <span className="text-cyan-400 font-bold">100% Safe</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden flex border border-slate-800 mt-0.5">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300"
                      style={{ width: `${jevStats.threatAvoidancePct}%` }}
                    />
                  </div>
                </div>

                {/* Action Probability weights */}
                <div className="pt-0.5 border-t border-slate-800/80 space-y-0.5">
                  <div className="flex justify-between text-[8px] text-slate-400">
                    <span>PREDICTIVE DODGE PRIORITY</span>
                    <span className="text-emerald-400 font-bold">100% (Absolute)</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400">
                    <span>LEAD-ANGLE TARGET INTERCEPT</span>
                    <span className="text-cyan-300 font-bold">{jevStats.leadIntercept}</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400">
                    <span>ZERO-RISK CORE HARVEST</span>
                    <span className="text-amber-300 font-bold">{jevStats.coreHarvest}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Destroyed Overlay */}
            <div
              className={`absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-200 ${
                !jevStats.alive ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-cyan-400 uppercase">
                CRITICAL FAIL
              </span>
              <span className="font-mono text-[11px] text-cyan-300 mt-1">
                Hull Compromised
              </span>
            </div>
          </div>

          {/* Hint Footer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 shrink-0">
            <span className="text-cyan-400 truncate">
              Cyan = Lead Angle • Green = Safe Corridor • Red = Threat
            </span>
            <span className="text-[10px] text-slate-500 shrink-0">
              Raycast Triangulation
            </span>
          </div>
        </div>
      </div>

      {/* 5. Bottom Decision Horizon Deck (Docked at bottom, shrink-0) */}
      <DecisionHorizonDeck
        humanScore={humanStats.score}
        jevScore={jevStats.score}
        decisionCadence={decisionCadence}
      />

      {/* 6. Mission Concluded Modal */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border-2 border-cyan-500/50 p-6 rounded-2xl max-w-lg w-full text-center space-y-5 shadow-2xl">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-cyan-950 rounded-full border border-cyan-400">
                <Trophy className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="font-mono text-2xl font-bold tracking-widest text-slate-100 uppercase">
                MISSION TELEMETRY CONCLUDED
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Benchmark evaluation across synchronized fleet seeds
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left font-mono text-xs">
              <div className="bg-slate-900 p-3 rounded-xl border border-amber-500/30">
                <div className="text-amber-400 font-bold mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> HUMAN PILOT
                </div>
                <div className="space-y-1 text-slate-300">
                  <div>
                    Score:{" "}
                    <strong className="text-amber-300 font-bold">
                      {finalStats.humanScore.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    Enemies Down:{" "}
                    <strong className="text-slate-100">{finalStats.humanKills}</strong>
                  </div>
                  <div>
                    Cores Looted:{" "}
                    <strong className="text-slate-100">{finalStats.humanCores}</strong>
                  </div>
                  <div>
                    Survival Time:{" "}
                    <strong className="text-slate-100">{finalStats.humanTime}s</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-cyan-500/30">
                <div className="text-cyan-400 font-bold mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> JEV AUTONOMOUS AI
                </div>
                <div className="space-y-1 text-slate-300">
                  <div>
                    Score:{" "}
                    <strong className="text-cyan-300 font-bold">
                      {finalStats.jevScore.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    Enemies Down:{" "}
                    <strong className="text-slate-100">{finalStats.jevKills}</strong>
                  </div>
                  <div>
                    Cores Looted:{" "}
                    <strong className="text-slate-100">{finalStats.jevCores}</strong>
                  </div>
                  <div>
                    Survival Time:{" "}
                    <strong className="text-slate-100">{finalStats.jevTime}s</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed text-left font-mono">
              {modalConclusion}
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-mono font-bold text-sm tracking-wider uppercase shadow-lg shadow-cyan-500/30 hover:brightness-110 active:scale-95 transition flex items-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                Run Benchmark Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
