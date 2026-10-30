from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class CategoryStat(BaseModel):
    category: str
    count: int
    percentage: float


class SeverityStat(BaseModel):
    severity: str
    count: int
    color: str


class TrendPoint(BaseModel):
    date: str
    incidents: int
    scans: int


class DepartmentExposure(BaseModel):
    department: str
    reported_incidents: int
    primary_threat_category: str
    exposure_level: str  # Elevated, Moderate, Low
    recommended_action: str
    confidence_level: str  # High, Medium, Low (Data Sufficiency Guardrail)


class ExposureIntelligenceResponse(BaseModel):
    data_sufficiency_met: bool
    data_sufficiency_note: str
    top_exposed_departments: List[DepartmentExposure]
    recurrence_rate: float
    active_threat_campaigns_count: int
    recommended_awareness_topics: List[str]


class CyberRadarOverviewResponse(BaseModel):
    total_incidents: int
    phishing_count: int
    qr_threats_count: int
    impersonation_count: int
    payment_fraud_count: int
    categories: List[CategoryStat]
    severities: List[SeverityStat]
    trends: List[TrendPoint]
    active_campaigns_count: int
    exposure_summary: ExposureIntelligenceResponse
