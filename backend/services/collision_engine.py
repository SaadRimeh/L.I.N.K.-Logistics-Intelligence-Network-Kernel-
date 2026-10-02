import math
import logging
from typing import List, Dict, Any, Tuple, Optional
from shapely.geometry import Point, LineString, Polygon, mapping
from shapely import distance

from backend.services.graph_service import graph_service
from backend.models.schemas import (
    ConflictEvent,
    CollisionResult,
    EmergencyDivertRequest,
    EmergencyDivertResponse,
    LocationNode
)

logger = logging.getLogger("LINK.CollisionEngine")

EARTH_RADIUS_KM = 6371.0

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points on Earth in kilometers."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c

def calculate_initial_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates forward compass heading in degrees from point 1 to point 2 (0-360 deg)."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    lambda1, lambda2 = math.radians(lon1), math.radians(lon2)

    y = math.sin(lambda2 - lambda1) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - \
        math.sin(phi1) * math.cos(phi2) * math.cos(lambda2 - lambda1)

    initial_bearing = math.degrees(math.atan2(y, x))
    compass_bearing = (initial_bearing + 360) % 360
    return round(compass_bearing, 1)

def create_geodesic_danger_polygon(center_lat: float, center_lon: float, radius_km: float, num_points: int = 64) -> Polygon:
    """Creates a circular polygon (in lon, lat coordinates) approximating the danger perimeter."""
    points = []
    angular_dist = radius_km / EARTH_RADIUS_KM
    lat1 = math.radians(center_lat)
    lon1 = math.radians(center_lon)

    for i in range(num_points):
        bearing = math.radians((i * 360.0) / num_points)
        lat2 = math.asin(
            math.sin(lat1) * math.cos(angular_dist) +
            math.cos(lat1) * math.sin(angular_dist) * math.cos(bearing)
        )
        lon2 = lon1 + math.atan2(
            math.sin(bearing) * math.sin(angular_dist) * math.cos(lat1),
            math.cos(angular_dist) - math.sin(lat1) * math.sin(lat2)
        )
        points.append((math.degrees(lon2), math.degrees(lat2)))

    # Close polygon
    points.append(points[0])
    return Polygon(points)


