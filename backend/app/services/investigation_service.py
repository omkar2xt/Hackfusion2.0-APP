import hashlib
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.models import (
    IncidentModel,
    EvidenceVaultModel,
    IncidentCorrelationModel,
    ScanModel
)
from app.schemas.investigation import (
    EvidenceVaultItem,
    EvidenceCreateRequest,
    IncidentCorrelationItem,
    AttributionItem,
    VictimImpactSummary,
    InvestigationReport,
    TechnicalIndicator
)
from app.services.url_intelligence_service import url_intelligence_service
from app.services.qr_intelligence_service import qr_intelligence_service


class InvestigationService:
    @classmethod
    def seed_initial_evidence_and_correlations(cls, db: Session):
        """Seeds initial forensics evidence and correlations if tables are empty."""
        vault_count = db.query(EvidenceVaultModel).count()
        if vault_count == 0:
            sample_evidence = [
                EvidenceVaultModel(
                    id="ev-vault-01",
                    incident_id="inc-eng-quad-01",
                    evidence_type="submitted_url",
                    file_hash_sha256=hashlib.sha256("https://kls-vdit-sso.online/login".encode()).hexdigest(),
                    raw_payload_text="https://kls-vdit-sso.online/login",
                    source_origin="Student Report (Eng Quad AP-4)",
                    uploaded_by="Campus Triage Officer",
                    chain_of_custody_json=[
                        {"timestamp": "2026-10-30T10:15:00Z", "action": "INGESTED", "user": "Student Reporter"},
                        {"timestamp": "2026-10-30T10:20:00Z", "action": "CRYPTOGRAPHIC_SEAL", "user": "Triage Analyst (SHA-256)"},
                        {"timestamp": "2026-10-30T11:00:00Z", "action": "ANALYSIS_LOCK", "user": "Lead Forensics Investigator"}
                    ],
                    created_at=datetime.utcnow()
                ),
                EvidenceVaultModel(
                    id="ev-vault-02",
                    incident_id="inc-bursar-02",
                    evidence_type="qr_image",
                    file_hash_sha256=hashlib.sha256("PHYSICAL_STICKER_BURSAR_QR_NOTICE_OCT30".encode()).hexdigest(),
                    raw_payload_text="upi://pay?pa=campus-refund-help@sbi&pn=Fee%20Refund%20Desk&am=1200",
                    source_origin="Physical Noticeboard Flyer (Bursar Hub 1st Floor)",
                    uploaded_by="Patrol Security Officer",
                    chain_of_custody_json=[
                        {"timestamp": "2026-10-30T14:30:00Z", "action": "PHYSICAL_RECOVERY", "user": "Patrol Officer"},
                        {"timestamp": "2026-10-30T14:45:00Z", "action": "IMAGE_DECODE_VAULT", "user": "Forensics Terminal (SHA-256 Verified)"}
                    ],
                    created_at=datetime.utcnow()
                )
            ]
            for ev in sample_evidence:
                db.add(ev)
            db.commit()

        corr_count = db.query(IncidentCorrelationModel).count()
        if corr_count == 0:
            sample_correlations = [
                IncidentCorrelationModel(
                    id=str(uuid.uuid4()),
                    incident_id="inc-eng-quad-01",
                    related_incident_id="inc-lib-03",
                    correlation_factor="SAME_DOMAIN",
                    match_strength="CONFIRMED_MATCH",
                    shared_indicator="kls-vdit-sso.online",
                    reason="Identical phishing destination host observed in both Engineering Wi-Fi and Library printer QR submissions.",
                    created_at=datetime.utcnow()
                ),
                IncidentCorrelationModel(
                    id=str(uuid.uuid4()),
                    incident_id="inc-bursar-02",
                    related_incident_id="inc-canteen-04",
                    correlation_factor="SAME_IP",
                    match_strength="CONFIRMED_MATCH",
                    shared_indicator="185.220.101.45",
                    reason="Both fraudulent payment portals resolve to the same offshore bulletproof VPS IP address.",
                    created_at=datetime.utcnow()
                ),
                IncidentCorrelationModel(
                    id=str(uuid.uuid4()),
                    incident_id="inc-eng-quad-01",
                    related_incident_id="inc-hostel-05",
                    correlation_factor="SIMILAR_CAMPAIGN",
                    match_strength="WEAK_SIMILARITY",
                    shared_indicator="SSO-Harvest-Pattern",
                    reason="Similar credential form structure and HTML template markers, but hosted on distinct autonomous systems.",
                    created_at=datetime.utcnow()
                )
            ]
            for cr in sample_correlations:
                db.add(cr)
            db.commit()

    @classmethod
    def get_evidence_vault(cls, db: Session) -> List[EvidenceVaultItem]:
        cls.seed_initial_evidence_and_correlations(db)
        items = db.query(EvidenceVaultModel).order_by(EvidenceVaultModel.created_at.desc()).all()
        return [
            EvidenceVaultItem(
                id=item.id,
                incident_id=item.incident_id,
                evidence_type=item.evidence_type,
                file_hash_sha256=item.file_hash_sha256,
                raw_payload_preview=item.raw_payload_text[:120] + ("..." if len(item.raw_payload_text) > 120 else ""),
                source_origin=item.source_origin,
                uploaded_by=item.uploaded_by,
                chain_of_custody=item.chain_of_custody_json or [],
                created_at=item.created_at.isoformat() + "Z"
            )
            for item in items
        ]

    @classmethod
    def store_evidence(cls, db: Session, payload: EvidenceCreateRequest) -> EvidenceVaultItem:
        file_hash = hashlib.sha256(payload.raw_content.encode()).hexdigest()
        now_iso = datetime.utcnow().isoformat() + "Z"

        record = EvidenceVaultModel(
            id=f"ev-{uuid.uuid4().hex[:8]}",
            incident_id=payload.incident_id,
            evidence_type=payload.evidence_type,
            file_hash_sha256=file_hash,
            raw_payload_text=payload.raw_content,
            source_origin=payload.source_origin,
            uploaded_by="Forensics Analyst",
            chain_of_custody_json=[
                {"timestamp": now_iso, "action": "INITIAL_DEPOSIT", "user": "Forensics Analyst"},
                {"timestamp": now_iso, "action": "CRYPTOGRAPHIC_SEAL", "user": f"SHA-256:{file_hash[:16]}"}
            ],
            created_at=datetime.utcnow()
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return EvidenceVaultItem(
            id=record.id,
            incident_id=record.incident_id,
            evidence_type=record.evidence_type,
            file_hash_sha256=record.file_hash_sha256,
            raw_payload_preview=record.raw_payload_text[:120],
            source_origin=record.source_origin,
            uploaded_by=record.uploaded_by,
            chain_of_custody=record.chain_of_custody_json,
            created_at=record.created_at.isoformat() + "Z"
        )

    @classmethod
    def get_correlations(cls, db: Session) -> List[IncidentCorrelationItem]:
        cls.seed_initial_evidence_and_correlations(db)
        corrs = db.query(IncidentCorrelationModel).all()
        return [
            IncidentCorrelationItem(
                incident_id=c.incident_id,
                related_incident_id=c.related_incident_id,
                correlation_factor=c.correlation_factor,
                match_strength=c.match_strength,
                shared_indicator=c.shared_indicator,
                reason=c.reason
            )
            for c in corrs
        ]

    @classmethod
    def get_attribution(cls, incident_id: str) -> AttributionItem:
        now_iso = datetime.utcnow().isoformat() + "Z"
        return AttributionItem(
            observed_facts=[
                "Source IP 103.21.244.12 initiated TLS 1.3 handshake on port 443 at 2026-10-30T10:14:22Z.",
                "HTTP request header 'User-Agent' matches standard automated phishing scraper.",
                "Server hosted on ASN AS13335 (Cloudflare) with reverse proxy masking origin server IP."
            ],
            technical_inferences=[
                "Domain registered 4 days prior to attack wave through NameCheap Privacy service.",
                "SSL certificate issuer 'Let's Encrypt Authority X3' automated free certificate.",
                "Phishing login form targets campus SSO layout with identical CSS class names."
            ],
            unverified_hypotheses=[
                "Attacker may be operating from an offshore VPS using credential-stuffing botnets.",
                "Possible coordinated student exam-period credential harvesting campaign."
            ],
            confirmed_findings=[
                "Rogue captive Wi-Fi AP broadcasted spoofed SSID targeting KLS VDIT Computer Science quad.",
                "Malicious URL harvested student credentials and forwarded them to offshore drop-server."
            ],
            source_ip="103.21.244.12",
            destination_ip="185.220.101.45",
            source_port=54128,
            destination_port=443,
            protocol="TCP/HTTPS",
            timestamp_with_tz=now_iso,
            session_id=f"sess-{uuid.uuid4().hex[:8]}",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            network_provider="Offshore Cloud Hosting VPS",
            attribution_confidence="Low (Evidence-Preserved for Law Enforcement)"
        )

    @classmethod
    def get_victim_impact(cls, db: Session, incident_id: str) -> VictimImpactSummary:
        return VictimImpactSummary(
            total_affected_reports=8,
            potentially_exposed_accounts=14,
            credential_submissions_reported=3,
            affected_departments=["Computer Science & Engineering", "Administrative Registrar"],
            affected_device_count=12,
            assessment_note="3 students confirmed entering credentials on rogue captive portal. Immediate password resets and MFA revocations enforced."
        )

    @classmethod
    def generate_investigation_report(cls, db: Session, incident_id: str) -> InvestigationReport:
        inc = db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()
        title = f"Cyber Incident #{incident_id[:8]}" if not inc else f"Incident: {inc.category.upper()} - {inc.description[:40]}"
        now_iso = datetime.utcnow().isoformat() + "Z"

        # Investigate the content
        content = inc.suspicious_content if inc and inc.suspicious_content else "https://kls-vdit-sso.online/login"
        is_qr = inc and inc.category in ("qr", "other") and ("wifi:" in content.lower() or "upi:" in content.lower())

        if is_qr:
            analysis_dict = qr_intelligence_service.analyze_qr(db, content).model_dump()
            attack_type = f"QR Vector ({analysis_dict.get('payload_type')})"
            indicators = [TechnicalIndicator(**i) for i in analysis_dict.get("indicators", [])]
        else:
            url_res = url_intelligence_service.analyze_url(content)
            analysis_dict = url_res.model_dump()
            attack_type = f"Web/URL Threat ({url_res.verdict})"
            indicators = url_res.indicators

        attribution = cls.get_attribution(incident_id)
        victim_impact = cls.get_victim_impact(db, incident_id)

        timeline = [
            {"timestamp": "2026-10-30T10:14:00Z", "stage": "DETECTION", "event": "Rogue Wi-Fi AP beacon observed in Engineering Quad."},
            {"timestamp": "2026-10-30T10:15:20Z", "stage": "VICTIM_REPORT", "event": "Student reported fake login redirection prompt."},
            {"timestamp": "2026-10-30T10:25:00Z", "stage": "AUTOMATED_SCAN", "event": f"YODHRA URL/QR Engine flagged threat: {analysis_dict.get('verdict')}."},
            {"timestamp": "2026-10-30T10:30:00Z", "stage": "TRIAGE", "event": "Security analyst locked evidence in cryptographic vault."},
            {"timestamp": "2026-10-30T11:00:00Z", "stage": "CONTAINMENT", "event": "Campus firewall blocked destination IP 185.220.101.45."}
        ]

        containment_steps = [
            "Block malicious IP 185.220.101.45 and domain kls-vdit-sso.online at campus core firewall.",
            "De-authenticate rogue Wi-Fi AP AP-4 in Engineering & CS Quad.",
            "Trigger automated password reset and MFA session revocation for 3 compromised user accounts.",
            "Preserve SHA-256 evidence package in Evidence Vault for institutional review.",
            "Issue proximity mesh advisory to all connected student devices in Engineering Quad."
        ]

        return InvestigationReport(
            report_id=f"RPT-{uuid.uuid4().hex[:8].upper()}",
            incident_id=incident_id,
            incident_title=title,
            generated_at=now_iso,
            incident_summary=inc.description if inc else "Malicious credential harvesting portal discovered on campus network.",
            attack_type=attack_type,
            timeline=timeline,
            url_or_qr_analysis=analysis_dict,
            technical_indicators=indicators,
            infrastructure=analysis_dict.get("infrastructure"),
            affected_users_and_systems=victim_impact,
            evidence_vault_references=["ev-vault-01", "ev-vault-02"],
            related_incidents=["inc-lib-03", "inc-bursar-02"],
            attribution=attribution,
            recommended_containment_steps=containment_steps,
            investigation_status="CONTAINED"
        )


investigation_service = InvestigationService()
