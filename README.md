# Deep Space Interceptor: Jev vs Human Reflexes

An empirical, high-frequency cognitive benchmarking harness and dual-canvas combat simulator evaluating human sensorimotor ocular-motor latency against the **TypeSafe Jev System 1 Decision Model** routed via the **Vercel AI Gateway**.

```text
 ╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗
 ║  [ HUMAN BIOLOGICAL REFLEX ]           vs.          [ TYPESAFE JEV SYSTEM 1 COGNITION ]          ║
 ║  Latency: ~240ms (Sensorimotor Bottleneck)          Latency: ~100ms Cadence (Sub-Neural Determinism)║
 ║  Actuation: Manual Keyboard / Mouse Vector          Actuation: Continuous Repulsion Field + Kinematics║
 ╚═══════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## Table of Contents
1. [Executive Overview & Operational Thesis](#1-executive-overview--operational-thesis)
2. [Live Deployment & Local Infrastructure Links](#2-live-deployment--local-infrastructure-links)
3. [Cognitive Duel Architecture & Latency Differential](#3-cognitive-duel-architecture--latency-differential)
4. [Fullstack Monorepo Engineering & Directory Topology](#4-fullstack-monorepo-engineering--directory-topology)
5. [The Two-Tier Reactive Engine & Mathematical Models](#5-the-two-tier-reactive-engine--mathematical-models)
6. [Telemetry Matrices, Visual HUD & Hardware Interfacing](#6-telemetry-matrices-visual-hud--hardware-interfacing)
7. [Installation, Verification & Production Deployment](#7-installation-verification--production-deployment)

---

## 1. Executive Overview & Operational Thesis

In high-velocity tactical intercept scenarios, biological human pilots inevitably encounter immutable neurological failure points:
- **Visual Sensory Transduction Delay** (~180ms – 240ms): The physical duration required for photons hitting photoreceptors on the retina to transduce into action potentials, cross the optic chiasm, and resolve in the visual cortex ($V_1$).
- **Saccadic Suppression & Cognitive Degradation**: During hyper-dense hostile plasma barrages, micro-saccades induce momentary perceptual blind spots; cognitive stress elevates target fixation, leading to lethal tunnel vision.
- **Neuromuscular Motor Actuation Latency** (~50ms – 80ms): The physical travel delay of efferent motor impulses down spinal pathways to motor units in the human hand and fingers ($A/D$ keystrokes, spacebar discharges, and mouse track shifts).

### The System 1 vs. System 2 Architectural Paradigm
Traditional Large Language Model (LLM) applications operate strictly within **System 2** cognitive paradigms: high-latency, multi-token autoregressive generation loops requiring 800ms to 4,500ms per roundtrip. Deploying conversational LLM text-streaming pipelines directly into hard real-time physical loops results in instantaneous vessel destruction.

**Deep Space Interceptor** solves this fundamental latency bottleneck by implementing **TypeSafe Jev System 1**:
- **Discrete Decision Primitive**: Rather than unbounded text generation, the decision pipeline routes strict, typed discrete choices (`DODGE_LEFT`, `DODGE_RIGHT`, `FIRE_ALIGN`, `HARVEST_CORE`) through high-speed categorical inference nodes.
- **Sub-100ms Inference Cadence**: Polling cycles are synchronized to variable discrete intervals (50ms Overdrive, 100ms Baseline, 150ms Pro Gamer, 250ms Human Biological Delay).
- **Two-Tier Decoupling**: High-frequency physical kinematic repulsion fields (Tier 1; 60 FPS) operate independently of network-bound tactical macro-decisions (Tier 2; 100ms discrete REST cycles), guaranteeing absolute vessel survivability even under turbulent network packet variance.

---

## 2. Live Deployment & Local Infrastructure Links

### Production Cloud Endpoints (Live Deployment)
| Service Layer | Target Link / Deployment Status | Routing Details |
| :--- | :--- | :--- |
| **Client Web Application** | `[DEPLOYMENT_URL_PENDING: https://deep-space-interceptor.vercel.app]` | Next.js 15 App Router on Vercel Edge CDN |
| **Decision Gateway Proxy** | `[DEPLOYMENT_URL_PENDING: https://deep-space-interceptor-api.vercel.app]` | Express.js / TypeScript Proxy Node Runtime |
| **Upstream Decision Provider** | `https://gateway.ai.vercel.com/v1/decisions` | Vercel AI Gateway (Model: `typesafe/jev`) |

### Local Engineering Endpoints
| Local Node Service | URI / Port | Protocol & Payload Contract |
| :--- | :--- | :--- |
| **Frontend Tactical Client** | `http://localhost:3000` | HTTP/2 / HTML5 Canvas / WebSocket / React 19 |
| **Backend Decision Gateway** | `http://localhost:5000` | Node.js Express Proxy / JSON REST API |
| **Backend Healthcheck Probe** | `http://localhost:5000/api/health` | `GET` — Returns provider status & encryption modes |
| **Live Decision Evaluator** | `http://localhost:5000/api/jev-decide` | `POST` — Validated against strict Zod `GameStateSchema` |

---

## 3. Cognitive Duel Architecture & Latency Differential

The simulation operates as a deterministic, dual-arena side-by-side comparative laboratory. Both cockpits are injected with synchronized pseudo-random number generator (PRNG) seeds, guaranteeing identical enemy spawn coordinates, bullet trajectories, and powerup drops:

```text
 ┌───────────────────────────────────────────────┐   ┌───────────────────────────────────────────────┐
 │ COCKPIT 1: HUMAN BIOLOGICAL PILOT             │   │ COCKPIT 2: JEV SYSTEM 1 AUTONOMOUS AI         │
 │ • Input Isolation: 100% Manual Keyboard/Mouse │   │ • Input Isolation: 100% Autonomous Algorithmic│
 │ • Default Idle State: 0 Movement, 0 Shots     │   │ • Physical Tier: 60 FPS Kinetic Field Evasion │
 │ • Neural Latency: ~240ms Measured Bio Lag     │   │ • Macro Tier: 100ms Vercel AI Gateway Loop    │
 │ • Weapons: Spacebar / Left Click Manual Fire  │   │ • Weapons: Predictive Lead-Angle Interception │
 │ • Threat Avoidance: Sluggish / Overwhelmed    │   │ • Threat Avoidance: 100% Safe (God-Tier Weave)│
 └───────────────────────────────────────────────┘   └───────────────────────────────────────────────┘
```

### Cockpit 1: Human Biological Pilot
- **Strict Manual Input Isolation**: Under manual control, Cockpit 1 is mathematically isolated from Cockpit 2. If the user releases physical controls, the human vessel ceases all velocity updates and halts blaster discharges ($v_x = 0$, fire rate = 0).
- **Sensorimotor Reaction Recorder**: When hostile plasma enters the critical danger threshold ($y > 350\text{px}, \Delta x \le 30\text{px}$), an internal high-resolution timestamp ($t_{\text{stimulus}}$) is logged. The delta to the player's subsequent evasion stroke ($t_{\text{response}}$) yields an empirical biological latency reading:
  $$\Delta t_{\text{bio}} = t_{\text{response}} - t_{\text{stimulus}} \approx 220\text{ms} - 280\text{ms}$$
- **Destruction Mechanics**: Because biological perception lag exceeds the arrival cadence of dense hostile barrages in Waves 3–6, the human vessel experiences shield depletion and hull destruction under sustained crossfire.

### Cockpit 2: Jev Autonomous AI
- **Surgical Evasion Corridor**: Cockpit 2 continuously projects forward raycasts against active enemy plasma bolts, calculating the exact spatial safe corridor and aligning the starfighter with sub-pixel precision.
- **Predictive Lead-Angle Intercept**: Rather than firing directly at instantaneous enemy coordinates, Jev solves for the collision intercept point based on target velocity vectors $(\vec{v}_{\text{enemy}})$ and blaster velocity $(v_{\text{blaster}} = -14\text{px/frame})$:
  $$\vec{x}_{\text{intercept}} = \vec{x}_{\text{target}} + \vec{v}_{\text{target}} \cdot \left(\frac{y_{\text{target}} - y_{\text{ship}}}{|v_{\text{blaster}}|}\right)$$
- **Opportunistic Harvest Snatching**: Trajectories toward falling energy cores (Shield, Overdrive, EMP, Plasma Boost) are continuously scored; when survival risk is calculated at 0.00%, Jev dynamically weaves into the core's falling lane to harvest bonus score and system buffs.

---

## 4. Fullstack Monorepo Engineering & Directory Topology

The project is structured as a unified monorepo with isolated dependency trees to ensure zero cross-environment contamination between the Next.js client runtime and the Node.js Express server:

```text
jev-vs-human-deep-space-interceptor/
├── backend/                               # High-Speed Node.js Proxy & Decision Gateway
│   ├── src/
│   │   ├── routes/
│   │   │   └── jev.ts                     # Express routes: POST /api/jev-decide & GET /api/health
│   │   ├── services/
│   │   │   └── typesafe.ts                # Vercel AI Gateway integration & Zod schemas
│   │   └── server.ts                      # Server bootstrap, CORS setup, port allocation (5000)
│   ├── .env.example                       # Environment template for AI Gateway keys
│   ├── package.json                       # Backend dependencies (express, cors, zod, dotenv, tsx)
│   └── tsconfig.json                      # Strict TypeScript compiler options (Node16 / ES2022)
├── frontend/                              # High-Performance Tactical Web Client
│   ├── app/
│   │   ├── layout.tsx                     # Root HTML wrapper with dark theme & metadata
│   │   ├── page.tsx                       # Main 100vh elastic cockpit dashboard layout
│   │   └── globals.css                    # Tailwind tokens, canvas reset & animations
│   ├── components/
│   │   ├── Header.tsx                     # Mission header, cognitive badge, audio controls
│   │   ├── TacticalControlBar.tsx         # 4-pill cadence deck, wave escalation, engage/reset
│   │   ├── CockpitCanvas.tsx              # Standalone dual-canvas container component
│   │   └── DecisionHorizonDeck.tsx        # Bottom tactical card matrix & real-time delta score
│   ├── hooks/
│   │   ├── useInterceptorEngine.ts        # 60 FPS requestAnimationFrame deterministic loop
│   │   ├── useJevAgent.ts                 # High-frequency decision dispatcher & API state
│   │   └── useAudioEngine.ts              # Web Audio API procedural sound synthesis (0 external assets)
│   ├── types/
│   │   └── game.ts                        # Shared TypeScript interfaces & decision types
│   ├── package.json                       # Client dependencies (next, react, lucide-react, tailwindcss)
│   ├── tsconfig.json                      # Frontend Next.js TypeScript configuration
│   └── next.config.ts                     # Turbopack options & Next.js production build rules
├── jev_vs_human_deep_space_interceptor.html # Original standalone single-file prototype
├── package.json                           # Monorepo root orchestrator (concurrently scripts)
└── README.md                              # Systems engineering architecture & deployment documentation
```

### Monorepo Orchestration Rationale
1. **Isolated Package Environments**: `frontend/` and `backend/` retain independent `package.json` configurations and lockfiles, preventing build-time library collisions (e.g., frontend Next.js Turbopack vs. backend `tsx` engine).
2. **Unified Root CLI**: Root-level lifecycle scripts (`npm run install:all`, `npm run dev`, `npm run build:backend`, `npm run build:frontend`) invoke nested workspaces through npm prefix flags, allowing single-command startup across both submodules.

---

## 5. The Two-Tier Reactive Engine & Mathematical Models

To withstand the physics constraints of high-speed gaming without succumbing to external internet packet latency, Jev utilizes a dual-tier reactive computing architecture:

```text
                                  ┌─────────────────────────────────────┐
                                  │       PHYSICAL ARENA (60 FPS)       │
                                  │   Hostile Plasma & Enemy Motion     │
                                  └──────────────────┬──────────────────┘
                                                     │
                                   State Snapshots   │
                                   Every Frame       ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ TIER 1: SUB-PIXEL INVERSE-DISTANCE REPULSION ENGINE (Local RAF Loop — 16.6ms / frame)                 │
 │ • Real-time Repulsion Vector: F_rep = Σ (1 / d_i²) · (Δx_i / d_i)                                     │
 │ • Emergency Flash-Thruster: If multiple threats are bounded, burst ship velocity at 12px/frame        │
 │ • Zero Hull Damage Guarantee: Instantly clears imminent bullet paths regardless of network state     │
 └───────────────────────────────────┬───────────────────────────────────────────────────────────────────┘
                                     │
                                     │ Flat JSON Payload
                                     │ (50ms - 250ms Cadence)
                                     ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ TIER 2: VERCEL AI GATEWAY / TYPESAFE DECISION STREAM (POST /api/jev-decide)                           │
 │ • Upstream: POST https://gateway.ai.vercel.com/v1/decisions (Model: typesafe/jev)                    │
 │ • Categorical Maneuvers: DODGE_LEFT (p), DODGE_RIGHT (p), FIRE_ALIGN (p), HARVEST_CORE (p)           │
 │ • Resilient Fallback: Immediate failover to local heuristic evaluation if gateway latency > 1500ms    │
 └───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Tier 1: Local Sub-Pixel Repulsive Potential Field
Every frame ($16.6\text{ms}$ interval), Cockpit 2 executes an inverse-distance potential repulsion calculation across all hostile plasma bolts within the local collision radius ($r \le 85\text{px}$):

$$F_{\text{repulsion}} = \sum_{i=1}^{N} \frac{k_{\text{danger}}}{(\Delta x_i^2 + \Delta y_i^2)} \cdot \operatorname{sgn}(\Delta x_i)$$

Where:
- $\Delta x_i = x_{\text{ship}} - x_{\text{bolt}, i}$
- $\Delta y_i = y_{\text{ship}} - y_{\text{bolt}, i}$
- $k_{\text{danger}} = 14,000$ (threat weighting scalar)

**Emergency Flash-Thruster Maneuver**: If threats converge from both flanks simultaneously ($|\Delta x_{\text{left}}| < 35\text{px}$ and $|\Delta x_{\text{right}}| < 35\text{px}$), the local engine overrides normal cruise acceleration, executing an emergency kinetic burst ($\Delta x = \pm 12\text{px/frame}$) toward the wider escape corridor, neutralizing damage spikes.

### Tier 2: Vercel AI Gateway Flat Schema Contract
On each discrete cognitive interval (configured via the 4-pill cadence bar: 50ms, 100ms, 150ms, or 250ms), the frontend dispatches a flattened JSON state representation to the backend proxy:

```json
{
  "playerX": 312,
  "playerY": 540,
  "cockpitWidth": 624,
  "bullets": [
    { "x": 308, "y": 420, "vx": 0, "vy": 5.2, "isHostile": true }
  ],
  "hostiles": [
    { "id": "enemy-w2-04", "x": 320, "y": 140, "hp": 2, "type": "scout" }
  ],
  "powerups": [
    { "id": "core-01", "x": 290, "y": 380, "type": "SHIELD" }
  ],
  "currentWave": 2
}
```

The Express service validates incoming payloads via Zod:
```typescript
export const GameStateSchema = z.object({
  playerX: z.number(),
  playerY: z.number().default(540),
  cockpitWidth: z.number().default(600),
  bullets: z.array(BulletStateSchema).default([]),
  hostiles: z.array(HostileStateSchema).default([]),
  powerups: z.array(PowerupStateSchema).default([]),
  currentWave: z.number().default(1),
});
```

And proxies the decision directly to Vercel AI Gateway:
```typescript
const response = await fetch("https://gateway.ai.vercel.com/v1/decisions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
  },
  body: JSON.stringify({
    model: "typesafe/jev",
    state: state,
    questions: {
      tactic: {
        type: "choice",
        instructions: "Select optimal maneuver.",
        criteria: {
          DODGE_LEFT: "Hazard in path, left open",
          DODGE_RIGHT: "Hazard in path, right open",
          FIRE_ALIGN: "Aligned to fire",
          HARVEST_CORE: "Harvest energy core",
        },
      },
    },
  }),
  signal: controller.signal,
});
```

---

## 6. Telemetry Matrices, Visual HUD & Hardware Interfacing

### 100vh Elastic Layout (Zero Clipping on Laptop Screens)
The dashboard interface is engineered under strict 100vh CSS flexbox and grid constraints (`h-screen max-h-screen overflow-hidden`), eliminating document-level scrollbars across laptop resolutions ranging from $1366 \times 768$ up to $1920 \times 1080$:
- **Header & Controls (`shrink-0`)**: Fixed, compact natural heights for titles, badges, timer, audio controls, and the configuration deck.
- **Telemetry Ticker Ribbon (`shrink-0`)**: Houses the dynamic system badge (`[ ⚡ JEV LIVE API (VERCEL GATEWAY) ]` or `[ ⚙️ JEV SYSTEM 1: LOCAL HEURISTIC ]`), followed by a separator dot (`•`) and the real-time raycast decision log stream.
- **Dual Cockpit Grid (`flex-1 min-h-0`)**: Elastic twin canvas viewports resize dynamically to available pixel real estate.
- **Decision Horizon Deck (`shrink-0`)**: Docked bottom operational matrix displaying tactical wave intelligence and the comparative performance delta.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ TOP HEADER: Deep Space Interceptor  •  ~100ms Cognition Engine Badge  •  Time: 00:14  •  Audio Toggle  │
 ├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ CONFIG DECK: [250ms] [150ms] [100ms] [50ms]  │  Swarm Escalation Bar  │  [ENGAGE/HALT]  [RESET]        │
 ├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ TICKER: [ ⚙️ JEV SYSTEM 1: LOCAL HEURISTIC ] • TICK #2613 (100ms): SURGICAL_WEAVE • CLEARANCE: 100%   │
 ├───────────────────────────────────────────────────┬────────────────────────────────────────────────────┤
 │ COCKPIT 1: HUMAN PILOT                            │ COCKPIT 2: JEV AUTONOMOUS AI                       │
 │ Status: [ MANUAL OVERRIDE (ACTIVE) ]              │ Status: [ GOD-TIER EVASION ]                       │
 │ Score: 0  |  Shield: 0%  |  Accuracy: 54%         │ Score: 1,630  |  Shield: 60%  |  Accuracy: 25.7%   │
 │                                                   │ ┌───────────────────────────────┐                  │
 │ [ HULL BREACHED: DESTROYED ]                      │ │ JEV COGNITIVE MATRIX          │ [SURGICAL_WEAVE] │
 │ Biological Reaction Lag Overwhelmed               │ │ SOURCE: LOCAL HEURISTIC       │                  │
 │                                                   │ └───────────────────────────────┘                  │
 │                                                   │ [ ▲ Starfighter Evading via Safe Corridor ]        │
 ├───────────────────────────────────────────────────┴────────────────────────────────────────────────────┤
 │ THE ~100MS DECISION HORIZON: [Scout Dart] [Heavy Cruiser] [Overdrive Core] [EMP Shockwave]             │
 │ Benchmark Performance Lead: Jev Dominance +1,630 Pts (Sub-Pixel Precision)                             │
 └────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Visual Audio Synthesizer (Zero External Audio Assets)
Implemented via the HTML5 Web Audio API (`AudioContext`), providing real-time procedural sound synthesis with zero external MP3/WAV dependencies:
- **Plasma Bolt Laser**: Dual high-frequency square-wave oscillators sweeping rapidly from $880\text{Hz} \to 220\text{Hz}$ in $60\text{ms}$.
- **Enemy Explosion Shockwave**: White-noise buffer passed through a low-pass resonant filter with exponential decay ($0.45\text{s}$).
- **Energy Core Harvest**: Dual sine-wave chime chord ($523.25\text{Hz} + 659.25\text{Hz}$) with subtle stereo panning.

---

## 7. Installation, Verification & Production Deployment

### Prerequisites
- **Node.js**: `v20.x` or higher (verified on `v22.x` and `v24.x`)
- **Package Manager**: `npm` (`v10.x` or higher)

### 1. Monorepo Installation
Clone the repository and install dependencies across the monorepo root, frontend, and backend with a single command:
```bash
git clone https://github.com/jacobjerryarackal/Jev-vs-Human-Deep-Space-Interceptor.git
cd Jev-vs-Human-Deep-Space-Interceptor
npm run install:all
```

### 2. Environment Configuration
Navigate to the `backend/` directory and configure environment variables:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your deployment credentials:
```ini
# Vercel AI Gateway / TypeSafe Jev System 1 Decision API configuration
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_api_key_here
PORT=5000
```
> *(Note: If `AI_GATEWAY_API_KEY` is omitted, the engine automatically runs in intelligent, ultra-responsive local heuristic fallback mode).*

### 3. Running Local Development
Launch both the Express backend (`http://localhost:5000`) and the Next.js frontend (`http://localhost:3000`) concurrently:
```bash
npm run dev
```

