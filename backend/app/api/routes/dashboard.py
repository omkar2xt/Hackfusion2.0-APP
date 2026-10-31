from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database.session import get_db_optional
from app.database.models import ScanModel, IncidentModel
from app.core.security import get_current_user, CurrentUser
from app.schemas.dashboard import DashboardStatsResponse
from app.schemas.scan import ScanResultResponse
from app.schemas.incident import IncidentResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse, status_code=status.HTTP_200_OK)
def get_dashboard_stats(
    db: Optional[Session] = Depends(get_db_optional),
    user: CurrentUser = Depends(get_current_user)
):
    if db is None:
        return DashboardStatsResponse(
            total_scans=0,
            suspicious_results=0,
            reported_incidents=0,
            recent_scans=[],
            recent_incidents=[]
        )

    try:
        total_scans = db.query(func.count(ScanModel.id)).scalar() or 0

        suspicious_results = (
            db.query(func.count(ScanModel.id))
            .filter(ScanModel.verdict.in_(["MALICIOUS", "SUSPICIOUS"]))
            .scalar()
            or 0
        )

        reported_incidents = db.query(func.count(IncidentModel.id)).scalar() or 0

        recent_scans_models = (
            db.query(ScanModel)
            .order_by(desc(ScanModel.checked_at))
            .limit(5)
            .all()
        )
        recent_scans = [
            ScanResultResponse(
                scan_id=scan.id,
                verdict=scan.verdict,  # type: ignore
                risk_level=scan.risk_level,
                risk_score=scan.risk_score,
                scoring_version=scan.scoring_version,
                indicators=scan.indicators or [],
                recommendations=scan.recommendations or [],
                checked_at=scan.checked_at.isoformat() + "Z" if scan.checked_at else "",
                input_type=scan.input_type,  # type: ignore
                input_value=scan.input_value
            )
            for scan in recent_scans_models
        ]

        recent_incidents_models = (
            db.query(IncidentModel)
            .order_by(desc(IncidentModel.created_at))
            .limit(5)
            .all()
        )
        recent_incidents = [
            IncidentResponse(
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
            for inc in recent_incidents_models
        ]

        return DashboardStatsResponse(
            total_scans=total_scans,
            suspicious_results=suspicious_results,
            reported_incidents=reported_incidents,
            recent_scans=recent_scans,
            recent_incidents=recent_incidents
        )
    except Exception as exc:
        print(f"[{router.prefix}] Error querying dashboard telemetry: {exc}")
        return DashboardStatsResponse(
            total_scans=0,
            suspicious_results=0,
            reported_incidents=0,
            recent_scans=[],
            recent_incidents=[]
        )
