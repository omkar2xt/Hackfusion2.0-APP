from typing import Optional, List
from pydantic import BaseModel, Field


class InstitutionalIdentityResponse(BaseModel):
    id: str
    name: str
    unit_name: Optional[str] = None
    role_title: str
    department: str
    official_email: str
    official_phone: str = ""
    verified_domain: str
    official_domain: Optional[str] = None
    official_portal_url: str = ""
    verified_payment_portal: str = ""
    is_active: bool = True
    created_at: str

    model_config = {"from_attributes": True}


class CreateInstitutionalIdentityRequest(BaseModel):
    name: str = Field(..., min_length=2)
    role_title: str = Field(..., min_length=2)
    department: str = Field(..., min_length=2)
    official_email: str = Field(..., min_length=5)
    official_phone: Optional[str] = ""
    verified_domain: str = Field(..., min_length=3)
    official_portal_url: Optional[str] = ""
    verified_payment_portal: Optional[str] = ""


class VerifyIdentityRequest(BaseModel):
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    claimed_role: Optional[str] = None
    portal_or_link: Optional[str] = None


class VerifyIdentityResponse(BaseModel):
    status: str  # "VERIFIED_OFFICIAL", "LOOKALIKE_SPOOFING", "UNVERIFIED_SENDER", "PAYMENT_MISMATCH"
    confidence_score: float
    matched_identity: Optional[InstitutionalIdentityResponse] = None
    indicators: List[str]
    explanation: str
    safety_guidance: str

