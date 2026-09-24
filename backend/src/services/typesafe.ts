import { z } from "zod";

// Zod schemas for game state and decision requests
export const BulletStateSchema = z.object({
  x: z.number(),
  y: z.number(),
  vx: z.number().default(0),
  vy: z.number().default(1),
  isHostile: z.boolean().default(true),
});

export const HostileStateSchema = z.object({
  id: z.string().optional(),
  x: z.number(),
  y: z.number(),
  hp: z.number(),
  type: z.string().default("scout"),
});

export const PowerupStateSchema = z.object({
  id: z.string().optional(),
  x: z.number(),
  y: z.number(),
  type: z.preprocess(
    (val) => (typeof val === "string" ? val.toUpperCase() : val),
    z.enum(["SHIELD", "RAPID_FIRE", "EMP", "CORE", "OVERDRIVE"])
  ),
});

export const GameStateSchema = z.object({
  playerX: z.number(),
  playerY: z.number().default(540),
  cockpitWidth: z.number().default(600),
  bullets: z.array(BulletStateSchema).default([]),
  hostiles: z.array(HostileStateSchema).default([]),
  powerups: z.array(PowerupStateSchema).default([]),
  currentWave: z.number().default(1),
});

export type GameState = z.infer<typeof GameStateSchema>;

export type JevChoice = "DODGE_LEFT" | "DODGE_RIGHT" | "FIRE_ALIGN" | "HARVEST_CORE";

export interface JevDecisionResponse {
  choice: JevChoice;
  probabilities: Record<JevChoice, number>;
  latencyMs: number;
  provider: "vercel-ai-gateway" | "typesafe-live" | "jev-heuristic-engine";
  telemetry: {
    threatScore: number;
    targetAlignmentScore: number;
    harvestProximityScore: number;
    recommendedAction: JevChoice;
  };
}

/**
 * Intelligent real-time heuristic fallback simulator when live API keys
 * are absent or when network latency would breach real-time game constraints.
 */
export function computeHeuristicDecision(state: GameState, startTime: number): JevDecisionResponse {
  const { playerX, playerY, cockpitWidth, bullets, hostiles, powerups } = state;
  const shipWidth = 44;

  // 1. Analyze threat vectors from incoming hostile bullets
  let threatLeft = 0;
  let threatRight = 0;
  let threatDirect = 0;

  for (const b of bullets) {
    if (!b.isHostile) continue;
    const distY = playerY - b.y;
    if (distY > 0 && distY < 260) {
      const projectedX = b.x + (b.vx * (distY / (b.vy || 1)));
      const deltaX = projectedX - playerX;
      
      const timeToImpact = distY / Math.max(1, Math.abs(b.vy));
      const urgency = Math.max(0, 1 - (timeToImpact / 60));

      if (Math.abs(deltaX) < shipWidth * 1.3) {
        threatDirect += urgency * 2.8;
        if (deltaX >= 0) threatRight += urgency * 1.6;
        else threatLeft += urgency * 1.6;
      }
    }
  }

  // 2. Analyze Hostile Target Alignment (Lead Angle)
  let bestTargetScore = 0;
  for (const h of hostiles) {
    if (h.hp <= 0) continue;
    const dx = Math.abs(h.x - playerX);
    const dy = Math.max(10, playerY - h.y);
    const alignScore = Math.max(0, 1 - (dx / 120)) * (1 + 100 / dy);
    if (alignScore > bestTargetScore) {
      bestTargetScore = alignScore;
    }
  }

  // 3. Analyze Powerup Core Harvest Proximity
  let bestHarvestScore = 0;
  for (const p of powerups) {
    const dy = playerY - p.y;
    if (dy > 0 && dy < 300) {
      const dx = Math.abs(p.x - playerX);
      const harvestScore = Math.max(0, 1 - (dx / 150)) * (1.2 + (300 - dy) / 300);
      if (harvestScore > bestHarvestScore) {
        bestHarvestScore = harvestScore;
      }
    }
  }

  // Wall proximity penalty to prevent corner trapping
  const leftEdgeDist = playerX;
  const rightEdgeDist = cockpitWidth - playerX;
  if (leftEdgeDist < 60) threatLeft += 2.0;
  if (rightEdgeDist < 60) threatRight += 2.0;

  // Compute logit weights
  let wDodgeLeft = 0.1;
  let wDodgeRight = 0.1;
  let wFire = 0.2 + bestTargetScore * 1.8;
  let wHarvest = 0.05 + bestHarvestScore * 1.4;

  if (threatDirect > 0.4) {
    if (threatRight >= threatLeft) {
      wDodgeLeft += threatDirect * 3.5 + 1.0;
      wDodgeRight += 0.2;
    } else {
      wDodgeRight += threatDirect * 3.5 + 1.0;
      wDodgeLeft += 0.2;
    }
    wFire *= 0.15;
    wHarvest *= 0.1;
  }

  // Softmax normalization
  const maxW = Math.max(wDodgeLeft, wDodgeRight, wFire, wHarvest);
  const expDL = Math.exp(wDodgeLeft - maxW);
  const expDR = Math.exp(wDodgeRight - maxW);
  const expFire = Math.exp(wFire - maxW);
  const expHarvest = Math.exp(wHarvest - maxW);
  const sumExp = expDL + expDR + expFire + expHarvest;

  const probs: Record<JevChoice, number> = {
    DODGE_LEFT: Number((expDL / sumExp).toFixed(3)),
    DODGE_RIGHT: Number((expDR / sumExp).toFixed(3)),
    FIRE_ALIGN: Number((expFire / sumExp).toFixed(3)),
    HARVEST_CORE: Number((expHarvest / sumExp).toFixed(3)),
  };

  // Determine top choice
  let topChoice: JevChoice = "FIRE_ALIGN";
  let maxP = -1;
  for (const [action, p] of Object.entries(probs) as [JevChoice, number][]) {
    if (p > maxP) {
      maxP = p;
      topChoice = action;
    }
  }

  // Hardware inference jitter simulation (3-12ms)
  const calcTime = performance.now() - startTime;
  const simulatedLatency = Math.round(calcTime + 4 + Math.random() * 8);

  return {
    choice: topChoice,
    probabilities: probs,
    latencyMs: simulatedLatency,
    provider: "jev-heuristic-engine",
    telemetry: {
      threatScore: Number(threatDirect.toFixed(2)),
      targetAlignmentScore: Number(bestTargetScore.toFixed(2)),
      harvestProximityScore: Number(bestHarvestScore.toFixed(2)),
      recommendedAction: topChoice,
    },
  };
}

