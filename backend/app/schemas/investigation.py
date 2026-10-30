from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class TechnicalIndicator(BaseModel):
    name: str
    category: str  # dns, network, tls, parameter, credential, impersonation, wifi, payload
    evidence_source: str  # url_parser, dns_lookup, tls_handshake, heuristic_engine, regex
    timestamp: str
    status: str  # CONFIRMED, INFERRED, UNVERIFIED, SUSPICIOUS
    details: str
    severity: str = "medium"  # critical, high, medium, low, info


class DnsRecordInfo(BaseModel):
    record_type: str  # A, AAAA, MX, NS, TXT
    value: str
    ttl: Optional[int] = 300


class TlsCertificateInfo(BaseModel):
    subject: str
    issuer: str
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    fingerprint_sha256: str
    is_valid: bool = True
    cipher_suite: Optional[str] = None


class InfrastructureIntel(BaseModel):
    domain: str
    ip_addresses: List[str] = []
    asn: Optional[str] = None
    asn_org: Optional[str] = None
    hosting_provider: Optional[str] = None
    country: Optional[str] = "IN"
    dns_records: List[DnsRecordInfo] = []
    tls_certificate: Optional[TlsCertificateInfo] = None
    redirect_chain: List[str] = []
    is_url_shortener: bool = False
    unpacked_destination: Optional[str] = None


class UrlInvestigationRequest(BaseModel):
    url: str
    incident_id: Optional[str] = None


class UrlInvestigationResponse(BaseModel):
    normalized_url: str
    scheme: str
    hostname: str
    port: Optional[int] = None
    path: str
    query_params: Dict[str, str] = {}
    verdict: str  # CONFIRMED_MALICIOUS, SUSPICIOUS, UNDER_INVESTIGATION, LOW_RISK, UNKNOWN
    risk_score: int
    severity: str
    evidence_confidence: str  # High, Medium, Low
    potential_impact: str
    infrastructure: InfrastructureIntel
    indicators: List[TechnicalIndicator] = []
    typosquatting_target: Optional[str] = None
    credential_harvesting_detected: bool = False
    ssrf_safe: bool = True
    ssrf_note: Optional[str] = None
    investigated_at: str


class QrInvestigationRequest(BaseModel):
    decoded_payload: str
    image_metadata: Optional[Dict[str, Any]] = None
    image_hash_sha256: Optional[str] = None
    incident_id: Optional[str] = None


class QrInvestigationResponse(BaseModel):
    decoded_payload: str
    payload_type: str  # URL, WIFI, PAYMENT, VCARD_CONTACT, TEXT_PLAIN, APP_DEEP_LINK
    payload_hash_sha256: str
    image_hash_sha256: Optional[str] = None
    verdict: str
    risk_score: int
    severity: str
    evidence_confidence: str
    potential_impact: str
    url_destination: Optional[str] = None
    url_investigation: Optional[UrlInvestigationResponse] = None
    wifi_config: Optional[Dict[str, str]] = None
    payment_info: Optional[Dict[str, str]] = None
    contact_info: Optional[Dict[str, str]] = None
    indicators: List[TechnicalIndicator] = []
    reuse_count_across_campus: int = 0
    related_incident_ids: List[str] = []
    security_explanation: str
    investigated_at: str


class AttributionItem(BaseModel):
    observed_facts: List[str] = []
    technical_inferences: List[str] = []
    unverified_hypotheses: List[str] = []
    confirmed_findings: List[str] = []
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    protocol: Optional[str] = "TCP/HTTPS"
    timestamp_with_tz: str
    session_id: Optional[str] = None
    user_agent: Optional[str] = None
    network_provider: Optional[str] = None
    attribution_confidence: str = "Low"  # Strict guardrail: never identify real individual
    attribution_disclaimer: str = (
        "Strict Policy: Attribution is based strictly on observable network artifacts. "
        "YODHRA never attributes malicious acts to real individuals without authorized forensic proof."
    )


class EvidenceVaultItem(BaseModel):
    id: str
    incident_id: Optional[str] = None
    evidence_type: str  # qr_image, decoded_payload, submitted_url, server_log, screenshot
    file_hash_sha256: str
    raw_payload_preview: str
    source_origin: str
    uploaded_by: str = "Forensics Analyst"
    chain_of_custody: List[Dict[str, str]] = []
    created_at: str


class EvidenceCreateRequest(BaseModel):
    incident_id: Optional[str] = None
    evidence_type: str
    raw_content: str
    source_origin: str = "campus_triage"


class IncidentCorrelationItem(BaseModel):
    incident_id: str
    related_incident_id: str
    correlation_factor: str  # SAME_DOMAIN, SAME_IP, SAME_CERT_FINGERPRINT, SAME_REDIRECT_CHAIN, SIMILAR_CAMPAIGN
    match_strength: str  # CONFIRMED_MATCH, WEAK_SIMILARITY
    shared_indicator: str
    reason: str


class VictimImpactSummary(BaseModel):
    total_affected_reports: int = 0
    potentially_exposed_accounts: int = 0
    credential_submissions_reported: int = 0
    affected_departments: List[str] = []
    affected_device_count: int = 0
    assessment_note: str


class InvestigationReport(BaseModel):
    report_id: str
    incident_id: str
    incident_title: str
    generated_at: str
    incident_summary: str
    attack_type: str
    timeline: List[Dict[str, str]] = []
    url_or_qr_analysis: Dict[str, Any] = {}
    technical_indicators: List[TechnicalIndicator] = []
    infrastructure: Optional[InfrastructureIntel] = None
    affected_users_and_systems: VictimImpactSummary
    evidence_vault_references: List[str] = []
    related_incidents: List[str] = []
    attribution: AttributionItem
    recommended_containment_steps: List[str] = []
    investigation_status: str  # OPEN, TRIAGED, CONTAINED, CLOSED

