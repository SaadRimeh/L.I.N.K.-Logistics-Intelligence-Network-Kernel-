# 🖥️ L.I.N.K. Frontend (Tactical Digital Twin UI)

The frontend application of **L.I.N.K. (Logistics Intelligence Network Kernel)** is a high-performance, real-time command-and-control digital twin web interface built with **React 18**, **Vite**, and **Mapbox GL JS**.

---

## 🎨 Visual Design & Tactical Aesthetics

The interface is engineered with a **military-grade tactical HUD aesthetic**:
- **Palette**: Deep void navy backgrounds (`#0a0f1d`, `#050c16`), luminous cyan highlights (`#00f2fe`), tactical reconnaissance purple (`#c084fc`), amber alert indicators (`#fbbf24`), and kinetic danger crimson (`#ef4444`, `#ff2a5f`).
- **Typography**: Industrial monospace & geometric sans-serif fonts optimized for telemetry legibility.
- **Glassmorphism**: Multi-layer blurred backdrop panels (`backdrop-filter: blur(16px)`).
- **Smooth 3D Geodesic Curves**: Flight trajectories and maritime diversion channels rendered as quadratic Bezier curves with directional pulsing animations.

---

## 🏛️ Directory Structure

```
frontend/
├── index.html                   # HTML5 app shell & Mapbox stylesheet links
├── package.json                 # Node dependencies (React 18, Mapbox-gl, Lucide-react)
├── vite.config.js               # Vite bundling & development server settings
├── .env                         # Environment variables (VITE_MAPBOX_TOKEN)
└── src/
    ├── main.jsx                 # React root renderer
    ├── App.jsx                  # Master state orchestrator (polls feeds every 2.5s)
    ├── App.css                  # Component-level styling & animations
    ├── index.css                # Global cybernetic design system, CSS variables & badges
    └── components/              # Specialized UI modules (See components/README.md)
        ├── MapDeckView.jsx      # Mapbox GL 3D vector map & dashed flight tracks
        ├── ControlPanel.jsx     # Strategic domain filtering & multi-modal route engine
        ├── LiveRadarScope.jsx   # 360° sweeping tactical military radar HUD
        ├── EnergyIntelligenceDeck.jsx # Kinetic strike simulator & oil export tracker
        ├── DecisionDeck.jsx     # Geopolitical AI analysis & crisis simulation deck
        ├── EmergencyModal.jsx   # In-flight airspace collision & diversion modal
        ├── TelemetryDossier.jsx # Selected flight/vessel telemetry inspection drawer
        └── Navbar.jsx           # Global status bar, active hazard badges, & radar toggle
```

---

## 🚀 Setup & Execution

### 1. Install Node Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment (`.env`)
Ensure your Mapbox public token is defined in `frontend/.env`:
```env
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJ5b3VyLXRva2VuIn0...
```

### 3. Start Local Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173/`.

### 4. Production Build & Optimization
```bash
npm run build
```
Creates an optimized, tree-shaken production bundle in `dist/`.
