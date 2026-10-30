from typing import Optional, Literal, Dict, Any, List
from pydantic import BaseModel, Field


IncidentCategory = Literal[
    "phishing",
    "malware",
    "data_breach",
    "unauthorized_access",
    "suspicious_email",
    "social_engineering",
    "other"
]

IncidentSeverity = Literal["critical", "high", "medium", "low"]
IncidentStatus = Literal["submitted", "triaged", "investigating", "mitigating", "resolved", "closed"]


class CreateIncidentRequest(BaseModel):
    category: IncidentCategory
    severity: IncidentSeverity = "medium"
    description: str = Field(..., min_length=10, max_length=5000)
    suspicious_content: Optional[str] = Field(None, max_length=5000)


class UpdateIncidentStatusRequest(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    resolution_notes: Optional[str] = Field(None, max_length=5000)


class ConnectedScanInfo(BaseModel):
    scan_id: Optional[str] = None
    input_value: str
    verdict: str
    risk_level: str
    risk_score: int
    indicators: List[str] = []
    recommendations: List[str] = []
    checked_at: Optional[str] = None


class IncidentResponse(BaseModel):
    id: str
    user_id: str
    category: str
    description: str
    suspicious_content: str
    severity: str
    status: str
    created_at: str
    updated_at: str
    resolution_notes: str
    connected_scan: Optional[ConnectedScanInfo] = None
    isteps_insights: Optional[Dict[str, Any]] = None

    model_config = {
        "from_attributes": True
    }
