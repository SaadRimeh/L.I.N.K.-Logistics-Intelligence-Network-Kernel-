import sys
import os

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.graph_service import graph_service
from backend.services.collision_engine import (
    collision_engine,
    haversine_distance_km,
    calculate_initial_bearing,
    create_geodesic_danger_polygon
)
from backend.services.acled_service import acled_service
from backend.services.routing_engine import routing_engine
from backend.models.schemas import (
    ConflictEvent,
    EmergencyDivertRequest,
    RouteOptimizationRequest
)

def run_step3_tests():
    print("=" * 65)
    print("TESTING STEP 3: Collision Engine & Scenario 2 Airspace Interdiction")
    print("=" * 65)

    # 1. Test Geodesic Polygon Construction & Haversine Distance
    dist = haversine_distance_km(34.0, 49.0, 33.26, 44.23) # Central Iran to Baghdad
    bearing = calculate_initial_bearing(34.0, 49.0, 33.26, 44.23)
    poly = create_geodesic_danger_polygon(34.0, 49.0, 200.0)
    print(f"[OK] Haversine Distance (Iran to Baghdad): {round(dist, 1)} km")
    print(f"[OK] Initial Bearing: {bearing} deg")
    print(f"[OK] Geodesic Polygon created with {len(poly.exterior.coords)} boundary vertices.")
    assert dist > 300 and dist < 600, "Distance calculation sanity check failed"
    assert poly.is_valid, "Danger polygon must be a valid Shapely geometry"

    # 2. Test Geospatial Collision Detection (Iran Airspace Strike)
    iran_event = ConflictEvent(
        event_id="ACLED-TEST-IRAN-001",
        event_type="Missile strike / Active Air Defense Zone",
        location="Western Iran Corridor",
        country="Iran",
        lat=34.2,
        lon=49.5,
        radius_km=260.0,
        fatalities=0
    )

    collision_res = collision_engine.detect_and_resolve_conflict(iran_event)
    print(f"\n--- Geospatial Collision Engine Execution ---")
    print(f"Event ID: {collision_res.event_id} at {collision_res.location}")
    print(f"Corridors Closed by Collision: {collision_res.total_corridors_closed}")
    for c in collision_res.intersected_corridors:
        print(f"  - SEVERED CORRIDOR: {c['route_code']} ({c['source']} -> {c['target']})")
    
    assert collision_res.total_corridors_closed > 0, "Collision engine must detect intersecting flight corridors!"
    closed_codes = [c["route_code"] for c in collision_res.intersected_corridors]
    assert any("IKA" in code for code in closed_codes), "Corridors connecting Tehran (IKA) must be severed by Western Iran strike"
    print("[OK] Shapely Collision Detection verified: Corridors severed and marked CLOSED!")

    # 3. Test Emergency Flight Diversion to Safe Haven (Scenario 2)
    print("\n--- SCENARIO 2: In-Flight Emergency Diversion to Safe Haven ---")
    # Simulated aircraft over Western Iran
    divert_req = EmergencyDivertRequest(
        flight_callsign="UAE-992",
        current_lat=34.3,
        current_lon=48.8,
        original_destination_id="AIRPORT_IST"
    )
    divert_res = collision_engine.calculate_emergency_diversion(divert_req)
    print(f"Aircraft Callsign: {divert_res.flight_callsign}")
    print(f"Inside Conflict Zone: {divert_res.in_danger_zone}")
    print(f"Selected Safe Haven: {divert_res.nearest_safe_haven.name} ({divert_res.nearest_safe_haven.iata})")
    print(f"Distance to Safe Haven: {divert_res.distance_km} km")
    print(f"Turn Heading: {divert_res.divert_heading_degrees} deg")
    print(f"ETA to Landing: {divert_res.estimated_divert_time_min} mins")
    print(f"Vector Coordinates for Deck.gl: {divert_res.flight_vector_coordinates}")
    print(f"Advisory Directive: {divert_res.action_directive}")

    assert divert_res.nearest_safe_haven.safe_haven is True, "Must divert only to certified safe haven"
    assert divert_res.nearest_safe_haven.id in ["AIRPORT_BGW", "AIRPORT_AMM"], "Must divert to Baghdad or Amman"
    print("[OK] Scenario 2 Emergency Diversion solved: Aircraft guided safely to closest Safe Haven!")

    # 4. Test Rerouting of Commercial Traffic around Danger Zone
    print("\n--- Commercial Air Traffic Reroute around Iranian Airspace ---")
    reroute_req = RouteOptimizationRequest(
        origin_id="AIRPORT_DXB",
        destination_id="AIRPORT_IST",
        priority="time",
        allowed_modes=["AIR"],
        avoid_nodes=["AIRPORT_IKA"]  # Avoid Tehran node
    )
    reroute_res = routing_engine.find_optimal_multimodal_route(reroute_req)
    print(f"Safe Bypass Air Corridor: {' -> '.join(reroute_res.path_node_ids)}")
    print(f"Total Flight Time: {reroute_res.total_time_hours} hrs")
    assert "AIRPORT_IKA" not in reroute_res.path_node_ids, "Reroute must not cross Tehran"
    assert "AIRPORT_BGW" in reroute_res.path_node_ids or "AIRPORT_AMM" in reroute_res.path_node_ids, "Flight must bypass through Baghdad/Amman safe corridors"
    print("[OK] Traffic successfully rerouted around active conflict zone via safe corridors!")

    # Cleanup
    graph_service.reset_network_status()
    collision_engine.clear_danger_zones()
    print("\n" + "=" * 65)
    print("ALL TESTS PASSED! STEP 3 (COLLISION ENGINE) FULLY VERIFIED.")
    print("=" * 65)

if __name__ == "__main__":
    run_step3_tests()