class CollisionEngine:
    def __init__(self):
        self.active_danger_zones: List[Dict[str, Any]] = []

    def detect_and_resolve_conflict(self, event: ConflictEvent) -> CollisionResult:
        """
        Receives an ACLED conflict event, generates a spatial Danger Zone with Shapely,
        detects intersecting corridors, and automatically flips their status to CLOSED.
        """
        logger.info(f"Processing ACLED Conflict Event: {event.event_id} at ({event.lat}, {event.lon}) with radius {event.radius_km}km")
        
        # 1. Create Shapely Hazard Polygon
        hazard_polygon = create_geodesic_danger_polygon(event.lat, event.lon, event.radius_km)
        hazard_geojson = mapping(hazard_polygon)

        # Record active danger zone for UI layer
        danger_zone_record = {
            "event_id": event.event_id,
            "location": event.location,
            "country": event.country,
            "center": [event.lon, event.lat],
            "radius_km": event.radius_km,
            "polygon": hazard_geojson,
            "severity": event.fatalities or 1
        }
        self.active_danger_zones.append(danger_zone_record)

        # 2. Inspect all corridors in Digital Twin for spatial intersection
        G = graph_service.graph
        nodes_dict = graph_service.nodes_dict

        intersected_corridors = []

        for u, v, k, data in G.edges(keys=True, data=True):
            if u not in nodes_dict or v not in nodes_dict:
                continue

            node_u = nodes_dict[u]
            node_v = nodes_dict[v]

            # LineString in (lon, lat) matching GeoJSON standard
            corridor_line = LineString([(node_u.lon, node_u.lat), (node_v.lon, node_v.lat)])

            # Spatial intersection check
            if hazard_polygon.intersects(corridor_line):
                route_code = data.get("route_code") or f"{u}->{v}"
                logger.warning(f"GEOSPATIAL COLLISION DETECTED: Route '{route_code}' ({u} -> {v}) intersects Conflict Zone {event.event_id}")

                # Automatically update status in Graph Service & Neo4j
                graph_service.set_edge_status(u, v, "CLOSED")

                intersected_corridors.append({
                    "source": u,
                    "source_name": node_u.name,
                    "target": v,
                    "target_name": node_v.name,
                    "type": data.get("type"),
                    "route_code": route_code,
                    "mode": data.get("mode"),
                    "status_updated_to": "CLOSED",
                    "coordinates": [[node_u.lon, node_u.lat], [node_v.lon, node_v.lat]]
                })

        advisory = (
            f"ALERT: Airspace Interdiction over {event.location} ({event.country}). "
            f"{len(intersected_corridors)} corridors severed. "
            f"Emergency safe haven diversion protocols engaged for Queen Alia Intl (AMM) and Baghdad Intl (BGW)."
        )

        return CollisionResult(
            event_id=event.event_id,
            location=event.location,
            danger_zone_polygon=hazard_geojson,
            intersected_corridors=intersected_corridors,
            total_corridors_closed=len(intersected_corridors),
            emergency_advisory=advisory
        )

    def calculate_emergency_diversion(self, request: EmergencyDivertRequest) -> EmergencyDivertResponse:
        """
        Scenario 2 Core: Given aircraft coordinates over a conflict zone (e.g. Iran or Syria),
        identifies if it is within a danger zone and directs it immediately to the nearest
        certified safe haven airport (e.g., Amman AMM or Baghdad BGW) with bearing and flight vector.
        """
        aircraft_pt = Point(request.current_lon, request.current_lat)
        in_danger = False

        for dz in self.active_danger_zones:
            poly = Polygon(dz["polygon"]["coordinates"][0])
            if poly.contains(aircraft_pt):
                in_danger = True
                break

        # Candidate Safe Havens from digital twin
        nodes_dict = graph_service.nodes_dict
        safe_havens = [n for n in nodes_dict.values() if n.type == "AIRPORT" and n.safe_haven]

        if not safe_havens:
            # Fallback safe haven if none flagged
            safe_havens = [nodes_dict.get("AIRPORT_AMM", list(nodes_dict.values())[0])]

        # Find closest safe haven via Haversine distance
        closest_airport: Optional[LocationNode] = None
        min_distance = float("inf")

        for airport in safe_havens:
            dist = haversine_distance_km(request.current_lat, request.current_lon, airport.lat, airport.lon)
            if dist < min_distance:
                min_distance = dist
                closest_airport = airport

        # Flight calculations (assume commercial cruising speed ~850 km/h)
        speed_kmh = 850.0
        time_minutes = (min_distance / speed_kmh) * 60.0
        heading = calculate_initial_bearing(request.current_lat, request.current_lon, closest_airport.lat, closest_airport.lon)

        flight_vector = [
            [request.current_lon, request.current_lat],
            [closest_airport.lon, closest_airport.lat]
        ]

        directive = (
            f"PRIORITY RED DIRECTIVE for flight {request.flight_callsign}: "
            f"Immediate vector turn to heading {heading}° toward Safe Haven {closest_airport.name} ({closest_airport.iata}). "
            f"Distance: {round(min_distance, 1)} km. Estimated diversion landing in {round(time_minutes, 1)} minutes."
        )

        return EmergencyDivertResponse(
            flight_callsign=request.flight_callsign,
            in_danger_zone=in_danger,
            nearest_safe_haven=closest_airport,
            distance_km=round(min_distance, 1),
            estimated_divert_time_min=round(time_minutes, 1),
            divert_heading_degrees=heading,
            flight_vector_coordinates=flight_vector,
            action_directive=directive
        )

    def get_active_danger_zones(self) -> List[Dict[str, Any]]:
        return self.active_danger_zones

    def clear_danger_zones(self):
        self.active_danger_zones.clear()

collision_engine = CollisionEngine()
