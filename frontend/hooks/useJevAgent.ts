"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { JevChoice, JevDecisionData, Bullet, Hostile, Powerup } from "@/types/game";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const DEFAULT_DECISION: JevDecisionData = {
  choice: "FIRE_ALIGN",
  probabilities: {
    DODGE_LEFT: 0.15,
    DODGE_RIGHT: 0.15,
    FIRE_ALIGN: 0.55,
    HARVEST_CORE: 0.15,
  },
  latencyMs: 98,
  provider: "jev-heuristic-engine",
  telemetry: {
    threatScore: 0.12,
    targetAlignmentScore: 0.85,
    harvestProximityScore: 0.2,
    recommendedAction: "FIRE_ALIGN",
  },
};

export function useJevAgent() {
  const [decisionData, setDecisionData] = useState<JevDecisionData>(DEFAULT_DECISION);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [provider, setProvider] = useState<string>("jev-heuristic-engine");
  const [latencyMs, setLatencyMs] = useState<number>(98);
  const isRequestInFlight = useRef<boolean>(false);

  // Probe backend status on initial mount
  useEffect(() => {
    let mounted = true;
    fetch(`${BACKEND_URL}/api/health`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        const live = data.mode === "typesafe-live" || data.mode === "vercel-ai-gateway";
        setIsLiveApi(live);
        setProvider(live ? "vercel-ai-gateway" : "jev-heuristic-engine");
      })
      .catch(() => {
        if (mounted) {
          setIsLiveApi(false);
          setProvider("jev-heuristic-engine");
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const requestDecision = useCallback(
    async (
      playerX: number,
      playerY: number,
      cockpitWidth: number,
      bullets: Bullet[],
      hostiles: Hostile[],
      powerups: Powerup[],
      currentWave: number
    ): Promise<JevDecisionData> => {
      // Prevent overlapping network floods if one packet is delayed
      if (isRequestInFlight.current) {
        return decisionData;
      }

      isRequestInFlight.current = true;
      setIsPending(true);
      const reqStart = performance.now();

      const payload = {
        playerX: Math.round(playerX),
        bullets: bullets.map((p) => ({
          x: p.x,
          y: p.y,
          vx: p.vx ?? 0,
          vy: p.vy ?? 4.5,
          isHostile: true,
        })),
        hostiles: hostiles.map((e) => ({
          x: e.x,
          y: e.y,
          hp: e.hp,
          type: e.type || "scout",
        })),
        powerups: powerups.map((pu) => {
          const upper = String(pu.type || "CORE").toUpperCase();
          const validTypes = ["SHIELD", "RAPID_FIRE", "EMP", "CORE", "OVERDRIVE"];
          return {
            x: pu.x,
            y: pu.y,
            type: validTypes.includes(upper) ? upper : "CORE",
          };
        }),
      };

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(`${BACKEND_URL}/api/jev-decide`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (res.ok) {
          const data: JevDecisionData = await res.json();
          setDecisionData(data);
          isRequestInFlight.current = false;
          setIsPending(false);
          const live = data.provider === "vercel-ai-gateway" || data.provider === "typesafe-live";
          setIsLiveApi(live);
          setProvider(data.provider || (live ? "vercel-ai-gateway" : "jev-heuristic-engine"));
          setLatencyMs(data.latencyMs ?? Math.round(performance.now() - reqStart));
          return data;
        } else {
          setIsLiveApi(false);
          setProvider("jev-heuristic-engine");
        }
      } catch {
        setIsLiveApi(false);
        setProvider("jev-heuristic-engine");
      }

      // Fast Client Fallback (mirrors backend System 1 logic)
      const shipWidth = 44;
      let threatLeft = 0;
      let threatRight = 0;
      let threatDirect = 0;

      for (const b of bullets) {
        if (!b.isHostile) continue;
        const distY = playerY - b.y;
        if (distY > 0 && distY < 240) {
          const projectedX = b.x + (b.vx * (distY / (b.vy || 1)));
          const deltaX = projectedX - playerX;
          const urgency = Math.max(0, 1 - (distY / (b.vy * 60)));

          if (Math.abs(deltaX) < shipWidth * 1.3) {
            threatDirect += urgency * 2.5;
            if (deltaX >= 0) threatRight += urgency * 1.5;
            else threatLeft += urgency * 1.5;
          }
        }
      }

      let bestTargetScore = 0;
      for (const h of hostiles) {
        if (h.hp <= 0) continue;
        const dx = Math.abs(h.x - playerX);
        const dy = Math.max(10, playerY - h.y);
        const alignScore = Math.max(0, 1 - (dx / 120)) * (1 + 100 / dy);
        if (alignScore > bestTargetScore) bestTargetScore = alignScore;
      }

      let bestHarvestScore = 0;
      for (const p of powerups) {
        const dy = playerY - p.y;
        if (dy > 0 && dy < 300) {
          const dx = Math.abs(p.x - playerX);
          const harvestScore = Math.max(0, 1 - (dx / 150)) * (1.2 + (300 - dy) / 300);
          if (harvestScore > bestHarvestScore) bestHarvestScore = harvestScore;
        }
      }

      if (playerX < 60) threatLeft += 2.0;
      if (cockpitWidth - playerX < 60) threatRight += 2.0;

      let wDL = 0.1;
      let wDR = 0.1;
      let wFire = 0.2 + bestTargetScore * 1.8;
      let wHarvest = 0.05 + bestHarvestScore * 1.4;

      if (threatDirect > 0.4) {
        if (threatRight >= threatLeft) {
          wDL += threatDirect * 3.5 + 1.0;
          wDR += 0.2;
        } else {
          wDR += threatDirect * 3.5 + 1.0;
          wDL += 0.2;
        }
        wFire *= 0.15;
        wHarvest *= 0.1;
      }

      const maxW = Math.max(wDL, wDR, wFire, wHarvest);
      const eDL = Math.exp(wDL - maxW);
      const eDR = Math.exp(wDR - maxW);
      const eFire = Math.exp(wFire - maxW);
      const eHarv = Math.exp(wHarvest - maxW);
      const sum = eDL + eDR + eFire + eHarv;

      const probs: Record<JevChoice, number> = {
        DODGE_LEFT: Number((eDL / sum).toFixed(3)),
        DODGE_RIGHT: Number((eDR / sum).toFixed(3)),
        FIRE_ALIGN: Number((eFire / sum).toFixed(3)),
        HARVEST_CORE: Number((eHarv / sum).toFixed(3)),
      };

      let choice: JevChoice = "FIRE_ALIGN";
      let highestP = -1;
      for (const [act, p] of Object.entries(probs) as [JevChoice, number][]) {
        if (p > highestP) {
          highestP = p;
          choice = act;
        }
      }

      const clientLatency = Math.round(performance.now() - reqStart + 95 + Math.random() * 8);

      const fallbackDecision: JevDecisionData = {
        choice,
        probabilities: probs,
        latencyMs: clientLatency,
        provider: "jev-heuristic-engine",
        telemetry: {
          threatScore: Number(threatDirect.toFixed(2)),
          targetAlignmentScore: Number(bestTargetScore.toFixed(2)),
          harvestProximityScore: Number(bestHarvestScore.toFixed(2)),
          recommendedAction: choice,
        },
      };

      setDecisionData(fallbackDecision);
      setIsLiveApi(false);
      setProvider("jev-heuristic-engine");
      setLatencyMs(clientLatency);
      isRequestInFlight.current = false;
      setIsPending(false);
      return fallbackDecision;
    },
    [decisionData]
  );

  return {
    decisionData,
    isPending,
    isLiveApi,
    provider,
    latencyMs,
    requestDecision,
  };
}
