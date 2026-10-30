from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_current_user, get_current_admin, CurrentUser
from app.schemas.incident import (
    CreateIncidentRequest,
    UpdateIncidentStatusRequest,
    IncidentResponse
)
from app.services.incident_service import incident_service

router = APIRouter(prefix="/incidents", tags=["Incidents"])


def format_incident(inc) -> IncidentResponse:
    return IncidentResponse(
        id=str(inc.id),
        user_id=str(inc.user_id) if inc.user_id else "",
        category=inc.category,
        description=inc.description,
        suspicious_content=inc.suspicious_content or "",
        severity=inc.severity,
        status=inc.status,
        created_at=inc.created_at.isoformat() + "Z" if inc.created_at else "",
        updated_at=inc.updated_at.isoformat() + "Z" if inc.updated_at else "",
        resolution_notes=inc.resolution_notes or ""
    )


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    payload: CreateIncidentRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    incident = incident_service.create(db, user.id, payload)
    return format_incident(incident)


@router.get("", response_model=List[IncidentResponse], status_code=status.HTTP_200_OK)
def list_incidents(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    is_admin = user.role in ("security_admin", "staff")
    incidents = incident_service.list_for_user(db, user.id, is_admin=is_admin)
    return [format_incident(inc) for inc in incidents]


@router.get("/{incident_id}", response_model=IncidentResponse, status_code=status.HTTP_200_OK)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    incident = incident_service.get_by_id(db, incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident '{incident_id}' not found"
        )

    if incident.user_id and incident.user_id != user.id and user.role not in ("security_admin", "staff"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to view this incident report"
        )

    return format_incident(incident)


@router.patch("/{incident_id}", response_model=IncidentResponse, status_code=status.HTTP_200_OK)
def update_incident(
    incident_id: str,
    payload: UpdateIncidentStatusRequest,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin)
):
    updated = incident_service.update_status(db, incident_id, admin.id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident '{incident_id}' not found"
        )
    return format_incident(updated)
