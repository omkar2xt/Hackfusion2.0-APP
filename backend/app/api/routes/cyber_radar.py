from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_current_user, CurrentUser
from app.schemas.cyber_radar import CyberRadarOverviewResponse, ExposureIntelligenceResponse
from app.services.cyber_radar_service import cyber_radar_service

router = APIRouter(prefix="/cyber-radar", tags=["Campus Cyber Radar"])


@router.get("/overview", response_model=CyberRadarOverviewResponse, status_code=status.HTTP_200_OK)
def get_radar_overview(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Returns anonymized campus-wide threat radar and exposure analytics."""
    return cyber_radar_service.get_overview(db)


@router.get("/exposure", response_model=ExposureIntelligenceResponse, status_code=status.HTTP_200_OK)
def get_exposure_intelligence(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """
    Feature 3: Next-Target Exposure Intelligence.
    Adheres to data sufficiency guardrails and displays elevated exposure based on reported trends.
    """
    overview = cyber_radar_service.get_overview(db)
    return overview.exposure_summary
