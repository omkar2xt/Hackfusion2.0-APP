from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_current_user, CurrentUser
from app.schemas.investigation import (
    UrlInvestigationRequest,
    UrlInvestigationResponse,
    QrInvestigationRequest,
    QrInvestigationResponse,
    EvidenceVaultItem,
    EvidenceCreateRequest,
    IncidentCorrelationItem,
    AttributionItem,
    InvestigationReport
)
from app.services.url_intelligence_service import url_intelligence_service
from app.services.qr_intelligence_service import qr_intelligence_service
from app.services.investigation_service import investigation_service

router = APIRouter(prefix="/investigation", tags=["Cyber Investigation Center & Intelligence Engines"])


@router.post("/url", response_model=UrlInvestigationResponse, status_code=status.HTTP_200_OK)
def investigate_url(
    payload: UrlInvestigationRequest,
    user: CurrentUser = Depends(get_current_user)
):
    """
    Dedicated URL Intelligence Pipeline:
    Analyzes normalization, domain reputation, DNS/ASN, TLS, redirect chains,
    typosquatting, credential harvesting, and SSRF/private network protection.
    """
    return url_intelligence_service.analyze_url(payload.url)


@router.post("/qr", response_model=QrInvestigationResponse, status_code=status.HTTP_200_OK)
def investigate_qr(
    payload: QrInvestigationRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """
    Dedicated QR Intelligence Pipeline:
    Analyzes exact decoded payload, payload classification (URL, Wi-Fi, Payment, Contact, Plaintext),
    SHA-256 integrity hash, campus reuse count, and QR-specific security explanations.
    """
    return qr_intelligence_service.analyze_qr(
        db=db,
        decoded_payload=payload.decoded_payload,
        image_metadata=payload.image_metadata,
        image_hash_sha256=payload.image_hash_sha256
    )


@router.get("/vault", response_model=List[EvidenceVaultItem], status_code=status.HTTP_200_OK)
def list_evidence_vault(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Retrieves all forensically sealed evidence items and chain-of-custody audit logs."""
    return investigation_service.get_evidence_vault(db)


@router.post("/vault", response_model=EvidenceVaultItem, status_code=status.HTTP_201_CREATED)
def deposit_evidence(
    payload: EvidenceCreateRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Deposits a new evidence asset into the cryptographic SHA-256 Evidence Vault."""
    return investigation_service.store_evidence(db, payload)


@router.get("/correlation", response_model=List[IncidentCorrelationItem], status_code=status.HTTP_200_OK)
def get_incident_correlations(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Correlates campus incidents across shared domain, IP, certificate, or campaign markers."""
    return investigation_service.get_correlations(db)


@router.get("/attribution/{incident_id}", response_model=AttributionItem, status_code=status.HTTP_200_OK)
def get_incident_attribution(
    incident_id: str,
    user: CurrentUser = Depends(get_current_user)
):
    """
    Returns an evidence-based attribution breakdown separating:
    1. Observed Facts
    2. Technical Inferences
    3. Unverified Hypotheses
    4. Confirmed Findings
    """
    return investigation_service.get_attribution(incident_id)


@router.get("/report/{incident_id}", response_model=InvestigationReport, status_code=status.HTTP_200_OK)
def generate_report(
    incident_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Generates a structured, exportable forensic investigation report."""
    return investigation_service.generate_investigation_report(db, incident_id)
