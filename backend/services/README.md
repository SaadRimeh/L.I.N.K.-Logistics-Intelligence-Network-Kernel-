# 🧩 L.I.N.K. Backend Services

The `backend/services/` package contains the core algorithmic intelligence, mathematical models, real-time data ingestion pipelines, and spatial engines powering the L.I.N.K. platform.

---

## 📋 Services Overview

| Service Module | Primary Responsibility | Algorithms & Libraries |
| :--- | :--- | :--- |
| **`opensky_service.py`** | Real-time ADS-B flight telemetry, mission categorization, and geodesic arc flight paths | OpenSky API, Bezier Curvature, Haversine |
| **`vessel_service.py`** | Naval AIS fleet tracking, tanker monitoring, and emergency berthing vectors | Geodesic Distance, Maritime Safety Thresholds |
| **`energy_intelligence.py`** | Energy infrastructure monitoring, kinetic strike blast simulation, and pipeline diversion | Geospatial Blast Radius, Outage Modeling |
| **`collision_engine.py`** | Geodesic collision detection between conflict zones and flight corridors; safe-haven diversion | Shapely (`Polygon`, `LineString`), Geodesic Math |
| **`routing_engine.py`** | Multi-modal path optimization across maritime, land, and aerial networks | NetworkX (`DiGraph`, Dijkstra, A*) |
| **`decision_intelligence.py`**| Holistic geopolitical risk scoring and autonomous operational recommendations | Multi-factor Risk Matrix, Decision Heuristics |
| **`graph_service.py`** | Neo4j AuraDB synchronization and in-memory digital twin management | Neo4j Python Driver, Graph Schema Model |
| **`acled_service.py`** | Ingestion of conflict events and transformation into dynamic hazard polygons | ACLED Conflict API, GeoJSON Polygons |

---

## 🔬 Detailed Module Breakdown

### 1. `opensky_service.py` — Air Domain & Reconnaissance
- **Geographic Bounding Box**: Extends from Egypt/Sinai in the west ($31.5^\circ\text{E}$) to Eastern Iran ($62.0^\circ\text{E}$), and Southern Turkey border ($38.5^\circ\text{N}$) to the Gulf of Aden ($12.0^\circ\text{N}$).
- **Categorization Engine**:
  - Automatically identifies airline operators via ICAO prefix rules (e.g., `UAE`, `SVA`, `QTR`, `FDB`, `ETD`, `KAC`, `OMA`, `THY`, `DLH`).
  - Classifies dedicated **Cargo** freighters (`BOX-`, `FDX-`, `UPS-`, `CLX-`).
  - Merges persistent **Defense, Early Warning & Reconnaissance Missions** (`NATO-AWACS-04`, `RSAF-AEW-02`, `PATROL-POSEIDON-8`, `USAF-RC135-RIVET`, `UAE-GLOBALEYE-1`, `FORTE-11-RECON`, `VIP-GULFSTREAM-1`) with high-visibility squawk codes (`7777`, `7776`, `7775`).
- **Trajectory Generator**: Computes a 27-point quadratic Bezier curve approximating realistic flight corridor curvature between origin and destination aerodromes.
- **Radar Trail Generator**: Projects 4-step dynamic radar breadcrumb trails based on real-time ground speed and heading.

### 2. `vessel_service.py` — Maritime Domain & AIS
- Tracks crude supertankers (VLCC), LNG carriers, container mega-ships, and general bulk vessels.
- Evaluates proximity to high-risk maritime straits (**Strait of Hormuz** and **Bab el-Mandeb**).
- When a vessel enters an active danger zone, computes an autonomous redirection vector to the nearest safe emergency anchorage port (e.g. Port of Fujairah, Jebel Ali Anchorage, Port of Salalah).

### 3. `energy_intelligence.py` — Energy Defense & Strike Kernel
- Catalogs critical infrastructure across the Arabian Gulf & Red Sea:
  - **Ras Tanura Refinery & Crude Terminal** (Saudi Arabia) — Capacity: 6.5M bpd
  - **Yanbu Crude Oil Export & Petrochemical Terminal** (Saudi Arabia) — Capacity: 3.0M bpd
  - **Mina Al-Ahmadi Refinery Complex** (Kuwait) — Capacity: 466k bpd
  - **Das Island Crude & Gas Processing Terminal** (UAE) — Capacity: 2.3M bpd
  - **Ras Laffan Industrial City & LNG Hub** (Qatar) — Capacity: 77M MTA
- **Simulated Kinetic Strike Engine**:
  - Triggers blast zone calculations with dynamic evacuation radiuses ($45$ km).
  - Calculates daily oil/gas output deficit and economic disruption costs.
  - Automatically recommends alternative transport conduits, such as activating the **Petroline (East-West Pipeline)** to bypass the Persian Gulf.

### 4. `collision_engine.py` — Geospatial Interdiction
- Utilizes **Shapely** geometric primitives to detect spatial overlaps between flight corridor vectors (`LineString`) and active geopolitical conflict hazard zones (`Polygon`).
- When a collision is identified, the affected corridor is immediately severed (`status = CLOSED`).
- Calculates in-flight emergency diversion parameters:
  - Selects the nearest certified **Safe-Haven International Airport** (e.g., Queen Alia Amman `AMM` or Baghdad `BGW`).
  - Computes initial evasive heading angle ($\theta$), distance ($d$), and estimated flight minutes to emergency landing.

### 5. `routing_engine.py` — Multi-Modal Optimization
- Constructs a directed multi-modal graph connecting seaports, airports, logistics dry ports, and strategic chokepoints.
- Weighting function balances transit time, fuel/freight cost, and geopolitical risk penalties:
  $$\text{Weight} = w_t \cdot \text{Time} + w_c \cdot \text{Cost} + w_r \cdot \text{RiskPenalty}$$
- Dynamically orchestrates multi-modal transfer nodes (e.g. converting container freight at Port of Salalah or Jeddah to rail/truck for trans-peninsular transport across the **Saudi Land Bridge**).

### 6. `decision_intelligence.py` — Executive Synthesis
- Computes aggregate network health, active hazard count, severed corridor percentages, and overall geopolitical stress indices.
- Outputs structured recommendations for strategic command dashboards.
