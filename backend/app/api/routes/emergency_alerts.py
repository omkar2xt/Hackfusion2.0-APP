from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_current_user, get_current_admin, CurrentUser
from app.schemas.emergency_alerts import (
    BroadcastAlertRequest,
    EmergencyAlertResponse,
    AcknowledgeAlertRequest,
    AlertDeliveryMetric
)
from app.schemas.hierarchy import InstitutionTreeResponse
from app.services.alert_and_device_service import alert_and_device_service

router = APIRouter(prefix="/alerts", tags=["Emergency Red Alert Broadcast"])


@router.post("/broadcast", response_model=EmergencyAlertResponse, status_code=status.HTTP_201_CREATED)
def broadcast_red_alert(
    payload: BroadcastAlertRequest,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin)
):
    """
    Admin Command Center: Broadcasts an authenticated Red Alert across target campus proximity mesh.
    Triggers delivery tracking across registered devices.
    """
    return alert_and_device_service.broadcast_alert(
        db,
        admin_user_id=admin.id,
        admin_name=admin.full_name or "Campus SOC Incident Lead",
        admin_role=admin.role,
        data=payload
    )


@router.get("/active", response_model=List[EmergencyAlertResponse], status_code=status.HTTP_200_OK)
def get_active_emergency_alerts(
    device_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Retrieves all active emergency broadcasts targeting current campus devices."""
    return alert_and_device_service.get_active_alerts(db, user_id=user.id, device_id=device_id)


@router.post("/{alert_id}/acknowledge", status_code=status.HTTP_200_OK)
def acknowledge_alert(
    alert_id: str,
    payload: AcknowledgeAlertRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Records authenticated student/staff acknowledgment of emergency protocol."""
    res = alert_and_device_service.acknowledge_alert(db, alert_id, user.id, payload)
    if not res.get("success"):
        raise HTTPException(status_code=404, detail="Alert not found or acknowledgment failed")
    return res


@router.get("/{alert_id}/deliveries", response_model=AlertDeliveryMetric, status_code=status.HTTP_200_OK)
def get_alert_delivery_metrics(
    alert_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Retrieves real-time mesh delivery and acknowledgment metrics for an emergency alert."""
    return alert_and_device_service.get_alert_deliveries(db, alert_id)


@router.get("/hierarchy/tree", response_model=InstitutionTreeResponse, status_code=status.HTTP_200_OK)
def get_institutional_hierarchy(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Retrieves multi-tier institutional hierarchy tree: Institution -> Campus -> Department -> Groups -> Devices."""
    return alert_and_device_service.get_hierarchy_tree(db)

