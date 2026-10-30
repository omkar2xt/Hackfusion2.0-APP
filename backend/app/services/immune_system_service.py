import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.models import CampusWarningModel, ThreatCampaignModel
from app.schemas.immune_system import CampusWarningResponse, CreateCampusWarningRequest

DEFAULT_WARNINGS = [
    {
        "title": "URGENT: Fake 'Office 365 Password Reset' Phishing Emails Circulating",
        "content": "Campus IT Security has detected widespread deceptive emails claiming student Microsoft 365 accounts will expire today. The emails link to lookalike domain 'campus-login-auth.xyz'. Do not enter your password. Legitimate campus services will never request passwords over email.",
        "severity": "high",
        "status": "approved"
    }
]


class ImmuneSystemService:
    @classmethod
    def seed_defaults(cls, db: Session):
        if db.query(CampusWarningModel).count() == 0:
            for item in DEFAULT_WARNINGS:
                rec = CampusWarningModel(
                    id=str(uuid.uuid4()),
                    campaign_id=None,
                    title=item["title"],
                    content=item["content"],
                    severity=item["severity"],
                    status=item["status"],
                    published_at=datetime.utcnow()
                )
                db.add(rec)
            db.commit()

    @classmethod
    def list_approved_warnings(cls, db: Session) -> List[CampusWarningResponse]:
        cls.seed_defaults(db)
        warnings = (
            db.query(CampusWarningModel)
            .filter(CampusWarningModel.status == "approved")
            .order_by(desc(CampusWarningModel.published_at))
            .all()
        )
        return [
            CampusWarningResponse(
                id=w.id,
                campaign_id=w.campaign_id,
                title=w.title,
                content=w.content,
                severity=w.severity,
                status=w.status,
                published_at=w.published_at.isoformat() + "Z" if w.published_at else ""
            )
            for w in warnings
        ]

    @classmethod
    def create_warning(cls, db: Session, user_id: str, data: CreateCampusWarningRequest) -> CampusWarningResponse:
        record = CampusWarningModel(
            id=str(uuid.uuid4()),
            campaign_id=data.campaign_id,
            title=data.title,
            content=data.content,
            severity=data.severity,
            status=data.status,
            approved_by=user_id,
            published_at=datetime.utcnow()
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return CampusWarningResponse(
            id=record.id,
            campaign_id=record.campaign_id,
            title=record.title,
            content=record.content,
            severity=record.severity,
            status=record.status,
            published_at=record.published_at.isoformat() + "Z" if record.published_at else ""
        )


immune_system_service = ImmuneSystemService()
