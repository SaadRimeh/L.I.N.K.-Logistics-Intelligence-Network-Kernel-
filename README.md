# 🌐 L.I.N.K. (Logistics Intelligence Network Kernel)
### Middle East Multi-Modal Digital Twin & Strategic Risk Intelligence Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Mapbox](https://img.shields.io/badge/Geospatial-Mapbox%20GL%20JS-000000.svg?logo=mapbox&logoColor=white)](https://www.mapbox.com/)
[![Neo4j](https://img.shields.io/badge/Graph%20DB-Neo4j%20AuraDB-008CC1.svg?logo=neo4j&logoColor=white)](https://neo4j.com/)
[![NetworkX](https://img.shields.io/badge/Routing-NetworkX-00599C.svg)](https://networkx.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Executive Overview

**L.I.N.K. (Logistics Intelligence Network Kernel)** is an enterprise-grade digital twin and geopolitical decision intelligence platform tailored for the **Middle East & Red Sea / Arabian Gulf maritime and aerial theaters**. 

The system continuously models multi-modal supply chains—encompassing commercial container shipping, oil tankers, civil aviation, air defense/reconnaissance missions, strategic energy refineries, and regional land bridge corridors—as a high-performance **Directed Graph**. When geopolitical escalations, maritime blockades, or missile strikes occur, L.I.N.K. autonomously recalculates optimal resilient corridors, orchestrates emergency air diversions, triggers maritime transshipment maneuvers, and generates actionable military-grade intelligence dossiers.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Data Feeds & External Intelligence
        OPENSKY[OpenSky Network API<br/>Real-time Middle East ADS-B Telemetry]
        AIS[Live Maritime AIS Feed<br/>Tankers, VLCCs & Cargo Vessels]
        ACLED[ACLED Conflict Hazards<br/>Geopolitical Hazard Polygons]
        ENERGY_SRC[Energy Infrastructure Feed<br/>Ras Tanura, Yanbu, Jizan, Mina Al-Ahmadi]
    end

    subgraph Backend Core (FastAPI & Graph Engine)
        API[FastAPI Core Server :8000]
        GRAPH[Graph Service & NetworkX Engine<br/>Multi-Modal Cost & Dijkstra Optimization]
        COLLISION[Shapely Geospatial Collision Engine<br/>Polygon-LineString Interdiction & Vector Divert]
        DECISION[Decision Intelligence Evaluator<br/>Autonomous Risk Scenarios & Recommendations]
        ENERGY_KERNEL[Energy Intelligence & Kinetic Strike Engine<br/>Vulnerability Scoring & Evacuation Radius]
        NEO4J[(Neo4j AuraDB Graph Twin<br/>Ports, Hubs, Chokepoints, Corridors)]
    end

    subgraph Tactical Frontend (Vite + React 18)
        MAP[Mapbox GL Dark-v11 3D Canvas<br/>Dashed Arcs, Blast Zones, Flight Vectors]
        HUD[Live 360° Tactical Radar HUD<br/>Air & Naval Target Tracking & Sweeper]
        ENERGY_DECK[Energy & Infrastructure Intelligence Deck<br/>Simulated Kinetic Strikes & Strategic Reserves]
        CTRL[Operational Domain Control Panel<br/>Maritime, Air, Defense, Land, Energy, Unified]
        DOSSIER[Telemetry Dossier Drawer<br/>Real-time Squawk, Speed, Safe Haven Guidance]
    end

    OPENSKY --> API
    AIS --> API
    ACLED --> API
    ENERGY_SRC --> API
    API --> GRAPH
    API --> COLLISION
    API --> DECISION
    API --> ENERGY_KERNEL
    GRAPH <--> NEO4J
    API <--> MAP
    API <--> HUD
    API <--> ENERGY_DECK
    API <--> CTRL
    API <--> DOSSIER
```

---

## ⚡ Core Operational Capabilities

### 1. 🛡️ Defense & Reconnaissance Operations (دفاع واستطلاع)
- Dedicated tracking and monitoring of airborne early warning (AEW&C), maritime patrol, and electronic surveillance assets across Middle Eastern airspace.
- **Active Reconnaissance Assets Tracked**:
  - `NATO-AWACS-04` (Boeing E-3A Sentry AWACS)
  - `RSAF-AEW-02` (Royal Saudi Air Force E-3A Sentry)
  - `PATROL-POSEIDON-8` (Boeing P-8A Poseidon Maritime Surveillance)
  - `USAF-RC135-RIVET` (Boeing RC-135V Rivet Joint Electronic Recon)
  - `UAE-GLOBALEYE-1` (Bombardier GlobalEye AEW&C)
  - `FORTE-11-RECON` (Northrop Grumman RQ-4 Global Hawk)
  - `VIP-GULFSTREAM-1` (Executive Government Aircraft)
- High-visibility tactical purple indicators, squawk transponder tracking (`7777`, `7776`, etc.), and dedicated sidebar filters synchronized with the map.

### 2. ✈️ Flight Corridor Visualization & Single-Flight Isolation (`- - - - -`)
- Over 130 simultaneous live and operational aircraft rendered as 3D curved geodesic arcs across the region.
- All flight corridors styled as distinctive dashed lines (`- - - - - - - - - - - -`).
- **Focus & Isolate Interaction**: Clicking any aircraft isolates its single dashed trajectory while instantaneously concealing all other trajectories. Re-clicking the aircraft or clicking the map canvas restores the global trajectory view.

### 3. 🎯 360° Tactical Military Radar Scope (HUD)
- Canvas-rendered circular radar sweep with customizable range rings ($200$ NM, $400$ NM, $600$ NM, $800$ NM).
- Independent tracking filters: **كافة الأهداف (All Contacts)**, **طيران جوي (Air Traffic)**, **دفاع واستطلاع (Defense & Recon)**, and **أهداف بحرية (Naval AIS)**.
- Target acquisition lock with live coordinates, altitude, heading, and distance-to-center metrics.

### 4. 🛢️ Strategic Energy & Infrastructure Defense Kernel
- Direct monitoring of Gulf & Red Sea critical petroleum hubs: **Ras Tanura (Saudi Arabia)**, **Yanbu Petrochemical Complex**, **Mina Al-Ahmadi (Kuwait)**, **Das Island (UAE)**, and **Ras Laffan LNG Terminal (Qatar)**.
- **Simulated Kinetic Strike Module**: Calculates real-time blast radius ($45$ km evacuation zone), infrastructure outage percentage, oil supply disruption volume ($1.8$M bpd), and recommends immediate strategic reserves pipeline diversions (e.g. Petroline East-West pipeline to Yanbu).

### 5. 🚢 Naval Fleet Tracking & Chokepoint Rerouting
- Live monitoring of crude oil carriers, LNG tankers, container vessels, and chemical carriers passing through the **Strait of Hormuz**, **Bab el-Mandeb**, and the **Suez Canal**.
- Automated emergency anchorage orders when proximity to active conflict zones exceeds safe maritime security thresholds.

---

## 🕹️ Geopolitical Crisis Scenarios

| Scenario ID | Name | Trigger Event | Autonomous Algorithmic Response |
| :--- | :--- | :--- | :--- |
| **Scenario 1** | **Strait of Hormuz Closure** | Naval mining & drone swarm harassment blocking Persian Gulf exit | Cargo is automatically diverted to Salalah / Fujairah; container freight converted into Saudi Land Bridge rail/truck convoys directly to Dammam & Riyadh. |
| **Scenario 2** | **Airspace Conflict Hazard** | Kinetic surface-to-air missile exchange over Western Iran / Syria | Shapely collision engine intercepts route; issues emergency in-flight turn directive toward nearest certified Safe Haven (Amman AMM or Baghdad BGW). |
| **Scenario 3** | **Turkish Lifeline Corridor** | Southern maritime routes interdicted in Gulf of Aden | System opens Mediterranean transit through the Port of Mersin, routing overland via Gaziantep, Zakho (Ibrahim Khalil border), and Baghdad into the Gulf. |

---

## 📂 Repository Structure

Each subdirectory includes an exhaustive, dedicated documentation file:

```
L.I.N.K./
├── README.md                      # Primary project overview & architecture (This file)
├── backend/                       # FastAPI core server & graph execution layer
│   ├── README.md                  # Backend architecture, requirements & endpoints
│   ├── config.py                  # Environment configurations & API secrets
│   ├── main.py                    # REST API endpoints & route handlers
│   ├── db/                        # Neo4j client & driver connection management
│   ├── models/                    # Pydantic data validation schemas
│   └── services/                  # Algorithmic and intelligence services
│       └── README.md              # Deep dive into all 8 intelligence services
├── database/                      # Neo4j graph database definitions
│   ├── README.md                  # Cypher seed schemas, nodes & relationships
│   └── schema_and_seed.cypher     # Production graph seed script
├── frontend/                      # Vite + React 18 digital twin application
│   ├── README.md                  # Frontend setup, styling system & dependencies
│   ├── index.html                 # App shell entry point
│   ├── src/                       # React components & application state
│   │   ├── App.jsx                # Global state orchestrator
│   │   └── components/            # Interactive Deck.gl & Mapbox components
│   │       └── README.md          # Comprehensive UI component breakdown
└── tests/                         # Automated verification & test suites
    └── README.md                  # Test execution instructions & scenario coverage
```

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Python**: 3.10+ (Tested on Python 3.12 / 3.14)
- **Node.js**: 18.0+ (with npm)
- **Mapbox API Token**: Free token from [Mapbox](https://www.mapbox.com/)
- **Neo4j** (Optional): Local instance or Neo4j AuraDB free cloud instance (Fallback mock twin included)

### 1. Clone Repository
```bash
git clone https://github.com/SaadRimeh/L.I.N.K.-Logistics-Intelligence-Network-Kernel-.git
cd "L.I.N.K.-Logistics-Intelligence-Network-Kernel-"
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API documentation available at `http://127.0.0.1:8000/docs`.*

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
# Set Mapbox token in frontend/.env:
# VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here
npm run dev
```
*Web application available at `http://localhost:5173/`.*

### 4. Running Verification Test Suites
```bash
python tests/test_step2.py
python tests/test_step3.py
python tests/test_step4_live_features.py
```

---

## 📡 Core API Reference Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/network` | Retrieves the full Neo4j digital twin topology (nodes, edges, capacities). |
| `GET` | `/api/flights/live` | Returns live Middle East flight telemetry classified by commercial, cargo, and defense. |
| `GET` | `/api/vessels/live` | Returns maritime AIS vessel coordinates, cargo type, and threat alerts. |
| `GET` | `/api/energy/facilities` | Returns all critical energy refineries, LNG terminals, and operational statuses. |
| `POST`| `/api/route/optimize` | Calculates optimal multi-modal path with constraint weighting (time vs cost vs risk). |
| `POST`| `/api/flight/emergency-divert` | Computes in-flight evasive vector toward nearest safe-haven airport. |
| `POST`| `/api/scenario/simulate` | Triggers geopolitical stress scenarios (Hormuz closure, Airspace interdiction). |
| `GET` | `/api/intelligence/evaluate` | Evaluates holistic network risk index and generates autonomous directives. |

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for full details.
