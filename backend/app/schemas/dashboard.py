from typing import List
from pydantic import BaseModel
from app.schemas.scan import ScanResultResponse
from app.schemas.incident import IncidentResponse


class DashboardStatsResponse(BaseModel):
    total_scans: int
    suspicious_results: int
    reported_incidents: int
    recent_scans: List[ScanResultResponse]
    recent_incidents: List[IncidentResponse]

