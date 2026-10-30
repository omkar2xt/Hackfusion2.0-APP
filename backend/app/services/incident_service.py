import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.models import IncidentModel, AuditLogModel
from app.schemas.incident import CreateIncidentRequest, UpdateIncidentStatusRequest
from app.services.timeline_service import timeline_service
from app.services.threat_dna_service import threat_dna_service


class IncidentService:
    @staticmethod
    def create(db: Session, user_id: str, data: CreateIncidentRequest) -> IncidentModel:
        incident = IncidentModel(
            id=str(uuid.uuid4()),
            user_id=user_id,
            category=data.category,
            severity=data.severity,
            status="submitted",
            description=data.description,
            suspicious_content=data.suspicious_content or "",
            resolution_notes="",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(incident)

        audit = AuditLogModel(
            id=str(uuid.uuid4()),
            actor_id=user_id,
            action="INCIDENT_SUBMITTED",
            resource_type="incident",
            resource_id=incident.id,
            details={
                "category": incident.category,
                "severity": incident.severity
            },
            created_at=datetime.utcnow()
        )
        db.add(audit)
        db.commit()
        db.refresh(incident)

        # 1. Record creation in immutable timeline (Feature 9)
        timeline_service.record_event(
            db=db,
            incident_id=incident.id,
            event_type="CREATED",
            description=f"Incident report logged by campus member under category '{incident.category}' (Severity: {incident.severity.upper()}).",
            actor_id=user_id,
            metadata_json={"category": incident.category, "severity": incident.severity}
        )

        # 2. Correlate with Campus Cyberattack DNA engine (Feature 1 & 7)
        try:
            correlation = threat_dna_service.process_and_correlate(
                db=db,
                incident_id=incident.id,
                scan_id=None,
                content=incident.description,
                target_url=incident.suspicious_content,
                claimed_sender=None
            )
            if correlation.get("correlated_campaign_id"):
                timeline_service.record_event(
                    db=db,
                    incident_id=incident.id,
                    event_type="CAMPAIGN_LINKED",
                    description=f"Automated threat DNA correlation matched Campaign '{correlation['campaign_name']}' (Similarity: {int(correlation['similarity_score'] * 100)}%).",
                    actor_id="DNA_ENGINE",
                    metadata_json={
                        "campaign_id": correlation["correlated_campaign_id"],
                        "similarity_score": correlation["similarity_score"],
                        "match_reasons": correlation["match_reasons"]
                    }
                )
        except Exception as e:
            print(f"[ThreatDNA] Correlation non-fatal error: {e}")

        return incident

    @staticmethod
    def list_for_user(db: Session, user_id: str, is_admin: bool = False) -> List[IncidentModel]:
        """Lists incidents: admins see all incidents; students see their own reports."""
        if is_admin:
            return db.query(IncidentModel).order_by(desc(IncidentModel.created_at)).all()
        return (
            db.query(IncidentModel)
            .filter((IncidentModel.user_id == user_id) | (IncidentModel.user_id == None))
            .order_by(desc(IncidentModel.created_at))
            .all()
        )

    @staticmethod
    def get_by_id(db: Session, incident_id: str) -> Optional[IncidentModel]:
        return db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()

    @staticmethod
    def update_status(
        db: Session,
        incident_id: str,
        actor_id: str,
        data: UpdateIncidentStatusRequest
    ) -> Optional[IncidentModel]:
        incident = db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()
        if not incident:
            return None

        old_status = incident.status
        if data.status:
            incident.status = data.status
        if data.severity:
            incident.severity = data.severity
        if data.resolution_notes is not None:
            incident.resolution_notes = data.resolution_notes

        incident.updated_at = datetime.utcnow()

        audit = AuditLogModel(
            id=str(uuid.uuid4()),
            actor_id=actor_id,
            action="INCIDENT_STATUS_UPDATED",
            resource_type="incident",
            resource_id=incident.id,
            details={
                "old_status": old_status,
                "new_status": incident.status,
                "resolution_notes": incident.resolution_notes
            },
            created_at=datetime.utcnow()
        )
        db.add(audit)
        db.commit()
        db.refresh(incident)

        # Record timeline event (Feature 9)
        timeline_service.record_event(
            db=db,
            incident_id=incident.id,
            event_type="STATUS_CHANGE",
            description=f"Status advanced from '{old_status.upper()}' to '{incident.status.upper()}'. Notes: {incident.resolution_notes or 'No notes provided'}",
            actor_id=actor_id,
            metadata_json={"old_status": old_status, "new_status": incident.status}
        )

        return incident


incident_service = IncidentService()
