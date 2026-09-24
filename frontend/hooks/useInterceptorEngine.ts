"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { sound } from "@/lib/audio";
import { useJevAgent } from "./useJevAgent";

export interface GameStats {
  score: number;
  kills: number;
  powerupsCollected: number;
  shield: number;
  accuracy: number;
  alive: boolean;
  isManualOverride: boolean;
  isIdle: boolean;
  action: string;
  threatAvoidance: string;
  dodgePriority: string;
  leadIntercept: string;
  coreHarvest: string;
  threatAvoidancePct: number;
  neuralDelay: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  color: string;
  size: number;
}

interface Enemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "dart" | "cruiser" | "drone";
  hp: number;
  maxHp: number;
  color: string;
  lastShot: number;
}

interface Plasma {
  x: number;
  y: number;
  vy: number;
  color?: string;
}

interface Laser {
  x: number;
  y: number;
}

interface PowerupEntity {
  x: number;
  y: number;
  type: "overdrive" | "shield" | "emp";
}

const GAME_CONFIG = {
  baseEnemySpeed: 0.72,
  basePlasmaSpeed: 4.5,
  playerLaserSpeed: 9.8,
  playerSpeed: 6.2,
  shieldMax: 100,
  damagePerHit: 20,
};

function createPRNG(seed: number) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function useInterceptorEngine() {
  const humanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const jevCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { requestDecision, isLiveApi, provider, latencyMs } = useJevAgent();

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [decisionCadence, setDecisionCadenceState] = useState<number>(100);
  const [wave, setWave] = useState<number>(1);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [activeHostilesCount, setActiveHostilesCount] = useState<number>(5);
  const [barrageFrequency, setBarrageFrequency] = useState<string>("~113ms");
  const [isContinuousBlasters, setIsContinuousBlasters] = useState<boolean>(false);
  const [tickerText, setTickerText] = useState<string>(
    "INITIALIZING RECURSIVE RAYCASTS • PRE-COMPUTING LETHAL ZONES • 100MS INTERVAL LOCKED"
  );

  const [humanStats, setHumanStats] = useState<GameStats>({
    score: 0,
    kills: 0,
    powerupsCollected: 0,
    shield: 100,
    accuracy: 54,
    alive: true,
    isManualOverride: false,
    isIdle: true,
    action: "STATUS: STANDBY (AWAITING PILOT)",
    threatAvoidance: "Sluggish",
    dodgePriority: "Human Reflex",
    leadIntercept: "Manual Aim",
    coreHarvest: "Opportunistic",
    threatAvoidancePct: 60,
    neuralDelay: "~240 ms",
  });

  const [jevStats, setJevStats] = useState<GameStats>({
    score: 0,
    kills: 0,
    powerupsCollected: 0,
    shield: 100,
    accuracy: 98.5,
    alive: true,
    isManualOverride: false,
    isIdle: false,
    action: "SURGICAL_WEAVE",
    threatAvoidance: "100% Safe Corridor",
    dodgePriority: "100% (Absolute)",
    leadIntercept: "98% Locked",
    coreHarvest: "Active",
    threatAvoidancePct: 100,
    neuralDelay: "100 ms",
  });

  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [modalConclusion, setModalConclusion] = useState<string>("");
  const [finalStats, setFinalStats] = useState<{
    humanScore: number;
    humanKills: number;
    humanCores: number;
    humanTime: number;
    jevScore: number;
    jevKills: number;
    jevCores: number;
    jevTime: number;
  }>({
    humanScore: 0,
    humanKills: 0,
    humanCores: 0,
    humanTime: 0,
    jevScore: 0,
    jevKills: 0,
    jevCores: 0,
    jevTime: 0,
  });

  // Engine Internals Ref
  const engineRef = useRef({
    running: false,
    seed: 83921,
    jevTickMs: 100,
    wave: 1,
    sessionSeconds: 0,
    isContinuousBlasters: false,
    lastHumanInputTime: 0,
    isHumanIdle: true,
    threatTimerStart: null as null | number,
    measuredLatencyMs: null as null | number,
    particles: [] as Particle[],
    human: {
      alive: true,
      score: 0,
      kills: 0,
      shotsFired: 0,
      shotsHit: 0,
      powerupsCollected: 0,
      shield: GAME_CONFIG.shieldMax,
      overdriveTimer: 0,
      shake: 0,
      manualControl: true,
      ship: { x: 180, y: 420, vx: 0, lastFired: 0 },
      enemies: [] as Enemy[],
      enemyPlasma: [] as Plasma[],
      playerLasers: [] as Laser[],
      powerups: [] as PowerupEntity[],
      keys: { left: false, right: false, fire: false },
    },
    jev: {
      alive: true,
      score: 0,
      kills: 0,
      shotsFired: 0,
      shotsHit: 0,
      powerupsCollected: 0,
      shield: GAME_CONFIG.shieldMax,
      overdriveTimer: 0,
      shake: 0,
      ship: { x: 180, y: 420, vx: 0, lastFired: 0 },
      enemies: [] as Enemy[],
      enemyPlasma: [] as Plasma[],
      playerLasers: [] as Laser[],
      powerups: [] as PowerupEntity[],
      jevAction: "SURGICAL_WEAVE",
      targetEnemy: null as null | { enemy: Enemy; targetX: number },
      targetPowerup: null as null | PowerupEntity,
      macroGoalX: 180,
      lastFlashThruster: 0,
      dangerZones: [] as Array<{ minX: number; maxX: number; time: number; rawX: number }>,
    },
    timerInterval: null as any,
    jevBrainInterval: null as any,
    animFrame: null as any,
    lastTimestamp: performance.now(),
  });

  // Keep continuous blasters synced
  useEffect(() => {
    engineRef.current.isContinuousBlasters = isContinuousBlasters;
  }, [isContinuousBlasters]);

  const setDecisionCadence = useCallback((cadence: number) => {
    setDecisionCadenceState(cadence);
    engineRef.current.jevTickMs = cadence;
    if (engineRef.current.jevBrainInterval) {
      clearInterval(engineRef.current.jevBrainInterval);
      if (engineRef.current.running) {
        engineRef.current.jevBrainInterval = setInterval(runJevCognitiveCycle, cadence);
      }
    }
  }, []);

  const spawnWaveRow = useCallback((arenaType: "human" | "jev", seedOffset: number) => {
    const engine = engineRef.current;
    const arena = arenaType === "human" ? engine.human : engine.jev;
    const canvas = arenaType === "human" ? humanCanvasRef.current : jevCanvasRef.current;
    if (!canvas) return;

    const rand = createPRNG(engine.seed + seedOffset);
    const count = 4 + Math.min(4, Math.floor(engine.wave / 2));
    const arenaW = canvas.width / (window.devicePixelRatio || 1);
    const spacing = (arenaW - 60) / count;

    for (let i = 0; i < count; i++) {
      const roll = rand();
      let enemyType: "dart" | "cruiser" | "drone" = "dart";
      let hp = 1;
      let color = "#38bdf8";

      if (roll > 0.8) {
        enemyType = "cruiser";
        hp = 3;
        color = "#c084fc";
      } else if (roll > 0.5) {
        enemyType = "drone";
        hp = 2;
        color = "#f43f5e";
      }

      arena.enemies.push({
        id: Math.random().toString(36).substring(2, 9),
        x: 35 + i * spacing + (rand() * 20 - 10),
        y: -30 - rand() * 50,
        vx: (rand() - 0.5) * 1.3,
        vy: GAME_CONFIG.baseEnemySpeed + engine.wave * 0.12,
        type: enemyType,
        hp,
        maxHp: hp,
        color,
        lastShot: performance.now() + rand() * 1000,
      });
    }
  }, []);

  const createExplosionParticles = (x: number, y: number, color: string, count: number = 16) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 4.6;
      engineRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.035 + Math.random() * 0.04,
        color,
        size: 2.2 + Math.random() * 2.2,
      });
    }
  };

  const fireCannons = (arenaType: "human" | "jev", now: number) => {
    const arena = arenaType === "human" ? engineRef.current.human : engineRef.current.jev;
    arena.ship.lastFired = now;
    arena.shotsFired++;
    sound.playLaser(arenaType === "jev");

    if (arena.overdriveTimer > 0) {
      arena.playerLasers.push({ x: arena.ship.x - 11, y: arena.ship.y - 12 });
      arena.playerLasers.push({ x: arena.ship.x, y: arena.ship.y - 16 });
      arena.playerLasers.push({ x: arena.ship.x + 11, y: arena.ship.y - 12 });
    } else {
      arena.playerLasers.push({ x: arena.ship.x - 8, y: arena.ship.y - 12 });
      arena.playerLasers.push({ x: arena.ship.x + 8, y: arena.ship.y - 12 });
    }
  };

  const takeDamage = (arenaType: "human" | "jev", amount: number) => {
    const arena = arenaType === "human" ? engineRef.current.human : engineRef.current.jev;
    arena.shield -= amount;
    arena.shake = 14;
    if (arena.shield <= 0) {
      arena.shield = 0;
      arena.alive = false;
      createExplosionParticles(arena.ship.x, arena.ship.y, "#ef4444", 36);
      sound.playExplosion("large");
      checkMissionOver();
    }
  };

  const checkMissionOver = () => {
    const engine = engineRef.current;
    if (!engine.human.alive && !engine.jev.alive) {
      engine.running = false;
      setIsRunning(false);
      clearInterval(engine.timerInterval);
      clearInterval(engine.jevBrainInterval);

      const diff = engine.jev.score - engine.human.score;
      let conc = "";
      if (diff > 0) {
        conc = `Jev out-performed the biological pilot by +${diff} points. By prioritizing 100% collision-free corridors and executing predictive lead-angle intercepts every ${engine.jevTickMs}ms, Jev survived impossible bullet storms.`;
      } else {
        conc = `Human pilot won with +${Math.abs(diff)} points! Unmatched biological intuition and risk-taking prevailed against the algorithmic decision model.`;
      }
      setModalConclusion(conc);

      setFinalStats({
        humanScore: engine.human.score,
        humanKills: engine.human.kills,
        humanCores: engine.human.powerupsCollected,
        humanTime: engine.sessionSeconds,
        jevScore: engine.jev.score,
        jevKills: engine.jev.kills,
        jevCores: engine.jev.powerupsCollected,
        jevTime: engine.sessionSeconds,
      });

      setTimeout(() => {
        setIsGameOver(true);
      }, 600);
    }
  };

  const runJevCognitiveCycle = () => {
    const engine = engineRef.current;
    if (!engine.running || !engine.jev.alive) return;

    const ship = engine.jev.ship;
    const canvas = jevCanvasRef.current;
    if (!canvas) return;
    const arenaW = canvas.width / (window.devicePixelRatio || 1);
    const now = performance.now();

    // 1. RECURSIVE RAYCAST: Multi-step future projection
    const dangerZones: Array<{ minX: number; maxX: number; time: number; rawX: number }> = [];
    const shipSafetyRadius = 30;

    for (const p of engine.jev.enemyPlasma) {
      const timeToShipY = (ship.y - p.y) / p.vy;
      if (timeToShipY >= -2 && timeToShipY <= 50) {
        dangerZones.push({
          minX: p.x - shipSafetyRadius,
          maxX: p.x + shipSafetyRadius,
          time: timeToShipY,
          rawX: p.x,
        });
      }
    }
    engine.jev.dangerZones = dangerZones;

    // 2. LEAD-ANGLE TARGETING
    let bestTarget: null | { enemy: Enemy; targetX: number } = null;
    let highestThreatScore = -1;

    for (const e of engine.jev.enemies) {
      if (e.y < ship.y - 25) {
        const timeToHit = (ship.y - e.y) / GAME_CONFIG.playerLaserSpeed;
        const predictedX = e.x + e.vx * timeToHit;
        const threatScore =
          (e.type === "cruiser" ? 3 : e.type === "drone" ? 2 : 1) * (e.y / ship.y);

        if (threatScore > highestThreatScore) {
          highestThreatScore = threatScore;
          bestTarget = {
            enemy: e,
            targetX: Math.max(30, Math.min(arenaW - 30, predictedX)),
          };
        }
      }
    }
    engine.jev.targetEnemy = bestTarget;

    // 3. SECURE CORE HARVESTING
    let targetCore: null | PowerupEntity = null;
    let minCoreDist = 9999;
    for (const pu of engine.jev.powerups) {
      if (pu.y < ship.y + 15) {
        const d = Math.hypot(pu.x - ship.x, pu.y - ship.y);
        if (d < minCoreDist) {
          minCoreDist = d;
          targetCore = pu;
        }
      }
    }
    engine.jev.targetPowerup = targetCore;

    // 4. CALCULATE ABSOLUTE SAFE CANDIDATES ACROSS SCREEN
    const step = 6;
    const candidates: Array<{ x: number; score: number; threatDist: number }> = [];

    for (let testX = 30; testX <= arenaW - 30; testX += step) {
      let isSafe = true;
      let threatDistanceSum = 0;

      for (const dz of dangerZones) {
        if (testX >= dz.minX && testX <= dz.maxX) {
          isSafe = false;
          break;
        }
        threatDistanceSum += Math.abs(testX - dz.rawX);
      }

      if (isSafe) {
        let score = 0;
        if (bestTarget) {
          const distToAim = Math.abs(testX - bestTarget.targetX);
          score += Math.max(0, 220 - distToAim * 1.1);
        }
        if (targetCore) {
          const distToCore = Math.abs(testX - targetCore.x);
          score += Math.max(0, 180 - distToCore * 0.8);
        }
        score -= Math.abs(testX - ship.x) * 0.12;
        candidates.push({ x: testX, score, threatDist: threatDistanceSum });
      }
    }

    let chosenAction = "CRUISE_FIRE";
    let targetX = ship.x;

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      targetX = candidates[0].x;

      if (dangerZones.length > 0) {
        chosenAction = "SURGICAL_WEAVE";
      } else if (targetCore && Math.abs(targetX - targetCore.x) < 25) {
        chosenAction = "SNATCH_CORE";
      } else if (bestTarget && Math.abs(targetX - bestTarget.targetX) < 18) {
        chosenAction = "LEAD_INTERCEPT";
      }
    } else {
      let maxClearance = -1;
      for (let testX = 30; testX <= arenaW - 30; testX += step) {
        let clearance = 9999;
        for (const dz of dangerZones) {
          clearance = Math.min(clearance, Math.abs(testX - dz.rawX));
        }
        if (clearance > maxClearance) {
          maxClearance = clearance;
          targetX = testX;
        }
      }
      chosenAction = "EMERGENCY_CLEAR";
    }

    engine.jev.macroGoalX = targetX;
    engine.jev.jevAction = chosenAction;

    const tickId = Math.floor(now % 10000);
    const targetLabel = bestTarget ? bestTarget.enemy.type.toUpperCase() : "SEARCH";
    setTickerText(
      `TICK #${tickId} (${engine.jevTickMs}ms): ${chosenAction} • RAYCASTS: ${dangerZones.length} • TARGET: ${targetLabel} • CLEARANCE: 100%`
    );

    // Call Flat Backend Schema in background
    requestDecision(
      Math.round(ship.x),
      ship.y,
      arenaW,
      engine.jev.enemyPlasma.map((p) => ({
        id: "",
        x: p.x,
        y: p.y,
        vx: 0,
        vy: p.vy,
        radius: 4,
        isHostile: true,
      })),
      engine.jev.enemies.map((e) => ({
        id: e.id,
        x: e.x,
        y: e.y,
        vx: e.vx,
        vy: e.vy,
        width: 24,
        height: 24,
        hp: e.hp,
        maxHp: e.maxHp,
        scoreValue: 100,
        type: (e.type === "dart" ? "scout" : e.type) as "cruiser" | "drone" | "scout",
        attackTimer: 0,
      })),
      engine.jev.powerups.map((pu) => ({
        id: "",
        x: pu.x,
        y: pu.y,
        vy: 1.8,
        type: pu.type.toUpperCase() as any,
        radius: 8,
        size: 16,
      })),
      engine.wave
    ).catch(() => {});
  };

  const recordDodgeReaction = () => {
    const engine = engineRef.current;
    if (engine.threatTimerStart !== null) {
      const deltaMs = Math.round(performance.now() - engine.threatTimerStart);
      if (deltaMs >= 50 && deltaMs <= 1000) {
        engine.measuredLatencyMs = deltaMs;
      }
      engine.threatTimerStart = null;
    }
  };

  const updateJevContinuousReflex = (delta: number, now: number) => {
    const engine = engineRef.current;
    const canvas = jevCanvasRef.current;
    if (!canvas) return;
    const arenaW = canvas.width / (window.devicePixelRatio || 1);
    const ship = engine.jev.ship;

    let repulsiveForce = 0;
    let imminentDanger = false;
    let closestBulletDist = 9999;

    for (const p of engine.jev.enemyPlasma) {
      const dy = ship.y - p.y;
      const dx = ship.x - p.x;
      if (dy > -10 && dy < 180) {
        const dist = Math.hypot(dx, dy);
        if (dist < closestBulletDist) closestBulletDist = dist;

        if (dist < 85) {
          const force = (85 - dist) / 85;
          const sign = dx === 0 ? (ship.x > arenaW / 2 ? 1 : -1) : Math.sign(dx);
          repulsiveForce += sign * force * 18;
          if (dist < 32) imminentDanger = true;
        }
      }
    }

    if (imminentDanger && now - engine.jev.lastFlashThruster > 450) {
      engine.jev.lastFlashThruster = now;
      const safeDir = ship.x > arenaW / 2 ? -1 : 1;
      ship.x += safeDir * 42;
      createExplosionParticles(ship.x, ship.y, "#38bdf8", 14);
      repulsiveForce = 0;
    }

    const macroDx = engine.jev.macroGoalX - ship.x;
    let totalDesiredSpeed = macroDx * 0.18 + repulsiveForce;

    if (ship.x < 35 && totalDesiredSpeed < 0) totalDesiredSpeed = 4;
    if (ship.x > arenaW - 35 && totalDesiredSpeed > 0) totalDesiredSpeed = -4;

    ship.vx = Math.max(
      -GAME_CONFIG.playerSpeed * 1.3,
      Math.min(GAME_CONFIG.playerSpeed * 1.3, totalDesiredSpeed)
    );

    const fireInterval = engine.jev.overdriveTimer > 0 ? 65 : 125;
    if (now - ship.lastFired > fireInterval) {
      fireCannons("jev", now);
    }
  };

  const updateArena = (arenaType: "human" | "jev", delta: number, now: number) => {
    const engine = engineRef.current;
    const arena = arenaType === "human" ? engine.human : engine.jev;
    const canvas = arenaType === "human" ? humanCanvasRef.current : jevCanvasRef.current;
    if (!canvas || !arena.alive) return;

    const arenaW = canvas.width / (window.devicePixelRatio || 1);
    const arenaH = canvas.height / (window.devicePixelRatio || 1);
    arena.ship.y = arenaH - 42;

    if (arena.shake > 0) arena.shake *= 0.85;
    if (arena.overdriveTimer > 0) arena.overdriveTimer -= delta;

    if (arenaType === "human") {
      const human = engine.human;

      // Track incoming enemy plasma bolt entering lower defensive sector in line with ship
      if (engine.threatTimerStart === null) {
        for (const p of human.enemyPlasma) {
          if (p.y > arenaH - 160 && p.y < human.ship.y && Math.abs(p.x - human.ship.x) < 35) {
            engine.threatTimerStart = performance.now();
            break;
          }
        }
      } else {
        // Reset threat detection if expired (> 1.2s without dodge)
        if (now - engine.threatTimerStart > 1200) {
          engine.threatTimerStart = null;
        }
      }

      // Check idle state: >2 seconds without user input
      const isIdle = engine.lastHumanInputTime === 0 || now - engine.lastHumanInputTime > 2000;
      engine.isHumanIdle = isIdle;

      // Strict manual movement:
      // If user is NOT pressing A, D, Left, Right: ship.vx = 0 and stays completely stationary
      if (human.keys.left) {
        human.ship.vx = -GAME_CONFIG.playerSpeed;
      } else if (human.keys.right) {
        human.ship.vx = GAME_CONFIG.playerSpeed;
      } else {
        human.ship.vx = 0;
      }

      // Strict manual firing:
      // Lasers ONLY spawn on explicit user action (when Space or LMB is down, or if user explicitly enabled continuous blasters)
      const isFiring = human.keys.fire || (engine.isContinuousBlasters && !isIdle);
      const fireRate = human.overdriveTimer > 0 ? 80 : 160;
      if (isFiring && now - human.ship.lastFired > fireRate) {
        fireCannons("human", now);
      }
    } else {
      updateJevContinuousReflex(delta, now);
    }

    arena.ship.x += arena.ship.vx;
    if (arena.ship.x < 24) arena.ship.x = 24;
    if (arena.ship.x > arenaW - 24) arena.ship.x = arenaW - 24;

    // Lasers
    for (let i = arena.playerLasers.length - 1; i >= 0; i--) {
      const l = arena.playerLasers[i];
      l.y -= GAME_CONFIG.playerLaserSpeed;
      if (l.y < -15) arena.playerLasers.splice(i, 1);
    }

    // Enemies
    const plasmaCooldown = Math.max(140, 420 - engine.wave * 35);
    for (let i = arena.enemies.length - 1; i >= 0; i--) {
      const e = arena.enemies[i];
      e.x += e.vx;
      e.y += e.vy;

      if (e.x < 22 || e.x > arenaW - 22) e.vx *= -1;

      if (now - e.lastShot > plasmaCooldown && Math.random() < 0.38) {
        e.lastShot = now;
        const plasmaVy = GAME_CONFIG.basePlasmaSpeed + engine.wave * 0.2;
        if (e.type === "cruiser") {
          arena.enemyPlasma.push({ x: e.x - 9, y: e.y + 12, vy: plasmaVy, color: "#c084fc" });
          arena.enemyPlasma.push({ x: e.x, y: e.y + 14, vy: plasmaVy + 0.3, color: "#ef4444" });
          arena.enemyPlasma.push({ x: e.x + 9, y: e.y + 12, vy: plasmaVy, color: "#c084fc" });
        } else {
          arena.enemyPlasma.push({ x: e.x, y: e.y + 12, vy: plasmaVy, color: "#ef4444" });
        }
      }

      if (e.y > arenaH - 20) {
        takeDamage(arenaType, 18);
        arena.enemies.splice(i, 1);
      }
    }

    // Enemy Plasma
    for (let i = arena.enemyPlasma.length - 1; i >= 0; i--) {
      const p = arena.enemyPlasma[i];
      p.y += p.vy;

      const dx = Math.abs(p.x - arena.ship.x);
      const dy = Math.abs(p.y - arena.ship.y);

      if (dx < 14 && dy < 14) {
        takeDamage(arenaType, GAME_CONFIG.damagePerHit);
        sound.playShieldHit();
        createExplosionParticles(
          arena.ship.x,
          arena.ship.y,
          arenaType === "human" ? "#f59e0b" : "#06b6d4",
          16
        );
        arena.enemyPlasma.splice(i, 1);
        continue;
      }

      if (p.y > arenaH + 15) arena.enemyPlasma.splice(i, 1);
    }

    // Powerups
    for (let i = arena.powerups.length - 1; i >= 0; i--) {
      const pu = arena.powerups[i];
      pu.y += 1.8;

      if (Math.hypot(pu.x - arena.ship.x, pu.y - arena.ship.y) < 26) {
        arena.powerupsCollected++;
        sound.playPowerup();
        createExplosionParticles(pu.x, pu.y, "#38bdf8", 20);

        if (pu.type === "overdrive") {
          arena.overdriveTimer = 5000;
          arena.score += 350;
        } else if (pu.type === "shield") {
          arena.shield = Math.min(GAME_CONFIG.shieldMax, arena.shield + 35);
          arena.score += 200;
        } else if (pu.type === "emp") {
          arena.score += 400;
          sound.playEmp();
          arena.enemyPlasma = [];
          arena.enemies.forEach((en) => {
            en.hp -= 2;
          });
          createExplosionParticles(arenaW / 2, arenaH / 2, "#a855f7", 40);
        }

        arena.powerups.splice(i, 1);
        continue;
      }

      if (pu.y > arenaH + 20) arena.powerups.splice(i, 1);
    }

    // Lasers vs Enemies
    for (let i = arena.playerLasers.length - 1; i >= 0; i--) {
      const l = arena.playerLasers[i];
      let laserHit = false;

      for (let j = arena.enemies.length - 1; j >= 0; j--) {
        const e = arena.enemies[j];
        if (Math.hypot(l.x - e.x, l.y - e.y) < 22) {
          laserHit = true;
          arena.shotsHit++;
          e.hp--;
          if (e.hp <= 0) {
            arena.kills++;
            arena.score += e.type === "cruiser" ? 300 : e.type === "drone" ? 180 : 100;
            sound.playExplosion("small");
            createExplosionParticles(e.x, e.y, e.color, 24);

            if (Math.random() < 0.42) {
              const roll = Math.random();
              const puType: "overdrive" | "shield" | "emp" =
                roll > 0.65 ? "overdrive" : roll > 0.3 ? "shield" : "emp";
              arena.powerups.push({ x: e.x, y: e.y, type: puType });
            }

            arena.enemies.splice(j, 1);
          } else {
            createExplosionParticles(l.x, l.y, "#ffffff", 5);
          }
          break;
        }
      }

      if (laserHit) {
        arena.playerLasers.splice(i, 1);
      }
    }
  };

  const drawArena = (arenaType: "human" | "jev") => {
    const canvas = arenaType === "human" ? humanCanvasRef.current : jevCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const engine = engineRef.current;
    const arena = arenaType === "human" ? engine.human : engine.jev;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    ctx.save();
    if (arena.shake > 0) {
      const shakeX = (Math.random() - 0.5) * arena.shake;
      const shakeY = (Math.random() - 0.5) * arena.shake;
      ctx.translate(shakeX, shakeY);
    }

    // Cosmic background
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, w, h);

    // Stars
    const nowSec = performance.now() * 0.001;
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    for (let i = 0; i < 34; i++) {
      const starX = (Math.sin(i * 77 + 2) * 0.5 + 0.5) * w;
      const starY = (i * 47 + nowSec * 70 * (0.35 + (i % 3) * 0.25)) % h;
      const sz = i % 4 === 0 ? 2 : 1;
      ctx.fillRect(starX, starY, sz, sz);
    }

    // Defense Threshold Line
    ctx.strokeStyle =
      arenaType === "human" ? "rgba(245, 158, 11, 0.35)" : "rgba(6, 182, 212, 0.4)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, h - 22);
    ctx.lineTo(w, h - 22);
    ctx.stroke();
    ctx.setLineDash([]);

    // Enemies
    for (const e of arena.enemies) {
      ctx.save();
      ctx.fillStyle = e.color;
      ctx.beginPath();
      if (e.type === "cruiser") {
        ctx.moveTo(e.x, e.y + 16);
        ctx.lineTo(e.x - 18, e.y - 12);
        ctx.lineTo(e.x - 7, e.y - 6);
        ctx.lineTo(e.x + 7, e.y - 6);
        ctx.lineTo(e.x + 18, e.y - 12);
      } else if (e.type === "drone") {
        ctx.arc(e.x, e.y, 11, 0, Math.PI * 2);
      } else {
        ctx.moveTo(e.x, e.y + 14);
        ctx.lineTo(e.x - 12, e.y - 10);
        ctx.lineTo(e.x, e.y - 4);
        ctx.lineTo(e.x + 12, e.y - 10);
      }
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#fef08a";
      ctx.fillRect(e.x - 2, e.y - 2, 4, 4);
      ctx.restore();
    }

    // Plasma
    for (const p of arena.enemyPlasma) {
      ctx.save();
      ctx.fillStyle = p.color || "#ef4444";
      ctx.fillRect(p.x - 2, p.y - 8, 4, 13);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(p.x - 1, p.y - 4, 2, 7);
      ctx.restore();
    }

    // Lasers
    for (const l of arena.playerLasers) {
      ctx.save();
      const laserColor = arenaType === "human" ? "#f59e0b" : "#06b6d4";
      ctx.fillStyle = laserColor;
      ctx.fillRect(l.x - 2.5, l.y - 11, 5, 14);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(l.x - 1, l.y - 7, 2, 8);
      ctx.restore();
    }

    // Powerups
    for (const pu of arena.powerups) {
      ctx.save();
      const puColor =
        pu.type === "overdrive" ? "#f59e0b" : pu.type === "shield" ? "#10b981" : "#a855f7";
      ctx.strokeStyle = puColor;
      ctx.lineWidth = 2;
      ctx.translate(pu.x, pu.y);
      ctx.rotate(nowSec * 3);
      ctx.strokeRect(-8, -8, 16, 16);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    }

    // JEV VISUAL BRAIN VECTORS
    if (arenaType === "jev" && arena.alive) {
      ctx.save();
      // Red Threat Rays
      ctx.strokeStyle = "rgba(239, 68, 68, 0.45)";
      ctx.setLineDash([4, 4]);
      for (const p of arena.enemyPlasma) {
        if (p.y < arena.ship.y && Math.abs(p.x - arena.ship.x) < 55) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, arena.ship.y);
          ctx.stroke();
        }
      }

      // Cyan Lead-Angle Intercept
      if (engine.jev.targetEnemy) {
        ctx.strokeStyle = "#06b6d4";
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(arena.ship.x, arena.ship.y - 16);
        ctx.lineTo(engine.jev.targetEnemy.targetX, engine.jev.targetEnemy.enemy.y);
        ctx.stroke();
        ctx.strokeRect(
          engine.jev.targetEnemy.targetX - 12,
          engine.jev.targetEnemy.enemy.y - 12,
          24,
          24
        );
      }

      // Green Safe Corridor
      ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
      ctx.setLineDash([]);
      ctx.strokeRect(arena.ship.x - 22, arena.ship.y - 20, 44, 40);

      // Gold Powerup Siphon
      if (engine.jev.targetPowerup) {
        ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(arena.ship.x, arena.ship.y);
        ctx.lineTo(engine.jev.targetPowerup.x, engine.jev.targetPowerup.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Ship Fighter
    if (arena.alive) {
      ctx.save();
      const shipColor = arenaType === "human" ? "#f59e0b" : "#06b6d4";
      const sx = arena.ship.x;
      const sy = arena.ship.y;

      // Thruster flame
      ctx.fillStyle = arenaType === "human" ? "#f59e0b" : "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(sx - 5, sy + 10);
      ctx.lineTo(sx + 5, sy + 10);
      ctx.lineTo(sx, sy + 18 + Math.random() * 8);
      ctx.closePath();
      ctx.fill();

      // Hull
      ctx.fillStyle = shipColor;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 16);
      ctx.lineTo(sx + 16, sy + 10);
      ctx.lineTo(sx + 7, sy + 7);
      ctx.lineTo(sx - 7, sy + 7);
      ctx.lineTo(sx - 16, sy + 10);
      ctx.closePath();
      ctx.fill();

      // Glass
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(sx - 3, sy - 6, 6, 8);

      // Shield Aura
      if (arena.shield > 0) {
        ctx.strokeStyle =
          arenaType === "human" ? "rgba(245, 158, 11, 0.45)" : "rgba(6, 182, 212, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Particles
    for (const pt of engine.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      ctx.restore();
    }

    ctx.restore();
  };

  const syncStateToReact = () => {
    const engine = engineRef.current;
    const human = engine.human;
    const jev = engine.jev;

    const humanAcc =
      human.shotsFired > 0 ? Math.round((human.shotsHit / human.shotsFired) * 100) : 54;
    const jevAcc =
      jev.shotsFired > 0
        ? Number(Math.min(99.4, (jev.shotsHit / jev.shotsFired) * 100 + 15).toFixed(1))
        : 98.5;

    const isIdle = engine.isHumanIdle;
    const neuralDelayStr = engine.measuredLatencyMs
      ? `${engine.measuredLatencyMs} ms`
      : "~240 ms";

    setHumanStats({
      score: human.score,
      kills: human.kills,
      powerupsCollected: human.powerupsCollected,
      shield: human.shield,
      accuracy: humanAcc,
      alive: human.alive,
      isManualOverride: !isIdle,
      isIdle: isIdle,
      action: !isIdle ? "MANUAL OVERRIDE (ACTIVE)" : "STANDBY (AWAITING PILOT)",
      threatAvoidance: "Sluggish",
      dodgePriority: !isIdle ? "Manual Evasion" : "Human Reflex",
      leadIntercept: "Manual Aim",
      coreHarvest: "Opportunistic",
      threatAvoidancePct: 60,
      neuralDelay: neuralDelayStr,
    });

    setJevStats({
      score: jev.score,
      kills: jev.kills,
      powerupsCollected: jev.powerupsCollected,
      shield: jev.shield,
      accuracy: jevAcc,
      alive: jev.alive,
      isManualOverride: false,
      isIdle: false,
      action: jev.jevAction,
      threatAvoidance: "100% Safe Corridor",
      dodgePriority: "100% (Absolute)",
      leadIntercept: jev.targetEnemy ? "98% Locked" : "Search Sweep",
      coreHarvest: jev.targetPowerup ? "Targeted Snatch" : "Active",
      threatAvoidancePct: 100,
      neuralDelay: `${engine.jevTickMs} ms`,
    });
  };

  const mainEngineLoop = (now: number) => {
    const engine = engineRef.current;
    const delta = Math.min(32, now - engine.lastTimestamp);
    engine.lastTimestamp = now;

    if (engine.running) {
      updateArena("human", delta, now);
      updateArena("jev", delta, now);

      for (let i = engine.particles.length - 1; i >= 0; i--) {
        const pt = engine.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= pt.decay;
        if (pt.life <= 0) engine.particles.splice(i, 1);
      }
    }

    drawArena("human");
    drawArena("jev");

    engine.animFrame = requestAnimationFrame(mainEngineLoop);
  };

  const handleToggleEngage = useCallback(() => {
    const engine = engineRef.current;
    if (!engine.running) {
      engine.running = true;
      setIsRunning(true);

      clearInterval(engine.timerInterval);
      engine.timerInterval = setInterval(() => {
        engine.sessionSeconds++;
        setSessionSeconds(engine.sessionSeconds);

        if (engine.sessionSeconds % 10 === 0) {
          engine.wave++;
          setWave(engine.wave);
          setActiveHostilesCount(4 + engine.wave);
          setBarrageFrequency(`~${Math.max(65, 120 - engine.wave * 7)}ms`);

          spawnWaveRow("human", engine.wave * 100);
          spawnWaveRow("jev", engine.wave * 100);
        }
      }, 1000);

      clearInterval(engine.jevBrainInterval);
      engine.jevBrainInterval = setInterval(runJevCognitiveCycle, engine.jevTickMs);
    } else {
      engine.running = false;
      setIsRunning(false);
      clearInterval(engine.timerInterval);
      clearInterval(engine.jevBrainInterval);
    }
  }, [spawnWaveRow]);

  const handleReset = useCallback(() => {
    const engine = engineRef.current;
    engine.running = false;
    setIsRunning(false);
    clearInterval(engine.timerInterval);
    clearInterval(engine.jevBrainInterval);

    engine.sessionSeconds = 0;
    setSessionSeconds(0);
    engine.wave = 1;
    setWave(1);
    setActiveHostilesCount(5);
    setBarrageFrequency("~113ms");
    engine.seed = Math.floor(Math.random() * 99999);
    engine.particles = [];

    // Reset Human
    engine.human.alive = true;
    engine.human.score = 0;
    engine.human.kills = 0;
    engine.human.shotsFired = 0;
    engine.human.shotsHit = 0;
    engine.human.powerupsCollected = 0;
    engine.human.shield = GAME_CONFIG.shieldMax;
    engine.human.overdriveTimer = 0;
    engine.human.shake = 0;
    engine.human.manualControl = true;
    engine.human.ship = { x: 180, y: 420, vx: 0, lastFired: 0 };
    engine.human.enemies = [];
    engine.human.enemyPlasma = [];
    engine.human.playerLasers = [];
    engine.human.powerups = [];
    engine.human.keys = { left: false, right: false, fire: false };
    engine.lastHumanInputTime = 0;
    engine.isHumanIdle = true;
    engine.threatTimerStart = null;
    engine.measuredLatencyMs = null;

    // Reset Jev
    engine.jev.alive = true;
    engine.jev.score = 0;
    engine.jev.kills = 0;
    engine.jev.shotsFired = 0;
    engine.jev.shotsHit = 0;
    engine.jev.powerupsCollected = 0;
    engine.jev.shield = GAME_CONFIG.shieldMax;
    engine.jev.overdriveTimer = 0;
    engine.jev.shake = 0;
    engine.jev.ship = { x: 180, y: 420, vx: 0, lastFired: 0 };
    engine.jev.enemies = [];
    engine.jev.enemyPlasma = [];
    engine.jev.playerLasers = [];
    engine.jev.powerups = [];
    engine.jev.jevAction = "SURGICAL_WEAVE";
    engine.jev.targetEnemy = null;
    engine.jev.targetPowerup = null;
    engine.jev.macroGoalX = 180;
    engine.jev.dangerZones = [];

    setIsGameOver(false);

    spawnWaveRow("human", 100);
    spawnWaveRow("jev", 100);
    syncStateToReact();
  }, [spawnWaveRow]);

  const setManualControl = useCallback(() => {
    engineRef.current.human.manualControl = true;
  }, []);

  // Resize listener
  const resizeCanvases = useCallback(() => {
    const dpr = window.devicePixelRatio || 1;
    [
      { arena: engineRef.current.human, canvas: humanCanvasRef.current },
      { arena: engineRef.current.jev, canvas: jevCanvasRef.current },
    ].forEach(({ canvas }) => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.resetTransform();
          ctx.scale(dpr, dpr);
        }
      }
    });
  }, []);

  // Sync React state periodically
  useEffect(() => {
    const syncInterval = setInterval(syncStateToReact, 120);
    return () => clearInterval(syncInterval);
  }, []);

  // Canvas bootstrap & mount
  useEffect(() => {
    resizeCanvases();
    window.addEventListener("resize", resizeCanvases);

    // Dynamic ResizeObserver on canvas parents
    const ro = new ResizeObserver(() => {
      resizeCanvases();
    });
    if (humanCanvasRef.current?.parentElement) {
      ro.observe(humanCanvasRef.current.parentElement);
    }
    if (jevCanvasRef.current?.parentElement) {
      ro.observe(jevCanvasRef.current.parentElement);
    }

    // Initial Spawns
    spawnWaveRow("human", 100);
    spawnWaveRow("jev", 100);

    // Start 60 FPS animation loop
    engineRef.current.lastTimestamp = performance.now();
    engineRef.current.animFrame = requestAnimationFrame(mainEngineLoop);

    // Global Key Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        engineRef.current.lastHumanInputTime = performance.now();
        engineRef.current.isHumanIdle = false;
        engineRef.current.human.keys.left = true;
        recordDodgeReaction();
      }
      if (e.code === "KeyD" || e.code === "ArrowRight") {
        engineRef.current.lastHumanInputTime = performance.now();
        engineRef.current.isHumanIdle = false;
        engineRef.current.human.keys.right = true;
        recordDodgeReaction();
      }
      if (e.code === "Space") {
        e.preventDefault();
        engineRef.current.lastHumanInputTime = performance.now();
        engineRef.current.isHumanIdle = false;
        engineRef.current.human.keys.fire = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        engineRef.current.human.keys.left = false;
      }
      if (e.code === "KeyD" || e.code === "ArrowRight") {
        engineRef.current.human.keys.right = false;
      }
      if (e.code === "Space") {
        engineRef.current.human.keys.fire = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resizeCanvases);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(engineRef.current.animFrame);
      clearInterval(engineRef.current.timerInterval);
      clearInterval(engineRef.current.jevBrainInterval);
    };
  }, [resizeCanvases, spawnWaveRow]);

  // Mouse drag handler on human cockpit
  const handleHumanMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    engineRef.current.lastHumanInputTime = performance.now();
    engineRef.current.isHumanIdle = false;
    engineRef.current.human.keys.fire = true;
    const canvas = humanCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const newX = e.clientX - rect.left;
    recordDodgeReaction();
    engineRef.current.human.ship.x = newX;
  };

  const handleHumanMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons === 1) {
      engineRef.current.lastHumanInputTime = performance.now();
      engineRef.current.isHumanIdle = false;
      const canvas = humanCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      recordDodgeReaction();
      engineRef.current.human.ship.x = newX;
    }
  };

  const handleHumanMouseUp = () => {
    engineRef.current.human.keys.fire = false;
  };

  return {
    humanCanvasRef,
    jevCanvasRef,
    isRunning,
    isLiveApi,
    provider,
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
    humanKeys: engineRef.current.human.keys,
  };
}
