from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_scan_url_low_risk():
    response = client.post("/api/v1/scan/url", json={"url": "https://university.edu/admissions"})
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "LOW_RISK"
    assert "scan_id" in data
    assert "recommendations" in data
    assert data["input_type"] == "url"


def test_scan_url_malicious_ip_and_port():
    response = client.post(
        "/api/v1/scan/url",
        json={"url": "http://192.168.1.100:8888/campus-login-portal/verify"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] in ("MALICIOUS", "SUSPICIOUS")
    assert data["risk_score"] >= 60
    assert any("IP address" in ind for ind in data["indicators"])


def test_scan_message_phishing():
    response = client.post(
        "/api/v1/scan/message",
        json={
            "message_text": "URGENT: Your university student account will be suspended within 24 hours. Confirm your password immediately at http://192.168.1.5/login or buy a $50 gift card."
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] in ("MALICIOUS", "SUSPICIOUS")
    assert len(data["indicators"]) >= 2


def test_scan_qr_code():
    response = client.post(
        "/api/v1/scan/qr",
        json={"decoded_content": "https://campus-verify-auth.xyz/portal"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["input_type"] == "qr"
    assert "risk_score" in data
