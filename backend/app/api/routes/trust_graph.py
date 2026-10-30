from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_current_user, get_current_admin, CurrentUser
from app.schemas.trust_graph import (
    InstitutionalIdentityResponse,
    CreateInstitutionalIdentityRequest,
    VerifyIdentityRequest,
    VerifyIdentityResponse
)
from app.services.trust_graph_service import trust_graph_service

router = APIRouter(prefix="/trust-graph", tags=["Institutional Trust Graph"])


@router.get("/identities", response_model=List[InstitutionalIdentityResponse], status_code=status.HTTP_200_OK)
def list_identities(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Retrieves verified campus departments, faculty, and official payment portals."""
    return trust_graph_service.list_identities(db)


@router.post("/verify", response_model=VerifyIdentityResponse, status_code=status.HTTP_200_OK)
def verify_claimed_identity(
    payload: VerifyIdentityRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """
    Verifies claimed sender, domain, or payment portal against institutional registry.
    Detects lookalike spoofing and unverified sender attempts.
    """
    return trust_graph_service.verify(db, payload)


@router.post("/admin/identities", response_model=InstitutionalIdentityResponse, status_code=status.HTTP_201_CREATED)
def create_identity(
    payload: CreateInstitutionalIdentityRequest,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin)
):
    """Registers an official campus official, department, or verified payment destination."""
    return trust_graph_service.create_identity(db, payload)

