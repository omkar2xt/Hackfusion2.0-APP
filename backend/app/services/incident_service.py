import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.models import IncidentModel, AuditLogModel
from app.schemas.incident import CreateIncidentRequest, UpdateIncidentStatusRequest


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
        return incident


incident_service = IncidentService()
