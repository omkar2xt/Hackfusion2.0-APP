from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.scan import ScanResultResponse


class VerifiedQrDestinationResponse(BaseModel):
    id: str
    title: str
    destination_url: str
    category: str
    department: str
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


class CreateVerifiedQrRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    destination_url: str = Field(..., min_length=4)
    category: str = "general"
    department: str = "University Admin"


class QrGuardianAnalysisResponse(BaseModel):
    decoded_content: str
    is_official_campus_destination: bool
    official_destination_title: Optional[str] = None
    official_department: Optional[str] = None
    verification_badge: str  # "VERIFIED_OFFICIAL", "UNVERIFIED_CAMPUS", "SUSPICIOUS_MISMATCH", "EXTERNAL_DESTINATION"
    scan_result: ScanResultResponse
    safety_advisory: str

