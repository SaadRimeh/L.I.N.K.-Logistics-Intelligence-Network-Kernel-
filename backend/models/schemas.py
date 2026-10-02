from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class LocationNode(BaseModel):
    id: str
    name: str
    name_ar: Optional[str] = None
    country: str
    lat: float
    lon: float
    type: str  # PORT, AIRPORT, CHOKEPOINT, LOGISTICS_HUB
    capacity_teu_day: Optional[int] = None
    iata: Optional[str] = None
    safe_haven: Optional[bool] = False
    status: str = "OPEN"  # OPEN, RESTRICTED, CLOSED

class RouteEdge(BaseModel):
    source: str
    target: str
    type: str  # MARITIME_ROUTE, FLIGHT_CORRIDOR, LAND_BRIDGE, INTERMODAL_TRANSFER
    route_code: Optional[str] = None
    distance_km: float
    time_hours: float
    cost_usd: float
    status: str = "OPEN"  # OPEN, CONGESTED, RESTRICTED, CLOSED
    risk_level: float = 0.0  # 0.0 to 1.0
    mode: str  # MARITIME, LAND, AIR, TRANSFER

class GraphResponse(BaseModel):
    nodes: List[LocationNode]
    edges: List[RouteEdge]
    total_nodes: int
    total_edges: int

class RouteOptimizationRequest(BaseModel):
    origin_id: str = Field(..., description="Starting node ID e.g. PORT_SALALAH or AIRPORT_DXB")
    destination_id: str = Field(..., description="Target node ID e.g. PORT_JEDDAH or AIRPORT_IST")
    priority: str = Field("balanced", description="'time', 'cost', 'risk', or 'balanced'")
    allowed_modes: List[str] = Field(default=["MARITIME", "LAND", "AIR", "TRANSFER"])
    avoid_nodes: List[str] = Field(default=[])
    avoid_edges: List[str] = Field(default=[])
    cargo_type: Optional[str] = "CONTAINER"  # CONTAINER, CRITICAL_AIR_CARGO, BULK

class RouteSegment(BaseModel):
    source_id: str
    source_name: str
    target_id: str
    target_name: str
    mode: str
    distance_km: float
    time_hours: float
    cost_usd: float
    risk_level: float
    status: str
    coordinates: List[List[float]]  # [[lon, lat], [lon, lat]] for Deck.gl PathLayer

class RouteOptimizationResponse(BaseModel):
    success: bool
    message: str
    origin: LocationNode
    destination: LocationNode
    path_node_ids: List[str]
    segments: List[RouteSegment]
    total_distance_km: float
    total_time_hours: float
    total_cost_usd: float
    aggregate_risk: float
    is_multimodal: bool
    modes_used: List[str]
    bottlenecks_encountered: List[str] = []
    contingency_applied: Optional[str] = None

class ScenarioSimulateRequest(BaseModel):
    scenario_id: str = Field(..., description="'scenario_1_maritime_closure', 'scenario_2_airspace_hazard', 'scenario_3_turkish_lifeline'")
    action: str = Field("activate", description="'activate' or 'reset'")
    affected_nodes: Optional[List[str]] = []
    affected_edges: Optional[List[str]] = []

class ScenarioSimulateResponse(BaseModel):
    scenario_id: str
    title: str
    description: str
    status: str
    closed_edges: List[str]
    closed_nodes: List[str]
    recommended_contingency: str

class ConflictEvent(BaseModel):
    event_id: str
    event_type: str = "Air/drone strike"
    actor: str = "Regional Armed Group"
    location: str
    country: str
    lat: float
    lon: float
    radius_km: float = 200.0
    fatalities: Optional[int] = 0
    source: str = "ACLED Intelligence Feed"

class CollisionResult(BaseModel):
    event_id: str
    location: str
    danger_zone_polygon: Dict[str, Any]  # GeoJSON Polygon for Deck.gl
    intersected_corridors: List[Dict[str, Any]]
    total_corridors_closed: int
    emergency_advisory: str

class EmergencyDivertRequest(BaseModel):
    flight_callsign: str = "UAE841"
    current_lat: float = 34.5
    current_lon: float = 48.0
    original_destination_id: str = "AIRPORT_IST"

class EmergencyDivertResponse(BaseModel):
    flight_callsign: str
    in_danger_zone: bool
    nearest_safe_haven: LocationNode
    distance_km: float
    estimated_divert_time_min: float
    divert_heading_degrees: float
    flight_vector_coordinates: List[List[float]]  # [[lon, lat], [lon, lat]] for Deck.gl
    action_directive: str
