from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_current_user, CurrentUser
from app.schemas.devices import (
    RegisterDeviceRequest,
    DeviceRegistrationResponse
)
from app.services.alert_and_device_service import alert_and_device_service

router = APIRouter(prefix="/devices", tags=["Authenticated Device Relay"])


@router.post("/register", response_model=DeviceRegistrationResponse, status_code=status.HTTP_200_OK)
def register_device(
    payload: RegisterDeviceRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Registers or updates a device session, push token, and proximity mesh location."""
    return alert_and_device_service.register_or_heartbeat_device(db, user.id, payload)


@router.get("", response_model=List[DeviceRegistrationResponse], status_code=status.HTTP_200_OK)
def list_devices(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Retrieves all active registered devices for the authenticated user session."""
    return alert_and_device_service.list_user_devices(db, user.id)


@router.delete("/{device_id}", status_code=status.HTTP_200_OK)
def revoke_device(
    device_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Revokes a registered device session and stops push alerts to that device."""
    success = alert_and_device_service.revoke_device(db, user.id, device_id)
    if not success:
        raise HTTPException(status_code=404, detail="Device registration not found")
    return {"success": True, "message": "Device registration revoked successfully"}
