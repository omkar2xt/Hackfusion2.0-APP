from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_current_user, get_current_admin, CurrentUser
from app.schemas.qr_guardian import (
    QrGuardianAnalysisResponse,
    VerifiedQrDestinationResponse,
    CreateVerifiedQrRequest
)
from app.schemas.scan import ScanQrRequest
from app.services.qr_guardian_service import qr_guardian_service

router = APIRouter(prefix="/qr", tags=["QR Guardian"])


@router.post("/analyze", response_model=QrGuardianAnalysisResponse, status_code=status.HTTP_200_OK)
def analyze_qr_code(
    payload: ScanQrRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Deep inspection of QR code verifying against institutional registry."""
    return qr_guardian_service.analyze_qr_with_guardian(db, payload.decoded_content)


@router.get("/verified-destinations", response_model=List[VerifiedQrDestinationResponse], status_code=status.HTTP_200_OK)
def list_verified_destinations(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Lists registered official university QR destinations."""
    return qr_guardian_service.list_verified_destinations(db)


@router.post("/admin/registry", response_model=VerifiedQrDestinationResponse, status_code=status.HTTP_201_CREATED)
def create_verified_destination(
    payload: CreateVerifiedQrRequest,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin)
):
    """Allows administrators to register official campus QR destinations."""
    return qr_guardian_service.create_destination(db, admin.id, payload)


@router.delete("/admin/registry/{destination_id}", status_code=status.HTTP_200_OK)
def delete_verified_destination(
    destination_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin)
):
    deleted = qr_guardian_service.delete_destination(db, destination_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verified QR entry not found")
    return {"status": "success", "message": "Verified QR entry deactivated"}
