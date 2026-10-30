from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_current_user, get_current_admin, CurrentUser
from app.schemas.threat_dna import (
    AnalyzeThreatDnaRequest,
    ThreatCampaignResponse,
    ReviewCampaignRequest
)
from app.services.threat_dna_service import threat_dna_service

router = APIRouter(prefix="/threat-dna", tags=["Campus Cyberattack DNA"])


@router.post("/analyze", status_code=status.HTTP_200_OK)
def analyze_threat_dna(
    payload: AnalyzeThreatDnaRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """
    Extracts semantic DNA fingerprint and correlates with known campus campaigns.
    """
    correlation = threat_dna_service.process_and_correlate(
        db=db,
        incident_id=payload.incident_id,
        scan_id=payload.scan_id,
        content=payload.content,
        target_url=payload.target_url,
        claimed_sender=payload.claimed_sender
    )
    return correlation


@router.get("/campaigns", response_model=List[ThreatCampaignResponse], status_code=status.HTTP_200_OK)
def list_threat_campaigns(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Lists aggregated threat campaigns with similarity match scores."""
    return threat_dna_service.list_campaigns(db)


@router.get("/campaigns/{campaign_id}", response_model=ThreatCampaignResponse, status_code=status.HTTP_200_OK)
def get_threat_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    campaigns = threat_dna_service.list_campaigns(db)
    for c in campaigns:
        if c.id == campaign_id:
            return c
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")


@router.post("/campaigns/{campaign_id}/review", response_model=ThreatCampaignResponse, status_code=status.HTTP_200_OK)
def review_threat_campaign(
    campaign_id: str,
    payload: ReviewCampaignRequest,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin)
):
    """Allows administrators to confirm, reject, or mitigate threat campaigns."""
    updated = threat_dna_service.review_campaign(db, campaign_id, payload.status, payload.notes)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return get_threat_campaign(campaign_id, db, admin)
