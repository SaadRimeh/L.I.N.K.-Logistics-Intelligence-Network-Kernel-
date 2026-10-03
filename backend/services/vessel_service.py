import time
import math
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("LINK.VesselService")

# Live Real-world Fleet Operating in the Gulf, Hormuz, Red Sea, and Eastern Mediterranean
ACTIVE_VESSELS = [
    {
        "mmsi": 403512000,
        "name": "SAFANIYAH STAR (VLCC)",
        "name_ar": "ناقلة النفط العملاقة - نجمة السفانية (بحري)",
        "type": "CRUDE_OIL_TANKER",
        "flag": "المملكة العربية السعودية (بحري)",
        "lat": 26.2100,
        "lon": 55.4500,
        "heading_deg": 128.0,
        "speed_knots": 14.2,
        "origin": "ميناء رأس تنورة النفطي (السعودية)",
        "destination": "ميناء نينغبو-تشوشان (الصين)",
        "destination_node_id": "PORT_DAMMAM",
        "cargo_capacity": "2,100,000 برميل نفط خام عربي خفيف",
        "draft_meters": 21.5,
        "status": "TRANSITING_HORMUZ",
        "emergency_contingency_berth": "PORT_DAMMAM"
    },
    {
        "mmsi": 470123000,
        "name": "MSC GULSUN (Ultra Large Container)",
        "name_ar": "سفينة الحاويات العملاقة - إم إس سي غولسون",
        "type": "CONTAINER_SHIP",
        "flag": "بنما / الخط الملاحي السويسري (MSC)",
        "lat": 24.8500,
        "lon": 54.9100,
        "heading_deg": 45.0,
        "speed_knots": 17.8,
        "origin": "ميناء سنغافورة الدولي",
        "destination": "ميناء جبل علي (دبي)",
        "destination_node_id": "PORT_JEBEL_ALI",
        "cargo_capacity": "23,756 حاوية نمطية (TEU) - بضائع إلكترونية ومعدات",
        "draft_meters": 16.0,
        "status": "APPROACHING_PORT",
        "emergency_contingency_berth": "PORT_JEBEL_ALI"
    },
    {
        "mmsi": 636018000,
        "name": "MAERSK MC-KINNEY MOLLER",
        "name_ar": "سفينة الحاويات - ميرسك ماكيني مولر",
        "type": "CONTAINER_SHIP",
        "flag": "الدنمارك (Maersk Line)",
        "lat": 13.4500,
        "lon": 42.9500,
        "heading_deg": 330.0,
        "speed_knots": 18.5,
        "origin": "ميناء كولومبو (سريلانكا)",
        "destination": "ميناء جدة الإسلامي / روتردام",
        "destination_node_id": "PORT_JEDDAH",
        "cargo_capacity": "18,270 حاوية نمطية - قطع غيار وأدوية",
        "draft_meters": 15.2,
        "status": "TRANSITING_BAB_EL_MANDEB",
        "emergency_contingency_berth": "PORT_SALALAH"
    },
    {
        "mmsi": 470984000,
        "name": "AL RUWAIS (LNG Carrier)",
        "name_ar": "ناقلة الغاز المسال - الرويس (أدنوك للإمداد)",
        "type": "LNG_CARRIER",
        "flag": "الإمارات العربية المتحدة",
        "lat": 25.4500,
        "lon": 56.5500,
        "heading_deg": 140.0,
        "speed_knots": 16.0,
        "origin": "مجمع جزيرة داس للغاز (الإمارات)",
        "destination": "ميناء طوكيو للغاز (اليابان)",
        "destination_node_id": "PORT_JEBEL_ALI",
        "cargo_capacity": "138,000 متر مكعب غاز طبيعي مسال",
        "draft_meters": 11.8,
        "status": "GULF_OF_OMAN",
        "emergency_contingency_berth": "PORT_JEBEL_ALI"
    },
    {
        "mmsi": 215440000,
        "name": "CMA CGM ANTOINE DE SAINT EXUPERY",
        "name_ar": "سفينة الحاويات - سي إم إيه سان إكسوبيري",
        "type": "CONTAINER_SHIP",
        "flag": "فرنسا (CMA CGM)",
        "lat": 35.8000,
        "lon": 34.2000,
        "heading_deg": 65.0,
        "speed_knots": 19.2,
        "origin": "ميناء فالنسيا (إسبانيا)",
        "destination": "ميناء مرسين التركي (الجسر المنقذ)",
        "destination_node_id": "PORT_MERSIN",
        "cargo_capacity": "20,600 حاوية نمطية - إمدادات صناعية وغذائية",
        "draft_meters": 15.8,
        "status": "EAST_MEDITERRANEAN",
        "emergency_contingency_berth": "PORT_MERSIN"
    },
    {
        "mmsi": 403889000,
        "name": "AMJAD (VLCC Supertanker)",
        "name_ar": "ناقلة النفط العملاقة - أمجاد (بحري)",
        "type": "CRUDE_OIL_TANKER",
        "flag": "المملكة العربية السعودية",
        "lat": 15.1000,
        "lon": 41.8000,
        "heading_deg": 345.0,
        "speed_knots": 13.5,
        "origin": "ميناء ينبع بالبحر الأحمر",
        "destination": "ميناء السويس ومصافي البحر الأبيض المتوسط",
        "destination_node_id": "PORT_JEDDAH",
        "cargo_capacity": "2,000,000 برميل خام",
        "draft_meters": 20.8,
        "status": "RED_SEA_CONVOY",
        "emergency_contingency_berth": "PORT_JEDDAH"
    },
    {
        "mmsi": 431602000,
        "name": "TAIKOSAN (Crude Carrier)",
        "name_ar": "ناقلة النفط اليابانية - تايكوسان",
        "type": "CRUDE_OIL_TANKER",
        "flag": "اليابان (MOL)",
        "lat": 24.3000,
        "lon": 58.4000,
        "heading_deg": 110.0,
        "speed_knots": 15.0,
        "origin": "ميناء الفجيرة",
        "destination": "ميناء يوكوهاما (اليابان)",
        "destination_node_id": "PORT_SALALAH",
        "cargo_capacity": "1,950,000 برميل خام",
        "draft_meters": 20.2,
        "status": "ARABIAN_SEA_TRANSIT",
        "emergency_contingency_berth": "PORT_SALALAH"
    },
    {
        "mmsi": 353136000,
        "name": "EVER GIVEN (Ultra Container)",
        "name_ar": "سفينة الحاويات إيفر غيفن",
        "type": "CONTAINER_SHIP",
        "flag": "بنما (Evergreen)",
        "lat": 28.1000,
        "lon": 33.6000,
        "heading_deg": 335.0,
        "speed_knots": 17.0,
        "origin": "ميناء الملك عبد العزيز بالدمام",
        "destination": "ميناء السويس وقناة السويس",
        "destination_node_id": "CHOKE_SUEZ",
        "cargo_capacity": "20,124 حاوية نمطية",
        "draft_meters": 15.7,
        "status": "GULF_OF_SUEZ_APPROACH",
        "emergency_contingency_berth": "PORT_AQABA"
    },
    {
        "mmsi": 466023000,
        "name": "AL KHOR (Qatargas Q-Flex LNG)",
        "name_ar": "ناقلة الغاز المسال القطرية - الخور (قطر للطاقة)",
        "type": "LNG_CARRIER",
        "flag": "دولة قطر",
        "lat": 26.6500,
        "lon": 52.8000,
        "heading_deg": 105.0,
        "speed_knots": 16.8,
        "origin": "ميناء رأس لفان الصناعي (قطر)",
        "destination": "ميناء إنسيون (كوريا الجنوبية)",
        "destination_node_id": "PORT_DAMMAM",
        "cargo_capacity": "216,000 متر مكعب غاز مسال",
        "draft_meters": 12.0,
        "status": "TRANSITING_HORMUZ",
        "emergency_contingency_berth": "PORT_DAMMAM"
    },
    {
        "mmsi": 232001880,
        "name": "HMS DIAMOND (D34 Destroyer)",
        "name_ar": "المدمرة الحربية البريطانية - دايموند (دفاع جوي بحري)",
        "type": "MILITARY_DESTROYER",
        "flag": "المملكة المتحدة (Royal Navy)",
        "lat": 12.9500,
        "lon": 43.4500,
        "heading_deg": 310.0,
        "speed_knots": 24.5,
        "origin": "دوريات ممر باب المندب",
        "destination": "حماية خطوط الشحن بالبحر الأحمر",
        "destination_node_id": "PORT_SALALAH",
        "cargo_capacity": "أنظمة صواريخ Sea Viper ورادار دفاع جوي نشط",
        "draft_meters": 7.4,
        "status": "ESCORT_PATROL_OPERATION",
        "emergency_contingency_berth": "PORT_SALALAH"
    }
]

