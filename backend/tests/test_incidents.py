from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_incident_lifecycle():
    # 1. Create incident
    create_res = client.post(
        "/api/v1/incidents",
        json={
            "category": "phishing",
            "severity": "high",
            "description": "Received suspicious email pretending to be the dean asking for credentials.",
            "suspicious_content": "http://campus-fake-portal.xyz/dean-message"
        }
    )
    assert create_res.status_code == 201
    incident = create_res.json()
    assert incident["status"] == "submitted"
    assert incident["category"] == "phishing"
    incident_id = incident["id"]

    # 2. Retrieve incident by ID
    get_res = client.get(f"/api/v1/incidents/{incident_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == incident_id

    # 3. List incidents
    list_res = client.get("/api/v1/incidents")
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(item["id"] == incident_id for item in items)

    # 4. Update status (admin workflow: submitted -> triaged -> investigating)
    patch_res = client.patch(
        f"/api/v1/incidents/{incident_id}",
        json={
            "status": "triaged",
            "resolution_notes": "Assigned to network security response officer."
        }
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["status"] == "triaged"
    assert "network security" in updated["resolution_notes"]
