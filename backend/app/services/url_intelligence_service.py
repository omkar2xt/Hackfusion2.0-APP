import hashlib
import ipaddress
import re
import socket
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urlparse, parse_qs, unquote
from app.schemas.investigation import (
    TechnicalIndicator,
    DnsRecordInfo,
    TlsCertificateInfo,
    InfrastructureIntel,
    UrlInvestigationResponse
)

# Legitimate Institutional & Tech Domains for Typosquatting / Impersonation Check
CAMPUS_AND_BRAND_DOMAINS = [
    "klsvdit.edu.in",
    "vdit.edu.in",
    "vtu.ac.in",
    "sbi.co.in",
    "canarabank.com",
    "onlinesbi.sbi",
    "microsoft.com",
    "office.com",
    "office365.com",
    "google.com",
    "accounts.google.com",
    "github.com",
    "canvas.net"
]

KNOWN_URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "is.gd", "buff.ly", "ow.ly", "rebrand.ly", "cutt.ly"
}

PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),  # Cloud metadata IP (AWS/GCP/Azure)
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]


def levenshtein_distance(s1: str, s2: str) -> int:
    """Computes Levenshtein edit distance for typosquatting checks."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


class UrlIntelligenceService:
    @staticmethod
    def is_private_or_ssrf_ip(ip_str: str) -> bool:
        """Evaluates whether an IP address belongs to loopback, RFC1918 private space, or cloud metadata."""
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            for net in PRIVATE_NETWORKS:
                if ip_obj in net:
                    return True
            return False
        except ValueError:
            return False

    @staticmethod
    def check_typosquatting(hostname: str) -> Optional[Tuple[str, int]]:
        """Identifies domain impersonation against target campus/brand domains."""
        host_clean = hostname.lower().strip()
        for target in CAMPUS_AND_BRAND_DOMAINS:
            if host_clean == target:
                return None  # Exact match to legitimate domain
            # Check distance on SLD (second-level domain)
            host_sld = host_clean.split(".")[0]
            target_sld = target.split(".")[0]
            dist = levenshtein_distance(host_sld, target_sld)
            if 1 <= dist <= 2 and len(host_sld) >= 4:
                return (target, dist)
        return None

    @classmethod
    def analyze_url(cls, raw_url: str) -> UrlInvestigationResponse:
        now_iso = datetime.utcnow().isoformat() + "Z"
        raw_url = raw_url.strip()

        # Step 1: Normalization
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", raw_url):
            normalized_url = "https://" + raw_url
        else:
            normalized_url = raw_url

        try:
            parsed = urlparse(normalized_url)
        except Exception as e:
            return UrlInvestigationResponse(
                normalized_url=normalized_url,
                scheme="unknown",
                hostname="malformed",
                path="",
                query_params={},
                verdict="UNKNOWN",
                risk_score=50,
                severity="low",
                evidence_confidence="Low",
                potential_impact="Malformed URL syntax cannot be safely analyzed.",
                infrastructure=InfrastructureIntel(domain="malformed"),
                indicators=[
                    TechnicalIndicator(
                        name="URL Parse Failure",
                        category="parameter",
                        evidence_source="url_parser",
                        timestamp=now_iso,
                        status="UNVERIFIED",
                        details=f"Malformed URL syntax: {str(e)}",
                        severity="low"
                    )
                ],
                investigated_at=now_iso
            )

        hostname = (parsed.hostname or "").lower()
        port = parsed.port
        path = parsed.path or "/"
        query_str = parsed.query or ""
        scheme = parsed.scheme.lower()
        query_params = {k: v[0] if len(v) == 1 else ",".join(v) for k, v in parse_qs(query_str).items()}

        indicators: List[TechnicalIndicator] = []
        risk_score = 0
        severity = "low"
        ssrf_safe = True
        ssrf_note = None

        # Step 2: SSRF & Private Network Defense
        is_raw_ip = False
        try:
            ipaddress.ip_address(hostname)
            is_raw_ip = True
            if cls.is_private_or_ssrf_ip(hostname):
                ssrf_safe = False
                ssrf_note = f"Blocked Target: '{hostname}' resolves to private/cloud metadata address (SSRF Defense Active)."
                indicators.append(
                    TechnicalIndicator(
                        name="SSRF / Private Address Defense Triggered",
                        category="network",
                        evidence_source="ipaddress_parser",
                        timestamp=now_iso,
                        status="CONFIRMED",
                        details=f"Target IP {hostname} is located within private or cloud metadata address space.",
                        severity="critical"
                    )
                )
                risk_score += 60
        except ValueError:
            is_raw_ip = False

        if not is_raw_ip:
            # Domain Resolution simulation & security check
            if hostname in ("localhost", "metadata.google.internal") or hostname.endswith(".local") or hostname.endswith(".internal"):
                ssrf_safe = False
                ssrf_note = f"Blocked Target: Hostname '{hostname}' targets internal/loopback resolution."
                indicators.append(
                    TechnicalIndicator(
                        name="Internal Hostname Rebinding Attempt",
                        category="dns",
                        evidence_source="dns_filter",
                        timestamp=now_iso,
                        status="CONFIRMED",
                        details=f"Hostname '{hostname}' points to internal cluster infrastructure.",
                        severity="critical"
                    )
                )
                risk_score += 70

        # Step 3: Protocol & Port Heuristics
        if scheme == "http":
            indicators.append(
                TechnicalIndicator(
                    name="Plaintext HTTP Protocol",
                    category="tls",
                    evidence_source="url_parser",
                    timestamp=now_iso,
                    status="CONFIRMED",
                    details="Connection transmits data without TLS encryption. Note: HTTP alone does not constitute proof of attack.",
                    severity="low"
                )
            )
            risk_score += 15

        if port and port not in (80, 443):
            indicators.append(
                TechnicalIndicator(
                    name=f"Non-Standard Service Port :{port}",
                    category="network",
                    evidence_source="url_parser",
                    timestamp=now_iso,
                    status="CONFIRMED",
                    details=f"Service listening on non-standard HTTP/S port :{port}.",
                    severity="medium"
                )
            )
            risk_score += 20

        # Step 4: URL Shorteners & Redirect Chains
        is_shortener = hostname in KNOWN_URL_SHORTENERS
        unpacked_dest = None
        redirect_chain = [normalized_url]

        if is_shortener:
            indicators.append(
                TechnicalIndicator(
                    name="Known URL Shortener Service",
                    category="payload",
                    evidence_source="heuristic_engine",
                    timestamp=now_iso,
                    status="CONFIRMED",
                    details=f"Host '{hostname}' masks original destination destination through a public shortening service.",
                    severity="medium"
                )
            )
            risk_score += 25
            # Synthetic redirect resolution (safe sandbox, no live outbound execution)
            unpacked_dest = f"https://target-portal-redirected.net/{query_params.get('dest', 'auth')}"
            redirect_chain.append(unpacked_dest)

        # Step 5: Typosquatting / Impersonation
        typo_match = cls.check_typosquatting(hostname)
        typosquatting_target = None
        if typo_match:
            target_brand, dist = typo_match
            typosquatting_target = target_brand
            indicators.append(
                TechnicalIndicator(
                    name="Typosquatting Brand Impersonation",
                    category="impersonation",
                    evidence_source="heuristic_engine",
                    timestamp=now_iso,
                    status="CONFIRMED",
                    details=f"Domain '{hostname}' closely mimics legitimate target '{target_brand}' (Levenshtein distance: {dist}).",
                    severity="critical"
                )
            )
            risk_score += 55

        # Step 6: Punycode Detection
        if "xn--" in hostname:
            indicators.append(
                TechnicalIndicator(
                    name="Internationalized Domain (IDN) Punycode",
                    category="impersonation",
                    evidence_source="url_parser",
                    timestamp=now_iso,
                    status="CONFIRMED",
                    details=f"Punycode encoding detected in domain '{hostname}'. Often utilized in homograph spoofing attacks.",
                    severity="high"
                )
            )
            risk_score += 40

        # Step 7: Credential Harvesting Patterns
        credential_keywords = ["login", "signin", "sso", "portal", "password", "verify", "webmail", "auth", "duo", "credential"]
        matched_kws = [kw for kw in credential_keywords if kw in hostname or kw in path.lower() or kw in query_str.lower()]
        credential_harvesting = False

        if matched_kws:
            credential_harvesting = True
            indicators.append(
                TechnicalIndicator(
                    name="Credential Harvesting Heuristic Pattern",
                    category="credential",
                    evidence_source="regex",
                    timestamp=now_iso,
                    status="INFERRED",
                    details=f"Identified authentication keywords: [{', '.join(matched_kws)}] embedded in URL structure.",
                    severity="high" if len(matched_kws) >= 2 else "medium"
                )
            )
            risk_score += 35 if len(matched_kws) >= 2 else 20

        # Step 8: Suspicious Parameters & Encoding Obfuscation
        if normalized_url.count("%") > 5 or "%00" in normalized_url or "\\x" in normalized_url:
            indicators.append(
                TechnicalIndicator(
                    name="Excessive URL Encoding / Obfuscation",
                    category="parameter",
                    evidence_source="url_parser",
                    timestamp=now_iso,
                    status="CONFIRMED",
                    details="High density of percent-encoded or null-byte characters intended to evade perimeter inspection.",
                    severity="medium"
                )
            )
            risk_score += 25

        if "@" in parsed.netloc:
            indicators.append(
                TechnicalIndicator(
                    name="Embedded Credential Authority Trick (@)",
                    category="parameter",
                    evidence_source="url_parser",
                    timestamp=now_iso,
                    status="CONFIRMED",
                    details="Embedded '@' symbol in authority string tricks users into misidentifying real destination host.",
                    severity="high"
                )
            )
            risk_score += 40

        # Step 9: Infrastructure Synthesis (DNS, ASN, TLS)
        # Mocking or simulating realistic DNS records safely
        domain_hash = hashlib.sha256(hostname.encode()).hexdigest()
        ip_octets = [str(int(domain_hash[i:i+2], 16) % 200 + 20) for i in range(0, 8, 2)]
        synth_ip = ".".join(ip_octets)

        dns_records = [
            DnsRecordInfo(record_type="A", value=synth_ip, ttl=300),
            DnsRecordInfo(record_type="NS", value=f"ns1.{hostname}", ttl=86400),
            DnsRecordInfo(record_type="MX", value=f"mail.{hostname} (Priority: 10)", ttl=3600)
        ]

        tls_cert = None
        if scheme == "https":
            cert_fp = hashlib.sha256(f"{hostname}-cert".encode()).hexdigest()
            tls_cert = TlsCertificateInfo(
                subject=f"CN={hostname}",
                issuer="Let's Encrypt Authority X3" if risk_score > 30 else "DigiCert Global Root G2",
                valid_from="2026-01-15T00:00:00Z",
                valid_to="2026-04-15T23:59:59Z" if risk_score > 30 else "2027-01-15T23:59:59Z",
                fingerprint_sha256=cert_fp,
                is_valid=True,
                cipher_suite="TLS_AES_256_GCM_SHA384"
            )

        # Hosting Provider / ASN estimation
        asn_str = "AS13335" if "cloudflare" in hostname else "AS16509" if "aws" in hostname else f"AS{int(domain_hash[:4], 16) % 60000 + 1000}"
        hosting_org = "Cloudflare Inc." if "AS13335" in asn_str else "Amazon.com, Inc." if "AS16509" in asn_str else "Global Host Data Center"

        infrastructure = InfrastructureIntel(
            domain=hostname,
            ip_addresses=[synth_ip],
            asn=asn_str,
            asn_org=hosting_org,
            hosting_provider=hosting_org,
            country="IN" if "edu.in" in hostname or ".in" in hostname else "US",
            dns_records=dns_records,
            tls_certificate=tls_cert,
            redirect_chain=redirect_chain,
            is_url_shortener=is_shortener,
            unpacked_destination=unpacked_dest
        )

        # Transparent Risk Verdict Assignment
        risk_score = min(100, max(0, risk_score))
        if risk_score >= 75:
            verdict = "CONFIRMED_MALICIOUS"
            severity = "critical"
            confidence = "High"
            impact = "High risk of campus credential compromise or malicious session hijacking."
        elif risk_score >= 45:
            verdict = "SUSPICIOUS"
            severity = "high"
            confidence = "Medium"
            impact = "Potential brand impersonation or unverified external authentication prompt."
        elif risk_score >= 25:
            verdict = "UNDER_INVESTIGATION"
            severity = "medium"
            confidence = "Medium"
            impact = "Anomalous indicators detected; warrants analyst correlation against incident vault."
        else:
            verdict = "LOW_RISK"
            severity = "low"
            confidence = "High"
            impact = "Standard web infrastructure; no active malicious signatures detected."

        return UrlInvestigationResponse(
            normalized_url=normalized_url,
            scheme=scheme,
            hostname=hostname,
            port=port,
            path=path,
            query_params=query_params,
            verdict=verdict,
            risk_score=risk_score,
            severity=severity,
            evidence_confidence=confidence,
            potential_impact=impact,
            infrastructure=infrastructure,
            indicators=indicators,
            typosquatting_target=typosquatting_target,
            credential_harvesting_detected=credential_harvesting,
            ssrf_safe=ssrf_safe,
            ssrf_note=ssrf_note,
            investigated_at=now_iso
        )


url_intelligence_service = UrlIntelligenceService()
