export type JevChoice = "DODGE_LEFT" | "DODGE_RIGHT" | "FIRE_ALIGN" | "HARVEST_CORE";

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isHostile: boolean;
  color?: string;
  size?: number;
}

export interface Hostile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  width: number;
  height: number;
  type: "scout" | "cruiser" | "drone" | "interceptor" | "dreadnought" | "mothership";
  attackTimer: number;
  strafeAngle?: number;
}

export interface Powerup {
  id: string;
  x: number;
  y: number;
  vy: number;
  type: "SHIELD" | "RAPID_FIRE" | "CORE" | "OVERDRIVE";
  size: number;
  rotation?: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  rotation?: number;
  rotSpeed?: number;
  trail?: boolean;
}

export interface Shockwave {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  lineWidth: number;
  life: number;
}

export interface ShipState {
  x: number;
  y: number;
  vx: number;
  hp: number;
  maxHp: number;
  shield: number;
  score: number;
  rapidFireTimer: number;
  invulnerableTimer: number;
  lastDecision: JevChoice | string;
  reactionLatencyMs: number;
  dodges: number;
  shotsFired: number;
  shotsHit: number;
  isManualOverride?: boolean;
}

export interface JevDecisionData {
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

export type GameStatus = "READY" | "RUNNING" | "PAUSED" | "GAMEOVER";

export const WAVE_OPERATIONS: Record<number, string> = {
  1: "OP: RECON SWARM",
  2: "OP: INFILTRATION SQUAD",
  3: "OP: HEAVY CORVETTE FLIGHT",
  4: "OP: DENSE BULLET HELL",
  5: "OP: DREADNOUGHT ASSAULT",
  6: "OP: SINGULARITY CRITICAL OVERDRIVE",
};

export interface WaveBannerState {
  mode: "COMPACT" | "CLEARED" | "OPERATION";
  text: string;
  wave: number;
}

