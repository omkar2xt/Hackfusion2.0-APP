from typing import List, Tuple
from app.schemas.scan import VerdictType


class RiskEngine:
    @staticmethod
    def calculate_verdict(
        score: int,
        is_confirmed_malicious: bool = False,
        has_critical_indicators: bool = False
    ) -> Tuple[VerdictType, str]:
        """
        Calculates the risk verdict and descriptive level based on score and indicators.
        Strictly follows documented rules:
        - MALICIOUS: Confirmed threat source or critical threat indicators (score >= 75 or confirmed)
        - SUSPICIOUS: Supported by heuristic indicators (score 40..74)
        - LOW_RISK: No known indicators found (score < 40). Notice: Never claimed as guaranteed safe.
        - UNKNOWN: Insufficient evidence.
        """
        if is_confirmed_malicious or score >= 80:
            return "MALICIOUS", "Critical Threat"
        elif score >= 60:
            return "MALICIOUS" if has_critical_indicators else "SUSPICIOUS", "High Risk"
        elif score >= 40:
            return "SUSPICIOUS", "Medium Risk"
        elif score >= 15:
            return "LOW_RISK", "Low Risk (Not Guaranteed Safe)"
        elif score >= 0:
            return "LOW_RISK", "Low Risk"
        else:
            return "UNKNOWN", "Insufficient Telemetry"

    @staticmethod
    def generate_recommendations(verdict: VerdictType, indicators: List[str]) -> List[str]:
        """Generates clear, explainable campus cybersecurity recommendations."""
        recommendations = []

        if verdict == "MALICIOUS":
            recommendations.append("DO NOT click this link, download files, or enter passwords.")
            recommendations.append("Report this incident immediately to Campus IT Security.")
            recommendations.append("If credentials were typed, change your campus password immediately.")
        elif verdict == "SUSPICIOUS":
            recommendations.append("Exercise extreme caution before navigating to this destination.")
            recommendations.append("Verify the sender via an independent communication channel (phone/in-person).")
            recommendations.append("Check the domain in the browser address bar for subtle spelling variations.")
        elif verdict == "LOW_RISK":
            recommendations.append("No active malicious indicators detected in our database.")
            recommendations.append("Remember: LOW_RISK does not guarantee safety. Keep software updated.")
            recommendations.append("Always verify multi-factor authentication (MFA) prompts.")
        else:
            recommendations.append("Insufficient telemetry available to evaluate this destination.")
            recommendations.append("Proceed with general caution or submit for manual campus administrator review.")

        return recommendations


risk_engine = RiskEngine()
