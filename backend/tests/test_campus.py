from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_campus_buildings():
    response = client.get("/api/v1/campus/buildings")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 8
    # Verify KLS VDIT Computer Science block exists
    codes = [b["code"] for b in data]
    assert "ENG-QUAD" in codes
    assert "ADMIN-BURSAR" in codes
    assert "LIB-COMMONS" in codes


def test_geofence_check():
    # User at CSE Quad coordinates (15.3225, 74.7552)
    response = client.post("/api/v1/campus/geofence-check", json={
        "latitude": 15.3225,
        "longitude": 74.7552,
        "accuracy_meters": 5.0
    })
    assert response.status_code == 200
    data = response.json()
    assert data["in_campus_bounds"] is True
    assert data["closest_building_name"] is not None
    assert len(data["alerts"]) >= 1
    # Check that CSE Quad is inside the boundary
    inside_alerts = [a for a in data["alerts"] if a["is_inside"]]
    assert len(inside_alerts) >= 1
    assert any("ENG-QUAD" in a["zone_id"] or "Engineering" in a["zone_name"] for a in inside_alerts)

