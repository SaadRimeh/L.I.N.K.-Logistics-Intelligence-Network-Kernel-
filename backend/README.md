# ⚙️ L.I.N.K. Backend (FastAPI Core & Graph Engine)

This directory contains the central server and analytical compute engine for the **Logistics Intelligence Network Kernel (L.I.N.K.)**. Built on **FastAPI**, **NetworkX**, and **Shapely**, it handles real-time flight ingestion, maritime AIS vessel telemetry, geopolitical hazard intersection, multi-modal routing optimization, and strategic energy infrastructure defense.

---

## 🏛️ Directory Architecture

```
backend/
├── main.py                  # FastAPI application entry point, CORS, and REST endpoints
├── config.py                # Environment configuration & credential management
├── requirements.txt         # Python package dependencies
├── .env.example             # Template for API keys and Neo4j credentials
├── db/                      # Database connectors & Neo4j driver wrappers
│   └── neo4j_client.py      # Neo4j AuraDB driver with local fallback digital twin
├── models/                  # Pydantic schemas for request validation & serialization
│   └── schemas.py           # Data structures for nodes, routes, hazard events, and diversions
└── services/                # Specialized domain compute engines (See services/README.md)
    ├── acled_service.py     # Ingestion of ACLED conflict hazard polygons
    ├── collision_engine.py  # Geospatial LineString-Polygon intersection & evasive vectors
    ├── decision_intelligence.py # Network-wide risk evaluation & autonomous directives
    ├── energy_intelligence.py   # Energy infrastructure monitoring & kinetic strike simulation
    ├── graph_service.py     # Graph database query wrapper & network state synchronization
    ├── opensky_service.py   # Live Middle East ADS-B telemetry, classification, and defense patrol
    ├── routing_engine.py    # Multi-modal Dijkstra/A* path optimizer with penalty weighting
    └── vessel_service.py    # AIS naval vessel tracking, tanker risk alerts, & emergency berthing
```

---

## 🚀 Key Functional Modules

### 1. Graph Twin & Routing Engine (`routing_engine.py` & `graph_service.py`)
- Maintains an in-memory `networkx.DiGraph` synchronized with Neo4j.
- Supports weighted multi-criteria routing:
  - **`time` priority**: Minimizes transit hours across air, maritime, and land legs.
  - **`cost` priority**: Minimizes tariff and fuel expenditures per container/TEU.
  - **`risk` priority**: Heavily penalizes corridors near conflict hazards or closed straits.
  - **`balanced` priority**: Pareto-optimal trade-off across all parameters.
- Converts sea cargo into trucking convoys over the **Saudi Land Bridge** (Dammam ⇄ Riyadh ⇄ Jeddah).

### 2. Geospatial Collision Engine (`collision_engine.py`)
- Converts conflict coordinates into spherical geodesic hazard polygons.
- Uses **Shapely** to compute spatial intersections between flight corridor arcs and active hazard zones.
- Calculates in-flight evasive turn vectors (heading angle, distance, ETA) toward certified **Safe Haven International Airports** (Amman AMM, Baghdad BGW).

### 3. OpenSky ADS-B & Defense Surveillance Fleet (`opensky_service.py`)
- Polls the OpenSky Network API across the Middle East bounding box (`12.0°N` to `38.5°N`, `31.5°E` to `62.0°E`).
- Real-time classification engine:
  - `COMMERCIAL`: Major international and regional passenger airliners.
  - `CARGO`: Emirates SkyCargo, Saudia Cargo, Qatar Cargo, DHL, FedEx.
  - `MILITARY` / `DEFENSE`: Airborne early warning (AWACS E-3A), maritime surveillance (P-8A Poseidon), and strategic electronic recon (RC-135V, Global Hawk).
  - `VIP`: Executive governmental transport.
- Generates 27-point geodesic flight path arcs (`- - - - -`) and radar breadcrumb trails for each aircraft.

### 4. Energy Intelligence & Kinetic Strike Kernel (`energy_intelligence.py`)
- Catalogs critical Gulf and Red Sea petroleum refineries, storage tanks, and export terminals.
- Simulates kinetic drone/missile strikes with customizable blast radiuses ($45$ km).
- Quantifies daily export capacity loss (bpd) and generates mitigation options (pipeline switching, reserve mobilization).

---

## 🛠️ Setup & Running

### 1. Virtual Environment & Dependencies
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Environment Variables (`.env`)
Create a `.env` file in `backend/`:
```env
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
PORT=8000
```
*(If Neo4j credentials are not provided, the backend automatically initializes an in-memory high-fidelity digital twin).*

### 3. Run FastAPI Development Server
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 📡 REST API Documentation

Once the server is running, interactive Swagger documentation is available at:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`
