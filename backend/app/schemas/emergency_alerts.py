from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class BroadcastAlertRequest(BaseModel):
    target_zone: str = Field(..., min_length=2)
    category: str = Field(..., min_length=2)
    title: Optional[str] = None
    message: str = Field(..., min_length=5)
    severity: str = Field("CRITICAL", pattern="^(CRITICAL|HIGH|ELEVATED|ADVISORY)$")
    action_instructions: Optional[str] = "Disconnect from unverified networks, verify official identity, report suspicious activity."
    delivery_scope: str = Field("PROXIMITY_MESH", pattern="^(PROXIMITY_MESH|CAMPUS_WIDE|INSTITUTION_WIDE|DEPARTMENT_ONLY)$")
    institution_id: Optional[str] = "inst-apex-01"
    campus_id: Optional[str] = "camp-main-01"
    department_id: Optional[str] = None
    expires_in_hours: Optional[int] = 24


class AcknowledgeAlertRequest(BaseModel):
    device_id: str = Field(..., min_length=1)
    user_notes: Optional[str] = None


class EmergencyAlertResponse(BaseModel):
    id: str
    institution_id: str
    campus_id: str
    department_id: Optional[str] = None
    target_zone: str
    category: str
    severity: str
    title: str
    message: str
    action_instructions: str
    status: str
    delivery_scope: str
    target_device_count: int
    acknowledged_count: int
    broadcast_by: str
    broadcast_by_role: str
    is_acknowledged: Optional[bool] = False
    expires_at: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}


class AlertDeliveryMetric(BaseModel):
    total_targeted: int
    delivered: int
    acknowledged: int
    pending: int
    by_platform: dict
    deliveries_sample: List[dict]
