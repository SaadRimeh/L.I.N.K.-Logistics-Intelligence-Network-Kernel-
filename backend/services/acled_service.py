import os
import logging
from typing import List, Dict, Any, Optional
import httpx

from backend.models.schemas import ConflictEvent
from backend.services.collision_engine import collision_engine, CollisionResult

logger = logging.getLogger("LINK.ACLEDService")

# Sample real-world inspired geopolitical conflict events for simulation
SIMULATED_ACLED_EVENTS = [
    ConflictEvent(
        event_id="ACLED-IRN-2026-0891",
        event_type="Air/drone strike & Air Defense Activation",
        actor="Military Forces of Iran / Regional Actors",
        location="Central-Western Iran Airspace (Isfahan - Hamedan Corridor)",
        country="Iran",
        lat=33.8000,
        lon=49.8000,
        radius_km=280.0,
        fatalities=0,
        source="ACLED Armed Conflict Intelligence Feed"
    ),
    ConflictEvent(
        event_id="ACLED-SYR-2026-0412",
        event_type="Missile strike / Active Air Defense Zone",
        actor="State & Non-State Armed Groups",
        location="Damascus & Southern Syrian Air Corridor",
        country="Syria",
        lat=33.5138,
        lon=36.2765,
        radius_km=180.0,
        fatalities=4,
        source="ACLED Armed Conflict Intelligence Feed"
    ),
    ConflictEvent(
        event_id="ACLED-YEM-2026-0105",
        event_type="Anti-Ship Ballistic Missile & Drone Activity",
        actor="Ansar Allah (Houthi) Maritime Units",
        location="Southern Red Sea / Bab al-Mandab Approach",
        country="Yemen / Red Sea",
        lat=13.1000,
        lon=43.1000,
        radius_km=150.0,
        fatalities=0,
        source="ACLED Armed Conflict Intelligence Feed"
    )
]

class ACLEDService:
    def __init__(self):
        self.api_key = os.getenv("ACLED_API_KEY", "")
        self.email = os.getenv("ACLED_EMAIL", "")

    def get_simulated_events(self) -> List[ConflictEvent]:
        return SIMULATED_ACLED_EVENTS

    def trigger_event_simulation(self, event_index: int = 0) -> CollisionResult:
        """Picks a preset ACLED event, feeds it to the collision engine, and returns results."""
        if 0 <= event_index < len(SIMULATED_ACLED_EVENTS):
            event = SIMULATED_ACLED_EVENTS[event_index]
        else:
            event = SIMULATED_ACLED_EVENTS[0]
        return collision_engine.detect_and_resolve_conflict(event)

acled_service = ACLEDService()
