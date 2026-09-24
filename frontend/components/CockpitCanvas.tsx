"use client";

import React, { useRef, useEffect } from "react";
import { ShipState, Bullet, Hostile, Powerup, Particle, Shockwave } from "@/types/game";
import { RaycastVectors } from "@/hooks/useGameLoop";

interface CockpitCanvasProps {
  mode: "HUMAN" | "JEV";
  ship: ShipState;
  bullets: Bullet[];
  hostiles: Hostile[];
  powerups: Powerup[];
  particles: Particle[];
  shockwaves: Shockwave[];
  stars: Array<{ x: number; y: number; speed: number; size: number; alpha: number; color?: string }>;
  raycasts?: RaycastVectors;
  onMouseMove?: (x: number) => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
  width?: number;
  height?: number;
}

export const CockpitCanvas: React.FC<CockpitCanvasProps> = ({
  mode,
  ship,
  bullets,
  hostiles,
  powerups,
  particles,
  shockwaves,
  stars,
  raycasts,
  onMouseMove,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  width = 540,
  height = 520,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset transformations and shadow effects
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    ctx.clearRect(0, 0, width, height);

    // 1. Cosmic Deep Obsidian Background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, "#040711");
    bgGradient.addColorStop(0.6, "#060b1a");
    bgGradient.addColorStop(1, "#081024");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Parallax Starfield (Crisp, zero scanlines)
    for (const star of stars) {
      ctx.fillStyle = star.color || "#e2e8f0";
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x % width, star.y % height, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 3. Tactical Coordinate Grid
    ctx.strokeStyle = mode === "JEV" ? "rgba(0, 240, 255, 0.05)" : "rgba(56, 189, 248, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 50; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 50; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 4. Jev Predictive Vectors (Cockpit 2 HUD Overlay)
    if (mode === "JEV" && raycasts) {
      // (a) Red Threat Danger Corridors
      for (const cone of raycasts.threatCones) {
        ctx.save();
        const grad = ctx.createLinearGradient(cone.x1, cone.y1, cone.x2, cone.y2);
        grad.addColorStop(0, "rgba(255, 51, 102, 0.05)");
        grad.addColorStop(1, "rgba(255, 51, 102, 0.22)");
        ctx.fillStyle = grad;
        ctx.strokeStyle = "rgba(255, 51, 102, 0.65)";
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(cone.x1, cone.y1);
        ctx.lineTo(cone.x2 - cone.width / 2, cone.y2);
        ctx.lineTo(cone.x2 + cone.width / 2, cone.y2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Projected Impact Target Crosshair
        ctx.fillStyle = "#ff3366";
        ctx.beginPath();
        ctx.arc(cone.x2, cone.y2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // (b) Lead-Angle Weapon Alignment Vector (Cyan)
      if (raycasts.leadAngleVector) {
        const lv = raycasts.leadAngleVector;
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00f0ff";
        ctx.strokeStyle = "rgba(0, 240, 255, 0.9)";
        ctx.lineWidth = 2.0;
        ctx.setLineDash([5, 4]);

        ctx.beginPath();
        ctx.moveTo(lv.x1, lv.y1);
        ctx.lineTo(lv.x2, lv.y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target intercept reticle with dynamic brackets
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(lv.x2, lv.y2, 12, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(lv.x2 - 16, lv.y2);
        ctx.lineTo(lv.x2 + 16, lv.y2);
        ctx.moveTo(lv.x2 - 14, lv.y2);
        ctx.lineTo(lv.x2 + 14, lv.y2);
        ctx.stroke();

        ctx.fillStyle = "#00f0ff";
        ctx.font = "bold 9px monospace";
        ctx.fillText(`LEAD_LOCK [${lv.distance}m]`, lv.x2 + 16, lv.y2 - 8);
        ctx.restore();
      }

      // (c) Golden Dashed Powerup Harvest Vector
      if (raycasts.harvestCorridor) {
        const hc = raycasts.harvestCorridor;
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ffaa00";
        ctx.strokeStyle = "rgba(255, 170, 0, 0.85)";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 4]);

        ctx.beginPath();
        ctx.moveTo(hc.x1, hc.y1);
        ctx.lineTo(hc.x2, hc.y2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#ffaa00";
        ctx.beginPath();
        ctx.arc(hc.x2, hc.y2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 5. Human Cockpit Overlay: Saccadic Gaze Tracker & Latency Ring
    if (mode === "HUMAN") {
      ctx.save();
      const isManual = ship.isManualOverride;
      ctx.strokeStyle = isManual ? "rgba(56, 189, 248, 0.9)" : "rgba(100, 116, 139, 0.4)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(ship.x, ship.y - 48, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = isManual ? "#38bdf8" : "#94a3b8";
      ctx.font = "bold 9px monospace";
      ctx.fillText(
        isManual ? "MANUAL OVERRIDE [ACTIVE]" : "IDLE // READY [A/D/SPACE]",
        ship.x - 48,
        ship.y - 68
      );
      ctx.restore();
    }

    // 6. Draw Distinct Hostile Enemies
    // 6. Draw Distinct Badass Hostile Fleet
    for (const h of hostiles) {
      ctx.save();
      ctx.translate(h.x, h.y);

      if (h.type === "scout") {
        // ==========================================
        // SCOUT DART: Sleek crimson delta blade with rear engine trails
        // ==========================================
        const hw = h.width / 2;
        const hh = h.height / 2;

        // Rear engine trails (flickering twin flames & trailing particle sparks)
        const flame = 6 + Math.random() * 5;
        ctx.fillStyle = "rgba(255, 100, 0, 0.85)";
        ctx.fillRect(-6, -hh - flame, 3, flame);
        ctx.fillRect(3, -hh - flame, 3, flame);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-5, -hh - flame * 0.5, 1.5, flame * 0.5);
        ctx.fillRect(4, -hh - flame * 0.5, 1.5, flame * 0.5);

        // Trailing sparks
        if (Math.random() > 0.4) {
          ctx.fillStyle = "rgba(255, 60, 0, 0.7)";
          ctx.beginPath();
          ctx.arc(-5 + (Math.random() - 0.5) * 4, -hh - flame - Math.random() * 8, 1.2, 0, Math.PI * 2);
          ctx.arc(4 + (Math.random() - 0.5) * 4, -hh - flame - Math.random() * 8, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Sleek crimson delta hull
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff3366";

        // Left facet (darker crimson shadow)
        ctx.fillStyle = "#881337";
        ctx.beginPath();
        ctx.moveTo(0, hh + 2); // Bottom needle tip
        ctx.lineTo(-hw, -hh);
        ctx.lineTo(-hw * 0.4, -hh * 0.3);
        ctx.lineTo(0, -hh * 0.6);
        ctx.closePath();
        ctx.fill();

        // Right facet (bright crimson specular)
        ctx.fillStyle = "#be123c";
        ctx.beginPath();
        ctx.moveTo(0, hh + 2);
        ctx.lineTo(hw, -hh);
        ctx.lineTo(hw * 0.4, -hh * 0.3);
        ctx.lineTo(0, -hh * 0.6);
        ctx.closePath();
        ctx.fill();

        // Outer razor edge outline
        ctx.strokeStyle = "#ff3366";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, hh + 2);
        ctx.lineTo(hw, -hh);
        ctx.lineTo(hw * 0.4, -hh * 0.3);
        ctx.lineTo(0, -hh * 0.6);
        ctx.lineTo(-hw * 0.4, -hh * 0.3);
        ctx.lineTo(-hw, -hh);
        ctx.closePath();
        ctx.stroke();

        // Center dorsal spine & optic sensor slit
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-1, -2, 2, 6);
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#00f0ff";
        ctx.fillStyle = "#00f0ff";
        ctx.fillRect(-1.5, -4, 3, 2);

      } else if (h.type === "drone") {
        // ==========================================
        // KAMIKAZE DRONE: Pulsing spiked diamond with directional trail particles
        // ==========================================
        const pulse = 1 + Math.sin(Date.now() * 0.012) * 0.16;
        const hw = (h.width / 2) * pulse;
        const hh = (h.height / 2) * pulse;

        // Directional trail particles trailing behind motion vector
        ctx.save();
        for (let i = 1; i <= 3; i++) {
          const alpha = 0.5 - i * 0.14;
          ctx.fillStyle = `rgba(255, 0, 85, ${alpha})`;
          ctx.beginPath();
          ctx.arc(-h.vx * i * 3.5, -h.vy * i * 3.5 - hh * 0.6, 2.5 - i * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Spiked diamond outer hull
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#ff0055";
        ctx.fillStyle = "#1e040c";
        ctx.strokeStyle = "#ff0055";
        ctx.lineWidth = 2.0;

        // 4 razor fin spikes
        ctx.beginPath();
        ctx.moveTo(0, hh + 5); // Bottom needle spike
        ctx.lineTo(hw * 0.3, hh * 0.4);
        ctx.lineTo(hw + 5, 0); // Starboard spike
        ctx.lineTo(hw * 0.3, -hh * 0.4);
        ctx.lineTo(0, -hh - 5); // Top spike
        ctx.lineTo(-hw * 0.3, -hh * 0.4);
        ctx.lineTo(-hw - 5, 0); // Port spike
        ctx.lineTo(-hw * 0.3, hh * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner glowing core & cyclopean sensor eye
        const coreR = 5 * pulse;
        const coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, coreR);
        coreGrad.addColorStop(0, "#ffffff");
        coreGrad.addColorStop(0.5, "#ff0055");
        coreGrad.addColorStop(1, "rgba(255, 0, 85, 0)");
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, coreR, 0, Math.PI * 2);
        ctx.fill();

      } else if (h.type === "cruiser") {
        // ==========================================
        // GUNSHIP CORVETTE: Heavy angular gunboat with dual glowing sponson cannons and animated red core
        // ==========================================
        const hw = h.width / 2;
        const hh = h.height / 2;

        ctx.shadowBlur = 12;
        ctx.shadowColor = "#ff3366";

        // Rear engine thrusters
        const flame = 7 + Math.random() * 6;
        ctx.fillStyle = "#ff3366";
        ctx.fillRect(-hw * 0.4, -hh - flame, 4, flame);
        ctx.fillRect(hw * 0.4 - 4, -hh - flame, 4, flame);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-hw * 0.4 + 1, -hh - flame * 0.5, 2, flame * 0.5);
        ctx.fillRect(hw * 0.4 - 3, -hh - flame * 0.5, 2, flame * 0.5);

        // Heavy angular hull armor plates
        ctx.fillStyle = "#1a050f";
        ctx.strokeStyle = "#ff3366";
        ctx.lineWidth = 2.0;

        ctx.beginPath();
        ctx.moveTo(0, hh + 2); // Center nose
        ctx.lineTo(hw * 0.5, hh - 2);
        ctx.lineTo(hw, hh * 0.2); // Starboard sponson root
        ctx.lineTo(hw, -hh * 0.6);
        ctx.lineTo(hw * 0.6, -hh);
        ctx.lineTo(-hw * 0.6, -hh);
        ctx.lineTo(-hw, -hh * 0.6);
        ctx.lineTo(-hw, hh * 0.2); // Port sponson root
        ctx.lineTo(-hw * 0.5, hh - 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner layered armor plating
        ctx.fillStyle = "#2d0b1a";
        ctx.beginPath();
        ctx.moveTo(0, hh - 4);
        ctx.lineTo(hw * 0.4, hh * 0.1);
        ctx.lineTo(hw * 0.4, -hh * 0.5);
        ctx.lineTo(-hw * 0.4, -hh * 0.5);
        ctx.lineTo(-hw * 0.4, hh * 0.1);
        ctx.closePath();
        ctx.fill();

        // Dual Glowing Sponson Cannons on outrigger wings (x = ±(hw - 3))
        ctx.fillStyle = "#ff1744";
        ctx.fillRect(-hw - 1, -2, 5, hh + 8);
        ctx.fillRect(hw - 4, -2, 5, hh + 8);

        // Glowing emitter rings on cannons
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-hw, hh + 4, 3, 2);
        ctx.fillRect(hw - 3, hh + 4, 3, 2);

        // Animated red plasma core in center
        const corePulse = 1 + Math.sin(Date.now() * 0.008) * 0.25;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff0055";
        ctx.fillStyle = "#ff0055";
        ctx.beginPath();
        ctx.arc(0, -1, 5 * corePulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, -1, 2.2, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // ==========================================
        // BOSS DREADNOUGHT (Wave 5 & 6): Massive multi-segment warship with flashing armor plates and glowing plasma batteries
        // ==========================================
        const hw = h.width / 2;
        const hh = h.height / 2;
        const time = Date.now();

        // (a) Rotating Shield Barriers (Revolving kinetic barrier arcs around Dreadnought)
        const rot = time * 0.0025;
        const barrierR = hw + 8;
        ctx.save();
        ctx.lineWidth = 2.4;
        ctx.shadowBlur = 14;
        ctx.shadowColor = "#ff0077";

        for (let i = 0; i < 3; i++) {
          const arcStart = rot + (i * Math.PI * 2) / 3;
          const arcEnd = arcStart + 1.1; // ~63 deg
          ctx.strokeStyle = `rgba(255, 0, 119, ${0.75 + Math.sin(time * 0.006 + i) * 0.2})`;
          ctx.beginPath();
          ctx.arc(0, 0, barrierR, arcStart, arcEnd);
          ctx.stroke();

          // Barrier node emitter dots at arc edges
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(Math.cos(arcStart) * barrierR, Math.sin(arcStart) * barrierR, 2.2, 0, Math.PI * 2);
          ctx.arc(Math.cos(arcEnd) * barrierR, Math.sin(arcEnd) * barrierR, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // (b) Rear Engine Clusters (Quad heavy thrusters)
        const flame = 8 + Math.random() * 8;
        ctx.fillStyle = "#ff3366";
        for (const ox of [-hw * 0.6, -hw * 0.2, hw * 0.2 - 4, hw * 0.6 - 4]) {
          ctx.fillRect(ox, -hh - flame, 4, flame);
        }
        ctx.fillStyle = "#ffffff";
        for (const ox of [-hw * 0.6 + 1, -hw * 0.2 + 1, hw * 0.2 - 3, hw * 0.6 - 3]) {
          ctx.fillRect(ox, -hh - flame * 0.5, 2, flame * 0.5);
        }

        // (c) Massive Multi-Segment Hull
        ctx.shadowBlur = 16;
        ctx.shadowColor = "#ff0055";
        ctx.fillStyle = "#12030a";
        ctx.strokeStyle = "#ff0055";
        ctx.lineWidth = 2.2;

        // Outer fortress hull
        ctx.beginPath();
        ctx.moveTo(0, hh + 6); // Heavy prow
        ctx.lineTo(hw * 0.35, hh + 4);
        ctx.lineTo(hw * 0.75, hh * 0.5);
        ctx.lineTo(hw, hh * 0.1);
        ctx.lineTo(hw, -hh * 0.7);
        ctx.lineTo(hw * 0.7, -hh);
        ctx.lineTo(-hw * 0.7, -hh);
        ctx.lineTo(-hw, -hh * 0.7);
        ctx.lineTo(-hw, hh * 0.1);
        ctx.lineTo(-hw * 0.75, hh * 0.5);
        ctx.lineTo(-hw * 0.35, hh + 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Segmented inner armor plates with pulsing energy seams
        const seamPulse = 0.5 + Math.sin(time * 0.007) * 0.35;
        ctx.fillStyle = "#220614";
        ctx.fillRect(-hw * 0.75, -hh * 0.6, hw * 1.5, hh * 1.0);

        // Flashing armor plates & hazard chevrons
        ctx.fillStyle = `rgba(255, 170, 0, ${seamPulse})`;
        ctx.fillRect(-hw * 0.6, -hh * 0.4, 6, 4);
        ctx.fillRect(hw * 0.6 - 6, -hh * 0.4, 6, 4);
        ctx.fillRect(-10, hh - 2, 20, 3);

        // (d) Triple Glowing Plasma Batteries (Turrets at x = -24, 0, +24)
        for (const tx of [-24, 0, 24]) {
          // Battery housing
          ctx.fillStyle = "#33081c";
          ctx.fillRect(tx - 4, hh - 6, 8, 12);
          ctx.strokeStyle = "#ff3366";
          ctx.lineWidth = 1.2;
          ctx.strokeRect(tx - 4, hh - 6, 8, 12);

          // Glowing plasma chamber
          ctx.fillStyle = "#ff0055";
          ctx.beginPath();
          ctx.arc(tx, hh + 4, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(tx, hh + 4, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Central Reactor Core
        const corePulse = 1 + Math.sin(time * 0.009) * 0.25;
        ctx.fillStyle = "#ffaa00";
        ctx.beginPath();
        ctx.arc(0, -hh * 0.1, 7 * corePulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, -hh * 0.1, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;

      // Health Bar
      const hpPct = Math.max(0, h.hp / h.maxHp);
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(-h.width / 2, -h.height / 2 - 10, h.width, 3);
      ctx.fillStyle = hpPct > 0.4 ? "#ff3366" : "#ef4444";
      ctx.fillRect(-h.width / 2, -h.height / 2 - 10, h.width * hpPct, 3);

      ctx.restore();
    }

    // 7. Draw Glowing Hexagonal Powerup Cores
    for (const p of powerups) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation || 0);

      const color =
        p.type === "OVERDRIVE" ? "#00f0ff" : p.type === "SHIELD" ? "#10b981" : "#ffaa00";
      ctx.shadowBlur = 14;
      ctx.shadowColor = color;
      ctx.fillStyle = "rgba(4, 7, 17, 0.85)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;

      // Hexagonal outer frame
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = Math.cos(angle) * p.size;
        const hy = Math.sin(angle) * p.size;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner Icon Badge
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.type === "OVERDRIVE" ? "⚡" : p.type === "SHIELD" ? "🛡" : "★", 0, 0);

      ctx.restore();
    }

    // 8. Draw Laser Bolts (High-Energy Dual Plasma Bolts with Bloom Glow)
    for (const b of bullets) {
      ctx.save();
      if (b.isHostile) {
        // Hostile Crimson/Rose Plasma Bolt
        ctx.shadowBlur = 14;
        ctx.shadowColor = "#ff3366";
        ctx.fillStyle = "#ff0055";

        // Outer plasma glow capsule
        ctx.beginPath();
        ctx.roundRect(b.x - 2.5, b.y - 9, 5, 18, 2.5);
        ctx.fill();

        // White-hot inner core
        ctx.fillStyle = "#ffe4e6";
        ctx.beginPath();
        ctx.roundRect(b.x - 1, b.y - 7, 2, 14, 1);
        ctx.fill();
      } else {
        // High-Energy Dual Cyan Plasma Bolt (Bloom Glow)
        ctx.shadowBlur = 14;
        ctx.shadowColor = "#00f0ff";
        ctx.fillStyle = "#00f0ff";

        // Outer plasma glow capsule
        ctx.beginPath();
        ctx.roundRect(b.x - 2.5, b.y - 11, 5, 20, 2.5);
        ctx.fill();

        // White-hot inner core
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(b.x - 1, b.y - 9, 2, 16, 1);
        ctx.fill();
      }
      ctx.restore();
    }

    // 9. Draw Radial Shockwave Rings (Ship Destruction & Weapon Impacts)
    for (const sw of shockwaves) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, sw.life);
      ctx.shadowBlur = 16;
      ctx.shadowColor = sw.color;

      // Outer expanding ring
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.lineWidth;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner faint secondary shockwave ring
      if (sw.radius > 10) {
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius * 0.72, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 10. Draw Debris, Explosions & Metallic Shrapnel Sparks
    for (const pt of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = pt.color;

      if (pt.rotation !== undefined) {
        // Metallic rotating shrapnel shard
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rotation);
        ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size * 0.6);

        // Highlight glint on metal shard
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-pt.size / 4, -pt.size / 4, pt.size / 2, 1);
      } else {
        // High-velocity spark dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(1, pt.size * pt.life), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 11. Draw Badass Starfighter (Aggressive Forward-Swept Interceptor)
    ctx.save();
    ctx.translate(ship.x, ship.y);

    const themeColor = mode === "JEV" ? "#00f0ff" : "#38bdf8";
    const canopyColor = mode === "JEV" ? "#00f0ff" : "#f59e0b"; // Cyan for Jev, Amber for Human
    const time = Date.now();

    // ==========================================
    // (a) Hexagonal Kinetic Barrier Shield (Flashes Bright on Weapon Impact)
    // ==========================================
    if (ship.shield > 0) {
      const shieldPulse = Math.sin(time * 0.008) * 1.8;
      const isImpact = (ship.invulnerableTimer && ship.invulnerableTimer > 0) || ship.shield < 30;
      const shieldAlpha = isImpact ? 0.95 : Math.min(0.7, (ship.shield / 100) * 0.5 + 0.15);

      ctx.save();
      ctx.shadowBlur = isImpact ? 24 : 14;
      ctx.shadowColor = isImpact ? "#ffffff" : themeColor;
      ctx.strokeStyle = isImpact ? "#ffffff" : `rgba(0, 240, 255, ${shieldAlpha})`;
      ctx.lineWidth = isImpact ? 2.5 : 1.8;

      // 6-sided hexagonal honeycomb barrier
      const hexR = 34 + shieldPulse;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i - Math.PI / 6;
        const hx = Math.cos(ang) * hexR;
        const hy = Math.sin(ang) * (hexR * 0.92);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();

      // Hexagonal vertices / glowing kinetic nodes
      ctx.fillStyle = isImpact ? "#ffffff" : themeColor;
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i - Math.PI / 6;
        const hx = Math.cos(ang) * hexR;
        const hy = Math.sin(ang) * (hexR * 0.92);
        ctx.beginPath();
        ctx.arc(hx, hy, isImpact ? 3.0 : 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ==========================================
    // (b) Dynamic Twin Ion-Thruster Exhaust Plumes (White-Hot Core + Trailing Sparks)
    // ==========================================
    const flameFlicker = Math.random() * 8;
    const flameLen = 22 + flameFlicker;

    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = themeColor;

    // Port & Starboard Twin Thruster Plumes (Mounted at x = -10 and +10, y = 16)
    for (const tx of [-10, 10]) {
      // Outer vibrant ion flame
      ctx.fillStyle = themeColor;
      ctx.beginPath();
      ctx.moveTo(tx - 4, 15);
      ctx.lineTo(tx, 15 + flameLen);
      ctx.lineTo(tx + 4, 15);
      ctx.closePath();
      ctx.fill();

      // White-hot inner core flame
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(tx - 2, 15);
      ctx.lineTo(tx, 15 + flameLen * 0.55);
      ctx.lineTo(tx + 2, 15);
      ctx.closePath();
      ctx.fill();

      // Trailing particle sparks drifting backward
      ctx.fillStyle = themeColor;
      for (let s = 1; s <= 2; s++) {
        const sparkY = 15 + flameLen + s * 6 + Math.random() * 6;
        const sparkX = tx + (Math.random() - 0.5) * 6;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // ==========================================
    // (c) Aggressive Forward-Swept Interceptor Hull with Layered Armor & Intake Vents
    // ==========================================
    ctx.shadowBlur = 12;
    ctx.shadowColor = themeColor;

    // Base Spaceframe Dark Navy
    ctx.fillStyle = "#060f1e";
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1.8;

    // Forward-swept wing geometry:
    // Nose at (0, -28) -> roots at (±10, 2) -> sweeping FORWARD to wingtips at (±24, -12) -> trailing edges to (±12, 16)
    ctx.beginPath();
    ctx.moveTo(0, -28); // Sharp needle nose
    ctx.lineTo(6, -14); // Nose chine
    ctx.lineTo(10, 2); // Wing root
    ctx.lineTo(24, -12); // Forward-swept starboard wingtip
    ctx.lineTo(23, -4); // Wingtip missile pylon
    ctx.lineTo(13, 16); // Starboard engine nacelle
    ctx.lineTo(0, 10); // Center trailing intake notch
    ctx.lineTo(-13, 16); // Port engine nacelle
    ctx.lineTo(-23, -4); // Port wingtip missile pylon
    ctx.lineTo(-24, -12); // Forward-swept port wingtip
    ctx.lineTo(-10, 2); // Port wing root
    ctx.lineTo(-6, -14); // Nose chine
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Layered Chiseled Titanium Armor Plates
    const armorGrad = ctx.createLinearGradient(0, -24, 0, 14);
    armorGrad.addColorStop(0, "#132c52");
    armorGrad.addColorStop(1, "#0a182d");
    ctx.fillStyle = armorGrad;

    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(5, -12);
    ctx.lineTo(16, -6); // Forward wing armor plate
    ctx.lineTo(10, 12);
    ctx.lineTo(-10, 12);
    ctx.lineTo(-16, -6);
    ctx.lineTo(-5, -12);
    ctx.closePath();
    ctx.fill();

    // Sculpted Intake Vents (Port & Starboard) with Dark Recessed Carbon Mesh
    ctx.fillStyle = "#030710";
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 1;

    // Port intake vent
    ctx.beginPath();
    ctx.moveTo(-9, -2);
    ctx.lineTo(-5, -4);
    ctx.lineTo(-5, 6);
    ctx.lineTo(-9, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Starboard intake vent
    ctx.beginPath();
    ctx.moveTo(9, -2);
    ctx.lineTo(5, -4);
    ctx.lineTo(5, 6);
    ctx.lineTo(9, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Intake vent slats
    ctx.fillStyle = themeColor;
    ctx.fillRect(-8, 0, 2, 4);
    ctx.fillRect(6, 0, 2, 4);

    // ==========================================
    // (d) Twin High-Energy Laser Pulse Cannons (Firing Tips at x ± 12, y - 15)
    // ==========================================
    ctx.fillStyle = themeColor;
    ctx.fillRect(-13.5, -16, 3, 20);
    ctx.fillRect(10.5, -16, 3, 20);

    // White-hot cannon muzzle emitter tips
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-13.5, -16, 3, 3);
    ctx.fillRect(10.5, -16, 3, 3);

    // ==========================================
    // (e) Glowing Glass Cockpit Canopy (Amber for Human, Cyan for Jev)
    // ==========================================
    ctx.shadowBlur = 10;
    ctx.shadowColor = canopyColor;

    const canopyGrad = ctx.createLinearGradient(0, -14, 0, 4);
    canopyGrad.addColorStop(0, canopyColor);
    canopyGrad.addColorStop(1, "rgba(2, 6, 16, 0.95)");
    ctx.fillStyle = canopyGrad;

    // Aerodynamic canopy teardrop
    ctx.beginPath();
    ctx.ellipse(0, -5, 4.5, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Specular white gleam arc along top-left curve
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -5, 4.2, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.stroke();

    // Dark titanium canopy frame ring
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, -5, 4.5, 9.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (onMouseMove && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = width / rect.width;
      const x = (e.clientX - rect.left) * scaleX;
      onMouseMove(x);
    }
  };

  return (
    <div className="relative flex flex-col flex-1 min-h-0 w-full h-full bg-[#040711] overflow-hidden">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        className="w-full h-full object-contain cursor-crosshair select-none block"
      />
    </div>
  );
};
