"""
Verification script for SignalSafe Campus API Endpoints
Runs live HTTP requests against http://localhost:8000
"""
import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000"


def make_request(method: str, path: str, data: dict = None, headers: dict = None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)

    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            err_json = json.loads(content)
        except Exception:
            err_json = {"raw": content}
        return e.code, err_json


def run_tests():
    print("==================================================")
    print("SignalSafe Campus - API Endpoint Verification")
    print("==================================================")

    # 1. Health check
    print("\n[1/8] Testing GET /api/v1/health...")
    status, body = make_request("GET", "/api/v1/health")
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert body.get("status") == "healthy"
    print(f"  [OK] Status {status}: service='{body.get('service')}', database='{body.get('database')}'")

    # 2. Scan URL (Low Risk)
    print("\n[2/8] Testing POST /api/v1/scan/url (Low Risk)...")
    status, body = make_request("POST", "/api/v1/scan/url", {"url": "https://university.edu/student-portal"})
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert body.get("verdict") == "LOW_RISK"
    assert "scan_id" in body
    print(f"  [OK] Status {status}: verdict={body.get('verdict')}, score={body.get('risk_score')}")

    # 3. Scan URL (Malicious/Suspicious)
    print("\n[3/8] Testing POST /api/v1/scan/url (Malicious IP & Port)...")
    status, body = make_request("POST", "/api/v1/scan/url", {"url": "http://192.168.1.50:8888/campus-login-portal/auth"})
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert body.get("verdict") in ("MALICIOUS", "SUSPICIOUS")
    assert len(body.get("indicators", [])) >= 2
    print(f"  [OK] Status {status}: verdict={body.get('verdict')}, score={body.get('risk_score')}, indicators={len(body.get('indicators'))}")

    # 4. Scan Message
    print("\n[4/8] Testing POST /api/v1/scan/message (Phishing SMS)...")
    status, body = make_request("POST", "/api/v1/scan/message", {
        "message_text": "URGENT: Your university student account will be closed in 24 hours. Confirm your password immediately at http://192.168.1.5/login or buy a gift card."
    })
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert body.get("verdict") in ("MALICIOUS", "SUSPICIOUS")
    print(f"  [OK] Status {status}: verdict={body.get('verdict')}, indicators={body.get('indicators')}")

    # 5. Scan QR
    print("\n[5/8] Testing POST /api/v1/scan/qr...")
    status, body = make_request("POST", "/api/v1/scan/qr", {"decoded_content": "https://campus-verify-auth.xyz/portal"})
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert body.get("input_type") == "qr"
    print(f"  [OK] Status {status}: verdict={body.get('verdict')}, input_type={body.get('input_type')}")

    # 6. Incident Lifecycle: POST -> GET -> PATCH
    print("\n[6/8] Testing Incident Lifecycle (Create -> Read -> Update)...")
    # 6a. Create
    status, incident = make_request("POST", "/api/v1/incidents", {
        "category": "phishing",
        "severity": "high",
        "description": "Received fake campus bursar payment alert requesting external wire transfer.",
        "suspicious_content": "http://campus-fake-portal.xyz/wire"
    })
    assert status == 201, f"Expected 201, got {status}: {incident}"
    incident_id = incident["id"]
    assert incident["status"] == "submitted"
    print(f"  [OK] Created Incident ID: {incident_id} (status: {incident['status']})")

    # 6b. Read by ID
    status, fetched = make_request("GET", f"/api/v1/incidents/{incident_id}")
    assert status == 200, f"Expected 200, got {status}: {fetched}"
    assert fetched["id"] == incident_id
    print(f"  [OK] Retrieved Incident by ID: {fetched['id']}")

    # 6c. List incidents
    status, incidents_list = make_request("GET", "/api/v1/incidents")
    assert status == 200, f"Expected 200, got {status}: {incidents_list}"
    assert any(item["id"] == incident_id for item in incidents_list)
    print(f"  [OK] Listed {len(incidents_list)} incident(s)")

    # 6d. Update status (admin workflow: submitted -> triaged -> investigating)
    status, updated = make_request("PATCH", f"/api/v1/incidents/{incident_id}", {
        "status": "triaged",
        "resolution_notes": "Assigned to Campus Security Incident Response Team."
    })
    assert status == 200, f"Expected 200, got {status}: {updated}"
    assert updated["status"] == "triaged"
    print(f"  [OK] Updated Incident Status to: {updated['status']}")

    # 7. Dashboard Stats
    print("\n[7/8] Testing GET /api/v1/dashboard/stats...")
    status, stats = make_request("GET", "/api/v1/dashboard/stats")
    assert status == 200, f"Expected 200, got {status}: {stats}"
    assert stats["total_scans"] >= 3
    assert stats["reported_incidents"] >= 1
    assert len(stats["recent_scans"]) >= 1
    assert len(stats["recent_incidents"]) >= 1
    print(f"  [OK] Dashboard Stats: total_scans={stats['total_scans']}, suspicious={stats['suspicious_results']}, reported={stats['reported_incidents']}")

    # 8. Negative test (404 and validation)
    print("\n[8/8] Testing Error Handling & Validations...")
    status, err = make_request("GET", "/api/v1/incidents/nonexistent-id-000")
    assert status == 404, f"Expected 404, got {status}"
    print(f"  [OK] Expected 404 on missing incident: {err.get('detail')}")

    print("\n==================================================")
    print("ALL API ENDPOINT TESTS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n❌ Test Failed: {e}", file=sys.stderr)
        sys.exit(1)
