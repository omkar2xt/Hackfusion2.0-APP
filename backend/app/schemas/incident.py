from typing import Optional, Literal
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
IncidentStatus = Literal["submitted", "triaged", "investigating", "resolved", "closed"]


class CreateIncidentRequest(BaseModel):
    category: IncidentCategory
    severity: IncidentSeverity = "medium"
    description: str = Field(..., min_length=10, max_length=5000)
    suspicious_content: Optional[str] = Field(None, max_length=5000)


class UpdateIncidentStatusRequest(BaseModel):
    status: Optional[IncidentStatus] = None
    severity: Optional[IncidentSeverity] = None
    resolution_notes: Optional[str] = Field(None, max_length=5000)


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

    model_config = {
        "from_attributes": True
    }
