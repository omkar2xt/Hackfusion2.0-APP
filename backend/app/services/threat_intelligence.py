from typing import Optional, Dict, Any
from app.core.config import settings

KNOWN_THREAT_DOMAINS = {
    "malicious-phishing.test": "Verified simulated phishing site",
    "testsafebrowsing.appspot.com": "Google Safe Browsing test target",
    "malware.wicar.org": "WiCAR malware test suite",
    "phishing-test-domain.com": "Known test credential harvester",
    "campus-fake-portal.xyz": "Simulated campus spoofed portal",
    "update-edu-login.net": "Known fraudulent credential collection landing page",
}


class ThreatIntelligenceService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.THREAT_INTELLIGENCE_API_KEY

    def lookup_domain(self, domain: str) -> Optional[Dict[str, Any]]:
        domain_lower = domain.lower()

        # 1. Check local threat indicators
        for known_domain, reason in KNOWN_THREAT_DOMAINS.items():
            if domain_lower == known_domain or domain_lower.endswith("." + known_domain):
                return {
                    "is_malicious": True,
                    "provider": "SignalSafe Campus Threat Intelligence Feed",
                    "reason": reason,
                    "confidence": 0.99
                }

        # 2. Check for suspicious TLDs frequently abused in campus phishing
        suspicious_tlds = {".xyz", ".top", ".buzz", ".work", ".click", ".surf", ".gq", ".cf", ".tk"}
        for tld in suspicious_tlds:
            if domain_lower.endswith(tld) and any(kw in domain_lower for kw in ("login", "portal", "verify", "secure", "auth", "campus", "edu")):
                return {
                    "is_malicious": False,
                    "is_suspicious": True,
                    "provider": "SignalSafe Heuristic Feed",
                    "reason": f"High-risk top-level domain '{tld}' combined with credential harvesting keywords",
                    "confidence": 0.85
                }

        return None


threat_intel_service = ThreatIntelligenceService()
