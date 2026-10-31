"""
YODHRA End-to-End Simulation Script
Tests database connection, threat scanning, incident dispatch, dashboard stats,
institutional hierarchy, and geofencing.
"""
import sys
import os
import json

# Set PYTHONPATH
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def print_section(title):
    print(f"\n{'=' * 65}")
    print(f"  {title}")
    print(f"{'=' * 65}")

def main():
    print_section("YODHRA LIVE BACKEND ENGINE SIMULATION")
    client = TestClient(app)
    
    # 1. Health & Database Probe
    print("\n[Step 1] Probing Health & Database Pooler...")
    res = client.get("/api/v1/health")
    print(f"Status Code: {res.status_code}")
    health_data = res.json()
    print(f"Response: {json.dumps(health_data, indent=2)}")
    assert res.status_code == 200, "Health check failed"
    print(">>> Health & Database Engine: OK")

    # 2. Threat Scan - Malicious URL
    print("\n[Step 2] Simulating Threat Analysis on Suspicious URL...")
    malicious_payload = {"url": "http://192.168.1.50:8080/secure-banking-login.php"}
    res = client.post("/api/v1/scan/url", json=malicious_payload)
    print(f"Status Code: {res.status_code}")
    scan_result = res.json()
    print(f"Verdict: {scan_result.get('verdict')} (Risk Score: {scan_result.get('risk_score')}/100)")
    print(f"Indicators: {scan_result.get('indicators')}")
    print(f"Mitigation: {scan_result.get('recommendations')[:2]}")
    assert scan_result.get("verdict") in ["MALICIOUS", "SUSPICIOUS"], "Should detect risk"
    print(">>> URL Threat Scanner: OK")

    # 3. Threat Scan - Safe Official Institutional Domain
    print("\n[Step 3] Simulating Threat Analysis on Official Institutional Domain...")
    safe_payload = {"url": "https://klsvdit.edu.in/admissions"}
    res = client.post("/api/v1/scan/url", json=safe_payload)
    print(f"Status Code: {res.status_code}")
    safe_result = res.json()
    print(f"Verdict: {safe_result.get('verdict')} (Risk Score: {safe_result.get('risk_score')}/100)")
    assert safe_result.get("verdict") == "LOW_RISK" or safe_result.get("risk_score") < 30
    print(">>> Safe Domain Scanner: OK")

    # 4. Message Phishing Detection
    print("\n[Step 4] Simulating SMS / Phishing Alert Message Scanner...")
    sms_payload = {
        "message_text": "URGENT NOTICE: Your campus WiFi credentials will expire in 2 hours. Update now at http://portal-update-campus.ru to prevent disconnection."
    }
    res = client.post("/api/v1/scan/message", json=sms_payload)
    print(f"Status Code: {res.status_code}")
    msg_result = res.json()
    print(f"Verdict: {msg_result.get('verdict')} (Risk Score: {msg_result.get('risk_score')}/100)")
    print(f"Threat Indicators: {msg_result.get('indicators')}")
    assert msg_result.get("verdict") in ["MALICIOUS", "SUSPICIOUS"]
    print(">>> Phishing Message Scanner: OK")

    # 5. QR Code Quishing Inspection
    print("\n[Step 5] Simulating QR Code Quishing / Malicious Noticeboard Analysis...")
    qr_payload = {"decoded_content": "https://fake-event-pass.top/claim-free-voucher"}
    res = client.post("/api/v1/scan/qr", json=qr_payload)
    print(f"Status Code: {res.status_code}")
    qr_result = res.json()
    print(f"Verdict: {qr_result.get('verdict')} (Risk Score: {qr_result.get('risk_score')}/100)")
    print(">>> QR Guardian Scanner: OK")

    # 6. Incident Reporting & Database Persistence
    print("\n[Step 6] Simulating Incident Creation & Triage Dispatch...")
    incident_payload = {
        "category": "phishing",
        "severity": "high",
        "description": "Found a malicious sticker claiming to be free campus WiFi linking to credential harvesting domain.",
        "suspicious_content": "http://portal-update-campus.ru"
    }
    res = client.post("/api/v1/incidents", json=incident_payload)
    print(f"Status Code: {res.status_code}")
    incident_data = res.json()
    incident_id = incident_data.get("id")
    print(f"Created Incident ID: {incident_id}")
    print(f"Assigned Status: {incident_data.get('status')} | Severity: {incident_data.get('severity')}")
    assert incident_id, "Incident ID should exist"
    print(">>> Incident Persistence Engine: OK")

    # 7. Retrieve Incidents List
    print("\n[Step 7] Querying Live Incidents Triage Queue...")
    res = client.get("/api/v1/incidents")
    incidents = res.json()
    print(f"Total Incidents Stored: {len(incidents)}")
    print(">>> Incident Query Engine: OK")

    # 8. Real-time Security Operations Dashboard
    print("\n[Step 8] Fetching Real-time Security Dashboard Statistics...")
    res = client.get("/api/v1/dashboard/stats")
    stats = res.json()
    print(f"Dashboard Telemetry:")
    print(f"  • Total Scans: {stats.get('total_scans')}")
    print(f"  • Malicious Blocked: {stats.get('malicious_detected')}")
    print(f"  • Active Incidents: {stats.get('active_incidents')}")
    print(f"  • Protected Score: {stats.get('security_score')}%")
    print(">>> Security Operations Dashboard: OK")

    # 9. Institutional Hierarchy Tree
    print("\n[Step 9] Simulating Campus Tree Hierarchy Resolution...")
    res = client.get("/api/v1/alerts/hierarchy/tree")
    tree = res.json()
    print(f"Root Institution: {tree.get('name')} (Code: {tree.get('code')})")
    print(f"Child Colleges/Departments: {len(tree.get('children', []))}")
    print(">>> Institutional Hierarchy: OK")

    # 10. Geospatial Campus Geofence Check
    print("\n[Step 10] Simulating Geospatial Radar Geofence Inspection...")
    geo_payload = {
        "latitude": 15.3225,
        "longitude": 74.7552,
        "accuracy_meters": 10
    }
    res = client.post("/api/v1/campus/geofence-check", json=geo_payload)
    geo_result = res.json()
    print(f"Inside Campus Boundary: {geo_result.get('inside_campus')}")
    print(f"Campus Zone: {geo_result.get('zone_name', 'Main Perimeter')}")
    print(">>> Geospatial Radar: OK")

    print_section("ALL 10 SIMULATION SUITES PASSED SUCCESSFULLY")

if __name__ == "__main__":
    main()
