from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class IncidentTimelineEventResponse(BaseModel):
    id: str
    incident_id: str
    event_type: str
    actor_id: Optional[str] = None
    description: str
    metadata_json: Dict[str, Any]
    created_at: str

    model_config = {"from_attributes": True}


class IncidentTimelineExportResponse(BaseModel):
    incident_id: str
    category: str
    severity: str
    current_status: str
    created_at: str
    exported_at: str
    total_events: int
    timeline: List[IncidentTimelineEventResponse]
    export_signature: str
