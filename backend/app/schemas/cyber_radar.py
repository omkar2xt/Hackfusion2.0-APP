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


class CampusZoneTelemetry(BaseModel):
    id: str
    name: str
    code: str
    category: str
    threat_level: str  # RED_ALERT, ELEVATED, NORMAL
    active_threats: int
    reported_incidents_today: int
    radius_meters: int
    proximity_alert_active: bool
    last_reported_attack: str
    top_threat_vector: str
    x_percent: float  # Map visual positioning
    y_percent: float


class ThreatFeedEvent(BaseModel):
    id: str
    timestamp_display: str
    campus_zone: str
    category: str
    severity: str  # critical, high, medium, low
    threat_vector: str
    anonymized_reporter: str  # E.g. "Student #4A8F", "Faculty #10BC", "Lab Endpoint #04" (No PII)
    status: str
    distance_meters: Optional[int] = None


class ProximityAlertBroadcast(BaseModel):
    id: str
    zone_id: str
    zone_name: str
    severity: str
    alert_title: str
    alert_message: str
    created_at: str
    expires_in_minutes: int
    active: bool


class BroadcastAlertRequest(BaseModel):
    zone_id: str
    category: str
    severity: str = "critical"
    message: str


class CyberRadarOverviewResponse(BaseModel):
    total_incidents: int
    total_threats: int
    threat_level: str
    live_attacks_count: int
    critical_alerts_count: int
    blocked_traffic_count: int
    phishing_count: int
    qr_threats_count: int
    impersonation_count: int
    payment_fraud_count: int
    categories: List[CategoryStat]
    severities: List[SeverityStat]
    trends: List[TrendPoint]
    active_campaigns_count: int
    campus_zones: List[CampusZoneTelemetry]
    realtime_threat_feed: List[ThreatFeedEvent]
    active_proximity_alerts: List[ProximityAlertBroadcast]
    exposure_summary: ExposureIntelligenceResponse
