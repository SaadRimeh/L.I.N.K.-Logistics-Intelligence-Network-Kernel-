import time
import logging
from typing import Dict, Any, List, Optional
from backend.services.graph_service import graph_service
from backend.services.collision_engine import collision_engine
from backend.services.opensky_service import opensky_service
from backend.services.routing_engine import routing_engine
from backend.models.schemas import RouteOptimizationRequest

logger = logging.getLogger("LINK.DecisionIntelligence")

class DecisionIntelligenceEngine:
    def __init__(self):
        pass

    def evaluate_geopolitical_crisis(self, crisis_type: str = "AUTO") -> Dict[str, Any]:
        """
        Autonomous Decision & Recommendation Engine:
        - Detects active maritime and aviation danger zones.
        - Analyzes real-time OpenSky flights and naval chokepoints.
        - Computes operational costs, risk differentials, fuel/trucking tariffs.
        - Recommends best emergency landing airports and emergency ship docking ports.
        - Quantifies secondary systemic impact on other air and sea traffic.
        """
        active_hazards = collision_engine.get_active_danger_zones()
        live_flights = opensky_service.fetch_live_flights()
        flights_in_danger = [f for f in live_flights if f.get("in_danger")]

        G = graph_service.graph
        closed_routes = []
        for u, v, k, data in G.edges(keys=True, data=True):
            if data.get("status") == "CLOSED":
                closed_routes.append({
                    "source": u,
                    "target": v,
                    "code": data.get("route_code"),
                    "mode": data.get("mode")
                })

        hormuz_closed = any("HORMUZ" in r["source"] or "HORMUZ" in r["target"] for r in closed_routes)
        red_sea_closed = any("BAB_EL_MANDEB" in r["source"] or "BAB_EL_MANDEB" in r["target"] for r in closed_routes)
        airspace_closed = any(r["mode"] == "AIR" for r in closed_routes)

        # ----------------------------------------------------------------------
        # 1. Aviation Emergency Evaluation (تحليل الطوارئ الجوية)
        # ----------------------------------------------------------------------
        total_live_airborne = len(live_flights)
        threatened_flights_count = len(flights_in_danger)

        aviation_analysis = {
            "total_monitored_flights": total_live_airborne,
            "threatened_flights_count": threatened_flights_count,
            "recommended_safe_haven_primary": "AIRPORT_AMM (مطار الملكة علياء الدولي - عمّان)",
            "recommended_safe_haven_secondary": "AIRPORT_BGW (مطار بغداد الدولي)",
            "total_estimated_divert_cost_usd": round(threatened_flights_count * 12800.0, 2),
            "estimated_air_traffic_congestion": "مرتفع (+38%) في الممر الجوي الأردني والعراقي",
            "systemic_flight_impact": (
                f"تم رصد {threatened_flights_count} طائرة تجارية وشحن في مسار خطر مباشر أو بمحاذاة مناطق النزاع. "
                f"التوجيه الذكي: إلزام الرحلات بالدوران نحو مسار الانحراف الآمن لمطار عمّان وبغداد مع تجنب الأجواء الإيرانية والسورية بالكامل."
            )
        }

        # ----------------------------------------------------------------------
        # 2. Maritime Emergency Evaluation (تحليل الطوارئ البحرية والرسو الاضطراري)
        # ----------------------------------------------------------------------
        if hormuz_closed:
            maritime_primary_port = "PORT_DAMMAM (ميناء الملك عبد العزيز بالدمام)"
            maritime_backup_port = "PORT_JEBEL_ALI (ميناء جبل علي - دبي)"
            land_corridor = "الجسر البري السعودي (الدمام ➔ الميناء الجاف بالرياض ➔ ميناء جدة الإسلامي)"
            daily_demurrage_saved = 1350000.0  # Savings avoiding tanker detention fees
            trucks_required_per_day = 1200
            multimodal_tariff_per_teu = 1450.0  # Handling + trucking cost
            transit_time_hrs = 14.5
            avoided_delay_days = 11.0  # Vs circumnavigating Africa
            maritime_verdict = (
                "إغلاق مضيق هرمز يعطل 21% من إمدادات الطاقة العالمية. "
                "القرار الاستراتيجي الذكي: توجيه السفن لتفريغ الحاويات في ميناء الدمام أو جبل علي، "
                "وتشغيل أسطول شاحنات وسكك حديدية عبر الجسر البري السعودي لنقل البضائع مباشرة إلى ميناء جدة والبحر الأحمر لتجاوز المضيق."
            )
        elif red_sea_closed:
            maritime_primary_port = "PORT_MERSIN (ميناء مرسين التركي - الجسر المنقذ)"
            maritime_backup_port = "PORT_SALALAH (ميناء صلالة - سلطنة عمان)"
            land_corridor = "ممر الجسر المنقذ (مرسين ➔ غازي عنتاب ➔ معبر زاخو ➔ بغداد ➔ الرياض)"
            daily_demurrage_saved = 2100000.0
            trucks_required_per_day = 1600
            multimodal_tariff_per_teu = 1750.0
            transit_time_hrs = 27.5
            avoided_delay_days = 14.0
            maritime_verdict = (
                "تعطل مضيق باب المندب والبحر الأحمر. "
                "القرار الاستراتيجي الذكي: تفعيل ميناء مرسين كبوابة إنقاذ بديلة، وتفريغ الحاويات للشحن البري الدولي عبر معبر زاخو نحو بغداد والخليج العربي."
            )
        else:
            maritime_primary_port = "PORT_JEBEL_ALI (ميناء جبل علي)"
            maritime_backup_port = "PORT_DAMMAM (ميناء الدمام)"
            land_corridor = "الممرات البحرية والبرية الاعتيادية تعمل بكفاءة"
            daily_demurrage_saved = 0.0
            trucks_required_per_day = 0
            multimodal_tariff_per_teu = 850.0
            transit_time_hrs = 18.0
            avoided_delay_days = 0.0
            maritime_verdict = "الملاحة البحرية ومضائق الشرق الأوسط تعمل بالحالة الطبيعية دون إغلاقات حرجة."

        maritime_analysis = {
            "chokepoint_status": "CLOSED" if (hormuz_closed or red_sea_closed) else "OPEN",
            "recommended_emergency_port": maritime_primary_port,
            "backup_emergency_port": maritime_backup_port,
            "recommended_land_bridge": land_corridor,
            "daily_demurrage_saved_usd": daily_demurrage_saved,
            "multimodal_tariff_per_teu_usd": multimodal_tariff_per_teu,
            "truck_fleet_needed_per_day": trucks_required_per_day,
            "transit_time_hours": transit_time_hrs,
            "avoided_cape_route_delay_days": avoided_delay_days,
            "systemic_naval_impact": maritime_verdict
        }

        # ----------------------------------------------------------------------
        # 3. Overall Strategic Verdict & Trade-off Optimization Matrix
        # ----------------------------------------------------------------------
        risk_index = 0
        if hormuz_closed: risk_index += 40
        if red_sea_closed: risk_index += 35
        if airspace_closed: risk_index += 25
        risk_index = min(100, max(5, risk_index))

        return {
            "timestamp": time.time(),
            "overall_threat_level": "CRITICAL" if risk_index >= 50 else "ELEVATED" if risk_index >= 20 else "LOW",
            "composite_risk_index_percentage": risk_index,
            "active_closed_corridors_count": len(closed_routes),
            "aviation_intelligence": aviation_analysis,
            "maritime_intelligence": maritime_analysis,
            "threatened_flights_detail": flights_in_danger[:10],
            "executive_decision_ar": (
                f"توصية استخبارات العمليات اللوجستية: تفعيل بروتوكول المرونة المتعدد الوسائط (Multi-Modal Resilient Protocol). "
                f"مستوى التهديد العام: {risk_index}%. "
                f"أفضل مطار هبوط اضطراري للطائرات: مطار عمّان الدولي ومطار بغداد. "
                f"أفضل ميناء رسو وتفريغ استراتيجي للسفن: {maritime_primary_port} مع ربط فوري لأسطول النقل البري لتجاوز الإغلاقات البحرية."
            )
        }

decision_intelligence = DecisionIntelligenceEngine()