/**
 * Dispatches to TypeSafe Jev System 1 API, OpenRouter Alpha, or heuristic fallback.
 */
export async function getJevDecision(state: GameState): Promise<JevDecisionResponse> {
  const startTime = performance.now();
  const gatewayKey = (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_TOKEN || "").trim();
  const jevKey = (process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY || "").trim();
  const openrouterKey = (process.env.OPENROUTER_API_KEY || "").trim();

  // 1. Vercel AI Gateway Decisions API (Model: typesafe/jev)
  if (gatewayKey && gatewayKey !== "mock") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 190);

      const response = await fetch("https://gateway.ai.vercel.com/v1/decisions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${gatewayKey}`,
        },
        body: JSON.stringify({
          model: "typesafe/jev",
          state: state,
          questions: {
            tactic: {
              type: "choice",
              instructions: "Select optimal maneuver for the starfighter.",
              criteria: {
                DODGE_LEFT: "Incoming threat in current flight lane, left corridor open",
                DODGE_RIGHT: "Incoming threat in current flight lane, right corridor open",
                FIRE_ALIGN: "Lane clear of hazard and target ship aligned",
                HARVEST_CORE: "Trajectory clear to collect falling energy core",
              },
            },
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as any;
        const latencyMs = Math.round(performance.now() - startTime);

        // Extract decision choice from tactic answer
        const rawChoice = data.choice || data?.answers?.tactic?.choice || data?.tactic;
        const choice: JevChoice = ["DODGE_LEFT", "DODGE_RIGHT", "FIRE_ALIGN", "HARVEST_CORE"].includes(rawChoice)
          ? rawChoice
          : "FIRE_ALIGN";

        const probabilities: Record<JevChoice, number> = data.probabilities || data?.answers?.tactic?.probabilities || {
          DODGE_LEFT: choice === "DODGE_LEFT" ? 0.7 : 0.1,
          DODGE_RIGHT: choice === "DODGE_RIGHT" ? 0.7 : 0.1,
          FIRE_ALIGN: choice === "FIRE_ALIGN" ? 0.7 : 0.1,
          HARVEST_CORE: choice === "HARVEST_CORE" ? 0.7 : 0.1,
        };

        return {
          choice,
          probabilities,
          latencyMs,
          provider: "vercel-ai-gateway",
          telemetry: {
            threatScore: data.threatScore ?? 0.45,
            targetAlignmentScore: data.alignmentScore ?? 0.85,
            harvestProximityScore: data.harvestScore ?? 0.2,
            recommendedAction: choice,
          },
        };
      }
    } catch {
      // Fallback on timeout or gateway error
    }
  }

  // 2. Direct TypeSafe Jev System 1 API
  if (jevKey && jevKey !== "mock") {
    const apiUrl = process.env.TYPESAFE_API_URL || "https://api.typesafe.ai/v1/systemone";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 190);

      const promptContext = `You are Jev, a high-frequency System 1 combat interceptor AI.
Player is at x=${Math.round(state.playerX)}, y=${Math.round(state.playerY)}.
Active hostile bullets: ${state.bullets.filter(b => b.isHostile).length}.
Active enemies: ${state.hostiles.length}.
Active powerup cores: ${state.powerups.length}.
Choose immediate reflex action: DODGE_LEFT, DODGE_RIGHT, FIRE_ALIGN, or HARVEST_CORE.`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jevKey}`,
        },
        body: JSON.stringify({
          model: "jev-latest",
          primitive: "choice",
          choices: ["DODGE_LEFT", "DODGE_RIGHT", "FIRE_ALIGN", "HARVEST_CORE"],
          prompt: promptContext,
          metadata: {
            bullets: state.bullets.slice(0, 5),
            hostiles: state.hostiles.slice(0, 3),
            playerX: state.playerX,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as any;
        const latencyMs = Math.round(performance.now() - startTime);

        const choice: JevChoice = ["DODGE_LEFT", "DODGE_RIGHT", "FIRE_ALIGN", "HARVEST_CORE"].includes(data.choice)
          ? data.choice
          : "FIRE_ALIGN";

        const probabilities: Record<JevChoice, number> = data.probabilities || {
          DODGE_LEFT: 0.25,
          DODGE_RIGHT: 0.25,
          FIRE_ALIGN: 0.25,
          HARVEST_CORE: 0.25,
        };

        return {
          choice,
          probabilities,
          latencyMs,
          provider: "typesafe-live",
          telemetry: {
            threatScore: data.threatScore ?? 0.5,
            targetAlignmentScore: data.alignmentScore ?? 0.7,
            harvestProximityScore: data.harvestScore ?? 0.2,
            recommendedAction: choice,
          },
        };
      }
    } catch {
      // Failover to heuristic on network timeout
    }
  }

  // 2. OpenRouter Alpha Decisions API
  if (openrouterKey && openrouterKey !== "mock") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 190);

      const response = await fetch("https://openrouter.ai/api/alpha/decisions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openrouterKey}`,
        },
        body: JSON.stringify({
          model: "typesafe/jev-1.13",
          choices: ["DODGE_LEFT", "DODGE_RIGHT", "FIRE_ALIGN", "HARVEST_CORE"],
          context: {
            playerX: state.playerX,
            bullets: state.bullets.slice(0, 5),
            hostiles: state.hostiles.slice(0, 3),
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as any;
        const latencyMs = Math.round(performance.now() - startTime);

        const choice: JevChoice = ["DODGE_LEFT", "DODGE_RIGHT", "FIRE_ALIGN", "HARVEST_CORE"].includes(data.choice)
          ? data.choice
          : "FIRE_ALIGN";

        return {
          choice,
          probabilities: data.probabilities || {
            DODGE_LEFT: 0.25,
            DODGE_RIGHT: 0.25,
            FIRE_ALIGN: 0.25,
            HARVEST_CORE: 0.25,
          },
          latencyMs,
          provider: "typesafe-live",
          telemetry: {
            threatScore: 0.5,
            targetAlignmentScore: 0.8,
            harvestProximityScore: 0.2,
            recommendedAction: choice,
          },
        };
      }
    } catch {
      // Failover to heuristic
    }
  }

  // 3. Fallback: Ultra-responsive local heuristic engine
  return computeHeuristicDecision(state, startTime);
}
