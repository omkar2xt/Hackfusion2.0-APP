import hashlib
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse, parse_qs
from sqlalchemy.orm import Session
from app.database.models import IncidentModel, ScanModel
from app.schemas.investigation import (
    TechnicalIndicator,
    QrInvestigationResponse
)
from app.services.url_intelligence_service import url_intelligence_service


class QrIntelligenceService:
    @staticmethod
    def classify_payload(payload: str) -> str:
        """Classifies the exact payload structure of a QR code."""
        p_clean = payload.strip()
        p_lower = p_clean.lower()

        if p_lower.startswith("wifi:"):
            return "WIFI"
        if p_lower.startswith(("upi://", "paytmmp://", "phonepe://", "gpay://")):
            return "PAYMENT"
        if p_lower.startswith(("begin:vcard", "mecard:")):
            return "VCARD_CONTACT"
        if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", p_clean) or p_lower.startswith("www."):
            return "URL"
        if p_lower.startswith(("intent://", "slack://", "tg://", "whatsapp://", "fb://")):
            return "APP_DEEP_LINK"
        return "TEXT_PLAIN"

    @staticmethod
    def parse_wifi_config(payload: str) -> Dict[str, str]:
        """Parses standard Wi-Fi QR format: WIFI:S:MySSID;T:WPA;P:MyPassword;H:false;;"""
        config = {"ssid": "", "security": "OPEN", "password": "", "hidden": "false"}
        parts = payload.strip()[5:].split(";")
        for part in parts:
            if part.startswith("S:"):
                config["ssid"] = part[2:]
            elif part.startswith("T:"):
                config["security"] = part[2:]
            elif part.startswith("P:"):
                config["password"] = part[2:]
            elif part.startswith("H:"):
                config["hidden"] = part[2:]
        return config

    @staticmethod
    def parse_payment_info(payload: str) -> Dict[str, str]:
        """Parses UPI / Payment URI: upi://pay?pa=merchant@upi&pn=Campus%20Store&am=500"""
        info = {"payee_vpa": "", "payee_name": "", "amount": "", "transaction_ref": ""}
        try:
            parsed = urlparse(payload)
            params = parse_qs(parsed.query)
            info["payee_vpa"] = params.get("pa", [""])[0]
            info["payee_name"] = params.get("pn", [""])[0]
            info["amount"] = params.get("am", [""])[0]
            info["transaction_ref"] = params.get("tr", [""])[0]
        except Exception:
            pass
        return info

    @classmethod
    def analyze_qr(
        cls,
        db: Optional[Session],
        decoded_payload: str,
        image_metadata: Optional[Dict[str, Any]] = None,
        image_hash_sha256: Optional[str] = None
    ) -> QrInvestigationResponse:
        now_iso = datetime.utcnow().isoformat() + "Z"
        raw_payload = decoded_payload.strip()

        payload_hash = hashlib.sha256(raw_payload.encode()).hexdigest()
        payload_type = cls.classify_payload(raw_payload)

        indicators: List[TechnicalIndicator] = []
        risk_score = 0
        url_dest = None
        url_inv_response = None
        wifi_info = None
        payment_info = None
        contact_info = None
        security_explanation = ""

        # Step 1: Payload Classification & Specific Forensic Engines
        if payload_type == "URL":
            url_dest = raw_payload
            url_inv_response = url_intelligence_service.analyze_url(raw_payload)
            risk_score = url_inv_response.risk_score
            indicators.extend(url_inv_response.indicators)

            security_explanation = (
                f"Decoded QR directs device to Web URL: '{url_dest}'. "
                f"Evaluated against campus domain registry, redirect shorteners and TLS certificates."
            )

            # Extra QR-specific check: Physical sticker placement notice
            indicators.append(
                TechnicalIndicator(
                    name="Physical-to-Digital Bridge Vector (QR)",
                    category="payload",
                    evidence_source="qr_decoder",
                    timestamp=now_iso,
                    status="CONFIRMED",
                    details="QR barcode acts as an unverified physical redirection bridge. Auto-execution restricted by policy.",
                    severity="info"
                )
            )

        elif payload_type == "WIFI":
            wifi_info = cls.parse_wifi_config(raw_payload)
            ssid = wifi_info.get("ssid", "Unknown")
            sec = wifi_info.get("security", "OPEN").upper()

            security_explanation = (
                f"Decoded QR prompts automatic configuration of Wi-Fi network SSID '{ssid}' with security '{sec}'. "
                f"Analyzing for captive portal harvesting and rogue access point impersonation."
            )

            if sec in ("NOPASS", "OPEN", "NONE", ""):
                indicators.append(
                    TechnicalIndicator(
                        name="Rogue Open Wi-Fi Network Configuration",
                        category="wifi",
                        evidence_source="qr_wifi_parser",
                        timestamp=now_iso,
                        status="CONFIRMED",
                        details=f"QR configures device to associate with open, unencrypted wireless SSID '{ssid}'. High risk of eavesdropping or evil twin attack.",
                        severity="high"
                    )
                )
                risk_score += 55

            campus_ssids = ["vdit", "klsvdit", "campus", "student", "faculty", "eduroam"]
            if any(term in ssid.lower() for term in campus_ssids):
                indicators.append(
                    TechnicalIndicator(
                        name="Campus SSID Name Impersonation",
                        category="impersonation",
                        evidence_source="qr_wifi_parser",
                        timestamp=now_iso,
                        status="INFERRED",
                        details=f"SSID '{ssid}' contains campus brand keywords. Physical verification required to confirm authorized IT deployment.",
                        severity="medium"
                    )
                )
                risk_score += 35

        elif payload_type == "PAYMENT":
            payment_info = cls.parse_payment_info(raw_payload)
            vpa = payment_info.get("payee_vpa", "")
            amount = payment_info.get("amount", "")

            security_explanation = (
                f"Decoded QR initiates immediate financial transaction to VPA: '{vpa}'"
                f"{f' for ₹{amount}' if amount else ''}. Checking against official university bursar accounts."
            )

            official_vpas = ["fees@vtu", "fees@vdit", "bursar@sbi", "klsvdit@sbi"]
            if vpa and not any(vpa.lower().endswith(off) for off in official_vpas):
                indicators.append(
                    TechnicalIndicator(
                        name="Unverified Third-Party Payment Address (VPA)",
                        category="payload",
                        evidence_source="qr_payment_parser",
                        timestamp=now_iso,
                        status="CONFIRMED",
                        details=f"Target VPA '{vpa}' is not in the certified campus treasury registry. Potential fee diversion or fraud.",
                        severity="high"
                    )
                )
                risk_score += 50

        elif payload_type == "VCARD_CONTACT":
            security_explanation = "Decoded QR installs contact information or vCard entry into device address book."
            indicators.append(
                TechnicalIndicator(
                    name="vCard Contact Insertion",
                    category="payload",
                    evidence_source="qr_vcard_parser",
                    timestamp=now_iso,
                    status="CONFIRMED",
                    details="Payload automatically imports contact information. Social engineering vector.",
                    severity="medium"
                )
            )
            risk_score += 25

        else:
            security_explanation = "Decoded QR contains alphanumeric plain text or serial code."
            indicators.append(
                TechnicalIndicator(
                    name="Plaintext Payload",
                    category="payload",
                    evidence_source="qr_decoder",
                    timestamp=now_iso,
                    status="CONFIRMED",
                    details="Payload does not initiate direct network or application execution.",
                    severity="info"
                )
            )
            risk_score += 10

        # Step 2: Destination Reuse across Campus Incidents
        reuse_count = 0
        related_incidents = []

        if db:
            try:
                # Query past incidents with same suspicious content
                matched_incs = db.query(IncidentModel).filter(
                    IncidentModel.suspicious_content.ilike(f"%{raw_payload[:50]}%")
                ).limit(5).all()

                reuse_count = len(matched_incs)
                related_incidents = [inc.id for inc in matched_incs]

                if reuse_count >= 2:
                    indicators.append(
                        TechnicalIndicator(
                            name=f"Repeated Payload Reuse Across Campus ({reuse_count} Reports)",
                            category="payload",
                            evidence_source="database_correlation",
                            timestamp=now_iso,
                            status="CONFIRMED",
                            details=f"This exact QR payload has been submitted across multiple independent reports on campus.",
                            severity="high"
                        )
                    )
                    risk_score += 30
            except Exception:
                pass

        # Transparent Risk Verdict Assignment
        risk_score = min(100, max(0, risk_score))
        if risk_score >= 75:
            verdict = "CONFIRMED_MALICIOUS"
            severity = "critical"
            confidence = "High"
            impact = "Imminent risk of credential harvesting, rogue network connection, or fee redirection."
        elif risk_score >= 45:
            verdict = "SUSPICIOUS"
            severity = "high"
            confidence = "Medium"
            impact = "Potential unverified physical flyer targeting campus community."
        elif risk_score >= 25:
            verdict = "UNDER_INVESTIGATION"
            severity = "medium"
            confidence = "Medium"
            impact = "Anomalous QR structure; warrants analyst correlation before scanning."
        else:
            verdict = "LOW_RISK"
            severity = "low"
            confidence = "High"
            impact = "Standard benign QR payload structure."

        return QrInvestigationResponse(
            decoded_payload=raw_payload,
            payload_type=payload_type,
            payload_hash_sha256=payload_hash,
            image_hash_sha256=image_hash_sha256,
            verdict=verdict,
            risk_score=risk_score,
            severity=severity,
            evidence_confidence=confidence,
            potential_impact=impact,
            url_destination=url_dest,
            url_investigation=url_inv_response,
            wifi_config=wifi_info,
            payment_info=payment_info,
            contact_info=contact_info,
            indicators=indicators,
            reuse_count_across_campus=reuse_count,
            related_incident_ids=related_incidents,
            security_explanation=security_explanation,
            investigated_at=now_iso
        )


qr_intelligence_service = QrIntelligenceService()
