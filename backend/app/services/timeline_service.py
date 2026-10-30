import uuid
import hashlib
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.models import IncidentTimelineModel, IncidentModel
from app.schemas.timeline import IncidentTimelineEventResponse, IncidentTimelineExportResponse


class TimelineService:
    @staticmethod
    def record_event(
        db: Session,
        incident_id: str,
        event_type: str,
        description: str,
        actor_id: Optional[str] = None,
        metadata_json: Optional[Dict[str, Any]] = None
    ) -> IncidentTimelineModel:
        """Appends an immutable audit event to an incident's investigation timeline."""
        event = IncidentTimelineModel(
            id=str(uuid.uuid4()),
            incident_id=incident_id,
            event_type=event_type,
            actor_id=actor_id or "SOC Analyst",
            description=description,
            metadata_json=metadata_json or {},
            created_at=datetime.utcnow()
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def get_timeline(db: Session, incident_id: str) -> List[IncidentTimelineEventResponse]:
        events = (
            db.query(IncidentTimelineModel)
            .filter(IncidentTimelineModel.incident_id == incident_id)
            .order_by(IncidentTimelineModel.created_at.asc())
            .all()
        )
        # If no events exist yet, seed initial CREATED event so timeline is never empty
        if not events:
            inc = db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()
            if inc:
                init_ev = IncidentTimelineModel(
                    id=str(uuid.uuid4()),
                    incident_id=incident_id,
                    event_type="CREATED",
                    actor_id="Reporter Endpoint",
                    description=f"Incident report submitted into triage queue under category '{inc.category}'.",
                    metadata_json={"severity": inc.severity, "category": inc.category},
                    created_at=inc.created_at or datetime.utcnow()
                )
                db.add(init_ev)
                db.commit()
                db.refresh(init_ev)
                events = [init_ev]

        results = []
        for e in events:
            iso_time = e.created_at.isoformat() + "Z" if e.created_at else datetime.utcnow().isoformat() + "Z"
            results.append(
                IncidentTimelineEventResponse(
                    id=e.id,
                    incident_id=e.incident_id,
                    event_type=e.event_type,
                    actor_id=e.actor_id or "SOC Analyst",
                    actor=e.actor_id or "Campus SOC",
                    description=e.description,
                    details=e.description,
                    metadata_json=e.metadata_json or {},
                    created_at=iso_time,
                    timestamp=iso_time
                )
            )
        return results

    @classmethod
    def export_evidence_package(cls, db: Session, incident_id: str) -> Optional[IncidentTimelineExportResponse]:
        incident = db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()
        if not incident:
            return None

        timeline_events = cls.get_timeline(db, incident_id)

        # Generate a tamper-evident audit signature (SHA-256 of combined events)
        signature_material = f"{incident.id}:{incident.created_at}:{len(timeline_events)}"
        for ev in timeline_events:
            signature_material += f"|{ev.id}:{ev.event_type}:{ev.created_at}"
        audit_hash = hashlib.sha256(signature_material.encode("utf-8")).hexdigest()

        return IncidentTimelineExportResponse(
            incident_id=incident.id,
            category=incident.category,
            severity=incident.severity,
            current_status=incident.status,
            created_at=incident.created_at.isoformat() + "Z" if incident.created_at else datetime.utcnow().isoformat() + "Z",
            exported_at=datetime.utcnow().isoformat() + "Z",
            total_events=len(timeline_events),
            timeline=timeline_events,
            export_signature=f"SIG-SHA256-{audit_hash[:32]}"
        )


timeline_service = TimelineService()
