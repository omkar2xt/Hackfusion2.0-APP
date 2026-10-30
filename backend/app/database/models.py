import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class ScanModel(Base):
    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)
    input_type = Column(String(20), nullable=False)  # url, message, qr
    input_value = Column(Text, nullable=False)
    verdict = Column(String(30), nullable=False)     # CONFIRMED_MALICIOUS, MALICIOUS, SUSPICIOUS, LOW_RISK, UNKNOWN
    risk_level = Column(String(40), nullable=False)
    risk_score = Column(Integer, nullable=False)
    scoring_version = Column(String(30), default="v2.0-explainable")
    indicators = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)
    checked_at = Column(DateTime, default=datetime.utcnow)


class IncidentModel(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)
    category = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    status = Column(String(30), default="submitted")
    description = Column(Text, nullable=False)
    suspicious_content = Column(Text, nullable=True)
    department = Column(String(100), default="General Campus")
    resolution_notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(36), nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


# =========================================================================
# FEATURE 1 & 7: CAMPUS CYBERATTACK DNA & CAMPAIGNS
# =========================================================================

class ThreatFingerprintModel(Base):
    __tablename__ = "threat_fingerprints"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), nullable=True)
    scan_id = Column(String(36), nullable=True)
    domain_normalized = Column(String(255), default="")
    url_structure_hash = Column(String(64), default="")
    content_tokens = Column(JSON, default=list)
    claimed_sender = Column(String(255), default="")
    fingerprint_hash = Column(String(64), nullable=False)
    feature_vector = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class ThreatCampaignModel(Base):
    __tablename__ = "threat_campaigns"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    primary_theme = Column(String(100), default="General Phishing")
    severity = Column(String(20), default="medium")
    status = Column(String(30), default="suspected")  # suspected, confirmed, rejected, mitigated
    confidence_score = Column(Float, default=0.75)
    incident_count = Column(Integer, default=1)
    description = Column(Text, default="")
    notes = Column(Text, default="")
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CampaignIncidentModel(Base):
    __tablename__ = "campaign_incidents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String(36), nullable=False)
    incident_id = Column(String(36), nullable=False)
    similarity_score = Column(Float, default=1.0)
    match_reasons = Column(JSON, default=list)
    added_at = Column(DateTime, default=datetime.utcnow)


# =========================================================================
# FEATURE 4: QR GUARDIAN REGISTRY
# =========================================================================

class VerifiedQrDestinationModel(Base):
    __tablename__ = "verified_qr_destinations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    destination_url = Column(Text, nullable=False)
    category = Column(String(50), default="general")  # library, admissions, fees, events, wifi
    department = Column(String(100), default="University Admin")
    created_by = Column(String(36), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# =========================================================================
# FEATURE 6: INSTITUTIONAL TRUST GRAPH
# =========================================================================

class InstitutionalIdentityModel(Base):
    __tablename__ = "institutional_identities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    role_title = Column(String(150), nullable=False)
    department = Column(String(100), nullable=False)
    official_email = Column(String(255), nullable=False)
    official_phone = Column(String(50), default="")
    verified_domain = Column(String(255), nullable=False)
    official_portal_url = Column(Text, default="")
    verified_payment_portal = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# =========================================================================
# FEATURE 7: CAMPUS CYBER IMMUNE SYSTEM WARNINGS
# =========================================================================

class CampusWarningModel(Base):
    __tablename__ = "campus_warnings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String(36), nullable=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    severity = Column(String(20), default="high")
    status = Column(String(30), default="approved")  # draft, approved, archived
    approved_by = Column(String(36), nullable=True)
    published_at = Column(DateTime, default=datetime.utcnow)


# =========================================================================
# FEATURE 9: EVIDENCE TIMELINE GENERATOR
# =========================================================================

class IncidentTimelineModel(Base):
    __tablename__ = "incident_timeline"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), nullable=False)
    event_type = Column(String(50), nullable=False)  # CREATED, SCANNED, TRIAGED, ASSIGNED, NOTE_ADDED, RESOLVED, CAMPAIGN_LINKED
    actor_id = Column(String(36), nullable=True)
    description = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


# =========================================================================
# FEATURE 10: ADAPTIVE CYBER SAFETY COACH
# =========================================================================

class LearningModuleModel(Base):
    __tablename__ = "learning_modules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(100), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)  # phishing, qr_scams, payment_fraud, passwords, social_engineering
    description = Column(Text, nullable=False)
    estimated_minutes = Column(Integer, default=3)
    content_markdown = Column(Text, nullable=False)
    icon_name = Column(String(50), default="Shield")
    order_index = Column(Integer, default=0)


class QuizQuestionModel(Base):
    __tablename__ = "quiz_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    module_id = Column(String(36), nullable=False)
    question_text = Column(Text, nullable=False)
    options_json = Column(JSON, nullable=False)  # list of strings
    correct_index = Column(Integer, nullable=False)
    explanation = Column(Text, default="")


class LearningProgressModel(Base):
    __tablename__ = "learning_progress"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False)
    module_id = Column(String(36), nullable=False)
    completed = Column(Boolean, default=False)
    quiz_score = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
