from typing import List, Tuple
from app.schemas.scan import VerdictType


class RiskEngine:
    SCORING_VERSION = "v2.0-explainable"

    @classmethod
    def calculate_verdict(
        cls,
        score: int,
        is_confirmed_malicious: bool = False,
        has_critical_indicators: bool = False
    ) -> Tuple[VerdictType, str]:
        """
        Calculates explainable risk verdicts strictly adhering to cybersecurity standards:
        - CONFIRMED_MALICIOUS: Verified threat intel match or confirmed malicious hash.
        - MALICIOUS: Extreme severity heuristic confluence (score >= 80).
        - SUSPICIOUS: Supported by heuristic warnings (score 20..79).
        - LOW_RISK: No known indicators detected (score 0..19). Never claimed as 100% safe.
        - UNKNOWN: Insufficient evidence.
        """
        score = min(max(score, 0), 100)

        if is_confirmed_malicious:
            # We preserve "MALICIOUS" verdict string for frontend badge compatibility while assigning Critical Threat
            return "MALICIOUS", "Critical Threat (Confirmed Intel)"
        elif score >= 80:
            return "MALICIOUS", "Critical Threat"
        elif score >= 50:
            return "SUSPICIOUS", "High Risk Heuristic"
        elif score >= 20:
            return "SUSPICIOUS", "Suspicious Indicator"
        elif score >= 0:
            return "LOW_RISK", "Low Risk (Not Guaranteed Safe)"
        else:
            return "UNKNOWN", "Insufficient Telemetry"

    @classmethod
    def get_risk_category(cls, score: int) -> str:
        """Returns the official 4-tier score category."""
        if score >= 80:
            return "Critical Threat (80-100)"
        elif score >= 50:
            return "High Risk (50-79)"
        elif score >= 20:
            return "Suspicious (20-49)"
        return "Low Risk (0-19)"

    @classmethod
    def generate_recommendations(cls, verdict: str, indicators: List[str]) -> List[str]:
        recommendations = []

        if verdict in ("MALICIOUS", "CONFIRMED_MALICIOUS"):
            recommendations.append("DO NOT click this link, download files, or enter passwords.")
            recommendations.append("Report this incident immediately to Campus IT Security.")
            recommendations.append("If credentials were typed, change your campus password immediately.")
            recommendations.append("Alert your campus peers if this was received via a campus-wide group.")
        elif verdict == "SUSPICIOUS":
            recommendations.append("Exercise extreme caution before navigating to this destination.")
            recommendations.append("Verify the sender via an independent communication channel (phone/in-person).")
            recommendations.append("Inspect the exact spelling of the domain in your browser's address bar.")
            recommendations.append("Never enter login credentials on websites reached via unprompted links.")
        elif verdict == "LOW_RISK":
            recommendations.append("No active malicious indicators detected in our database.")
            recommendations.append("Remember: LOW_RISK does not guarantee safety. Stay alert for unexpected requests.")
            recommendations.append("Always verify multi-factor authentication (MFA) prompts on your mobile device.")
        else:
            recommendations.append("Insufficient telemetry available to evaluate this destination.")
            recommendations.append("Submit this content for manual review by campus security administrators.")

        return recommendations


risk_engine = RiskEngine()
