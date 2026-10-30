from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_current_user, CurrentUser
from app.schemas.timeline import IncidentTimelineEventResponse, IncidentTimelineExportResponse
from app.services.timeline_service import timeline_service

router = APIRouter(prefix="/incidents", tags=["Evidence Timeline Generator"])


@router.get("/{incident_id}/timeline", response_model=List[IncidentTimelineEventResponse], status_code=status.HTTP_200_OK)
def get_incident_timeline(
    incident_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Retrieves full chronological audit trail of an incident."""
    return timeline_service.get_timeline(db, incident_id)


@router.get("/{incident_id}/export", response_model=IncidentTimelineExportResponse, status_code=status.HTTP_200_OK)
def export_evidence_package(
    incident_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Exports structured and verifiable evidence timeline with SHA-256 signature."""
    package = timeline_service.export_evidence_package(db, incident_id)
    if not package:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return package
