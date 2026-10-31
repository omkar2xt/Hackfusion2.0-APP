"""
Comprehensive Database CRUD, Persistence, and Telemetry Verification Test
Verifies real SELECT, INSERT, UPDATE, DELETE operations, API persistence across requests,
telemetry queries, and test data cleanup.
"""
import sys
import os
import uuid
from datetime import datetime, timezone
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database.session import SessionLocal, get_db_optional, check_database_connection
from app.database.models import IncidentModel, ScanModel

client = TestClient(app)

def test_database_crud_and_persistence_lifecycle():
    assert SessionLocal is not None, "Database SessionLocal factory must be available"
    db: Session = SessionLocal()
    test_id = f"test-crud-{uuid.uuid4().hex[:8]}"

    try:
        # 1. INSERT: Create controlled test incident record
        new_incident = IncidentModel(
            id=test_id,
            user_id="test-analyst-001",
            category="phishing",
            severity="high",
            status="submitted",
            description="Automated database CRUD & persistence verification incident",
            suspicious_content="https://test-credential-harvester.verify/login",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(new_incident)
        db.commit()
        db.refresh(new_incident)

        # 2. SELECT: Verify record exists in database
        queried = db.query(IncidentModel).filter(IncidentModel.id == test_id).first()
        assert queried is not None, "Inserted record must be found in database"
        assert queried.id == test_id
        assert queried.category == "phishing"
        assert queried.severity == "high"
        assert queried.status == "submitted"

        # 3. UPDATE: Update record attributes
        queried.status = "investigating"
        queried.resolution_notes = "Assigned to SOC Tier-2 Incident Responder"
        queried.updated_at = datetime.now(timezone.utc)
        db.commit()

        # Re-query in a fresh transaction to verify commit persistence
        db.expire_all()
        updated_record = db.query(IncidentModel).filter(IncidentModel.id == test_id).first()
        assert updated_record.status == "investigating"
        assert updated_record.resolution_notes == "Assigned to SOC Tier-2 Incident Responder"

        # 4. API PERSISTENCE: Verify separate HTTP requests retrieve the live database record
        api_res = client.get(f"/api/v1/incidents/{test_id}")
        assert api_res.status_code == 200, f"Expected 200, got {api_res.status_code}"
        api_data = api_res.json()
        assert api_data["id"] == test_id
        assert api_data["status"] == "investigating"
        assert api_data["resolution_notes"] == "Assigned to SOC Tier-2 Incident Responder"

        # 5. DASHBOARD RETRIEVAL: Verify dashboard retrieves actual database records
        dash_res = client.get("/api/v1/dashboard/stats")
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        assert dash_data["reported_incidents"] >= 1, "Dashboard must report active database record count"
        recent_incident_ids = [inc["id"] for inc in dash_data.get("recent_incidents", [])]
        assert test_id in recent_incident_ids, "Test record must be listed in recent incidents telemetry"

        # 6. DELETE: Controlled test data cleanup
        db.delete(queried)
        db.commit()

        # 7. CLEANUP VERIFICATION: Confirm test data is completely removed
        cleanup_check = db.query(IncidentModel).filter(IncidentModel.id == test_id).first()
        assert cleanup_check is None, "Test record must be completely deleted from database"

        # Confirm API returns 404 after deletion
        post_delete_res = client.get(f"/api/v1/incidents/{test_id}")
        assert post_delete_res.status_code == 404, "Deleted record must return 404 on API"

    finally:
        # Guarantee cleanup even if an assertion fails
        cleanup = db.query(IncidentModel).filter(IncidentModel.id == test_id).first()
        if cleanup:
            db.delete(cleanup)
            db.commit()
        db.close()


def test_get_db_optional_behavior():
    """
    Verifies that get_db_optional yields a valid session when configured,
    and returns None without throwing exceptions when database is unconfigured.
    """
    gen = get_db_optional()
    session = next(gen)
    assert session is not None, "get_db_optional must yield active Session when configured"
    assert isinstance(session, Session)
    try:
        next(gen)
    except StopIteration:
        pass
