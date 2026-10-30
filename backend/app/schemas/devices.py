from typing import Optional, List
from pydantic import BaseModel, Field


class RegisterDeviceRequest(BaseModel):
    device_id: Optional[str] = None
    device_platform: str = Field("web_pwa", pattern="^(ios|android|web_pwa|desktop_chrome|macos|windows)$")
    device_name: str = Field(..., min_length=2)
    proximity_zone: Optional[str] = "Engineering & CS Quad (150m Proximity Mesh)"
    push_token: Optional[str] = None
    institution_id: Optional[str] = "inst-apex-01"
    campus_id: Optional[str] = "camp-main-01"
    department_id: Optional[str] = "dept-cs-01"


class DeviceRegistrationResponse(BaseModel):
    id: str
    user_id: str
    institution_id: str
    campus_id: str
    department_id: str
    device_platform: str
    device_name: str
    proximity_zone: str
    push_token: Optional[str] = None
    is_active: bool
    last_active_at: str
    registered_at: str

    model_config = {"from_attributes": True}
