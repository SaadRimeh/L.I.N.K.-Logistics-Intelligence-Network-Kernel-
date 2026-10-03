import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.main import app


client = TestClient(app)

def test_live_vessels():
    res = client.get("/api/vessels/live")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert "vessels" in data
    assert len(data["vessels"]) > 0
    vessel = data["vessels"][0]
    assert "name" in vessel
    assert "mmsi" in vessel
    assert "destination" in vessel
    assert "destination_coords" in vessel
    print(f"[OK] Live vessels endpoint passed: {len(data['vessels'])} vessels loaded.")

def test_energy_facilities_and_strike():
    res = client.get("/api/energy/facilities")
    assert res.status_code == 200
    facilities = res.json()["facilities"]
    assert len(facilities) >= 6
    print(f"[OK] Energy facilities endpoint passed: {len(facilities)} strategic facilities loaded.")

    # Test kinetic strike simulation
    strike_res = client.get("/api/energy/simulate-strike/ENERGY_RAS_TANURA")
    assert strike_res.status_code == 200
    strike_data = strike_res.json()
    assert "lost_output_capacity" in strike_data
    assert "projected_oil_price_spike" in strike_data
    assert "most_affected_countries_and_markets" in strike_data
    assert "threat_source_and_risk_rating" in strike_data
    assert "autonomous_logistics_contingency_plan" in strike_data
    assert "suggested_mitigations" in strike_data
    assert len(strike_data["suggested_mitigations"]) > 0
    print(f"[OK] Energy kinetic strike simulation passed for: {strike_data['facility_name_ar']}.")

    # Test dynamic risk analysis and proposals endpoint
    risk_res = client.get("/api/energy/suggest-risks/ENERGY_RAS_TANURA")
    assert risk_res.status_code == 200
    risk_data = risk_res.json()
    assert "vulnerability_scores" in risk_data
    assert "suggested_mitigations" in risk_data
    assert len(risk_data["suggested_mitigations"]) >= 3
    print(f"[OK] Energy risk suggestion & analysis passed: {len(risk_data['suggested_mitigations'])} proactive proposals generated.")

def test_energy_news():
    res = client.get("/api/energy/news")
    assert res.status_code == 200
    articles = res.json()["articles"]
    assert len(articles) > 0
    print(f"[OK] Energy intel news passed: {len(articles)} live articles loaded.")

def test_routes_analysis():
    res = client.get("/api/routes/analysis")
    assert res.status_code == 200
    routes = res.json()["routes"]
    assert len(routes) > 0
    sample = routes[0]
    assert "risk_percentage" in sample
    assert "safety_score" in sample
    assert "speed_rating" in sample
    assert "threat_description" in sample
    print(f"[OK] Routes risk analysis passed: {len(routes)} corridors analyzed.")

def test_military_threats():
    res = client.get("/api/military/threats")
    assert res.status_code == 200
    threats = res.json()["threats"]
    print(f"[OK] Military threats endpoint passed: {len(threats)} active alerts.")

if __name__ == "__main__":
    print("=========================================================")
    print("TESTING STEP 4: Live Vessels, Energy Kernel & Route Risk")
    print("=========================================================")
    test_live_vessels()
    test_energy_facilities_and_strike()
    test_energy_news()
    test_routes_analysis()
    test_military_threats()
    print("=========================================================")
    print("ALL LIVE INTELLIGENCE TESTS PASSED SUCCESSFULLY!")
    print("=========================================================")
