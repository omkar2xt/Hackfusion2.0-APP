from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class CampusBuildingBase(BaseModel):
    name: str = Field(..., example="Computer Science & Engineering Block")
    code: str = Field(..., example="CSE-VDIT")
    building_type: str = Field(default="academic", example="academic")
    latitude: float = Field(..., example=15.3225)
    longitude: float = Field(..., example=74.7552)
    radius_meters: int = Field(default=120, example=120)
    description: Optional[str] = Field(default="", example="CSE & AI Department, Server Rooms, Labs")
    contact_lead: Optional[str] = Field(default="Head of Department", example="Head of Department")
    is_verified: bool = Field(default=True)
    is_active: bool = Field(default=True)


class CampusBuildingCreate(CampusBuildingBase):
    pass


class CampusBuildingUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    building_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_meters: Optional[int] = None
    description: Optional[str] = None
    contact_lead: Optional[str] = None
    is_verified: Optional[bool] = None
    is_active: Optional[bool] = None


class CampusBuildingResponse(CampusBuildingBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CampusZoneBase(BaseModel):
    name: str
    zone_type: str = "standard"
    building_id: Optional[str] = None
    latitude: float
    longitude: float
    boundary_geometry: Optional[Dict[str, Any]] = None
    threat_level: str = "NORMAL"  # RED_ALERT, ELEVATED, NORMAL
    notification_radius: int = 150
    is_active: bool = True


class CampusZoneCreate(CampusZoneBase):
    pass


class CampusZoneResponse(CampusZoneBase):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GeofenceCheckRequest(BaseModel):
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = 10.0


class GeofenceAlert(BaseModel):
    zone_id: str
    zone_name: str
    threat_level: str
    distance_meters: float
    is_inside: bool
    is_approaching: bool
    warning_message: str
    top_threat_vector: Optional[str] = None


class GeofenceCheckResponse(BaseModel):
    user_latitude: float
    user_longitude: float
    timestamp: str
    in_campus_bounds: bool
    closest_building_id: Optional[str] = None
    closest_building_name: Optional[str] = None
    closest_building_distance_meters: Optional[float] = None
    alerts: List[GeofenceAlert]