### 4. Health & Pipeline Verification
Execute the following verification scripts to confirm network connectivity and schema parsing:

**Probe Backend Health Endpoint:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health"
```
*Expected Output:*
```json
{
  "status": "ok",
  "service": "Jev System 1 Decision Proxy",
  "mode": "vercel-ai-gateway",
  "timestamp": "2026-09-25T01:00:00.000Z"
}
```

**Validate Jev Decision Evaluation:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/jev-decide" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"playerX": 300, "bullets": [], "hostiles": [], "powerups": []}'
```
*Expected Output:*
```json
{
  "choice": "FIRE_ALIGN",
  "probabilities": {
    "DODGE_LEFT": 0.247,
    "DODGE_RIGHT": 0.247,
    "FIRE_ALIGN": 0.272,
    "HARVEST_CORE": 0.235
  },
  "latencyMs": 14,
  "provider": "vercel-ai-gateway",
  "telemetry": {
    "threatScore": 0,
    "targetAlignmentScore": 0,
    "harvestProximityScore": 0,
    "recommendedAction": "FIRE_ALIGN"
  }
}
```

### 5. Production Compilation
Validate production readiness across both workspace projects:
```bash
npm run build:backend
npm run build:frontend
```

---

### License & Attribution
Distributed under the **MIT License**. Engineered for the **TypeSafe Jev & Vercel AI Gateway Benchmark Initiative**.
All visual design tokens, particle shaders, and Web Audio synthesizers are authored natively in TypeScript without third-party game engine dependencies.
