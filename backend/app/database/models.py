import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class ScanModel(Base):
    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)
    input_type = Column(String(20), nullable=False)  # url, message, qr
    input_value = Column(Text, nullable=False)
    verdict = Column(String(20), nullable=False)     # MALICIOUS, SUSPICIOUS, LOW_RISK, UNKNOWN
    risk_level = Column(String(30), nullable=False)
    risk_score = Column(Integer, nullable=False)
    scoring_version = Column(String(30), default="v1.2-explainable")
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
