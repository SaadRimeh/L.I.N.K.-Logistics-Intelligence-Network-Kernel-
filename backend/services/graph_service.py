import logging
from typing import Dict, Any, List, Optional
import networkx as nx
from backend.db.neo4j_client import neo4j_client
from backend.models.schemas import LocationNode, RouteEdge

logger = logging.getLogger("LINK.GraphService")

class GraphService:
    def __init__(self):
        self.graph = nx.MultiDiGraph()
        self.nodes_dict: Dict[str, LocationNode] = {}
        self.load_graph_from_source()

    def load_graph_from_source(self):
        """Loads nodes and edges from Neo4j (or baseline seed) into NetworkX."""
        self.graph.clear()
        self.nodes_dict.clear()

        raw_nodes = neo4j_client.fetch_all_nodes()
        for node in raw_nodes:
            loc = LocationNode(**node)
            self.nodes_dict[loc.id] = loc
            self.graph.add_node(
                loc.id,
                name=loc.name,
                name_ar=loc.name_ar,
                country=loc.country,
                lat=loc.lat,
                lon=loc.lon,
                type=loc.type,
                capacity_teu_day=loc.capacity_teu_day,
                iata=loc.iata,
                safe_haven=loc.safe_haven,
                status=loc.status
            )

        raw_edges = neo4j_client.fetch_all_edges()
        for edge in raw_edges:
            self.graph.add_edge(
                edge["source"],
                edge["target"],
                key=edge.get("route_code") or f"{edge['source']}->{edge['target']}",
                type=edge["type"],
                route_code=edge.get("route_code"),
                distance_km=float(edge["distance_km"]),
                time_hours=float(edge["time_hours"]),
                cost_usd=float(edge["cost_usd"]),
                status=edge.get("status", "OPEN"),
                risk_level=float(edge.get("risk_level", 0.0)),
                mode=edge["mode"]
            )

        logger.info(f"Loaded Digital Twin Graph: {self.graph.number_of_nodes()} nodes, {self.graph.number_of_edges()} edges.")

    def get_all_nodes(self) -> List[LocationNode]:
        return list(self.nodes_dict.values())

    def get_all_edges(self) -> List[RouteEdge]:
        edges_list: List[RouteEdge] = []
        for u, v, k, data in self.graph.edges(keys=True, data=True):
            edges_list.append(RouteEdge(
                source=u,
                target=v,
                type=data.get("type", "ROUTE"),
                route_code=data.get("route_code"),
                distance_km=data.get("distance_km", 0.0),
                time_hours=data.get("time_hours", 0.0),
                cost_usd=data.get("cost_usd", 0.0),
                status=data.get("status", "OPEN"),
                risk_level=data.get("risk_level", 0.0),
                mode=data.get("mode", "LAND")
            ))
        return edges_list

    def set_edge_status(self, source_id: str, target_id: str, status: str):
        """Sets status of an edge in memory and updates Neo4j."""
        if self.graph.has_edge(source_id, target_id):
            for k in self.graph[source_id][target_id]:
                self.graph[source_id][target_id][k]["status"] = status
            neo4j_client.update_edge_status(source_id, target_id, status)
            logger.info(f"Updated route status {source_id} -> {target_id} to {status}")

    def reset_network_status(self):
        """Resets all nodes and edges to OPEN state."""
        self.load_graph_from_source()
        for u, v, k in self.graph.edges(keys=True):
            self.graph[u][v][k]["status"] = "OPEN"
        for n in self.graph.nodes():
            self.graph.nodes[n]["status"] = "OPEN"
            if n in self.nodes_dict:
                self.nodes_dict[n].status = "OPEN"
        logger.info("Digital twin network status fully reset to OPEN.")

graph_service = GraphService()