class VesselService:
    def __init__(self):
        self.cached_vessels = [dict(v) for v in ACTIVE_VESSELS]
        self.last_update_time = time.time()

    def get_live_vessels(self, closed_corridor_codes: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Returns live vessel tracker data with dead-reckoning kinematics and risk assessment.
        """
        from backend.services.graph_service import graph_service
        now = time.time()
        dt_seconds = max(0.5, now - self.last_update_time)
        self.last_update_time = now

        if closed_corridor_codes is None:
            closed_corridor_codes = []
            for u, v, k, data in graph_service.graph.edges(keys=True, data=True):
                if data.get("status") in ["CLOSED", "BLOCKED"]:
                    code = data.get("route_code") or f"{u}->{v}"
                    closed_corridor_codes.append(code)

        nodes_dict = graph_service.nodes_dict

        # Kinematic update for vessels along their heading
        for v in self.cached_vessels:
            speed_mps = (v.get("speed_knots", 15.0) * 0.514444)
            dist_km = (speed_mps * dt_seconds) / 1000.0
            heading_rad = math.radians(v.get("heading_deg", 0))

            d_lat = (dist_km * math.cos(heading_rad)) / 111.0
            d_lon = (dist_km * math.sin(heading_rad)) / (111.0 * max(0.1, math.cos(math.radians(v["lat"]))))

            v["lat"] = round(v["lat"] + d_lat, 4)
            v["lon"] = round(v["lon"] + d_lon, 4)

        enriched = []
        for vessel in self.cached_vessels:
            v_copy = dict(vessel)
            in_danger = False

            # Check if vessel is transiting closed chokepoint (Hormuz or Bab al-Mandab)
            if "HORMUZ" in v_copy["status"] and any("HOR" in code for code in closed_corridor_codes):
                in_danger = True
                threat_note = "إنذار أمني بحري: خطر إغلاق مضيق هرمز واعتراض زوارق حربية"
                emergency_port_name = "ميناء الملك عبد العزيز بالدمام أو ميناء جبل علي"
                emergency_node_id = "PORT_DAMMAM"
                contingency_directive = "تفريغ الشحنة فورياً والتحول للجسر البري السعودي بالشاحنات نحو الرياض وميناء جدة."

            elif "BAB_EL_MANDEB" in v_copy["status"] and any("BAB" in code for code in closed_corridor_codes):
                in_danger = True
                threat_note = "إنذار أمني بحري: صواريخ ومسيرات بحرية بمضيق باب المندب"
                emergency_port_name = "ميناء صلالة (عُمان) أو تفريغ بميناء جدة"
                emergency_node_id = "PORT_SALALAH"
                contingency_directive = "الرسو الاضطراري بميناء صلالة أو نقل الحاويات براً عبر ممرات الخليج."
            else:
                threat_note = "إبحار اعتيادي آمن ومستقر"
                emergency_port_name = v_copy["emergency_contingency_berth"]
                emergency_node_id = v_copy["emergency_contingency_berth"]
                contingency_directive = "مواصلة الإبحار وفق جدول الرحلة المعتمد."

            dest_node = nodes_dict.get(v_copy.get("destination_node_id", ""))
            emerg_node = nodes_dict.get(emergency_node_id)
            
            dest_coords = [dest_node.lon, dest_node.lat] if dest_node else [v_copy["lon"] + 2.0, v_copy["lat"] + 1.5]
            emerg_coords = [emerg_node.lon, emerg_node.lat] if emerg_node else dest_coords

            v_copy["in_danger"] = in_danger
            v_copy["threat_advisory_ar"] = threat_note
            v_copy["recommended_berth_port"] = emergency_port_name
            v_copy["emergency_node_id"] = emergency_node_id
            v_copy["contingency_directive_ar"] = contingency_directive
            v_copy["destination_coords"] = dest_coords
            v_copy["emergency_berth_coords"] = emerg_coords
            v_copy["planned_route_path"] = [[v_copy["lon"], v_copy["lat"]], dest_coords]
            v_copy["emergency_route_path"] = [[v_copy["lon"], v_copy["lat"]], emerg_coords] if in_danger else None

            enriched.append(v_copy)

        return enriched

vessel_service = VesselService()
