import logging
from contextlib import asynccontextmanager
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.db.neo4j_client import neo4j_client
from backend.services.graph_service import graph_service
from backend.services.routing_engine import routing_engine
from backend.services.collision_engine import collision_engine
from backend.services.acled_service import acled_service
from backend.services.opensky_service import opensky_service
from backend.services.decision_intelligence import decision_intelligence
from backend.models.schemas import (
    GraphResponse,
    RouteOptimizationRequest,
    RouteOptimizationResponse,
    ScenarioSimulateRequest,
    ScenarioSimulateResponse,
    ConflictEvent,
    CollisionResult,
    EmergencyDivertRequest,
    EmergencyDivertResponse
)

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("LINK.API")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing L.I.N.K. Engine & Digital Twin...")
    neo4j_client.connect()
    graph_service.load_graph_from_source()
    yield
    logger.info("Shutting down L.I.N.K. Engine...")
    neo4j_client.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Middle East Supply Chain Digital Twin & Geopolitical Logistics Intelligence API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "status": "OPERATIONAL",
        "neo4j_connected": neo4j_client.is_connected(),
        "total_nodes": graph_service.graph.number_of_nodes(),
        "total_edges": graph_service.graph.number_of_edges(),
        "active_danger_zones": len(collision_engine.get_active_danger_zones())
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "neo4j_connected": neo4j_client.is_connected(),
        "nodes_loaded": len(graph_service.nodes_dict),
        "edges_loaded": graph_service.graph.number_of_edges(),
        "active_danger_zones": len(collision_engine.get_active_danger_zones())
    }

@app.get("/api/network", response_model=GraphResponse)
def get_digital_twin_network():
    """Returns the full geospatial graph (nodes & edges) for Deck.gl & Mapbox rendering."""
    nodes = graph_service.get_all_nodes()
    edges = graph_service.get_all_edges()
    return GraphResponse(
        nodes=nodes,
        edges=edges,
        total_nodes=len(nodes),
        total_edges=len(edges)
    )

@app.post("/api/route/optimize", response_model=RouteOptimizationResponse)
def optimize_route(request: RouteOptimizationRequest):
    """Calculates optimal multi-modal routing solving chokepoint closures and lifeline paths."""
    response = routing_engine.find_optimal_multimodal_route(request)
    return response

# ==============================================================================
# Step 3: Hazard & Collision Engine Endpoints (Scenario 2)
# ==============================================================================

@app.get("/api/hazards/presets", response_model=List[ConflictEvent])
def get_conflict_presets():
    """Returns preset ACLED regional conflict events for real-time simulation."""
    return acled_service.get_simulated_events()

@app.get("/api/hazards/active")
def get_active_danger_zones():
    """Returns all active conflict danger zones with GeoJSON polygons for Deck.gl."""
    return collision_engine.get_active_danger_zones()

@app.post("/api/hazards/acled-event", response_model=CollisionResult)
def ingest_acled_event(event: ConflictEvent):
    """
    Ingests an ACLED conflict event, generates Shapely danger polygon,
    detects intersected flight corridors/routes, and closes them in Neo4j and memory.
    """
    return collision_engine.detect_and_resolve_conflict(event)

@app.post("/api/hazards/simulate-preset/{preset_index}", response_model=CollisionResult)
def simulate_acled_preset(preset_index: int):
    """Triggers preset ACLED incident (0: Iran Airspace, 1: Syria Airspace, 2: Red Sea)."""
    return acled_service.trigger_event_simulation(preset_index)

@app.post("/api/flight/emergency-divert", response_model=EmergencyDivertResponse)
def compute_emergency_diversion(request: EmergencyDivertRequest):
    """
    Computes emergency diversion vector to the nearest safe-haven airport
    (e.g., Queen Alia Intl in Amman or Baghdad Intl) when an aircraft encounters a danger zone.
    """
    return collision_engine.calculate_emergency_diversion(request)

@app.get("/api/flights/live")
def get_live_flights():
    """
    Returns real-time flights across the Middle East from OpenSky Network API.
    Identifies aircraft in danger zones and flags them RED with emergency diversion vectors.
    """
    flights = opensky_service.fetch_live_flights()
    danger_count = sum(1 for f in flights if f.get("in_danger"))
    return {
        "status": "LIVE_FEED_ACTIVE",
        "total_flights": len(flights),
        "flights_in_danger": danger_count,
        "flights": flights
    }

@app.get("/api/intelligence/evaluate")
def evaluate_systemic_crisis():
    """
    Autonomous Decision & Trade-off Optimization Engine:
    Evaluates costs, risks, operational delays, emergency anchorages, safe havens,
    and secondary cascading impacts on Middle East logistics.
    """
    return decision_intelligence.evaluate_geopolitical_crisis()

