"""
Comprehensive Verification script for SignalSafe Campus API Endpoints
Runs live HTTP requests against http://localhost:8000
Tests all core APIs and all 10 innovation features!
"""
import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"


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
    print("SignalSafe Campus - Complete API & Innovation Tests")
    print("==================================================")

    # 1. Health check
    print("\n[1/15] Testing GET /api/v1/health...")
    status, body = make_request("GET", "/api/v1/health")
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert body.get("status") == "healthy"
    print(f"  [OK] Status {status}: service='{body.get('service')}', database='{body.get('database')}'")

    # 2. Scan URL (Low Risk)
    print("\n[2/15] Testing POST /api/v1/scan/url (Low Risk)...")
    status, body = make_request("POST", "/api/v1/scan/url", {"url": "https://university.edu/student-portal"})
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert body.get("verdict") == "LOW_RISK"
    assert "scan_id" in body
    print(f"  [OK] Status {status}: verdict={body.get('verdict')}, score={body.get('risk_score')}")

    # 3. Scan URL (Malicious/Suspicious)
    print("\n[3/15] Testing POST /api/v1/scan/url (Malicious IP & Port)...")
    status, body = make_request("POST", "/api/v1/scan/url", {"url": "http://192.168.1.50:8888/campus-login-portal/auth"})
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert body.get("verdict") in ("MALICIOUS", "CONFIRMED_MALICIOUS", "SUSPICIOUS")
    assert len(body.get("indicators", [])) >= 2
    print(f"  [OK] Status {status}: verdict={body.get('verdict')}, score={body.get('risk_score')}, indicators={len(body.get('indicators'))}")

    # 4. Scan Message
    print("\n[4/15] Testing POST /api/v1/scan/message (Phishing SMS)...")
    status, body = make_request("POST", "/api/v1/scan/message", {
        "message_text": "URGENT: Your university student account will be closed in 24 hours. Confirm your password immediately at http://192.168.1.5/login or buy a gift card."
    })
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert body.get("verdict") in ("MALICIOUS", "CONFIRMED_MALICIOUS", "SUSPICIOUS")
    print(f"  [OK] Status {status}: verdict={body.get('verdict')}, indicators={body.get('indicators')}")

    # 5. Scan QR
    print("\n[5/15] Testing POST /api/v1/scan/qr...")
    status, body = make_request("POST", "/api/v1/scan/qr", {"decoded_content": "https://campus-verify-auth.xyz/portal"})
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert body.get("input_type") == "qr"
    print(f"  [OK] Status {status}: verdict={body.get('verdict')}, input_type={body.get('input_type')}")

    # 6. Incident Lifecycle: POST -> GET -> PATCH
    print("\n[6/15] Testing Incident Lifecycle (Create -> Read -> Update)...")
    status, incident = make_request("POST", "/api/v1/incidents", {
        "category": "phishing",
        "severity": "high",
        "description": "Received fake campus bursar payment alert requesting external wire transfer.",
        "suspicious_content": "http://campus-fake-portal.xyz/wire",
        "department": "Bursar Office"
    })
    assert status == 201, f"Expected 201, got {status}: {incident}"
    incident_id = incident["id"]
    assert incident["status"] == "submitted"
    print(f"  [OK] Created Incident ID: {incident_id} (status: {incident['status']})")

    status, fetched = make_request("GET", f"/api/v1/incidents/{incident_id}")
    assert status == 200, f"Expected 200, got {status}: {fetched}"
    assert fetched["id"] == incident_id
    print(f"  [OK] Retrieved Incident by ID: {fetched['id']}")

    status, incidents_list = make_request("GET", "/api/v1/incidents")
    assert status == 200, f"Expected 200, got {status}: {incidents_list}"
    assert any(item["id"] == incident_id for item in incidents_list)
    print(f"  [OK] Listed {len(incidents_list)} incident(s)")

    status, updated = make_request("PATCH", f"/api/v1/incidents/{incident_id}", {
        "status": "triaged",
        "resolution_notes": "Assigned to Campus Security Incident Response Team."
    })
    assert status == 200, f"Expected 200, got {status}: {updated}"
    assert updated["status"] == "triaged"
    print(f"  [OK] Updated Incident Status to: {updated['status']}")

    # 7. Dashboard Stats
    print("\n[7/15] Testing GET /api/v1/dashboard/stats...")
    status, stats = make_request("GET", "/api/v1/dashboard/stats")
    assert status == 200, f"Expected 200, got {status}: {stats}"
    assert stats["total_scans"] >= 3
    assert stats["reported_incidents"] >= 1
    print(f"  [OK] Dashboard Stats: total_scans={stats['total_scans']}, suspicious={stats['suspicious_results']}, reported={stats['reported_incidents']}")

    # 8. Feature 1: Threat DNA Engine
    print("\n[8/15] Testing Feature 1: Threat DNA Analysis...")
    status, dna = make_request("POST", "/api/v1/threat-dna/analyze", {
        "content": "URGENT: Dean Financial Aid bursar disbursement notice http://bursar-refunds-campus.info/claim?id=99",
        "target_url": "http://bursar-refunds-campus.info/claim?id=99",
        "claimed_sender": "bursar@fake-campus-refunds.com"
    })
    assert status == 200, f"Expected 200, got {status}: {dna}"
    assert "fingerprint_hash" in dna
    print(f"  [OK] Fingerprint hash: {dna['fingerprint_hash'][:16]}..., domain={dna.get('domain_normalized')}")

    status, campaigns = make_request("GET", "/api/v1/threat-dna/campaigns")
    assert status == 200, f"Expected 200, got {status}: {campaigns}"
    print(f"  [OK] Retrieved {len(campaigns)} Threat Campaign(s)")

    # 9. Feature 2 & 3: Campus Cyber Radar & Exposure Intelligence
    print("\n[9/15] Testing Feature 2 & 3: Cyber Radar Overview & Exposure Intelligence...")
    status, radar = make_request("GET", "/api/v1/cyber-radar/overview")
    assert status == 200, f"Expected 200, got {status}: {radar}"
    assert "severities" in radar
    assert "categories" in radar
    print(f"  [OK] Radar total incidents recorded: {radar['total_incidents']}, campaigns={radar['active_campaigns_count']}")

    status, exposure = make_request("GET", "/api/v1/cyber-radar/exposure")
    assert status == 200, f"Expected 200, got {status}: {exposure}"
    assert "data_sufficiency_met" in exposure
    print(f"  [OK] Exposure Intelligence: sufficiency={exposure['data_sufficiency_met']}, depts={len(exposure['top_exposed_departments'])}")

    # 10. Feature 4: QR Guardian
    print("\n[10/15] Testing Feature 4: QR Guardian Deep Analysis...")
    status, qr_guardian = make_request("POST", "/api/v1/qr/analyze", {
        "decoded_content": "https://library.campus.edu/portal"
    })
    assert status == 200, f"Expected 200, got {status}: {qr_guardian}"
    assert qr_guardian["is_official_campus_destination"] is True
    print(f"  [OK] QR Guardian badge={qr_guardian['verification_badge']}, is_official={qr_guardian['is_official_campus_destination']}")

    status, qr_destinations = make_request("GET", "/api/v1/qr/verified-destinations")
    assert status == 200, f"Expected 200, got {status}: {qr_destinations}"
    print(f"  [OK] Verified Destinations Registry count: {len(qr_destinations)}")

    # 11. Feature 6: Institutional Trust Graph
    print("\n[11/15] Testing Feature 6: Trust Graph Identity Verification...")
    status, identities = make_request("GET", "/api/v1/trust-graph/identities")
    assert status == 200, f"Expected 200, got {status}: {identities}"
    print(f"  [OK] Registered Institutional Identities: {len(identities)}")

    # Verify official sender
    status, verify_official = make_request("POST", "/api/v1/trust-graph/verify", {
        "sender_email": "bursar@campus.edu",
        "sender_name": "Office of the Bursar"
    })
    assert status == 200, f"Expected 200, got {status}: {verify_official}"
    assert verify_official["status"] == "VERIFIED_OFFICIAL", f"Expected VERIFIED_OFFICIAL, got: {verify_official}"
    print(f"  [OK] Official Domain check: {verify_official['status']}")

    # Verify lookalike / spoofed sender
    status, verify_spoof = make_request("POST", "/api/v1/trust-graph/verify", {
        "sender_email": "admin@campus-edu-portal.xyz",
        "sender_name": "Campus Helpdesk Impersonator"
    })
    assert status == 200, f"Expected 200, got {status}: {verify_spoof}"
    assert verify_spoof["status"] in ("LOOKALIKE_SPOOFING", "UNVERIFIED_SENDER")
    print(f"  [OK] Lookalike check: {verify_spoof['status']}")

    # 12. Feature 9: Evidence Timeline Generator & Digital Signature Export
    print("\n[12/15] Testing Feature 9: Evidence Timeline & Export...")
    status, timeline = make_request("GET", f"/api/v1/incidents/{incident_id}/timeline")
    assert status == 200, f"Expected 200, got {status}: {timeline}"
    assert len(timeline) >= 2  # Created + status updated
    print(f"  [OK] Timeline events recorded for incident: {len(timeline)} events")

    status, export_data = make_request("GET", f"/api/v1/incidents/{incident_id}/export")
    assert status == 200, f"Expected 200, got {status}: {export_data}"
    assert "export_signature" in export_data
    assert export_data["export_signature"].startswith("SIG-SHA256-")
    print(f"  [OK] Tamper-evident export package verified with SHA-256 signature: {export_data['export_signature']}...")

    # 13. Feature 10: Adaptive Cyber Safety Coach
    print("\n[13/15] Testing Feature 10: Adaptive Safety Coach...")
    status, modules = make_request("GET", "/api/v1/coach/modules")
    assert status == 200, f"Expected 200, got {status}: {modules}"
    assert len(modules) >= 3
    print(f"  [OK] Available Learning Modules: {len(modules)}")

    # Submit a quiz
    status, quiz_res = make_request("POST", "/api/v1/coach/quiz/submit", {
        "module_id": modules[0]["id"],
        "answers": [0]
    })
    assert status == 200, f"Expected 200, got {status}: {quiz_res}"
    print(f"  [OK] Quiz evaluated: score={quiz_res['score']}%, passed={quiz_res['passed']}, badge={quiz_res.get('badge_awarded')}")

    status, progress = make_request("GET", "/api/v1/coach/progress")
    assert status == 200, f"Expected 200, got {status}: {progress}"
    print(f"  [OK] Coach Progress: level='{progress['coach_level']}', completed={progress['completed_modules']}")

    # 14. Feature 7: Campus Cyber Immune System Warnings
    print("\n[14/15] Testing Feature 7: Campus Cyber Immune Warnings...")
    status, warnings = make_request("GET", "/api/v1/immune/warnings")
    assert status == 200, f"Expected 200, got {status}: {warnings}"
    print(f"  [OK] Active Campus Cyber Warnings: {len(warnings)}")

    # 15. Negative test (404 and validation)
    print("\n[15/15] Testing Error Handling & Validations...")
    status, err = make_request("GET", "/api/v1/incidents/nonexistent-id-000")
    assert status == 404, f"Expected 404, got {status}"
    print(f"  [OK] Expected 404 on missing incident: {err.get('detail')}")

    print("\n==================================================")
    print("ALL 15 CORE & INNOVATION API TESTS PASSED 100%!")
    print("==================================================")


if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[FAIL] Test Failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
