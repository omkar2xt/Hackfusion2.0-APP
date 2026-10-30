import uuid
import re
from datetime import datetime
from typing import List, Optional, Dict, Any
from urllib.parse import urlparse
from sqlalchemy.orm import Session
from app.database.models import InstitutionalIdentityModel
from app.schemas.trust_graph import (
    InstitutionalIdentityResponse,
    CreateInstitutionalIdentityRequest,
    VerifyIdentityRequest,
    VerifyIdentityResponse
)

DEFAULT_INSTITUTIONAL_IDENTITIES = [
    {
        "name": "Dr. Aris Thorne",
        "role_title": "Dean of Student Affairs",
        "department": "Office of Student Affairs",
        "official_email": "dean.thorne@campus.edu",
        "official_phone": "+1-555-019-2030",
        "verified_domain": "campus.edu",
        "official_portal_url": "https://studentaffairs.campus.edu",
        "verified_payment_portal": "https://payments.campus.edu"
    },
    {
        "name": "Campus IT Support & Information Security",
        "role_title": "Chief Information Security Officer",
        "department": "Information Technology Services (ITS)",
        "official_email": "security@campus.edu",
        "official_phone": "+1-555-019-4357",
        "verified_domain": "campus.edu",
        "official_portal_url": "https://it.campus.edu/helpdesk",
        "verified_payment_portal": ""
    },
    {
        "name": "Office of Career Services & Placement",
        "role_title": "Director of Campus Placements",
        "department": "Career Services",
        "official_email": "placements@campus.edu",
        "official_phone": "+1-555-019-8800",
        "verified_domain": "campus.edu",
        "official_portal_url": "https://careers.campus.edu",
        "verified_payment_portal": ""
    },
    {
        "name": "Office of the Bursar & Student Accounts",
        "role_title": "University Bursar",
        "department": "Financial Services",
        "official_email": "bursar@campus.edu",
        "official_phone": "+1-555-019-3320",
        "verified_domain": "campus.edu",
        "official_portal_url": "https://bursar.campus.edu",
        "verified_payment_portal": "https://payments.campus.edu"
    }
]


