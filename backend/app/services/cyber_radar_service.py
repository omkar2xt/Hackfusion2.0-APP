from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database.models import IncidentModel, ScanModel, ThreatCampaignModel
from app.schemas.cyber_radar import (
    CyberRadarOverviewResponse,
    CategoryStat,
    SeverityStat,
    TrendPoint,
    DepartmentExposure,
    ExposureIntelligenceResponse
)


class CyberRadarService:
    @classmethod
    def get_overview(cls, db: Session) -> CyberRadarOverviewResponse:
        """Calculates aggregated, anonymized campus-wide threat telemetry."""
        total_incidents = db.query(func.count(IncidentModel.id)).scalar() or 0

        # Sub-category counts
        phishing_count = db.query(func.count(IncidentModel.id)).filter(
            IncidentModel.category.in_(["phishing", "suspicious_email"])
        ).scalar() or 0

        qr_threats_count = db.query(func.count(ScanModel.id)).filter(
            ScanModel.input_type == "qr",
            ScanModel.verdict.in_(["MALICIOUS", "SUSPICIOUS"])
        ).scalar() or 0

        impersonation_count = db.query(func.count(IncidentModel.id)).filter(
            IncidentModel.category.in_(["social_engineering", "unauthorized_access"])
        ).scalar() or 0

        payment_fraud_count = db.query(func.count(IncidentModel.id)).filter(
            IncidentModel.category == "other",
            IncidentModel.description.ilike("%payment%")
        ).scalar() or 0

        # Category distribution
        category_rows = (
            db.query(IncidentModel.category, func.count(IncidentModel.id))
            .group_by(IncidentModel.category)
            .all()
        )
        categories = [
            CategoryStat(
                category=cat,
                count=cnt,
                percentage=round((cnt / total_incidents * 100), 1) if total_incidents else 0.0
            )
            for cat, cnt in category_rows
        ]

        # Severity distribution
        severity_colors = {
            "critical": "#ef4444",
            "high": "#f97316",
            "medium": "#eab308",
            "low": "#3b82f6"
        }
        severity_rows = (
            db.query(IncidentModel.severity, func.count(IncidentModel.id))
            .group_by(IncidentModel.severity)
            .all()
        )
        severities = [
            SeverityStat(
                severity=sev,
                count=cnt,
                color=severity_colors.get(sev.lower(), "#94a3b8")
            )
            for sev, cnt in severity_rows
        ]

        # 7-day trend
        today = datetime.utcnow().date()
        trends: List[TrendPoint] = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_start = datetime.combine(day, datetime.min.time())
            day_end = datetime.combine(day, datetime.max.time())

            inc_cnt = db.query(func.count(IncidentModel.id)).filter(
                IncidentModel.created_at >= day_start,
                IncidentModel.created_at <= day_end
            ).scalar() or 0

            scan_cnt = db.query(func.count(ScanModel.id)).filter(
                ScanModel.checked_at >= day_start,
                ScanModel.checked_at <= day_end
            ).scalar() or 0

            trends.append(TrendPoint(
                date=day.strftime("%b %d"),
                incidents=inc_cnt,
                scans=scan_cnt
            ))

        # Active Campaigns
        active_campaigns = db.query(func.count(ThreatCampaignModel.id)).filter(
            ThreatCampaignModel.status.in_(["suspected", "confirmed"])
        ).scalar() or 0

        # Exposure Intelligence
        exposure_summary = cls.compute_exposure_intelligence(db, total_incidents)

        return CyberRadarOverviewResponse(
            total_incidents=total_incidents,
            phishing_count=phishing_count,
            qr_threats_count=qr_threats_count,
            impersonation_count=impersonation_count,
            payment_fraud_count=payment_fraud_count,
            categories=categories,
            severities=severities,
            trends=trends,
            active_campaigns_count=active_campaigns,
            exposure_summary=exposure_summary
        )

    @staticmethod
    def compute_exposure_intelligence(db: Session, total_incidents: int) -> ExposureIntelligenceResponse:
        """
        Feature 3: Next-Target Exposure Intelligence.
        Strictly observes data sufficiency guardrails and avoids individual predictions.
        """
        # Guardrail: Insufficient data check
        if total_incidents < 2:
            return ExposureIntelligenceResponse(
                data_sufficiency_met=False,
                data_sufficiency_note="Insufficient incident volume to infer department exposure patterns. Data sufficiency requirement: at least 2 incident reports.",
                top_exposed_departments=[],
                recurrence_rate=0.0,
                active_threat_campaigns_count=0,
                recommended_awareness_topics=["General Cybersecurity Awareness", "Safe Link Navigation"]
            )

        # Department aggregation
        dept_rows = (
            db.query(IncidentModel.department, func.count(IncidentModel.id))
            .group_by(IncidentModel.department)
            .order_by(desc(func.count(IncidentModel.id)))
            .limit(4)
            .all()
        )

        exposed_depts: List[DepartmentExposure] = []
        for dept_name, count in dept_rows:
            dept_name = dept_name or "General Campus"
            if count >= 3:
                level = "Elevated"
                action = "Deploy targeted phishing simulation & alert department administrators."
                conf = "High"
            elif count >= 1:
                level = "Moderate"
                action = "Recommend 3-minute Cyber Safety Coach refresher to students/staff."
                conf = "Medium"
            else:
                level = "Low"
                action = "Maintain standard awareness practices."
                conf = "Low"

            exposed_depts.append(
                DepartmentExposure(
                    department=dept_name,
                    reported_incidents=count,
                    primary_threat_category="Phishing & Impersonation",
                    exposure_level=level,
                    recommended_action=action,
                    confidence_level=conf
                )
            )

        # Recurrence rate calculation
        active_campaigns_cnt = db.query(func.count(ThreatCampaignModel.id)).scalar() or 0
        recurrence = min(round((active_campaigns_cnt * 1.5) / (total_incidents or 1) * 100, 1), 90.0)

        return ExposureIntelligenceResponse(
            data_sufficiency_met=True,
            data_sufficiency_note="Exposure assessments calculated from aggregated campus telemetry. Individual students or specific targets are never predicted.",
            top_exposed_departments=exposed_depts,
            recurrence_rate=recurrence,
            active_threat_campaigns_count=active_campaigns_cnt,
            recommended_awareness_topics=[
                "Fake Institutional Fee Portals",
                "Phishing via Urgent Disciplinary Notices",
                "Malicious Noticeboard QR Code Stickers"
            ]
        )


cyber_radar_service = CyberRadarService()
