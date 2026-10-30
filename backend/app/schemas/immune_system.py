from typing import Optional, List
from pydantic import BaseModel, Field


class CampusWarningResponse(BaseModel):
    id: str
    campaign_id: Optional[str] = None
    title: str
    content: str
    severity: str
    status: str
    published_at: str

    model_config = {"from_attributes": True}


class CreateCampusWarningRequest(BaseModel):
    campaign_id: Optional[str] = None
    title: str = Field(..., min_length=5, max_length=255)
    content: str = Field(..., min_length=10)
    severity: str = "high"
    status: str = "approved"

