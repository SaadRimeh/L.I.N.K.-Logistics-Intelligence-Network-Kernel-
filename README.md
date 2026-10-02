# L.I.N.K. (Logistics Intelligence Network Kernel)
### Logistics Intelligence & Middle East Digital Twin

L.I.N.K. is an advanced graph-powered supply chain digital twin and geopolitical risk intelligence platform for the Middle East. It models multi-modal logistics networks (ports, airports, maritime routes, flight corridors, and cross-border land bridges) as a dynamic graph to autonomously resolve disruptions.

---

## 🌍 Core Geopolitical & Logistics Scenarios

1. **Maritime Chokepoint Disruption (Strait of Hormuz & Red Sea):**
   - Autonomous diversion of maritime cargo to safe-haven transshipment ports (e.g., King Abdulaziz Port in Dammam, Jebel Ali in UAE).
   - Dynamic conversion of container freight into multi-modal trucking convoys via trans-peninsula **Land Bridges** bypassing active danger zones.

2. **Sudden Airspace Interdiction & Geospatial Collision (Iran / Syria Airspace):**
   - Real-time geospatial collision detection between conflict hazard polygons (ACLED) and flight corridors.
   - Immediate automated rerouting and diversion to certified **Safe-Haven International Airports** (Amman AMM, Baghdad BGW).

3. **Strategic Northern Lifeline (Turkey - Port of Mersin):**
   - Activation of the Mediterranean Port of Mersin as an alternative lifeline gateway when southern sea lanes are compromised.
   - Land bridge transport corridor through Gaziantep, Zakho (Ibrahim Khalil border), Baghdad, and onwards into the Arabian Gulf.

---

## 🛠️ Tech Stack

- **Graph Database:** Neo4j (AuraDB)
- **Backend API & Graph Engine:** Python, FastAPI, NetworkX, Shapely
- **Frontend & Geospatial Digital Twin:** React.js, Mapbox GL (`react-map-gl`), Deck.gl (3D arc layers & hazard zones)
- **Data Ingestion & Automation:** ACLED API, OpenSky Network API, GitHub Actions Cron Pipelines
