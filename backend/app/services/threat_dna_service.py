import hashlib
import re
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urlparse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.models import (
    ThreatFingerprintModel,
    ThreatCampaignModel,
    CampaignIncidentModel,
    IncidentModel
)
from app.schemas.threat_dna import ThreatCampaignResponse, CampaignIncidentMatch


class ThreatDnaEngine:
    # High-signal token regex
    TOKEN_REGEX = re.compile(r"\b[a-zA-Z0-9_\-\.]{3,30}\b")

    @classmethod
    def extract_dna(
        cls,
        content: str,
        target_url: Optional[str] = None,
        claimed_sender: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generates a structured threat fingerprint vector from incident text and URLs."""
        domain_normalized = ""
        url_structure_hash = ""

        if target_url:
            clean_url = target_url.strip()
            if not clean_url.startswith(("http://", "https://")):
                clean_url = "https://" + clean_url
            try:
                parsed = urlparse(clean_url)
                domain_normalized = (parsed.hostname or "").lower()
                # Structural path template: e.g. /path/to/page -> /xxx/xxx/xxx
                path_structure = "/".join(["token" for segment in parsed.path.split("/") if segment])
                url_structure_hash = hashlib.sha256(path_structure.encode("utf-8")).hexdigest()[:16]
            except Exception:
                pass

        # Extract normalized semantic tokens
        text_for_tokens = f"{content} {domain_normalized} {claimed_sender or ''}".lower()
        all_tokens = set(cls.TOKEN_REGEX.findall(text_for_tokens))
        # Filter common stopwords
        stopwords = {"the", "and", "for", "with", "this", "that", "from", "your", "have", "been", "will", "http", "https"}
        meaningful_tokens = sorted(list(all_tokens - stopwords))[:25]

        # Deterministic primary hash
        fingerprint_source = f"{domain_normalized}|{url_structure_hash}|{sorted(meaningful_tokens)}"
        fingerprint_hash = hashlib.sha256(fingerprint_source.encode("utf-8")).hexdigest()

        return {
            "domain_normalized": domain_normalized,
            "url_structure_hash": url_structure_hash,
            "content_tokens": meaningful_tokens,
            "claimed_sender": (claimed_sender or "").strip().lower(),
            "fingerprint_hash": fingerprint_hash,
            "feature_vector": {
                "token_count": len(meaningful_tokens),
                "has_domain": bool(domain_normalized),
                "has_claimed_sender": bool(claimed_sender),
                "high_risk_triggers": [
                    t for t in meaningful_tokens
                    if t in ("password", "suspend", "urgent", "giftcard", "wire", "verify", "duo", "canvas", "itunes")
                ]
            }
        }

    @staticmethod
    def calculate_similarity(fp1: Dict[str, Any], fp2: Dict[str, Any]) -> Tuple[float, List[str]]:
        """
        Calculates explainable similarity between two threat fingerprints (0.0 to 1.0).
        Uses weighted feature comparison: Domain match (40%), Tokens Jaccard (40%), Sender match (20%).
        """
        reasons = []
        similarity = 0.0

        # 1. Domain Match
        d1 = fp1.get("domain_normalized", "")
        d2 = fp2.get("domain_normalized", "")
        if d1 and d2:
            if d1 == d2:
                similarity += 0.40
                reasons.append(f"Identical target domain: {d1}")
            elif d1.split(".")[-2:] == d2.split(".")[-2:]:
                similarity += 0.30
                reasons.append(f"Shared root domain: {'.'.join(d1.split('.')[-2:])}")

        # 2. Token Jaccard Similarity
        t1 = set(fp1.get("content_tokens", []))
        t2 = set(fp2.get("content_tokens", []))
        if t1 and t2:
            intersection = t1.intersection(t2)
            union = t1.union(t2)
            jaccard = len(intersection) / len(union) if union else 0.0
            similarity += (jaccard * 0.40)
            if intersection:
                reasons.append(f"Shared threat indicators/keywords: {', '.join(list(intersection)[:4])}")

        # 3. Claimed Sender Match
        s1 = fp1.get("claimed_sender", "")
        s2 = fp2.get("claimed_sender", "")
        if s1 and s2 and s1 == s2:
            similarity += 0.20
            reasons.append(f"Matching claimed sender: '{s1}'")

        # 4. URL structural match
        u1 = fp1.get("url_structure_hash", "")
        u2 = fp2.get("url_structure_hash", "")
        if u1 and u2 and u1 == u2:
            similarity += 0.10
            reasons.append("Identical URL path structure pattern")

        normalized_score = min(max(round(similarity, 2), 0.0), 1.0)
        return normalized_score, reasons

    @classmethod
    def process_and_correlate(
        cls,
        db: Session,
        incident_id: Optional[str],
        scan_id: Optional[str],
        content: str,
        target_url: Optional[str] = None,
        claimed_sender: Optional[str] = None
    ) -> Dict[str, Any]:
        """Stores threat DNA and dynamically evaluates correlation with known campaigns."""
        dna = cls.extract_dna(content, target_url, claimed_sender)

        # Save fingerprint record
        fp_record = ThreatFingerprintModel(
            id=str(uuid.uuid4()),
            incident_id=incident_id,
            scan_id=scan_id,
            domain_normalized=dna["domain_normalized"],
            url_structure_hash=dna["url_structure_hash"],
            content_tokens=dna["content_tokens"],
            claimed_sender=dna["claimed_sender"],
            fingerprint_hash=dna["fingerprint_hash"],
            feature_vector=dna["feature_vector"],
            created_at=datetime.utcnow()
        )
        db.add(fp_record)
        db.commit()

        # Compare with existing active fingerprints to detect campaigns
        existing_fps = (
            db.query(ThreatFingerprintModel)
            .filter(ThreatFingerprintModel.id != fp_record.id)
            .order_by(desc(ThreatFingerprintModel.created_at))
            .limit(30)
            .all()
        )

        matched_campaign_id = None
        best_similarity = 0.0
        best_reasons: List[str] = []

        for other_fp in existing_fps:
            sim, reasons = cls.calculate_similarity(
                dna,
                {
                    "domain_normalized": other_fp.domain_normalized,
                    "url_structure_hash": other_fp.url_structure_hash,
                    "content_tokens": other_fp.content_tokens or [],
                    "claimed_sender": other_fp.claimed_sender or ""
                }
            )
            if sim >= 0.50 and sim > best_similarity:
                best_similarity = sim
                best_reasons = reasons

                # Find if other_fp is already in a campaign
                existing_junction = (
                    db.query(CampaignIncidentModel)
                    .filter(CampaignIncidentModel.incident_id == other_fp.incident_id)
                    .first()
                )
                if existing_junction:
                    matched_campaign_id = existing_junction.campaign_id

        # If similarity threshold exceeded (>= 0.55), link to or create campaign
        campaign = None
        if best_similarity >= 0.50:
            if matched_campaign_id:
                campaign = db.query(ThreatCampaignModel).filter(ThreatCampaignModel.id == matched_campaign_id).first()
                if campaign:
                    campaign.incident_count += 1
                    campaign.last_seen = datetime.utcnow()
                    campaign.confidence_score = max(campaign.confidence_score, best_similarity)
            else:
                # Create a new campaign group
                campaign_name = f"Campaign: {dna['domain_normalized'] or 'Social Engineering Pattern'}"
                campaign = ThreatCampaignModel(
                    id=str(uuid.uuid4()),
                    name=campaign_name,
                    primary_theme="Credential Harvesting" if "login" in dna["domain_normalized"] else "Phishing",
                    severity="high" if best_similarity > 0.70 else "medium",
                    status="suspected",
                    confidence_score=best_similarity,
                    incident_count=2,
                    description=f"Correlated incident cluster: {', '.join(best_reasons)}",
                    first_seen=datetime.utcnow(),
                    last_seen=datetime.utcnow()
                )
                db.add(campaign)
                db.commit()
                db.refresh(campaign)

            if campaign and incident_id:
                # Add incident to campaign junction
                junction = CampaignIncidentModel(
                    id=str(uuid.uuid4()),
                    campaign_id=campaign.id,
                    incident_id=incident_id,
                    similarity_score=best_similarity,
                    match_reasons=best_reasons,
                    added_at=datetime.utcnow()
                )
                db.add(junction)
                db.commit()

        db.commit()

        return {
            "fingerprint_id": fp_record.id,
            "fingerprint_hash": fp_record.fingerprint_hash,
            "domain_normalized": fp_record.domain_normalized,
            "tokens": fp_record.content_tokens,
            "correlated_campaign_id": campaign.id if campaign else None,
            "campaign_name": campaign.name if campaign else None,
            "similarity_score": best_similarity,
            "match_reasons": best_reasons,
        }

    @staticmethod
    def list_campaigns(db: Session) -> List[ThreatCampaignResponse]:
        campaigns = db.query(ThreatCampaignModel).order_by(desc(ThreatCampaignModel.last_seen)).all()
        results = []
        for camp in campaigns:
            junctions = db.query(CampaignIncidentModel).filter(CampaignIncidentModel.campaign_id == camp.id).all()
            inc_matches = [
                CampaignIncidentMatch(
                    incident_id=j.incident_id,
                    similarity_score=j.similarity_score,
                    match_reasons=j.match_reasons or [],
                    added_at=j.added_at.isoformat() + "Z" if j.added_at else ""
                )
                for j in junctions
            ]
            results.append(
                ThreatCampaignResponse(
                    id=camp.id,
                    name=camp.name,
                    primary_theme=camp.primary_theme,
                    severity=camp.severity,
                    status=camp.status,
                    confidence_score=camp.confidence_score,
                    incident_count=camp.incident_count,
                    description=camp.description or "",
                    notes=camp.notes or "",
                    first_seen=camp.first_seen.isoformat() + "Z" if camp.first_seen else "",
                    last_seen=camp.last_seen.isoformat() + "Z" if camp.last_seen else "",
                    incidents=inc_matches
                )
            )
        return results

    @staticmethod
    def review_campaign(db: Session, campaign_id: str, status: str, notes: Optional[str] = None) -> Optional[ThreatCampaignModel]:
        campaign = db.query(ThreatCampaignModel).filter(ThreatCampaignModel.id == campaign_id).first()
        if not campaign:
            return None
        campaign.status = status
        if notes:
            campaign.notes = notes
        campaign.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(campaign)
        return campaign


threat_dna_service = ThreatDnaEngine()
