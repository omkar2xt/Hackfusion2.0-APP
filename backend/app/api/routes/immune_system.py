from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_current_user, get_current_admin, CurrentUser
from app.schemas.immune_system import CampusWarningResponse, CreateCampusWarningRequest
from app.services.immune_system_service import immune_system_service

router = APIRouter(prefix="/immune", tags=["Campus Cyber Immune System"])


@router.get("/warnings", response_model=List[CampusWarningResponse], status_code=status.HTTP_200_OK)
def list_campus_warnings(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Retrieves verified campus security warnings authorized by administrators."""
    return immune_system_service.list_approved_warnings(db)


@router.post("/admin/warnings", response_model=CampusWarningResponse, status_code=status.HTTP_201_CREATED)
def create_campus_warning(
    payload: CreateCampusWarningRequest,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin)
):
    """Publishes a campus-wide threat alert after administrative review."""
    return immune_system_service.create_warning(db, admin.id, payload)
