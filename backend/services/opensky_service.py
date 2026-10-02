import time
import logging
import urllib.request
import json
from typing import List, Dict, Any, Optional
from shapely.geometry import Point, Polygon

from backend.services.collision_engine import (
    collision_engine,
    haversine_distance_km,
    calculate_initial_bearing
)
from backend.services.graph_service import graph_service

logger = logging.getLogger("LINK.OpenSkyService")

# Middle East Geospatial Bounding Box: covers Levant, Arabian Gulf, Iran, Red Sea, Turkey south
ME_BBOX = {
    "lamin": 12.0,
    "lomin": 32.0,
    "lamax": 38.5,
    "lomax": 58.0
}

OPENSKY_URL = f"https://opensky-network.org/api/states/all?lamin={ME_BBOX['lamin']}&lomin={ME_BBOX['lomin']}&lamax={ME_BBOX['lamax']}&lomax={ME_BBOX['lomax']}"

class OpenSkyService:
    def __init__(self):
        self.cached_flights: List[Dict[str, Any]] = []
        self.last_fetch_time: float = 0
        self.cache_ttl_seconds: float = 12.0  # Respect OpenSky anonymous rate limits

    def fetch_live_flights(self) -> List[Dict[str, Any]]:
        """
        Fetches live flights over Middle East from OpenSky API.
        Analyzes every aircraft against active conflict hazard zones.
        Flags aircraft in danger as RED with emergency diversion vector.
        """
        now = time.time()
        if self.cached_flights and (now - self.last_fetch_time < self.cache_ttl_seconds):
            # Refresh threat calculations for cached flights against any newly added hazard zones
            return self._enrich_flights_with_threat_intelligence(self.cached_flights)

        raw_states = []
        try:
            req = urllib.request.Request(
                OPENSKY_URL,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) L.I.N.K. Digital Twin"}
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status == 200:
                    payload = json.loads(response.read().decode("utf-8"))
                    raw_states = payload.get("states") or []
                    logger.info(f"OpenSky API: Successfully fetched {len(raw_states)} live flights over Middle East.")
        except Exception as e:
            logger.warning(f"OpenSky API connection warning ({str(e)}). Preserving cached / baseline live traffic.")

        if raw_states:
            parsed_flights = []
            for state in raw_states:
                # OpenSky state vector fields:
                # 0: icao24, 1: callsign, 2: origin_country, 3: time_position, 4: last_contact
                # 5: longitude, 6: latitude, 7: baro_altitude, 8: on_ground, 9: velocity (m/s)
                # 10: true_track (heading deg), 11: vertical_rate, 13: geo_altitude
                icao = state[0]
                callsign = (state[1] or "").strip() or f"ICAO-{icao.upper()}"
                country = state[2] or "International"
                lon = state[5]
                lat = state[6]
                altitude_m = state[7] or 10000.0
                on_ground = state[8]
                velocity_mps = state[9] or 230.0  # ~830 km/h
                heading_deg = state[10] or 0.0

                # Skip aircraft on ground or missing coordinates
                if on_ground or lon is None or lat is None:
                    continue

                parsed_flights.append({
                    "icao": icao,
                    "callsign": callsign,
                    "country": country,
                    "lon": round(lon, 4),
                    "lat": round(lat, 4),
                    "altitude_ft": round(altitude_m * 3.28084),
                    "speed_kmh": round(velocity_mps * 3.6),
                    "heading_deg": round(heading_deg, 1)
                })

            self.cached_flights = parsed_flights
            self.last_fetch_time = now

        return self._enrich_flights_with_threat_intelligence(self.cached_flights)

    def _enrich_flights_with_threat_intelligence(self, flights: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Runs spatial collision detection on each flight.
        If inside or approaching an active danger zone:
        - Flags as IN_DANGER = True
        - Automatically computes nearest certified Safe Haven (Amman AMM or Baghdad BGW)
        - Computes turn heading, divert distance, fuel penalty, and emergency directive.
        """
        danger_zones = collision_engine.get_active_danger_zones()
        nodes_dict = graph_service.nodes_dict
        safe_havens = [n for n in nodes_dict.values() if n.type == "AIRPORT" and n.safe_haven]

        enriched = []
        for flight in flights:
            f_lat, f_lon = flight["lat"], flight["lon"]
            pt = Point(f_lon, f_lat)

            in_danger = False
            intersected_zone_title = None

            for dz in danger_zones:
                poly = Polygon(dz["polygon"]["coordinates"][0])
                # Check if inside polygon or within 40 km proximity
                if poly.contains(pt) or poly.distance(pt) < (40.0 / 111.32):
                    in_danger = True
                    intersected_zone_title = f"{dz['location']} ({dz['country']})"
                    break

            flight_copy = dict(flight)
            flight_copy["in_danger"] = in_danger

            if in_danger:
                flight_copy["threat_level"] = "CRITICAL_AIRSPACE_INTERDICTION"
                flight_copy["threat_description"] = f"تحليق داخل أو بمحاذاة منطقة نزاع نشطة: {intersected_zone_title}"

                # Calculate closest safe haven (AMM or BGW)
                closest_haven = None
                min_dist = float("inf")
                for haven in safe_havens:
                    d = haversine_distance_km(f_lat, f_lon, haven.lat, haven.lon)
                    if d < min_dist:
                        min_dist = d
                        closest_haven = haven

                if closest_haven:
                    heading_to_haven = calculate_initial_bearing(f_lat, f_lon, closest_haven.lat, closest_haven.lon)
                    divert_time_min = (min_dist / 850.0) * 60.0
                    # Jet A-1 fuel + handling estimated divert cost
                    fuel_cost = round(min_dist * 18.5 + 4500, 2)

                    flight_copy["safe_haven"] = {
                        "id": closest_haven.id,
                        "name": closest_haven.name,
                        "name_ar": closest_haven.name_ar,
                        "iata": closest_haven.iata,
                        "distance_km": round(min_dist, 1),
                        "turn_heading_deg": heading_to_haven,
                        "eta_minutes": round(divert_time_min, 1),
                        "estimated_cost_usd": fuel_cost,
                        "vector_coordinates": [[f_lon, f_lat], [closest_haven.lon, closest_haven.lat]],
                        "directive_ar": f"توجيه فوري بالانعطاف إلى زاوية {heading_to_haven}° نحو {closest_haven.name_ar} ({closest_haven.iata}) على مسافة {round(min_dist, 1)} كم."
                    }
            else:
                flight_copy["threat_level"] = "NORMAL"
                flight_copy["safe_haven"] = None

            enriched.append(flight_copy)

        return enriched

opensky_service = OpenSkyService()
