from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import get_current_user, CurrentUser
from app.schemas.cyber_radar import (
    CyberRadarOverviewResponse,
    ExposureIntelligenceResponse,
    ProximityAlertBroadcast,
    BroadcastAlertRequest
)
from app.services.cyber_radar_service import cyber_radar_service, ACTIVE_PROXIMITY_BROADCASTS

router = APIRouter(prefix="/cyber-radar", tags=["Campus Cyber Radar & Threat Trend Mapping"])


@router.get("/overview", response_model=CyberRadarOverviewResponse, status_code=status.HTTP_200_OK)
def get_radar_overview(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """
    Innovation 4: Campus Threat Trend Mapping.
    Returns aggregated incident patterns by campus facility, category and time.
    Guarantees STRICT ANONYMITY: individual reporters' identities are never exposed.
    """
    return cyber_radar_service.get_overview(db)


@router.get("/exposure", response_model=ExposureIntelligenceResponse, status_code=status.HTTP_200_OK)
def get_exposure_intelligence(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    """Next-Target Exposure Intelligence with data sufficiency guardrails."""
    overview = cyber_radar_service.get_overview(db)
    return overview.exposure_summary


@router.get("/proximity-alerts", response_model=List[ProximityAlertBroadcast], status_code=status.HTTP_200_OK)
def get_proximity_alerts(
    user: CurrentUser = Depends(get_current_user)
):
    """Returns active red alerts broadcasted to nearby connected devices on campus."""
    return ACTIVE_PROXIMITY_BROADCASTS


@router.post("/broadcast-alert", response_model=ProximityAlertBroadcast, status_code=status.HTTP_201_CREATED)
def broadcast_proximity_alert(
    payload: BroadcastAlertRequest,
    user: CurrentUser = Depends(get_current_user)
):
    """Dispatches a real-time proximity red alert across campus mesh to nearby student apps."""
    return cyber_radar_service.broadcast_proximity_alert(
        zone_id=payload.zone_id,
        category=payload.category,
        severity=payload.severity,
        message=payload.message
    )
