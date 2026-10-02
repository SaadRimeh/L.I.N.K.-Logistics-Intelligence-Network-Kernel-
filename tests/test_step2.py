import sys
import os

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.graph_service import graph_service
from backend.services.routing_engine import routing_engine
from backend.models.schemas import RouteOptimizationRequest

def run_tests():
    print("=" * 60)
    print("TESTING STEP 2: L.I.N.K. Backend & NetworkX Routing Engine")
    print("=" * 60)

    # 1. Test Graph Loading
    nodes = graph_service.get_all_nodes()
    edges = graph_service.get_all_edges()
    print(f"[OK] Nodes loaded: {len(nodes)}")
    print(f"[OK] Edges loaded: {len(edges)}")
    assert len(nodes) > 0, "No nodes loaded!"
    assert len(edges) > 0, "No edges loaded!"

    # 2. Test Normal Maritime Route (Salalah to Dammam via Hormuz)
    req_normal = RouteOptimizationRequest(
        origin_id="PORT_SALALAH",
        destination_id="PORT_DAMMAM",
        priority="time",
        allowed_modes=["MARITIME", "LAND"]
    )
    res_normal = routing_engine.find_optimal_multimodal_route(req_normal)
    print("\n--- Normal State (Hormuz OPEN) ---")
    print(f"Path: {' -> '.join(res_normal.path_node_ids)}")
    print(f"Total Time: {res_normal.total_time_hours} hrs, Cost: ${res_normal.total_cost_usd}")
    print(f"Modes: {res_normal.modes_used}")
    assert "CHOKE_HORMUZ" in res_normal.path_node_ids, "Should pass through Hormuz under normal conditions"

    # 3. Test SCENARIO 1: Strait of Hormuz Closure -> Diversion via Saudi Land Bridge
    print("\n--- SCENARIO 1: Closing Strait of Hormuz (Naval Blockade) ---")
    graph_service.set_edge_status("PORT_SALALAH", "CHOKE_HORMUZ", "CLOSED")
    graph_service.set_edge_status("CHOKE_HORMUZ", "PORT_SALALAH", "CLOSED")

    req_scenario1 = RouteOptimizationRequest(
        origin_id="PORT_SALALAH",
        destination_id="PORT_DAMMAM",
        priority="time",
        allowed_modes=["MARITIME", "LAND"],
        avoid_nodes=["CHOKE_HORMUZ"]
    )
    res_scenario1 = routing_engine.find_optimal_multimodal_route(req_scenario1)
    print(f"Optimal Reroute Path: {' -> '.join(res_scenario1.path_node_ids)}")
    print(f"Total Time: {res_scenario1.total_time_hours} hrs, Cost: ${res_scenario1.total_cost_usd}")
    print(f"Is Multi-modal: {res_scenario1.is_multimodal}")
    print(f"Modes Used: {res_scenario1.modes_used}")
    print(f"Contingency: {res_scenario1.contingency_applied}")
    assert "CHOKE_HORMUZ" not in res_scenario1.path_node_ids, "Must NOT cross closed Hormuz"
    assert "HUB_RIYADH" in res_scenario1.path_node_ids, "Must use Saudi Land Bridge (Riyadh Hub) to bypass Hormuz"
    print("[OK] Scenario 1 solved: Successfully diverted cargo to Saudi Land Bridge!")

    # 4. Test SCENARIO 3: Southern Routes Disrupted -> Turkish Lifeline Bridge via Port of Mersin
    print("\n--- SCENARIO 3: Turkish Lifeline Bridge (Port of Mersin to Riyadh) ---")
    req_scenario3 = RouteOptimizationRequest(
        origin_id="PORT_MERSIN",
        destination_id="HUB_RIYADH",
        priority="balanced",
        allowed_modes=["LAND"]
    )
    res_scenario3 = routing_engine.find_optimal_multimodal_route(req_scenario3)
    print(f"Turkish Lifeline Path: {' -> '.join(res_scenario3.path_node_ids)}")
    print(f"Total Distance: {res_scenario3.total_distance_km} km, Time: {res_scenario3.total_time_hours} hrs")
    print(f"Modes Used: {res_scenario3.modes_used}")
    assert "HUB_GAZIANTEP" in res_scenario3.path_node_ids and "HUB_ZAKHO" in res_scenario3.path_node_ids, "Must transit through Gaziantep and Zakho border"
    print("[OK] Scenario 3 solved: Successfully routed through Port of Mersin & Turkish Lifeline!")

    # Reset
    graph_service.reset_network_status()
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED! STEP 2 FULLY OPERATIONAL.")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
