import re
import ipaddress
from urllib.parse import urlparse, unquote
from typing import Dict, Any, List
from app.services.threat_intelligence import threat_intel_service
from app.services.risk_engine import risk_engine


class UrlAnalyzer:
    DECEPTIVE_KEYWORDS = [
        "login", "signin", "portal", "verify", "account", "update",
        "password", "security", "support", "helpdesk", "office365",
        "outlook", "mfa", "duo", "canvas", "blackboard", "student"
    ]

    STANDARD_PORTS = {80, 443}

    @staticmethod
    def is_ip_address(host: str) -> bool:
        clean_host = host.strip("[]")
        try:
            ipaddress.ip_address(clean_host)
            return True
        except ValueError:
            pass
        if clean_host.isdigit():
            return True
        return False

    @staticmethod
    def is_punycode(host: str) -> bool:
        return "xn--" in host.lower()

    def analyze(self, raw_url: str) -> Dict[str, Any]:
        raw_url = raw_url.strip()
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", raw_url):
            raw_url = "https://" + raw_url

        try:
            parsed = urlparse(raw_url)
        except Exception:
            return {
                "verdict": "UNKNOWN",
                "risk_level": "Invalid URL Format",
                "risk_score": 50,
                "indicators": ["Malformed URL syntax could not be parsed safely"],
                "recommendations": ["Ensure the URL adheres to standard URI specifications."],
                "input_type": "url",
                "input_value": raw_url,
            }

        hostname = (parsed.hostname or "").lower()
        port = parsed.port
        path = parsed.path or ""
        query = parsed.query or ""
        scheme = parsed.scheme.lower()

        indicators: List[str] = []
        score: int = 0
        is_confirmed_malicious = False

        if scheme not in ("http", "https"):
            indicators.append(f"Unusual URI protocol scheme detected: '{scheme}://'")
            score += 45

        if scheme == "http":
            indicators.append("Insecure plain HTTP connection (data is transmitted unencrypted)")
            score += 15

        if hostname and self.is_ip_address(hostname):
            indicators.append(f"Host uses a raw numerical IP address ({hostname}) instead of a verified domain name")
            score += 50

        if hostname and self.is_punycode(hostname):
            indicators.append(f"Punycode encoded domain ({hostname}) detected; often used to spoof legitimate brand names")
            score += 45

        if port and port not in self.STANDARD_PORTS:
            indicators.append(f"Unusual destination network port: :{port} (standard web traffic uses :80 or :443)")
            score += 30

        unquoted = unquote(raw_url)
        if raw_url.count("%") > 5 or "%00" in raw_url or "\\x" in raw_url:
            indicators.append("Excessive percentage encoding or obfuscation characters detected in path/query")
            score += 25

        if "@" in parsed.netloc:
            indicators.append("Embedded credentials or redirection character '@' found in authority section")
            score += 40

        matched_keywords = [kw for kw in self.DECEPTIVE_KEYWORDS if kw in hostname]
        if len(matched_keywords) >= 2:
            indicators.append(
                f"Multiple sensitive credential keywords in domain: {', '.join(matched_keywords)}"
            )
            score += 35
        elif len(matched_keywords) == 1 and not hostname.endswith(".edu"):
            indicators.append(
                f"Credential harvesting keyword '{matched_keywords[0]}' on non-institutional domain"
            )
            score += 20

        subdomain_parts = hostname.split(".")
        if len(subdomain_parts) > 4:
            indicators.append(f"Deeply nested subdomain structure ({len(subdomain_parts)} levels) often used to evade filters")
            score += 20

        if hostname:
            intel = threat_intel_service.lookup_domain(hostname)
            if intel:
                if intel.get("is_malicious"):
                    is_confirmed_malicious = True
                    indicators.insert(0, f"Threat Intel Alert: {intel.get('reason')}")
                    score = 95
                elif intel.get("is_suspicious"):
                    indicators.append(f"Threat Intel Warning: {intel.get('reason')}")
                    score += 40

        score = min(max(score, 0), 100)

        verdict, risk_level = risk_engine.calculate_verdict(
            score=score,
            is_confirmed_malicious=is_confirmed_malicious,
            has_critical_indicators=(score >= 60)
        )

        recommendations = risk_engine.generate_recommendations(verdict, indicators)

        return {
            "verdict": verdict,
            "risk_level": risk_level,
            "risk_score": score,
            "indicators": indicators,
            "recommendations": recommendations,
            "input_type": "url",
            "input_value": raw_url,
        }


url_analyzer = UrlAnalyzer()
