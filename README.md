# Deep Space Interceptor: Jev vs Human Reflexes

An interactive real-time space duel benchmarking **Human Biological Reaction Latency (~240ms)** against **TypeSafe Jev System 1 Decision API (~100ms)**.

![Interceptor Architecture](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/crosshair.svg)

---

## 🚀 Overview

In modern high-speed tactical intercepts, human pilot reaction times suffer from biological bottlenecks:
- **Visual perception delay**: ~180ms – 240ms
- **Saccadic eye micro-jitters & cognitive overload**: degradation during dense projectile barrages
- **Motor actuation latency**: ~50ms – 80ms

**Jev System 1** bypasses neuromuscular delays via high-frequency deterministic probability calculations (~100ms polling cycle), delivering razor-sharp evasive maneuvers, predictive weapon alignment, and optimal harvest corridor navigation.

---

## 🛰️ Architecture & Monorepo Structure

```
root/
├── frontend/               # Next.js 15 App Router, TypeScript, Tailwind CSS, Lucide icons
│   ├── app/
│   │   ├── layout.tsx      # Strict zero-scroll viewport container
│   │   ├── page.tsx        # Main mission control & duel arena
│   │   └── globals.css     # Obsidian cosmic styling (no CRT scanlines)
│   ├── components/
│   │   ├── CockpitCanvas.tsx  # Dual synchronized HTML5 canvas viewports
│   │   ├── TelemetryHUD.tsx   # Probability distribution, real-time APM & latency
│   │   ├── Header.tsx         # Wave status, score counters, audio toggle
│   │   └── ui/                # Modern HUD UI components
│   ├── hooks/
│   │   ├── useGameLoop.ts     # RequestAnimationFrame synchronized game engine
│   │   └── useJevAgent.ts     # 100ms polling agent calling proxy backend
│   ├── lib/
│   │   └── audio.ts           # Zero-dependency Web Audio API synthesizer
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                # Node.js + Express.js API proxy server
│   ├── src/
│   │   ├── server.ts       # Express app & route definitions
│   │   ├── routes/
│   │   │   └── jev.ts      # POST /api/jev-decide route handler
│   │   └── services/
│   │       └── typesafe.ts # Typed HTTP client calling TypeSafe Jev API + Heuristics
│   ├── .env.example        # TYPESAFE_API_KEY / JEV_API_KEY placeholder
│   ├── package.json
│   └── tsconfig.json
│
├── package.json            # Root workspace scripts (concurrently to run both)
└── README.md               # Setup and architectural documentation
```

---

## ⚡ Quickstart

### 1. Install Dependencies
Run from the repository root:
```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure Environment (Optional)
If you have a TypeSafe Jev API Key:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add:
# JEV_API_KEY=your_key_here
```
> **Note:** If no API key is provided, the backend seamlessly runs with an **intelligent local heuristic engine** that mirrors Jev's fast System 1 decision matrix without interruption!

### 3. Launch Development Server
Launch both frontend and backend concurrently:
```bash
npm run dev
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Backend Healthcheck**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🎮 Pilot Controls & Gameplay

| Key / Input | Action | Cockpit Affected |
| :--- | :--- | :--- |
| **A / Left Arrow** | Move Interceptor Left | Human Cockpit (Manual Override) |
| **D / Right Arrow** | Move Interceptor Right | Human Cockpit (Manual Override) |
| **Spacebar / Left Click** | Fire Laser Cannons | Human Cockpit (Manual Override) |
| **Mouse Hover / Touch** | Smooth Target Tracking | Human Cockpit (Manual Override) |
| **M** | Toggle Synthesizer Audio | Global Audio Engine |
| **R** | Reset Duel Simulation | Global Engine |

- **Cockpit 1 (Human Pilot)**: Features realistic biological buffer (~240ms perception latency delay, saccadic jitter, and human fatigue under dense waves). You can take immediate manual control at any second!
- **Cockpit 2 (Jev AI)**: Operates autonomously on a 100ms decision cadence. Displays live raycast vectors:
  - **Red Cones**: Incoming bullet threat corridors
  - **Cyan Vector**: Lead-angle target alignment
  - **Gold Path**: Energy core harvest corridors
  - **Live Probabilities**: Softmax action distribution (`DODGE_LEFT`, `DODGE_RIGHT`, `FIRE_ALIGN`, `HARVEST_CORE`)

---

## 📐 Strict Viewport Constraints
- **Zero Page Scrolling**: The interface is strictly contained within `100vh; max-height: 100vh; overflow: hidden;` for laptop screens (1366x768 to 1920x1080).
- **Obsidian Dark Cosmic Aesthetic**: Deep obsidian `#040711`, crisp cyan `#00f0ff`, amber `#ffaa00`, and laser red `#ff3366`.
- **Crisp Vector Fidelity**: Plain, razor-sharp HUD elements without CRT lines or blurry scanlines.
