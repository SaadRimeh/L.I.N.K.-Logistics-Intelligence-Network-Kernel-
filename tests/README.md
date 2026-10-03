# 🧪 L.I.N.K. Automated Test Suites

This directory contains automated verification scripts testing all layers of the **L.I.N.K.** platform, from graph pathfinding and multi-modal routing to geospatial collision detection and live intelligence feeds.

---

## 📂 Test Suites Overview

| Test Script | Tested Domain | Key Test Scenarios Covered |
| :--- | :--- | :--- |
| **`test_step2.py`** | Graph Engine & Routing | Graph initialization, normal state transit, **Scenario 1 (Hormuz closure & Saudi Land Bridge)**, **Scenario 3 (Turkish Lifeline)** |
| **`test_step3.py`** | Collision Engine & Aviation | Geodesic math, Shapely LineString-Polygon intersections, **Scenario 2 (Airspace interdiction & Safe Haven diversion)**, Commercial bypass |
| **`test_step4_live_features.py`** | Live Feeds & Energy Kernel | Live AIS naval vessel tracking, Energy facilities catalog, Simulated kinetic strike on Ras Tanura, Proactive energy suggestions, Route risk analysis |

---

## 🚀 Running the Tests

Ensure your virtual environment is active, then execute each suite individually or together:

### Run All Test Suites
```bash
python tests/test_step2.py
python tests/test_step3.py
python tests/test_step4_live_features.py
```

### Combined Single-Command Run
```bash
# Windows PowerShell:
python tests/test_step2.py; python tests/test_step3.py; python tests/test_step4_live_features.py

# Linux/macOS:
python tests/test_step2.py && python tests/test_step3.py && python tests/test_step4_live_features.py
```

---

## 🔍 Detailed Test Coverage

### 1. `test_step2.py` — NetworkX Multi-Modal Routing
- Loads baseline digital twin (19 nodes, 48 corridors).
- Solves normal route from `PORT_SALALAH` to `PORT_DAMMAM` via Strait of Hormuz.
- Simulates **Scenario 1**: Strait of Hormuz closure; asserts cargo automatically diverts to the **Saudi Land Bridge** (Salalah $\to$ Bab el-Mandeb $\to$ Jeddah $\to$ Riyadh $\to$ Dammam).
- Simulates **Scenario 3**: Southern sea lane closure; asserts cargo routes via the **Turkish Lifeline** (Port of Mersin $\to$ Gaziantep $\to$ Zakho $\to$ Baghdad $\to$ Riyadh).

### 2. `test_step3.py` — Geospatial Collision & Emergency Diversion
- Tests Haversine distance and initial bearing calculations between conflict points and aerodromes.
- Creates a 65-vertex spherical geodesic hazard polygon around Western Iran / Syrian conflict coordinates.
- Asserts that Shapely accurately detects intersecting flight corridors (`AIR-DXB-IKA`, `AIR-IKA-DXB`, etc.) and severs them.
- Simulates **Scenario 2**: In-flight aircraft `UAE-992` trapped in conflict airspace; asserts that the engine guides it to the closest certified Safe Haven (Baghdad International Airport `BGW`) with correct turn heading and landing ETA.

### 3. `test_step4_live_features.py` — Live Telemetry & Energy Intelligence
- Queries `/api/vessels/live` and verifies naval contacts and threat statuses.
- Queries `/api/energy/facilities` and confirms operational baseline for 7 strategic facilities.
- Simulates a kinetic strike on **Ras Tanura (`ENERGY_RAS_TANURA`)**; verifies blast polygon generation, loss quantification, and reserve mobilization proposals.
- Queries `/api/routes/analysis` and confirms risk indexing for all 48 corridors.
