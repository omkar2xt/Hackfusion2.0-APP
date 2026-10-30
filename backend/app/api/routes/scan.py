import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import ScanModel
from app.core.security import get_current_user, CurrentUser
from app.schemas.scan import (
    ScanUrlRequest,
    ScanMessageRequest,
    ScanQrRequest,
    ScanResultResponse
)
from app.services.url_analyzer import url_analyzer
from app.services.message_analyzer import message_analyzer
from app.services.qr_analyzer import qr_analyzer

router = APIRouter(prefix="/scan", tags=["Scanning"])


def record_scan(db: Session, user_id: str, analysis: dict) -> ScanModel:
    scan = ScanModel(
        id=str(uuid.uuid4()),
        user_id=user_id,
        input_type=analysis["input_type"],
        input_value=analysis["input_value"],
        verdict=analysis["verdict"],
        risk_level=analysis["risk_level"],
        risk_score=analysis["risk_score"],
        scoring_version="v1.2-explainable",
        indicators=analysis["indicators"],
        recommendations=analysis["recommendations"],
        checked_at=datetime.utcnow()
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


@router.post("/url", response_model=ScanResultResponse, status_code=status.HTTP_200_OK)
def scan_url(
    payload: ScanUrlRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    analysis = url_analyzer.analyze(payload.url)
    scan_record = record_scan(db, user.id, analysis)

    return ScanResultResponse(
        scan_id=scan_record.id,
        verdict=scan_record.verdict,  # type: ignore
        risk_level=scan_record.risk_level,
        risk_score=scan_record.risk_score,
        scoring_version=scan_record.scoring_version,
        indicators=scan_record.indicators,  # type: ignore
        recommendations=scan_record.recommendations,  # type: ignore
        checked_at=scan_record.checked_at.isoformat() + "Z",
        input_type="url",
        input_value=scan_record.input_value
    )


@router.post("/message", response_model=ScanResultResponse, status_code=status.HTTP_200_OK)
def scan_message(
    payload: ScanMessageRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    analysis = message_analyzer.analyze(payload.message_text)
    scan_record = record_scan(db, user.id, analysis)

    return ScanResultResponse(
        scan_id=scan_record.id,
        verdict=scan_record.verdict,  # type: ignore
        risk_level=scan_record.risk_level,
        risk_score=scan_record.risk_score,
        scoring_version=scan_record.scoring_version,
        indicators=scan_record.indicators,  # type: ignore
        recommendations=scan_record.recommendations,  # type: ignore
        checked_at=scan_record.checked_at.isoformat() + "Z",
        input_type="message",
        input_value=scan_record.input_value
    )


@router.post("/qr", response_model=ScanResultResponse, status_code=status.HTTP_200_OK)
def scan_qr(
    payload: ScanQrRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    analysis = qr_analyzer.analyze(payload.decoded_content)
    scan_record = record_scan(db, user.id, analysis)

    return ScanResultResponse(
        scan_id=scan_record.id,
        verdict=scan_record.verdict,  # type: ignore
        risk_level=scan_record.risk_level,
        risk_score=scan_record.risk_score,
        scoring_version=scan_record.scoring_version,
        indicators=scan_record.indicators,  # type: ignore
        recommendations=scan_record.recommendations,  # type: ignore
        checked_at=scan_record.checked_at.isoformat() + "Z",
        input_type="qr",
        input_value=scan_record.input_value
    )