class TrustGraphService:
    @classmethod
    def seed_defaults(cls, db: Session):
        if db.query(InstitutionalIdentityModel).count() == 0:
            for item in DEFAULT_INSTITUTIONAL_IDENTITIES:
                rec = InstitutionalIdentityModel(
                    id=str(uuid.uuid4()),
                    name=item["name"],
                    role_title=item["role_title"],
                    department=item["department"],
                    official_email=item["official_email"],
                    official_phone=item["official_phone"],
                    verified_domain=item["verified_domain"],
                    official_portal_url=item["official_portal_url"],
                    verified_payment_portal=item["verified_payment_portal"],
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                db.add(rec)
            db.commit()

    @classmethod
    def list_identities(cls, db: Session) -> List[InstitutionalIdentityResponse]:
        cls.seed_defaults(db)
        items = db.query(InstitutionalIdentityModel).filter(InstitutionalIdentityModel.is_active == True).all()
        return [
            InstitutionalIdentityResponse(
                id=item.id,
                name=item.name,
                unit_name=item.name,
                role_title=item.role_title,
                department=item.department,
                official_email=item.official_email,
                official_phone=item.official_phone or "",
                verified_domain=item.verified_domain,
                official_domain=item.verified_domain,
                official_portal_url=item.official_portal_url or "",
                verified_payment_portal=item.verified_payment_portal or "",
                is_active=item.is_active,
                created_at=item.created_at.isoformat() + "Z" if item.created_at else ""
            )
            for item in items
        ]

    @classmethod
    def create_identity(cls, db: Session, data: CreateInstitutionalIdentityRequest) -> InstitutionalIdentityResponse:
        record = InstitutionalIdentityModel(
            id=str(uuid.uuid4()),
            name=data.name,
            role_title=data.role_title,
            department=data.department,
            official_email=data.official_email.lower().strip(),
            official_phone=data.official_phone or "",
            verified_domain=data.verified_domain.lower().strip(),
            official_portal_url=data.official_portal_url or "",
            verified_payment_portal=data.verified_payment_portal or "",
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return InstitutionalIdentityResponse(
            id=record.id,
            name=record.name,
            role_title=record.role_title,
            department=record.department,
            official_email=record.official_email,
            official_phone=record.official_phone or "",
            verified_domain=record.verified_domain,
            official_portal_url=record.official_portal_url or "",
            verified_payment_portal=record.verified_payment_portal or "",
            is_active=record.is_active,
            created_at=record.created_at.isoformat() + "Z" if record.created_at else ""
        )

    @classmethod
    def verify(cls, db: Session, payload: VerifyIdentityRequest) -> VerifyIdentityResponse:
        cls.seed_defaults(db)
        identities = db.query(InstitutionalIdentityModel).filter(InstitutionalIdentityModel.is_active == True).all()

        sender_email = (payload.sender_email or "").strip().lower()
        sender_name = (payload.sender_name or "").strip().lower()
        claimed_role = (payload.claimed_role or "").strip().lower()
        target_link = (payload.portal_or_link or "").strip().lower()

        indicators: List[str] = []
        matched: Optional[InstitutionalIdentityModel] = None

        # 1. Direct Email Match
        if sender_email:
            for ident in identities:
                if ident.official_email.lower() == sender_email:
                    matched = ident
                    break

        # 2. Name or Role Match
        if not matched and (sender_name or claimed_role):
            for ident in identities:
                if sender_name and (sender_name in ident.name.lower() or ident.name.lower() in sender_name):
                    matched = ident
                    break
                if claimed_role and (claimed_role in ident.role_title.lower() or claimed_role in ident.department.lower()):
                    matched = ident
                    break

        # 3. Analyze Link / Domain Spoofing
        if matched:
            # Check email domain alignment
            if sender_email:
                email_domain = sender_email.split("@")[-1] if "@" in sender_email else ""
                if email_domain and email_domain != matched.verified_domain:
                    # Lookalike or freemail spoofing!
                    indicators.append(
                        f"Domain Spoofing: Sender email uses '@{email_domain}' while official institutional domain is '@{matched.verified_domain}'"
                    )
                    return VerifyIdentityResponse(
                        status="LOOKALIKE_SPOOFING",
                        confidence_score=0.95,
                        matched_identity=InstitutionalIdentityResponse(
                            id=matched.id,
                            name=matched.name,
                            role_title=matched.role_title,
                            department=matched.department,
                            official_email=matched.official_email,
                            official_phone=matched.official_phone or "",
                            verified_domain=matched.verified_domain,
                            official_portal_url=matched.official_portal_url or "",
                            verified_payment_portal=matched.verified_payment_portal or "",
                            is_active=matched.is_active,
                            created_at=matched.created_at.isoformat() + "Z" if matched.created_at else ""
                        ),
                        indicators=indicators,
                        explanation="The sender claims to represent an authorized campus official, but is using an unauthorized external email domain.",
                        safety_guidance="DO NOT reply or send documents. Contact the official office via their verified telephone number or campus directory."
                    )

            # Check portal or payment link mismatch
            if target_link and matched.verified_payment_portal:
                parsed_link = urlparse(target_link if "://" in target_link else f"https://{target_link}")
                link_host = (parsed_link.hostname or "").lower()
                official_host = urlparse(matched.verified_payment_portal).hostname or ""
                if link_host and official_host and link_host != official_host.lower():
                    indicators.append(
                        f"Payment Mismatch: Payment destination '{link_host}' does not match official bursar portal '{official_host}'"
                    )
                    return VerifyIdentityResponse(
                        status="PAYMENT_MISMATCH",
                        confidence_score=0.90,
                        matched_identity=None,
                        indicators=indicators,
                        explanation="Suspected fraudulent fee or bursary collection attempt.",
                        safety_guidance="Official campus payments are only processed through payments.campus.edu. Never send funds to external payment links."
                    )

            # Verified Official
            return VerifyIdentityResponse(
                status="VERIFIED_OFFICIAL",
                confidence_score=0.98,
                matched_identity=InstitutionalIdentityResponse(
                    id=matched.id,
                    name=matched.name,
                    role_title=matched.role_title,
                    department=matched.department,
                    official_email=matched.official_email,
                    official_phone=matched.official_phone or "",
                    verified_domain=matched.verified_domain,
                    official_portal_url=matched.official_portal_url or "",
                    verified_payment_portal=matched.verified_payment_portal or "",
                    is_active=matched.is_active,
                    created_at=matched.created_at.isoformat() + "Z" if matched.created_at else ""
                ),
                indicators=["Verified match in active institutional identity registry"],
                explanation=f"Sender matches verified campus registry record: {matched.name} ({matched.role_title}, {matched.department}).",
                safety_guidance="Communication matches legitimate campus records."
            )

        # Unverified Sender (Not in registry)
        return VerifyIdentityResponse(
            status="UNVERIFIED_SENDER",
            confidence_score=0.50,
            matched_identity=None,
            indicators=["Identity not registered in verified institutional directory"],
            explanation="The claimed sender or department is not currently cataloged in the verified university registry. An unverified identity is not automatically fraudulent, but requires independent verification.",
            safety_guidance="Verify the person's status through your campus directory or instructor office hours before clicking links or submitting credentials."
        )


trust_graph_service = TrustGraphService()

