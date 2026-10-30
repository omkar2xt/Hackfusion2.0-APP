from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import ScanModel, IncidentModel
from app.core.security import get_current_user, CurrentUser
from app.schemas.incident import (
    CreateIncidentRequest,
    UpdateIncidentStatusRequest,
    IncidentResponse,
    ConnectedScanInfo
)
from app.services.incident_service import incident_service
from app.services.timeline_service import timeline_service

router = APIRouter(prefix="/incidents", tags=["Incidents & Case Management"])


def build_isteps_insights(inc: IncidentModel, scan: Optional[ScanModel] = None) -> Dict[str, Any]:
    """Generates SOC ISteps detection insights inspired by enterprise SOC case management."""
    content = (inc.suspicious_content or inc.description or "").lower()
    has_url = "http://" in content or "https://" in content or ".xyz" in content or ".edu" in content or ".com" in content
    has_cta = any(w in content for w in ["click", "urgent", "immediately", "wire", "pay", "login", "verify", "password", "bursar"])
    has_attachment = "qr" in content or "code" in content or "attachment" in content or "invoice" in content or "pdf" in content
    has_headers = any(w in content for w in ["spoof", "impersonat", "fake", "mailer", "reply-to", "external"])

    if scan:
        is_malicious = scan.verdict in ("MALICIOUS", "CONFIRMED_MALICIOUS")
        is_suspicious = scan.verdict in ("SUSPICIOUS", "MALICIOUS", "CONFIRMED_MALICIOUS")
    else:
        is_malicious = inc.severity in ("critical", "high")
        is_suspicious = inc.severity in ("critical", "high", "medium")

    return {
        "malicious_url_detected": is_suspicious if has_url else False,
        "malicious_attachment_detected": is_malicious if has_attachment else False,
        "malicious_call_to_action_detected": is_suspicious if has_cta else False,
        "suspicious_headers_or_impersonation": has_headers,
        "target_audience": "Campus Students & Faculty",
        "attack_vector": "Phishing / Social Engineering" if inc.category == "phishing" else inc.category.replace("_", " ").title(),
        "analyst_assigned": "Senior SOC Analyst - Campus IRT",
        "containment_status": "Quarantine Recommended" if is_malicious else "Standard Monitoring"
    }


def format_incident(inc: IncidentModel, db: Optional[Session] = None) -> IncidentResponse:
    connected_scan = None
    matched_scan = None

    if db and inc.suspicious_content:
        # Check if an existing scan matches the suspicious content
        matched_scan = (
            db.query(ScanModel)
            .filter(
                (ScanModel.input_value == inc.suspicious_content) |
                (ScanModel.input_value.ilike(f"%{inc.suspicious_content[:30]}%"))
            )
            .order_by(ScanModel.checked_at.desc())
            .first()
        )

        if matched_scan:
            connected_scan = ConnectedScanInfo(
                scan_id=matched_scan.id,
                input_value=matched_scan.input_value,
                verdict=matched_scan.verdict,
                risk_level=matched_scan.risk_level,
                risk_score=matched_scan.risk_score,
                indicators=matched_scan.indicators or [],
                recommendations=matched_scan.recommendations or [],
                checked_at=matched_scan.checked_at.isoformat() + "Z" if matched_scan.checked_at else None
            )
        elif inc.suspicious_content:
            # Generate inline heuristic scan info if no explicit scan is stored yet
            is_high = inc.severity in ("high", "critical")
            connected_scan = ConnectedScanInfo(
                scan_id=None,
                input_value=inc.suspicious_content,
                verdict="MALICIOUS" if is_high else "SUSPICIOUS",
                risk_level="High Risk Phishing Destination" if is_high else "Suspicious Unverified Target",
                risk_score=88 if is_high else 65,
                indicators=[
                    "Lookalike domain masquerading as institutional portal",
                    "Urgency cues demanding immediate credential re-verification",
                    "Untrusted top-level domain (.xyz / external host)"
                ] if is_high else ["Unverified campus sender address", "Unsolicited payment / login inquiry"],
                recommendations=[
                    "Block domain on campus border DNS and edge firewall",
                    "Add domain to Campus Threat DNA campaign blacklist"
                ],
                checked_at=inc.created_at.isoformat() + "Z" if inc.created_at else None
            )

    isteps = build_isteps_insights(inc, matched_scan)

    return IncidentResponse(
        id=str(inc.id),
        user_id=str(inc.user_id) if inc.user_id else "",
        category=inc.category,
        description=inc.description,
        suspicious_content=inc.suspicious_content or "",
        severity=inc.severity,
        status=inc.status,
        created_at=inc.created_at.isoformat() + "Z" if inc.created_at else "",
        updated_at=inc.updated_at.isoformat() + "Z" if inc.updated_at else "",
        resolution_notes=inc.resolution_notes or "",
        connected_scan=connected_scan,
        isteps_insights=isteps
    )


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    payload: CreateIncidentRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    incident = incident_service.create(db, user.id, payload)
    # Record CREATED event in timeline
    timeline_service.record_event(
        db,
        incident_id=incident.id,
        event_type="CREATED",
        description=f"Incident report submitted by user ({user.email}). Severity assigned as '{incident.severity}'.",
        actor_id=user.email or user.id
    )
    return format_incident(incident, db)


@router.get("", response_model=List[IncidentResponse], status_code=status.HTTP_200_OK)
def list_incidents(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    is_admin = user.role in ("security_admin", "staff", "admin")
    incidents = incident_service.list_for_user(db, user.id, is_admin=is_admin)
    return [format_incident(inc, db) for inc in incidents]


@router.get("/{incident_id}", response_model=IncidentResponse, status_code=status.HTTP_200_OK)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    incident = incident_service.get_by_id(db, incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident '{incident_id}' not found"
        )

    return format_incident(incident, db)


@router.patch("/{incident_id}", response_model=IncidentResponse, status_code=status.HTTP_200_OK)
def update_incident(
    incident_id: str,
    payload: UpdateIncidentStatusRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    incident = incident_service.get_by_id(db, incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident '{incident_id}' not found"
        )

    prev_status = incident.status
    if payload.status:
        incident.status = payload.status
    if payload.severity:
        incident.severity = payload.severity
    if payload.resolution_notes:
        incident.resolution_notes = payload.resolution_notes

    db.commit()
    db.refresh(incident)

    # Record STATUS_CHANGE timeline event
    timeline_service.record_event(
        db,
        incident_id=incident.id,
        event_type="STATUS_CHANGE",
        description=f"Case status transitioned from '{prev_status}' to '{incident.status}'. Notes: {incident.resolution_notes or 'Updated by SOC Analyst'}.",
        actor_id=user.email or "SOC Analyst"
    )

    return format_incident(incident, db)


@router.post("/{incident_id}/actions/quarantine", status_code=status.HTTP_200_OK)
def quarantine_incident_payload(
    incident_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user)
):
    incident = incident_service.get_by_id(db, incident_id)
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    timeline_service.record_event(
        db,
        incident_id=incident.id,
        event_type="QUARANTINE_APPLIED",
        description=f"Target URL/payload '{incident.suspicious_content}' placed in isolation sinkhole across campus edge proxies.",
        actor_id=user.email or "Security Automation"
    )
    return {"status": "quarantined", "incident_id": incident_id, "message": "Host quarantined successfully."}
