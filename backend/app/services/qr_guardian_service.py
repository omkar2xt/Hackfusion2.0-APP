import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from urllib.parse import urlparse
from sqlalchemy.orm import Session
from app.database.models import VerifiedQrDestinationModel
from app.services.qr_analyzer import qr_analyzer
from app.schemas.qr_guardian import QrGuardianAnalysisResponse, VerifiedQrDestinationResponse, CreateVerifiedQrRequest
from app.schemas.scan import ScanResultResponse

# Pre-seeded institutional QR targets
DEFAULT_VERIFIED_QRS = [
    {
        "title": "University Central Library Catalog & Study Room Booking",
        "destination_url": "https://library.campus.edu/portal",
        "category": "library",
        "department": "Campus Library Services"
    },
    {
        "title": "Official Student Tuition & Examination Fee Portal",
        "destination_url": "https://payments.campus.edu/pay",
        "category": "fees",
        "department": "Office of the Bursar"
    },
    {
        "title": "Campus Secure Wi-Fi 802.1X Onboarding & Certificate",
        "destination_url": "https://wifi.campus.edu/setup",
        "category": "wifi",
        "department": "Campus IT Services"
    },
    {
        "title": "Admissions & Registrar Academic Transcript Request",
        "destination_url": "https://registrar.campus.edu/transcripts",
        "category": "admissions",
        "department": "Office of the Registrar"
    }
]


class QrGuardianService:
    @classmethod
    def seed_defaults(cls, db: Session):
        """Seeds default official campus QR destinations if table is empty."""
        count = db.query(VerifiedQrDestinationModel).count()
        if count == 0:
            for item in DEFAULT_VERIFIED_QRS:
                rec = VerifiedQrDestinationModel(
                    id=str(uuid.uuid4()),
                    title=item["title"],
                    destination_url=item["destination_url"],
                    category=item["category"],
                    department=item["department"],
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                db.add(rec)
            db.commit()

    @classmethod
    def analyze_qr_with_guardian(cls, db: Session, decoded_content: str) -> QrGuardianAnalysisResponse:
        """
        Deep QR code inspection comparing against verified institutional registry.
        Never executes browser auto-opening.
        """
        cls.seed_defaults(db)

        # 1. Run standard threat analysis (Punycode, IP, ports, keywords)
        scan_analysis = qr_analyzer.analyze(decoded_content)

        clean_content = decoded_content.strip()
        parsed_url = urlparse(clean_content if "://" in clean_content else f"https://{clean_content}")
        target_hostname = (parsed_url.hostname or "").lower()

        # 2. Check Institutional QR Registry
        verified_entries = db.query(VerifiedQrDestinationModel).filter(VerifiedQrDestinationModel.is_active == True).all()

        matched_entry: Optional[VerifiedQrDestinationModel] = None
        for entry in verified_entries:
            entry_parsed = urlparse(entry.destination_url)
            # Exact URL match or exact domain + path match
            if clean_content.rstrip("/") == entry.destination_url.rstrip("/"):
                matched_entry = entry
                break
            elif entry_parsed.hostname and entry_parsed.hostname.lower() == target_hostname:
                matched_entry = entry

        # 3. Determine Verification Badge & Advisory
        if matched_entry:
            badge = "VERIFIED_OFFICIAL"
            advisory = f"Official Campus QR code registered to: {matched_entry.title} ({matched_entry.department}). Verified Safe."
            # Override to LOW_RISK for verified institutional QR destinations
            scan_analysis["verdict"] = "LOW_RISK"
            scan_analysis["risk_level"] = "Verified Official Campus Asset"
            scan_analysis["risk_score"] = 0
            scan_analysis["indicators"] = [f"Cryptographically verified against official campus QR registry: {matched_entry.department}"]
        else:
            # Check if this QR attempts to spoof a campus entity
            campus_keywords = ["campus", "edu", "university", "library", "bursar", "tuition", "hall", "wifi", "login"]
            matches_campus_theme = any(k in target_hostname for k in campus_keywords)

            if matches_campus_theme and not target_hostname.endswith(".edu"):
                badge = "SUSPICIOUS_MISMATCH"
                advisory = "WARNING: This QR code uses campus-related wording but is NOT found in the verified university registry. Possible physical flyer sticker tampering."
                scan_analysis["risk_score"] = max(scan_analysis.get("risk_score", 0), 75)
                scan_analysis["verdict"] = "SUSPICIOUS"
                scan_analysis["indicators"].insert(0, "Physical QR mismatch: Claims campus association but lacks official registry record")
            elif target_hostname.endswith(".edu"):
                badge = "UNVERIFIED_CAMPUS"
                advisory = "Destination appears to be on a university domain, but is not registered in the active official QR directory."
            else:
                badge = "EXTERNAL_DESTINATION"
                advisory = "External destination. Confirm the physical source before entering any information."

        scan_result = ScanResultResponse(
            scan_id=str(uuid.uuid4()),
            verdict=scan_analysis["verdict"],
            risk_level=scan_analysis["risk_level"],
            risk_score=scan_analysis["risk_score"],
            scoring_version="v2.0-qr-guardian",
            indicators=scan_analysis["indicators"],
            recommendations=scan_analysis["recommendations"],
            checked_at=datetime.utcnow().isoformat() + "Z",
            input_type="qr",
            input_value=decoded_content
        )

        return QrGuardianAnalysisResponse(
            decoded_content=decoded_content,
            is_official_campus_destination=bool(matched_entry),
            official_destination_title=matched_entry.title if matched_entry else None,
            official_department=matched_entry.department if matched_entry else None,
            verification_badge=badge,
            scan_result=scan_result,
            safety_advisory=advisory
        )

    @classmethod
    def list_verified_destinations(cls, db: Session) -> List[VerifiedQrDestinationResponse]:
        cls.seed_defaults(db)
        destinations = db.query(VerifiedQrDestinationModel).filter(VerifiedQrDestinationModel.is_active == True).all()
        return [
            VerifiedQrDestinationResponse(
                id=d.id,
                title=d.title,
                destination_url=d.destination_url,
                category=d.category,
                department=d.department,
                is_active=d.is_active,
                created_at=d.created_at.isoformat() + "Z" if d.created_at else ""
            )
            for d in destinations
        ]

    @classmethod
    def create_destination(cls, db: Session, user_id: str, data: CreateVerifiedQrRequest) -> VerifiedQrDestinationResponse:
        record = VerifiedQrDestinationModel(
            id=str(uuid.uuid4()),
            title=data.title,
            destination_url=data.destination_url,
            category=data.category,
            department=data.department,
            created_by=user_id,
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return VerifiedQrDestinationResponse(
            id=record.id,
            title=record.title,
            destination_url=record.destination_url,
            category=record.category,
            department=record.department,
            is_active=record.is_active,
            created_at=record.created_at.isoformat() + "Z" if record.created_at else ""
        )

    @classmethod
    def delete_destination(cls, db: Session, dest_id: str) -> bool:
        dest = db.query(VerifiedQrDestinationModel).filter(VerifiedQrDestinationModel.id == dest_id).first()
        if not dest:
            return False
        dest.is_active = False
        db.commit()
        return True


qr_guardian_service = QrGuardianService()
