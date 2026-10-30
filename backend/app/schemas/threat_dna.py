from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ThreatFingerprintResponse(BaseModel):
    id: str
    incident_id: Optional[str] = None
    scan_id: Optional[str] = None
    domain_normalized: str
    url_structure_hash: str
    content_tokens: List[str]
    claimed_sender: str
    fingerprint_hash: str
    created_at: str

    model_config = {"from_attributes": True}


class CampaignIncidentMatch(BaseModel):
    incident_id: str
    similarity_score: float
    match_reasons: List[str]
    added_at: str


class ThreatCampaignResponse(BaseModel):
    id: str
    name: str
    primary_theme: str
    severity: str
    status: str
    confidence_score: float
    incident_count: int
    description: str
    notes: str
    first_seen: str
    last_seen: str
    incidents: List[CampaignIncidentMatch] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class AnalyzeThreatDnaRequest(BaseModel):
    incident_id: Optional[str] = None
    scan_id: Optional[str] = None
    content: str = Field(..., min_length=3)
    target_url: Optional[str] = None
    claimed_sender: Optional[str] = None


class ReviewCampaignRequest(BaseModel):
    status: str = Field(..., description="'confirmed', 'rejected', 'mitigated'")
    notes: Optional[str] = None
