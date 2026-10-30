import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_hierarchy_tree():
    response = client.get("/api/v1/alerts/hierarchy/tree")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["code"] == "AIST"
    assert "campuses" in data
    assert len(data["campuses"]) >= 1


def test_device_registration_and_list():
    reg_payload = {
        "device_name": "Test iPhone 15 Pro",
        "device_platform": "ios",
        "proximity_zone": "Engineering & CS Quad (150m Proximity Mesh)",
        "push_token": "test_token_12345"
    }
    response = client.post("/api/v1/devices/register", json=reg_payload)
    assert response.status_code == 200
    device = response.json()
    assert device["device_name"] == "Test iPhone 15 Pro"
    assert device["device_platform"] == "ios"

    list_resp = client.get("/api/v1/devices")
    assert list_resp.status_code == 200
    devices = list_resp.json()
    assert len(devices) >= 1


def test_emergency_alert_broadcast_and_ack():
    broadcast_payload = {
        "target_zone": "Engineering & CS Quad (150m Proximity Mesh)",
        "category": "Rogue Wi-Fi Access Point",
        "title": "URGENT: Rogue Wi-Fi Spoofing Campus Authentication",
        "message": "Do not connect to 'Campus-Free-Wifi'. Unencrypted credential sniffer active.",
        "severity": "CRITICAL",
        "delivery_scope": "PROXIMITY_MESH"
    }
    response = client.post("/api/v1/alerts/broadcast", json=broadcast_payload)
    assert response.status_code == 201
    alert = response.json()
    assert alert["category"] == "Rogue Wi-Fi Access Point"
    assert alert["status"] == "ACTIVE"

    # Active alerts
    active_resp = client.get("/api/v1/alerts/active")
    assert active_resp.status_code == 200
    active_alerts = active_resp.json()
    assert any(a["id"] == alert["id"] for a in active_alerts)

    # Acknowledge
    ack_payload = {"device_id": "test-device-ack-01"}
    ack_resp = client.post(f"/api/v1/alerts/{alert['id']}/acknowledge", json=ack_payload)
    assert ack_resp.status_code == 200
    ack_data = ack_resp.json()
    assert ack_data["success"] is True
    assert "ack_hash" in ack_data

    # Deliveries
    metrics_resp = client.get(f"/api/v1/alerts/{alert['id']}/deliveries")
    assert metrics_resp.status_code == 200
    metrics = metrics_resp.json()
    assert metrics["acknowledged"] >= 1