# ==============================================================================
# Geopolitical Scenario Simulators & Network Reset
# ==============================================================================

@app.post("/api/scenario/simulate", response_model=ScenarioSimulateResponse)
def simulate_geopolitical_scenario(request: ScenarioSimulateRequest):
    """
    Simulates high-impact geopolitical scenarios:
    1. 'scenario_1_maritime_closure': Strait of Hormuz closed -> reroutes cargo via Land Bridge
    2. 'scenario_2_airspace_hazard': Iranian/Syrian airspace interdiction -> closes corridors
    3. 'scenario_3_turkish_lifeline': Southern routes cut -> triggers Port of Mersin gateway
    """
    closed_edges: List[str] = []
    closed_nodes: List[str] = []

    if request.scenario_id == "scenario_1_maritime_closure":
        title = "Scenario 1: Strait of Hormuz Maritime Chokepoint Closure"
        description = "Armed conflict in the Strait of Hormuz has halted all maritime tanker and container vessel transit. Routing diverted to Saudi Land Bridge."
        closed_nodes = ["CHOKE_HORMUZ"]
        graph_service.set_edge_status("PORT_SALALAH", "CHOKE_HORMUZ", "CLOSED")
        graph_service.set_edge_status("CHOKE_HORMUZ", "PORT_SALALAH", "CLOSED")
        graph_service.set_edge_status("CHOKE_HORMUZ", "PORT_JEBEL_ALI", "CLOSED")
        graph_service.set_edge_status("PORT_JEBEL_ALI", "CHOKE_HORMUZ", "CLOSED")
        closed_edges = ["SEA-SAL-HOR", "SEA-HOR-SAL", "SEA-HOR-DXB", "SEA-DXB-HOR"]
        contingency = "Engage Multi-Modal transshipment: Unload containers at Port of Dammam / Jebel Ali; route via Saudi Land Bridge (Dammam-Riyadh-Jeddah)."

    elif request.scenario_id == "scenario_2_airspace_hazard":
        title = "Scenario 2: Iran / Syria Sudden Airspace Interdiction"
        description = "Missile threat and active conflict declared over central airspace. Commercial flight corridors closed via Shapely collision detection."
        # Trigger preset 0 (Iran Airspace) via ACLED collision engine
        res = acled_service.trigger_event_simulation(0)
        closed_edges = [c["route_code"] for c in res.intersected_corridors]
        closed_nodes = ["AIRPORT_IKA"]
        contingency = "Divert civilian and cargo flights immediately to certified Safe Havens: Amman (AMM) and Baghdad (BGW)."

    elif request.scenario_id == "scenario_3_turkish_lifeline":
        title = "Scenario 3: Southern Maritime Red Sea / Gulf Severed - Turkish Lifeline Activated"
        description = "Both Red Sea (Bab al-Mandab) and Persian Gulf are blocked. Activating northern lifeline bridge via Mersin Port."
        graph_service.set_edge_status("PORT_SALALAH", "CHOKE_BAB_EL_MANDEB", "CLOSED")
        graph_service.set_edge_status("CHOKE_BAB_EL_MANDEB", "PORT_SALALAH", "CLOSED")
        graph_service.set_edge_status("PORT_SALALAH", "CHOKE_HORMUZ", "CLOSED")
        graph_service.set_edge_status("CHOKE_HORMUZ", "PORT_SALALAH", "CLOSED")
        closed_nodes = ["CHOKE_BAB_EL_MANDEB", "CHOKE_HORMUZ"]
        closed_edges = ["SEA-SAL-BAB", "SEA-BAB-SAL", "SEA-SAL-HOR", "SEA-HOR-SAL"]
        contingency = "Re-route global container vessels to Port of Mersin (Turkey). Discharge cargo onto Northern Land Bridge (Mersin -> Gaziantep -> Zakho -> Baghdad -> Riyadh)."

    else:
        raise HTTPException(status_code=400, detail="Unknown scenario ID.")

    return ScenarioSimulateResponse(
        scenario_id=request.scenario_id,
        title=title,
        description=description,
        status="ACTIVE",
        closed_edges=closed_edges,
        closed_nodes=closed_nodes,
        recommended_contingency=contingency
    )

@app.post("/api/network/reset")
def reset_network():
    """Restores all corridors, chokepoints, and nodes to normal OPEN state, clearing danger zones."""
    graph_service.reset_network_status()
    collision_engine.clear_danger_zones()
    return {
        "status": "RESET_COMPLETE",
        "message": "All maritime routes, flight corridors, and land bridges restored to OPEN. Danger zones cleared."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.API_HOST, port=settings.API_PORT)
