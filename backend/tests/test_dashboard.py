from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_dashboard_stats():
    # Populate a scan and an incident
    client.post("/api/v1/scan/url", json={"url": "https://testsafebrowsing.appspot.com/s/phishing.html"})
    client.post(
        "/api/v1/incidents",
        json={
            "category": "malware",
            "severity": "critical",
            "description": "Malicious payload detected on student forum attachment link."
        }
    )

    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_scans" in data
    assert "suspicious_results" in data
    assert "reported_incidents" in data
    assert isinstance(data["recent_scans"], list)
    assert isinstance(data["recent_incidents"], list)
    assert data["total_scans"] >= 1
    assert data["reported_incidents"] >= 1
