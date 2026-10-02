import math
import logging
from typing import List, Dict, Any, Optional, Tuple
import networkx as nx
from backend.services.graph_service import graph_service
from backend.models.schemas import (
    LocationNode,
    RouteSegment,
    RouteOptimizationRequest,
    RouteOptimizationResponse
)

logger = logging.getLogger("LINK.RoutingEngine")

class MultiModalRoutingEngine:
    def __init__(self):
        pass

    def _calculate_edge_weight(
        self,
        edge_data: Dict[str, Any],
        priority: str,
        prev_mode: Optional[str] = None
    ) -> float:
        """Calculates dynamic cost based on status, time, financial cost, risk, and mode transition."""
        status = edge_data.get("status", "OPEN")
        if status in ["CLOSED", "BLOCKED"]:
            return float("inf")

        distance_km = edge_data.get("distance_km", 100.0)
        time_hours = edge_data.get("time_hours", 5.0)
        cost_usd = edge_data.get("cost_usd", 500.0)
        risk_level = edge_data.get("risk_level", 0.0)
        mode = edge_data.get("mode", "LAND")

        # Base normalization weights
        if priority == "time":
            w_time, w_cost, w_risk = 0.70, 0.15, 0.15
        elif priority == "cost":
            w_time, w_cost, w_risk = 0.15, 0.70, 0.15
        elif priority == "risk":
            w_time, w_cost, w_risk = 0.10, 0.10, 0.80
        else:  # balanced
            w_time, w_cost, w_risk = 0.40, 0.35, 0.25

        time_term = (time_hours / 24.0) * 10.0
        cost_term = (cost_usd / 1000.0) * 5.0
        risk_term = (risk_level * 50.0)

        base_weight = (w_time * time_term) + (w_cost * cost_term) + (w_risk * risk_term)

        # Intermodal transfer penalty (friction of transshipment / customs)
        transfer_penalty = 0.0
        if prev_mode and prev_mode != mode:
            transfer_penalty = 15.0  # Transshipment overhead penalty

        return base_weight + transfer_penalty

    def find_optimal_multimodal_route(self, request: RouteOptimizationRequest) -> RouteOptimizationResponse:
        """Computes the optimal path supporting multi-modal diversion across land bridges & ports."""
        G = graph_service.graph
        nodes_dict = graph_service.nodes_dict

        origin_id = request.origin_id
        dest_id = request.destination_id

        if origin_id not in G or dest_id not in G:
            return RouteOptimizationResponse(
                success=False,
                message=f"Origin '{origin_id}' or Destination '{dest_id}' not found in Digital Twin graph.",
                origin=nodes_dict.get(origin_id, LocationNode(id=origin_id, name="Unknown", country="", lat=0, lon=0, type="")),
                destination=nodes_dict.get(dest_id, LocationNode(id=dest_id, name="Unknown", country="", lat=0, lon=0, type="")),
                path_node_ids=[],
                segments=[],
                total_distance_km=0.0,
                total_time_hours=0.0,
                total_cost_usd=0.0,
                aggregate_risk=0.0,
                is_multimodal=False,
                modes_used=[]
            )

        # Build a temporary weighted directed graph respecting allowed modes and active blocks
        subgraph = nx.DiGraph()

        for u, v, k, data in G.edges(keys=True, data=True):
            # Check edge status
            if data.get("status") in ["CLOSED", "BLOCKED"]:
                continue
            # Check mode restriction
            mode = data.get("mode", "LAND")
            if mode not in request.allowed_modes and data.get("type") != "INTERMODAL_TRANSFER":
                continue
            # Check avoided nodes
            if u in request.avoid_nodes or v in request.avoid_nodes:
                continue
            # Check avoided route codes
            route_code = data.get("route_code")
            if route_code and route_code in request.avoid_edges:
                continue

            weight = self._calculate_edge_weight(data, request.priority)
            if math.isinf(weight):
                continue

            # In DiGraph, keep the lowest weight edge if multiple connections exist between u and v
            if subgraph.has_edge(u, v):
                if weight < subgraph[u][v]["weight"]:
                    subgraph.add_edge(u, v, weight=weight, raw_data=data)
            else:
                subgraph.add_edge(u, v, weight=weight, raw_data=data)

        try:
            path_node_ids = nx.dijkstra_path(subgraph, origin_id, dest_id, weight="weight")
        except (nx.NetworkXNoPath, nx.NodeNotFound) as e:
            logger.warning(f"No available path between {origin_id} and {dest_id} due to restrictions or closures.")
            return RouteOptimizationResponse(
                success=False,
                message=f"No viable path found between {origin_id} and {dest_id}. All connecting corridors may be blocked or restricted.",
                origin=nodes_dict[origin_id],
                destination=nodes_dict[dest_id],
                path_node_ids=[],
                segments=[],
                total_distance_km=0.0,
                total_time_hours=0.0,
                total_cost_usd=0.0,
                aggregate_risk=1.0,
                is_multimodal=False,
                modes_used=[],
                bottlenecks_encountered=["ACTIVE_CHOKEPOINT_OR_AIRSPACE_BLOCK"]
            )

        # Construct segments & tally totals
        segments: List[RouteSegment] = []
        total_dist = 0.0
        total_time = 0.0
        total_cost = 0.0
        risk_accum = 0.0
        modes_used_set = set()
        bottlenecks = []
        contingency_note = None

        for i in range(len(path_node_ids) - 1):
            u_id = path_node_ids[i]
            v_id = path_node_ids[i + 1]
            edge_info = subgraph[u_id][v_id]["raw_data"]

            u_node = nodes_dict[u_id]
            v_node = nodes_dict[v_id]

            mode = edge_info.get("mode", "LAND")
            dist = edge_info.get("distance_km", 0.0)
            time_h = edge_info.get("time_hours", 0.0)
            cost = edge_info.get("cost_usd", 0.0)
            risk = edge_info.get("risk_level", 0.0)
            status = edge_info.get("status", "OPEN")

            total_dist += dist
            total_time += time_h
            total_cost += cost
            risk_accum = max(risk_accum, risk)
            modes_used_set.add(mode)

            # Check if land bridge was triggered to bypass Hormuz or Bab al-Mandab
            if mode == "LAND" and ("DAM" in u_id or "RUH" in u_id or "JED" in u_id or "MER" in u_id):
                if "PORT_MERSIN" in path_node_ids:
                    contingency_note = "Scenario 3 Activated: Turkish Lifeline Bridge enabled via Port of Mersin & Zakho corridor."
                elif any(choke in request.avoid_nodes or G.nodes.get(choke, {}).get("status") == "CLOSED" for choke in ["CHOKE_HORMUZ", "CHOKE_BAB_EL_MANDEB"]):
                    contingency_note = "Scenario 1 Activated: Multi-Modal Saudi Land Bridge bypass engaged around maritime chokepoints."

            # Build Deck.gl coordinate pair [[lon, lat], [lon, lat]]
            coords = [[u_node.lon, u_node.lat], [v_node.lon, v_node.lat]]

            segments.append(RouteSegment(
                source_id=u_id,
                source_name=u_node.name,
                target_id=v_id,
                target_name=v_node.name,
                mode=mode,
                distance_km=dist,
                time_hours=time_h,
                cost_usd=cost,
                risk_level=risk,
                status=status,
                coordinates=coords
            ))

        is_multimodal = len(modes_used_set) > 1

        return RouteOptimizationResponse(
            success=True,
            message="Optimal multi-modal routing successfully calculated.",
            origin=nodes_dict[origin_id],
            destination=nodes_dict[dest_id],
            path_node_ids=path_node_ids,
            segments=segments,
            total_distance_km=round(total_dist, 2),
            total_time_hours=round(total_time, 2),
            total_cost_usd=round(total_cost, 2),
            aggregate_risk=round(risk_accum, 3),
            is_multimodal=is_multimodal,
            modes_used=list(modes_used_set),
            bottlenecks_encountered=bottlenecks,
            contingency_applied=contingency_note
        )

routing_engine = MultiModalRoutingEngine()
