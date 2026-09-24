"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bullet,
  Hostile,
  Powerup,
  Particle,
  Shockwave,
  ShipState,
  JevDecisionData,
  GameStatus,
  WaveBannerState,
  WAVE_OPERATIONS,
} from "@/types/game";
import { sound } from "@/lib/audio";

export interface RaycastVectors {
  threatCones: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    threatLevel: number;
  }>;
  leadAngleVector: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    targetId: string;
    distance: number;
  } | null;
  harvestCorridor: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null;
}


interface UseGameLoopProps {
  requestJevDecision: (
    playerX: number,
    playerY: number,
    cockpitWidth: number,
    bullets: Bullet[],
    hostiles: Hostile[],
    powerups: Powerup[],
    currentWave: number
  ) => Promise<JevDecisionData>;
  canvasWidth: number;
  canvasHeight: number;
}

export function useGameLoop({
  requestJevDecision,
  canvasWidth = 600,
  canvasHeight = 560,
}: UseGameLoopProps) {
  // Game lifecycle status (starts in "READY" state)
  const [gameStatus, setGameStatus] = useState<GameStatus>("READY");
  const [wave, setWave] = useState<number>(1);
  const [winner, setWinner] = useState<"HUMAN" | "JEV" | "DRAW" | null>(null);
  const [waveBanner, setWaveBanner] = useState<WaveBannerState>({
    mode: "COMPACT",
    text: "",
    wave: 1,
  });

  const waveRef = useRef<number>(1);
  const waveBannerRef = useRef<WaveBannerState>({
    mode: "COMPACT",
    text: "",
    wave: 1,
  });

  const updateWaveBanner = useCallback((banner: WaveBannerState) => {
    waveBannerRef.current = banner;
    setWaveBanner(banner);
  }, []);

  const updateWave = useCallback((newWave: number) => {
    waveRef.current = newWave;
    setWave(newWave);
  }, []);

  // Throttled stats for HUD
  const [humanStats, setHumanStats] = useState<ShipState>({
    x: 300,
    y: 500,
    vx: 0,
    hp: 100,
    maxHp: 100,
    shield: 100,
    score: 0,
    rapidFireTimer: 0,
    invulnerableTimer: 0,
    lastDecision: "STANDBY",
    reactionLatencyMs: 0,
    dodges: 0,
    shotsFired: 0,
    shotsHit: 0,
    isManualOverride: false,
  });

  const [jevStats, setJevStats] = useState<ShipState>({
    x: 300,
    y: 500,
    vx: 0,
    hp: 100,
    maxHp: 100,
    shield: 100,
    score: 0,
    rapidFireTimer: 0,
    invulnerableTimer: 0,
    lastDecision: "FIRE_ALIGN",
    reactionLatencyMs: 100,
    dodges: 0,
    shotsFired: 0,
    shotsHit: 0,
    isManualOverride: false,
  });

  const [humanAPM, setHumanAPM] = useState<number>(0);
  const [jevAPM, setJevAPM] = useState<number>(560);
  const [decisionCadence, setDecisionCadence] = useState<number>(100);
  const [cognitiveTelemetry, setCognitiveTelemetry] = useState<{
    threatAvoidance: string;
    dodgePriority: string;
    leadIntercept: string;
    coreHarvest: string;
  }>({
    threatAvoidance: "100% Safe Corridor",
    dodgePriority: "100% (Absolute)",
    leadIntercept: "0% Locked",
    coreHarvest: "Active",
  });

  const [raycasts, setRaycasts] = useState<RaycastVectors>({
    threatCones: [],
    leadAngleVector: null,
    harvestCorridor: null,
  });

  // Cockpit 1 (Human) Independent Simulation Refs
  const humanShipRef = useRef<ShipState>({ ...humanStats });
  const humanBulletsRef = useRef<Bullet[]>([]);
  const humanHostilesRef = useRef<Hostile[]>([]);
  const humanPowerupsRef = useRef<Powerup[]>([]);
  const humanParticlesRef = useRef<Particle[]>([]);
  const humanShockwavesRef = useRef<Shockwave[]>([]);

  // Cockpit 2 (Jev AI) Independent Simulation Refs
  const jevShipRef = useRef<ShipState>({ ...jevStats });
  const jevBulletsRef = useRef<Bullet[]>([]);
  const jevHostilesRef = useRef<Hostile[]>([]);
  const jevPowerupsRef = useRef<Powerup[]>([]);
  const jevParticlesRef = useRef<Particle[]>([]);
  const jevShockwavesRef = useRef<Shockwave[]>([]);

  // Input states strictly isolated to Cockpit 1
  const humanInputRef = useRef<{ left: boolean; right: boolean; fire: boolean }>({
    left: false,
    right: false,
    fire: false,
  });
  const humanMouseRef = useRef<{ x: number | null; isDown: boolean }>({
    x: null,
    isDown: false,
  });

  // Biological human pilot model refs (when manual override inactive)
  const bioTargetX = useRef<number>(300);
  const lastBioDecisionTime = useRef<number>(0);

  // Firing and timing refs
  const lastHumanShotTime = useRef<number>(0);
  const lastJevShotTime = useRef<number>(0);
  const lastJevPollTime = useRef<number>(0);
  const lastHudUpdateTime = useRef<number>(0);
  const humanActionCounter = useRef<number>(0);
  const jevActionCounter = useRef<number>(0);
  const waveClearingTimer = useRef<number>(0);
  const bannerTimerRef = useRef<number>(0);
  const isTransitioningWave = useRef<boolean>(false);
  const animFrameId = useRef<number | null>(null);

  // Parallax Starfields
  const starsRef = useRef<
    Array<{ x: number; y: number; speed: number; size: number; alpha: number; color?: string }>
  >([]);

  useEffect(() => {
    const stars: Array<{ x: number; y: number; speed: number; size: number; alpha: number; color?: string }> = [];
    for (let i = 0; i < 110; i++) {
      const isCyan = Math.random() > 0.85;
      stars.push({
        x: Math.random() * 1200,
        y: Math.random() * 900,
        speed: 0.3 + Math.random() * 2.0,
        size: Math.random() * 2.2 + 0.6,
        alpha: 0.25 + Math.random() * 0.75,
        color: isCyan ? "#00f0ff" : "#e2e8f0",
      });
    }
    starsRef.current = stars;
  }, []);

  // Synchronize ship Y anchor at canvasHeight - 65
  useEffect(() => {
    const yAnchor = canvasHeight - 65;
    humanShipRef.current.y = yAnchor;
    jevShipRef.current.y = yAnchor;
  }, [canvasHeight]);

  // Generate 6-Wave Manifest Enemies
  const generateWaveEnemies = useCallback((waveNum: number, width: number): Hostile[] => {
    const enemies: Hostile[] = [];

    switch (waveNum) {
      case 1: {
        // Wave 1 (OP: RECON SWARM): 5 Scout Darts (moderate descent, single laser pulses)
        const count = 5;
        const spacing = (width - 120) / (count - 1);
        for (let i = 0; i < count; i++) {
          enemies.push({
            id: `h-w1-${i}-${Date.now()}-${Math.random()}`,
            x: 60 + i * spacing,
            y: 65 + (i % 2) * 25,
            vx: (i % 2 === 0 ? 1 : -1) * 1.4,
            vy: 0.16, // moderate descent
            hp: 40,
            maxHp: 40,
            width: 32,
            height: 24,
            type: "scout",
            attackTimer: 55 + Math.random() * 45, // single laser pulses
            strafeAngle: 0,
          });
        }
        break;
      }
      case 2: {
        // Wave 2 (OP: INFILTRATION SQUAD): 6 Darts + 3 Drones (drone zig-zagging, fire interval: 600ms)
        const dartCount = 6;
        const dartSpacing = (width - 110) / (dartCount - 1);
        for (let i = 0; i < dartCount; i++) {
          enemies.push({
            id: `h-w2-dart-${i}-${Date.now()}-${Math.random()}`,
            x: 55 + i * dartSpacing,
            y: 55 + (i % 2) * 25,
            vx: (i % 2 === 0 ? 1 : -1) * 1.8,
            vy: 0.18,
            hp: 45,
            maxHp: 45,
            width: 32,
            height: 24,
            type: "scout",
            attackTimer: 45 + Math.random() * 40,
            strafeAngle: 0,
          });
        }
        // 3 Drones (zig-zagging, 600ms fire interval)
        const dronePositions = [width * 0.25, width * 0.5, width * 0.75];
        for (let i = 0; i < 3; i++) {
          enemies.push({
            id: `h-w2-drone-${i}-${Date.now()}-${Math.random()}`,
            x: dronePositions[i],
            y: 110,
            vx: (i % 2 === 0 ? 1 : -1) * 2.2,
            vy: 0.26,
            hp: 55,
            maxHp: 55,
            width: 28,
            height: 28,
            type: "drone",
            attackTimer: 36, // 600ms fire interval (~36 frames at 60fps)
            strafeAngle: Math.random() * Math.PI * 2,
          });
        }
        break;
      }
      case 3: {
        // Wave 3 (OP: HEAVY CORVETTE FLIGHT): 4 Armored Gunships firing angled dual-spread plasma (fire interval: 450ms)
        const count = 4;
        const spacing = (width - 130) / (count - 1);
        for (let i = 0; i < count; i++) {
          enemies.push({
            id: `h-w3-gunship-${i}-${Date.now()}-${Math.random()}`,
            x: 65 + i * spacing,
            y: 70 + (i % 2) * 35,
            vx: (i % 2 === 0 ? 1 : -1) * 1.5,
            vy: 0.14,
            hp: 95,
            maxHp: 95,
            width: 54,
            height: 36,
            type: "cruiser",
            attackTimer: 27, // 450ms fire interval (~27 frames)
            strafeAngle: Math.random() * Math.PI,
          });
        }
        break;
      }
      case 4: {
        // Wave 4 (OP: DENSE BULLET HELL): 8 mixed hostiles + continuous crossfire barrages (fire interval: 280ms)
        const count = 8;
        const spacing = (width - 110) / (count - 1);
        for (let i = 0; i < count; i++) {
          const isGunship = i === 1 || i === 3 || i === 4 || i === 6;
          const isDrone = i === 0 || i === 7;
          const type: Hostile["type"] = isGunship ? "cruiser" : isDrone ? "drone" : "scout";
          enemies.push({
            id: `h-w4-${i}-${Date.now()}-${Math.random()}`,
            x: 55 + i * spacing,
            y: 60 + (i % 3) * 35,
            vx: (i % 2 === 0 ? 1 : -1) * (isGunship ? 1.8 : 2.4),
            vy: 0.18,
            hp: isGunship ? 110 : isDrone ? 60 : 50,
            maxHp: isGunship ? 110 : isDrone ? 60 : 50,
            width: isGunship ? 54 : isDrone ? 28 : 32,
            height: isGunship ? 36 : isDrone ? 28 : 24,
            type,
            attackTimer: 17, // 280ms fire interval (~17 frames)
            strafeAngle: Math.random() * Math.PI * 2,
          });
        }
        break;
      }
      case 5: {
        // Wave 5 (OP: DREADNOUGHT ASSAULT): 1 Large Armored Dreadnought with 120 HP, rotating shield barriers, triple spread turrets, plus 2 escort darts
        enemies.push({
          id: `h-w5-dreadnought-${Date.now()}`,
          x: width / 2,
          y: 80,
          vx: 1.5,
          vy: 0.08,
          hp: 120, // 120 HP specified
          maxHp: 120,
          width: 88,
          height: 52,
          type: "dreadnought",
          attackTimer: 20, // triple spread turrets
          strafeAngle: 0,
        });

        // 2 Escort Darts
        enemies.push({
          id: `h-w5-escort-1-${Date.now()}`,
          x: width * 0.28,
          y: 130,
          vx: -2.0,
          vy: 0.15,
          hp: 50,
          maxHp: 50,
          width: 32,
          height: 24,
          type: "scout",
          attackTimer: 40,
        });
        enemies.push({
          id: `h-w5-escort-2-${Date.now()}`,
          x: width * 0.72,
          y: 130,
          vx: 2.0,
          vy: 0.15,
          hp: 50,
          maxHp: 50,
          width: 32,
          height: 24,
          type: "scout",
          attackTimer: 40,
        });
        break;
      }
      case 6:
      default: {
        // Wave 6 (OP: SINGULARITY CRITICAL OVERDRIVE): Ultra-dense particle stream (~100ms projectile pulses)
        enemies.push({
          id: `h-w6-dread-1-${Date.now()}`,
          x: width * 0.32,
          y: 75,
          vx: 1.6,
          vy: 0.08,
          hp: 140,
          maxHp: 140,
          width: 88,
          height: 52,
          type: "dreadnought",
          attackTimer: 6, // ~100ms pulses (6 frames)
        });
        enemies.push({
          id: `h-w6-dread-2-${Date.now()}`,
          x: width * 0.68,
          y: 75,
          vx: -1.6,
          vy: 0.08,
          hp: 140,
          maxHp: 140,
          width: 88,
          height: 52,
          type: "dreadnought",
          attackTimer: 9, // staggered ~100ms pulses
        });
        for (let i = 0; i < 3; i++) {
          enemies.push({
            id: `h-w6-gunship-${i}-${Date.now()}`,
            x: 75 + i * ((width - 150) / 2),
            y: 135,
            vx: (i % 2 === 0 ? 1 : -1) * 1.8,
            vy: 0.12,
            hp: 90,
            maxHp: 90,
            width: 54,
            height: 36,
            type: "cruiser",
            attackTimer: 6 + i * 2, // ~100ms stream
          });
        }
        for (let i = 0; i < 3; i++) {
          enemies.push({
            id: `h-w6-dart-${i}-${Date.now()}`,
            x: 70 + i * ((width - 140) / 2),
            y: 185,
            vx: (i % 2 === 0 ? 1 : -1) * 2.4,
            vy: 0.18,
            hp: 50,
            maxHp: 50,
            width: 32,
            height: 24,
            type: "scout",
            attackTimer: 7 + i * 2, // ~100ms stream
          });
        }
        break;
      }
    }

    return enemies;
  }, []);

  // Spawn visual shockwave
  const addShockwave = (shockwavesRef: React.MutableRefObject<Shockwave[]>, x: number, y: number, color: string, maxRadius: number = 42) => {
    shockwavesRef.current.push({
      id: `sw-${Date.now()}-${Math.random()}`,
      x,
      y,
      radius: 4,
      maxRadius,
      color,
      lineWidth: 2.5,
      life: 1.0,
    });
  };

  // Spawn visual explosion particles
  const addExplosion = (
    particlesRef: React.MutableRefObject<Particle[]>,
    shockwavesRef: React.MutableRefObject<Shockwave[]>,
    x: number,
    y: number,
    color: string,
    count: number = 18
  ) => {
    addShockwave(shockwavesRef, x, y, color);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const speed = 1.5 + Math.random() * 4.2;
      particlesRef.current.push({
        id: `pt-${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 22 + Math.random() * 26,
        color,
        size: 2 + Math.random() * 3.5,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        trail: true,
      });
    }
  };

  // Spawn powerup core
  const addPowerup = (powerupsRef: React.MutableRefObject<Powerup[]>, x: number, y: number) => {
    const types: Powerup["type"][] = ["OVERDRIVE", "SHIELD", "CORE"];
    const type = types[Math.floor(Math.random() * types.length)];
    powerupsRef.current.push({
      id: `p-${Date.now()}-${Math.random()}`,
      x,
      y,
      vy: 1.5,
      type,
      size: 15,
      rotation: 0,
    });
  };

  // Deploy a specific wave to both Cockpit 1 and Cockpit 2 independently
  const deployWave = useCallback(
    (waveNum: number, width: number) => {
      const fleet = generateWaveEnemies(waveNum, width);
      humanHostilesRef.current = JSON.parse(JSON.stringify(fleet));
      jevHostilesRef.current = JSON.parse(JSON.stringify(fleet));
      isTransitioningWave.current = false;
      waveClearingTimer.current = 0;
    },
    [generateWaveEnemies]
  );

  // Start the mission from the launch screen
  const startSimulation = useCallback(() => {
    sound.playPowerup();

    // Clear all projectiles & particles
    humanBulletsRef.current = [];
    jevBulletsRef.current = [];
    humanPowerupsRef.current = [];
    jevPowerupsRef.current = [];
    humanParticlesRef.current = [];
    jevParticlesRef.current = [];
    humanShockwavesRef.current = [];
    jevShockwavesRef.current = [];

    // Reset human inputs
    humanInputRef.current = { left: false, right: false, fire: false };
    humanMouseRef.current = { x: null, isDown: false };

    const initialY = canvasHeight - 65;
    humanShipRef.current = {
      x: canvasWidth / 2,
      y: initialY,
      vx: 0,
      hp: 100,
      maxHp: 100,
      shield: 100,
      score: 0,
      rapidFireTimer: 0,
      invulnerableTimer: 0,
      lastDecision: "IDLE",
      reactionLatencyMs: 0,
      dodges: 0,
      shotsFired: 0,
      shotsHit: 0,
      isManualOverride: false,
    };

    jevShipRef.current = {
      x: canvasWidth / 2,
      y: initialY,
      vx: 0,
      hp: 100,
      maxHp: 100,
      shield: 100,
      score: 0,
      rapidFireTimer: 0,
      invulnerableTimer: 0,
      lastDecision: "FIRE_ALIGN",
      reactionLatencyMs: 100,
      dodges: 0,
      shotsFired: 0,
      shotsHit: 0,
      isManualOverride: false,
    };

    updateWave(1);
    setWinner(null);
    bannerTimerRef.current = 0;
    updateWaveBanner({
      mode: "OPERATION",
      text: WAVE_OPERATIONS[1],
      wave: 1,
    });
    setGameStatus("RUNNING");
    deployWave(1, canvasWidth);
  }, [canvasWidth, canvasHeight, deployWave, updateWave, updateWaveBanner]);

  // Restart / Reset Button: strictly resets wave to 1, scores to 0, shields to 100%, clears all entities, returns human ship to center
  const resetSimulation = useCallback(() => {
    humanBulletsRef.current = [];
    jevBulletsRef.current = [];
    humanHostilesRef.current = [];
    jevHostilesRef.current = [];
    humanPowerupsRef.current = [];
    jevPowerupsRef.current = [];
    humanParticlesRef.current = [];
    jevParticlesRef.current = [];
    humanShockwavesRef.current = [];
    jevShockwavesRef.current = [];

    humanInputRef.current = { left: false, right: false, fire: false };
    humanMouseRef.current = { x: null, isDown: false };
    isTransitioningWave.current = false;
    waveClearingTimer.current = 0;

    const initialY = canvasHeight - 65;
    const freshHuman = {
      x: canvasWidth / 2,
      y: initialY,
      vx: 0,
      hp: 100,
      maxHp: 100,
      shield: 100,
      score: 0,
      rapidFireTimer: 0,
      invulnerableTimer: 0,
      lastDecision: "IDLE",
      reactionLatencyMs: 0,
      dodges: 0,
      shotsFired: 0,
      shotsHit: 0,
      isManualOverride: false,
    };

    const freshJev = {
      x: canvasWidth / 2,
      y: initialY,
      vx: 0,
      hp: 100,
      maxHp: 100,
      shield: 100,
      score: 0,
      rapidFireTimer: 0,
      invulnerableTimer: 0,
      lastDecision: "STANDBY",
      reactionLatencyMs: 100,
      dodges: 0,
      shotsFired: 0,
      shotsHit: 0,
      isManualOverride: false,
    };

    humanShipRef.current = freshHuman;
    jevShipRef.current = freshJev;
    setHumanStats(freshHuman);
    setJevStats(freshJev);
    updateWave(1);
    setWinner(null);
    bannerTimerRef.current = 0;
    updateWaveBanner({
      mode: "COMPACT",
      text: "",
      wave: 1,
    });
    setGameStatus("READY"); // Return to initial launch briefing modal
  }, [canvasWidth, canvasHeight, updateWave, updateWaveBanner]);

  // Keyboard listeners strictly isolated to Human Pilot (Cockpit 1 ONLY)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        humanInputRef.current.left = true;
      }
      if (e.code === "KeyD" || e.code === "ArrowRight") {
        humanInputRef.current.right = true;
      }
      if (e.code === "Space") {
        e.preventDefault();
        humanInputRef.current.fire = true;
      }
      if (e.code === "KeyM") {
        sound.toggleMute();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        humanInputRef.current.left = false;
      }
      if (e.code === "KeyD" || e.code === "ArrowRight") {
        humanInputRef.current.right = false;
      }
      if (e.code === "Space") {
        humanInputRef.current.fire = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Mouse handlers strictly isolated to Cockpit 1
  const handleHumanCanvasMouseMove = useCallback((x: number) => {
    humanMouseRef.current.x = x;
  }, []);

  const handleHumanCanvasMouseDown = useCallback(() => {
    humanMouseRef.current.isDown = true;
  }, []);

  const handleHumanCanvasMouseUp = useCallback(() => {
    humanMouseRef.current.isDown = false;
  }, []);

  const handleHumanCanvasMouseLeave = useCallback(() => {
    humanMouseRef.current.x = null;
    humanMouseRef.current.isDown = false;
  }, []);

  // Main 60fps Game Animation Loop
  useEffect(() => {
    let lastFrameTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastFrameTime) / 1000, 0.05);
      lastFrameTime = currentTime;

      // 1. Starfield parallax background always scrolls
      for (const star of starsRef.current) {
        star.y += star.speed;
        if (star.y > canvasHeight) {
          star.y = 0;
          star.x = Math.random() * canvasWidth;
        }
      }

      // If not running, keep rendering stars and exit game physics
      if (gameStatus !== "RUNNING") {
        animFrameId.current = requestAnimationFrame(loop);
        return;
      }

      const playerY = canvasHeight - 65;
      humanShipRef.current.y = playerY;
      jevShipRef.current.y = playerY;

      // ==========================================
      // 2. COCKPIT 1: HUMAN PILOT (DIRECT OR BIO-DEGRADATION MODEL)
      // ==========================================
      const hShip = humanShipRef.current;
      const keys = humanInputRef.current;
      const mouse = humanMouseRef.current;

      const isActivelyMoving = keys.left || keys.right || mouse.x !== null;
      const isActivelyFiring = keys.fire || mouse.isDown;
      hShip.isManualOverride = isActivelyMoving || isActivelyFiring;

      if (hShip.isManualOverride) {
        // Direct Manual Override (Instant 1:1 responsive pilot input)
        hShip.reactionLatencyMs = 0;
        if (mouse.x !== null) {
          hShip.x += (mouse.x - hShip.x) * 0.26;
          hShip.vx = 0;
          humanActionCounter.current += 1;
        } else if (keys.left) {
          hShip.x -= 7.5;
          hShip.vx = -7.5;
          humanActionCounter.current += 1;
        } else if (keys.right) {
          hShip.x += 7.5;
          hShip.vx = 7.5;
          humanActionCounter.current += 1;
        } else {
          hShip.vx = 0;
        }

        if (isActivelyFiring && currentTime - lastHumanShotTime.current >= 160) {
          lastHumanShotTime.current = currentTime;
          const cannonY = hShip.y - 15;
          humanBulletsRef.current.push({
            id: `b-hum-L-${currentTime}`,
            x: hShip.x - 12,
            y: cannonY,
            vx: 0,
            vy: -9.5,
            isHostile: false,
            color: "#00f0ff",
            size: 3.5,
          });
          humanBulletsRef.current.push({
            id: `b-hum-R-${currentTime}`,
            x: hShip.x + 12,
            y: cannonY,
            vx: 0,
            vy: -9.5,
            isHostile: false,
            color: "#00f0ff",
            size: 3.5,
          });
          hShip.shotsFired += 2;
          humanActionCounter.current += 2;
          sound.playLaser(820, 0.08);
        }
      } else {
        // Human Biological Degradation Engine (~240ms baseline, deteriorating on Waves 3-6)
        const bioDelay = 240 + Math.max(0, (wave - 2) * 45); // Waves 3-6 degrade latency up to ~420ms
        hShip.reactionLatencyMs = Math.round(bioDelay);

        if (currentTime - lastBioDecisionTime.current >= bioDelay) {
          lastBioDecisionTime.current = currentTime;

          // Search for nearest incoming hostile projectile in human cockpit
          let threat: Bullet | null = null;
          let threatDist = 130;
          for (const b of humanBulletsRef.current) {
            if (b.isHostile && b.y < hShip.y && hShip.y - b.y < threatDist) {
              threatDist = hShip.y - b.y;
              threat = b;
            }
          }

          if (threat && Math.abs(threat.x - hShip.x) < 36) {
            // Saccadic latency error rate under wave stress
            const failureChance = Math.min(0.7, (wave - 1) * 0.14);
            if (Math.random() > failureChance) {
              const evadeDir = threat.x <= hShip.x ? 1 : -1;
              const jitter = (Math.random() - 0.5) * 8;
              bioTargetX.current = Math.max(36, Math.min(canvasWidth - 36, hShip.x + evadeDir * 40 + jitter));
            }
          } else if (humanHostilesRef.current.length > 0) {
            const tgt = humanHostilesRef.current[0];
            bioTargetX.current = tgt.x + (Math.random() - 0.5) * 16;
          }
        }

        const bioDx = bioTargetX.current - hShip.x;
        if (Math.abs(bioDx) > 3) {
          hShip.vx = Math.sign(bioDx) * Math.min(4.8, Math.abs(bioDx));
          hShip.x += hShip.vx;
        }

        if (currentTime - lastHumanShotTime.current >= 220 && humanHostilesRef.current.length > 0) {
          lastHumanShotTime.current = currentTime;
          const cannonY = hShip.y - 15;
          humanBulletsRef.current.push({
            id: `b-hum-L-${currentTime}`,
            x: hShip.x - 12,
            y: cannonY,
            vx: 0,
            vy: -9.5,
            isHostile: false,
            color: "#00f0ff",
            size: 3.5,
          });
          humanBulletsRef.current.push({
            id: `b-hum-R-${currentTime}`,
            x: hShip.x + 12,
            y: cannonY,
            vx: 0,
            vy: -9.5,
            isHostile: false,
            color: "#00f0ff",
            size: 3.5,
          });
          hShip.shotsFired += 2;
          humanActionCounter.current += 1;
        }
      }
      hShip.x = Math.max(36, Math.min(canvasWidth - 36, hShip.x));

      // ==========================================
      // 3. COCKPIT 2: JEV AI TWO-TIER REACTIVE ENGINE
      // ==========================================
      const jShip = jevShipRef.current;

      // ------------------------------------------
      // TIER 1: Continuous Frame-Level Sub-Pixel Vector Evasion (60 FPS)
      // ------------------------------------------
      let tier1RepulsiveVx = 0;
      let threatCount = 0;
      let leftThreatCount = 0;
      let rightThreatCount = 0;
      let nearestThreatDist = 999;
      let trappedPinchPoint = false;

      for (const b of jevBulletsRef.current) {
        if (!b.isHostile) continue;
        const dy = jShip.y - b.y; // positive when bullet is above Jev
        // Approaching bullet within lethal envelope (95px vertically)
        if (dy >= -10 && dy <= 95 && b.vy > 0) {
          const dx = b.x - jShip.x; // + = bullet to right, - = bullet to left
          const dist = Math.hypot(dx, dy);

          if (dist < 95) {
            threatCount++;
            if (dist < nearestThreatDist) nearestThreatDist = dist;

            // Direct collision risk corridor: ship width half is 26px
            if (Math.abs(dx) < 32) {
              const urgency = (95 - dist) / 95;
              if (dx <= 0) {
                // Bullet on port side: push starboard
                tier1RepulsiveVx += (1.0 + urgency * 1.6) * 8.5;
                leftThreatCount++;
              } else {
                // Bullet on starboard: push port
                tier1RepulsiveVx -= (1.0 + urgency * 1.6) * 8.5;
                rightThreatCount++;
              }
            }
          }
        }
      }

      // Kinetic Flash-Thruster: triggered when Jev is trapped between simultaneous bolts
      if (leftThreatCount > 0 && rightThreatCount > 0) {
        trappedPinchPoint = true;
        const leftClearance = jShip.x - 36;
        const rightClearance = canvasWidth - 36 - jShip.x;
        const burstDir = rightClearance >= leftClearance ? 1 : -1;
        tier1RepulsiveVx = burstDir * 14.0;
        jShip.invulnerableTimer = Math.max(jShip.invulnerableTimer, 12);
        addShockwave(jevShockwavesRef, jShip.x, jShip.y, "#00f0ff", 32);
      }

      const isEvadingThreat = Math.abs(tier1RepulsiveVx) > 0.5;

      // ------------------------------------------
      // TIER 2: Strategic Layer on Decision Cadence (${decisionCadence}ms)
      // ------------------------------------------
      let strategicTarget = jevHostilesRef.current[0] || null;
      let targetAlignmentPercent = 0;

      if (strategicTarget) {
        const leadX = strategicTarget.x + strategicTarget.vx * 6;
        const targetDx = Math.abs(leadX - jShip.x);
        targetAlignmentPercent = Math.max(10, Math.min(100, Math.round(100 - targetDx * 1.8)));
      }

      if (isEvadingThreat) {
        // Tier 1 Evasion has absolute instant authority
        jShip.vx = tier1RepulsiveVx;
        jShip.lastDecision = trappedPinchPoint
          ? "FLASH THRUSTER"
          : tier1RepulsiveVx > 0
          ? "SURGICAL WEAVE R"
          : "SURGICAL WEAVE L";
        jShip.dodges += 1;
      } else {
        // Strategic Weapon Alignment & Powerup Harvesting
        if (jevPowerupsRef.current.length > 0) {
          const core = jevPowerupsRef.current[0];
          const dx = core.x - jShip.x;
          jShip.vx = Math.sign(dx) * Math.min(6.5, Math.abs(dx));
          jShip.lastDecision = "CORE HARVEST";
        } else if (strategicTarget) {
          const leadX = strategicTarget.x + strategicTarget.vx * 6;
          const dx = leadX - jShip.x;
          jShip.vx = Math.sign(dx) * Math.min(6.0, Math.abs(dx));
          jShip.lastDecision = "LEAD-ANGLE INTERCEPT";

          // Precision auto-fire when lead-angle is locked
          if (Math.abs(dx) < 28 && currentTime - lastJevShotTime.current >= 140) {
            lastJevShotTime.current = currentTime;
            const cannonY = jShip.y - 15;
            jevBulletsRef.current.push({
              id: `b-jev-L-${currentTime}`,
              x: jShip.x - 12,
              y: cannonY,
              vx: 0,
              vy: -10.0,
              isHostile: false,
              color: "#00f0ff",
              size: 3.5,
            });
            jevBulletsRef.current.push({
              id: `b-jev-R-${currentTime}`,
              x: jShip.x + 12,
              y: cannonY,
              vx: 0,
              vy: -10.0,
              isHostile: false,
              color: "#00f0ff",
              size: 3.5,
            });
            jShip.shotsFired += 2;
            sound.playLaser(960, 0.08);
          }
        } else {
          jShip.vx *= 0.85;
          jShip.lastDecision = "STANDBY WEAVE";
        }
      }

      // Background AI Gateway / Decision matrix polling at selected cadence
      if (currentTime - lastJevPollTime.current >= decisionCadence) {
        lastJevPollTime.current = currentTime;
        jevActionCounter.current += 1;

        requestJevDecision(
          jShip.x,
          jShip.y,
          canvasWidth,
          jevBulletsRef.current,
          jevHostilesRef.current,
          jevPowerupsRef.current,
          wave
        ).catch(() => {});
      }

      // Apply Jev movement and clamp to arena
      jShip.x += jShip.vx;
      jShip.vx *= 0.88;
      jShip.x = Math.max(36, Math.min(canvasWidth - 36, jShip.x));

      // Decrement invulnerability frame counter
      if (jShip.invulnerableTimer > 0) {
        jShip.invulnerableTimer -= 1;
      }
      if (hShip.invulnerableTimer > 0) {
        hShip.invulnerableTimer -= 1;
      }

      // Live Cognitive Matrix telemetry calculation
      setCognitiveTelemetry({
        threatAvoidance: threatCount > 0 ? `Evading Vectors (${nearestThreatDist < 90 ? (95 - nearestThreatDist).toFixed(0) : 0}px Risk)` : "100% Safe Corridor",
        dodgePriority: isEvadingThreat ? "100% (Absolute)" : "Standby (Tier-1 Ready)",
        leadIntercept: strategicTarget ? `${targetAlignmentPercent}% Locked` : "Active Scan",
        coreHarvest: jevPowerupsRef.current.length > 0 ? "Active (Locked)" : "Active (Searching)",
      });

      // Compute Jev predictive raycasts for HUD
      const threatCones: RaycastVectors["threatCones"] = [];
      for (const b of jevBulletsRef.current) {
        if (b.isHostile && b.y < jShip.y && jShip.y - b.y < 300) {
          const dy = jShip.y - b.y;
          const projectedX = b.x + b.vx * (dy / (b.vy || 1));
          threatCones.push({
            x1: b.x,
            y1: b.y,
            x2: projectedX,
            y2: jShip.y,
            width: 24,
            threatLevel: Math.max(0, 1 - dy / 300),
          });
        }
      }

      let leadAngleVector: RaycastVectors["leadAngleVector"] = null;
      if (jevHostilesRef.current.length > 0) {
        const nearest = jevHostilesRef.current[0];
        leadAngleVector = {
          x1: jShip.x,
          y1: jShip.y - 18,
          x2: nearest.x + nearest.vx * 6,
          y2: nearest.y + nearest.height / 2,
          targetId: nearest.id,
          distance: Math.round(Math.hypot(nearest.x - jShip.x, nearest.y - jShip.y)),
        };
      }

      let harvestCorridor: RaycastVectors["harvestCorridor"] = null;
      if (jevPowerupsRef.current.length > 0) {
        const p = jevPowerupsRef.current[0];
        harvestCorridor = {
          x1: jShip.x,
          y1: jShip.y,
          x2: p.x,
          y2: p.y,
        };
      }
      setRaycasts({ threatCones, leadAngleVector, harvestCorridor });

      // ==========================================
      // 4. HELPER SIMULATION PIPELINE FOR A COCKPIT
      // ==========================================
      const updateCockpitDomain = (
        ship: ShipState,
        bulletsRef: React.MutableRefObject<Bullet[]>,
        hostilesRef: React.MutableRefObject<Hostile[]>,
        powerupsRef: React.MutableRefObject<Powerup[]>,
        particlesRef: React.MutableRefObject<Particle[]>,
        shockwavesRef: React.MutableRefObject<Shockwave[]>
      ) => {
        // (a) Update Hostiles
        for (const h of hostilesRef.current) {
          if (h.type === "scout") {
            h.strafeAngle = (h.strafeAngle || 0) + 0.05;
            h.x += Math.sin(h.strafeAngle) * 3.0;
            h.y += h.vy * 1.3;
          } else if (h.type === "drone") {
            // Drone zig-zagging
            h.strafeAngle = (h.strafeAngle || 0) + 0.12;
            h.x += Math.sin(h.strafeAngle) * 3.5 + Math.sign(ship.x - h.x) * 1.2;
            h.y += h.vy * 1.4;
          } else if (h.type === "dreadnought" || h.type === "mothership") {
            h.x += h.vx;
            if (h.x < 70 || h.x > canvasWidth - 70) h.vx = -h.vx;
            h.y += h.vy;
          } else {
            // Cruiser Gunship
            h.x += h.vx;
            h.y += h.vy;
            if (h.x < 50 || h.x > canvasWidth - 50) h.vx = -h.vx;
          }

          // Bound clamp & bounce (never leave theater)
          if (h.x < 30) h.x = 30;
          if (h.x > canvasWidth - 30) h.x = canvasWidth - 30;
          if (h.y > canvasHeight - 140) h.vy = -Math.abs(h.vy);
          if (h.y < 40) h.vy = Math.abs(h.vy);

          // Enemy Firing with Escalated Combat Intensity
          h.attackTimer -= 1;
          if (h.attackTimer <= 0) {
            const spawnY = h.y + h.height / 2;

            if (h.type === "dreadnought" || h.type === "mothership") {
              // Boss Dreadnought (Wave 5 & 6): Triple spread turrets
              const baseVy = 4.2 + wave * 0.15;
              bulletsRef.current.push({
                id: `b-hostile-L-${Math.random()}`,
                x: h.x - 24,
                y: spawnY,
                vx: -1.4,
                vy: baseVy,
                isHostile: true,
                color: "#ff3366",
                size: 5,
              });
              bulletsRef.current.push({
                id: `b-hostile-C-${Math.random()}`,
                x: h.x,
                y: spawnY,
                vx: 0,
                vy: baseVy + 0.5,
                isHostile: true,
                color: "#ff3366",
                size: 5.5,
              });
              bulletsRef.current.push({
                id: `b-hostile-R-${Math.random()}`,
                x: h.x + 24,
                y: spawnY,
                vx: 1.4,
                vy: baseVy,
                isHostile: true,
                color: "#ff3366",
                size: 5,
              });

              // Fire interval: Wave 6 ~100ms (6 frames), Wave 5 ~320ms (19 frames)
              h.attackTimer = wave >= 6 ? 6 : 19;
            } else if (h.type === "cruiser") {
              // Armored Gunships (Wave 3 & 4): angled dual-spread plasma
              bulletsRef.current.push({
                id: `b-hostile-L-${Math.random()}`,
                x: h.x - 16,
                y: spawnY,
                vx: -0.7,
                vy: 3.8 + wave * 0.2,
                isHostile: true,
                color: "#ff3366",
                size: 4.5,
              });
              bulletsRef.current.push({
                id: `b-hostile-R-${Math.random()}`,
                x: h.x + 16,
                y: spawnY,
                vx: 0.7,
                vy: 3.8 + wave * 0.2,
                isHostile: true,
                color: "#ff3366",
                size: 4.5,
              });

              // Fire interval: Wave 3 = 450ms (~27 frames), Wave 4 = 280ms (~17 frames), Wave 6 = ~100ms (6 frames)
              h.attackTimer = wave >= 6 ? 6 : wave === 4 ? 17 : 27;
            } else if (h.type === "drone") {
              // Kamikaze Drone: targeting pulse
              const dx = ship.x - h.x;
              const dy = ship.y - spawnY;
              const dist = Math.hypot(dx, dy) || 1;
              const speed = 4.2;
              bulletsRef.current.push({
                id: `b-hostile-d-${Math.random()}`,
                x: h.x,
                y: spawnY,
                vx: (dx / dist) * speed * 0.65,
                vy: Math.max(2.6, (dy / dist) * speed),
                isHostile: true,
                color: "#ff0055",
                size: 4,
              });

              // Fire interval: Wave 2 = 600ms (~36 frames), Wave 4 = 280ms (~17 frames), Wave 6 = ~100ms (6 frames)
              h.attackTimer = wave >= 6 ? 6 : wave === 4 ? 17 : 36;
            } else {
              // Scout Dart: Single laser pulse
              bulletsRef.current.push({
                id: `b-hostile-s-${Math.random()}`,
                x: h.x,
                y: spawnY,
                vx: (Math.random() - 0.5) * 0.8,
                vy: 4.0 + wave * 0.2,
                isHostile: true,
                color: "#ff3366",
                size: 4,
              });

              // Fire interval: Wave 1 = ~1000ms (55 frames), Wave 4 = 280ms (17 frames), Wave 6 = ~100ms (6 frames)
              h.attackTimer = wave >= 6 ? 6 : wave === 4 ? 17 : wave === 2 ? 46 : 55;
            }
            sound.playLaser(440, 0.08);
          }
        }

        // (b) Update Bullets & Friendly Hits
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
          const b = bulletsRef.current[i];
          b.x += b.vx;
          b.y += b.vy;

          if (b.y < -30 || b.y > canvasHeight + 30 || b.x < -30 || b.x > canvasWidth + 30) {
            bulletsRef.current.splice(i, 1);
            continue;
          }

          // Friendly hit check against this cockpit's hostiles
          if (!b.isHostile) {
            for (let j = hostilesRef.current.length - 1; j >= 0; j--) {
              const h = hostilesRef.current[j];
              const dist = Math.hypot(b.x - h.x, b.y - h.y);
              if (dist < h.width / 2 + (b.size || 3.5)) {
                h.hp -= 28;
                ship.score += 50;
                addExplosion(particlesRef, shockwavesRef, b.x, b.y, "#00f0ff", 6);
                bulletsRef.current.splice(i, 1);

                if (h.hp <= 0) {
                  const isBoss = h.type === "dreadnought" || h.type === "mothership";
                  addExplosion(
                    particlesRef,
                    shockwavesRef,
                    h.x,
                    h.y,
                    isBoss ? "#ff0055" : h.type === "cruiser" ? "#ff3366" : "#ffaa00",
                    isBoss ? 38 : h.type === "cruiser" ? 24 : 18
                  );
                  sound.playExplosion(isBoss || h.type === "cruiser" ? "large" : "small");
                  ship.score += isBoss ? 1500 : h.type === "cruiser" ? 500 : 200;

                  if (Math.random() > 0.45) {
                    addPowerup(powerupsRef, h.x, h.y);
                  }
                  hostilesRef.current.splice(j, 1);
                }
                break;
              }
            }
          }
        }

        // (c) Update Powerups
        for (let i = powerupsRef.current.length - 1; i >= 0; i--) {
          const p = powerupsRef.current[i];
          p.y += p.vy;
          p.rotation = (p.rotation || 0) + 0.03;
          if (p.y > canvasHeight + 30) {
            powerupsRef.current.splice(i, 1);
            continue;
          }

          // Pickup check
          if (Math.hypot(p.x - ship.x, p.y - ship.y) < 26) {
            powerupsRef.current.splice(i, 1);
            ship.shield = Math.min(100, ship.shield + 30);
            ship.score += 300;
            sound.playPowerup();
          }
        }

        // (d) Update Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const pt = particlesRef.current[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          if (pt.rotation !== undefined && pt.rotSpeed !== undefined) {
            pt.rotation += pt.rotSpeed;
          }
          pt.life -= 1 / pt.maxLife;
          if (pt.life <= 0) {
            particlesRef.current.splice(i, 1);
          }
        }

        // (e) Update Shockwaves
        for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
          const sw = shockwavesRef.current[i];
          sw.radius += (sw.maxRadius - sw.radius) * 0.12;
          sw.life -= 0.04;
          if (sw.life <= 0 || sw.radius >= sw.maxRadius - 1) {
            shockwavesRef.current.splice(i, 1);
          }
        }

        // (f) Damage to this cockpit's ship from hostile bullets
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
          const b = bulletsRef.current[i];
          if (!b.isHostile) continue;

          if (Math.hypot(b.x - ship.x, b.y - ship.y) < 24) {
            if (ship.invulnerableTimer > 0) continue; // Kinetic Flash-Thruster immunity

            bulletsRef.current.splice(i, 1);
            addExplosion(particlesRef, shockwavesRef, b.x, b.y, "#ff3366", 14);

            if (ship.shield > 0) {
              ship.shield = Math.max(0, ship.shield - 20);
              sound.playShield();
            } else {
              ship.hp = Math.max(0, ship.hp - 20);
              sound.playExplosion("small");
            }
          }
        }
      };

      // Run independent domain pipelines
      updateCockpitDomain(
        humanShipRef.current,
        humanBulletsRef,
        humanHostilesRef,
        humanPowerupsRef,
        humanParticlesRef,
        humanShockwavesRef
      );

      updateCockpitDomain(
        jevShipRef.current,
        jevBulletsRef,
        jevHostilesRef,
        jevPowerupsRef,
        jevParticlesRef,
        jevShockwavesRef
      );

      // Score natural tick
      humanShipRef.current.score += Math.round(dt * 15);
      jevShipRef.current.score += Math.round(dt * 15);

      // 5. IN-HEADER OPERATION BANNER TIMER (2.5s duration)
      if (waveBannerRef.current.mode === "OPERATION") {
        bannerTimerRef.current += dt;
        if (bannerTimerRef.current >= 2.5) {
          updateWaveBanner({
            mode: "COMPACT",
            text: "",
            wave: waveRef.current,
          });
        }
      }

      // ==========================================
      // 6. 6-WAVE ESCALATION ENGINE & IN-HEADER CLEAR BANNER
      // ==========================================
      const humanDone = humanHostilesRef.current.length === 0;
      const jevDone = jevHostilesRef.current.length === 0;
      const waveCleared = (humanDone || humanShipRef.current.hp <= 0) && (jevDone || jevShipRef.current.hp <= 0);

      if (waveCleared && !isTransitioningWave.current) {
        isTransitioningWave.current = true;
        waveClearingTimer.current = 0;

        sound.playPowerup();
        // Award +500 PTS bonus per prompt specification
        humanShipRef.current.score += 500;
        jevShipRef.current.score += 500;

        updateWaveBanner({
          mode: "CLEARED",
          text: "WAVE CLEARED +500 PTS",
          wave: waveRef.current,
        });
      }

      if (isTransitioningWave.current) {
        waveClearingTimer.current += dt;
        if (waveClearingTimer.current >= 1.5) {
          isTransitioningWave.current = false;
          waveClearingTimer.current = 0;

          if (waveRef.current < 6) {
            const nextWave = waveRef.current + 1;
            updateWave(nextWave);
            deployWave(nextWave, canvasWidth);
            bannerTimerRef.current = 0;
            updateWaveBanner({
              mode: "OPERATION",
              text: WAVE_OPERATIONS[nextWave] || `OP: WAVE ${nextWave}`,
              wave: nextWave,
            });
          } else {
            // Completed all 6 Waves: End of duel
            setGameStatus("GAMEOVER");
            updateWaveBanner({
              mode: "COMPACT",
              text: "",
              wave: 6,
            });
            if (humanShipRef.current.score > jevShipRef.current.score) setWinner("HUMAN");
            else if (jevShipRef.current.score > humanShipRef.current.score) setWinner("JEV");
            else setWinner("DRAW");
          }
        }
      }

      // Check Shield Collapse & Hull Breach (Game Over)
      // Jev victory condition triggers when human ship runs out of shields
      if (humanShipRef.current.shield <= 0) {
        humanShipRef.current.hp = 0; // Catastrophic breach upon shield failure
        setGameStatus("GAMEOVER");
        setWinner("JEV");
        sound.playExplosion("large");
      } else if (humanShipRef.current.hp <= 0 || jevShipRef.current.hp <= 0) {
        setGameStatus("GAMEOVER");
        if (humanShipRef.current.hp <= 0 && jevShipRef.current.hp <= 0) setWinner("DRAW");
        else if (humanShipRef.current.hp <= 0) setWinner("JEV");
        else setWinner("HUMAN");
      }

      // ==========================================
      // 6. THROTTLED REACT HUD SYNC (~12 fps)
      // ==========================================
      if (currentTime - lastHudUpdateTime.current >= 80) {
        lastHudUpdateTime.current = currentTime;
        setHumanStats({ ...humanShipRef.current });
        setJevStats({ ...jevShipRef.current });

        setHumanAPM(Math.round(humanActionCounter.current * 20));
        setJevAPM(Math.round(480 + jevActionCounter.current * 22));

        humanActionCounter.current = Math.max(0, humanActionCounter.current - 1);
        jevActionCounter.current = Math.max(0, jevActionCounter.current - 1);
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [
    gameStatus,
    canvasWidth,
    canvasHeight,
    deployWave,
    requestJevDecision,
    wave,
    decisionCadence,
  ]);

  return {
    gameStatus,
    setGameStatus,
    wave,
    winner,
    waveBanner,
    decisionCadence,
    setDecisionCadence,
    cognitiveTelemetry,
    activeHostilesCount: Math.max(humanHostilesRef.current.length, jevHostilesRef.current.length),
    barrageFrequency: wave >= 6 ? "100ms (CRITICAL)" : wave >= 4 ? "250ms (HEAVY)" : wave >= 3 ? "400ms (DENSE)" : "600ms (NORMAL)",
    humanStats,
    jevStats,
    humanAPM,
    jevAPM,
    raycasts,
    startSimulation,
    resetSimulation,
    handleHumanCanvasMouseMove,
    handleHumanCanvasMouseDown,
    handleHumanCanvasMouseUp,
    handleHumanCanvasMouseLeave,
    stars: starsRef.current,
    humanBullets: humanBulletsRef.current,
    humanHostiles: humanHostilesRef.current,
    humanPowerups: humanPowerupsRef.current,
    humanParticles: humanParticlesRef.current,
    humanShockwaves: humanShockwavesRef.current,
    jevBullets: jevBulletsRef.current,
    jevHostiles: jevHostilesRef.current,
    jevPowerups: jevPowerupsRef.current,
    jevParticles: jevParticlesRef.current,
    jevShockwaves: jevShockwavesRef.current,
    humanShip: humanShipRef.current,
    jevShip: jevShipRef.current,
  };
}
