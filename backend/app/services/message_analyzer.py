import re
from typing import Dict, Any, List
from app.services.url_analyzer import url_analyzer
from app.services.risk_engine import risk_engine


class MessageAnalyzer:
    URGENCY_PATTERNS = [
        (r"\b(urgent|immediately|immediate action|within 24 hours|account will be (closed|terminated|suspended|disabled))\b", "Extreme urgency / threat of impending account closure"),
        (r"\b(final notice|last warning|unauthorized access detected|security alert)\b", "Manufactured panic / artificial threat notification"),
        (r"\b(act now|time sensitive|expires today|do not delay)\b", "High pressure call-to-action designed to bypass critical thinking"),
    ]

    CREDENTIAL_PATTERNS = [
        (r"\b(confirm your (password|credentials|login|pin)|verify your account|update your password)\b", "Explicit request for sensitive account credentials"),
        (r"\b(click (here|the link below) to (restore|unlock|keep) your access)\b", "Direct link prompting credential re-authentication"),
        (r"\b(two-factor|2fa|otp|verification code)\b", "Targeting multi-factor authentication tokens / one-time passwords"),
    ]

    IMPERSONATION_PATTERNS = [
        (r"\b(campus it|it helpdesk|university administrator|system admin|dean of students|provost office)\b", "Impersonating campus administration or IT support authority"),
        (r"\b(human resources|hr department|payroll|bursar office|financial aid office)\b", "Impersonating institutional finance or HR departments"),
    ]

    PAYMENT_FRAUD_PATTERNS = [
        (r"\b(gift card|apple gift card|itunes card|google play card|steam card)\b", "Solicitation of gift cards (classic financial fraud signature)"),
        (r"\b(wire transfer|crypto|bitcoin|cashapp|venmo|zelle)\b", "Untraceable payment method request"),
        (r"\b(overdue tuition payment|immediate refund|unclaimed bursary)\b", "Tuition or refund baiting targeting college students"),
    ]

    URL_REGEX = re.compile(r"https?://[^\s<>\"']+|www\.[^\s<>\"']+", re.IGNORECASE)

    def analyze(self, text: str) -> Dict[str, Any]:
        indicators: List[str] = []
        score: int = 0
        text_lower = text.lower()

        extracted_urls = self.URL_REGEX.findall(text)
        if extracted_urls:
            indicators.append(f"Contains {len(extracted_urls)} embedded link(s): {', '.join(extracted_urls[:2])}")
            score += 15

            first_url = extracted_urls[0]
            url_result = url_analyzer.analyze(first_url)
            if url_result["verdict"] in ("MALICIOUS", "SUSPICIOUS"):
                indicators.append(f"Embedded link analysis result: {url_result['verdict']} ({', '.join(url_result['indicators'][:2])})")
                score += (url_result["risk_score"] // 2)

        for pattern, label in self.URGENCY_PATTERNS:
            if re.search(pattern, text_lower):
                indicators.append(label)
                score += 25
                break

        for pattern, label in self.CREDENTIAL_PATTERNS:
            if re.search(pattern, text_lower):
                indicators.append(label)
                score += 35
                break

        for pattern, label in self.IMPERSONATION_PATTERNS:
            if re.search(pattern, text_lower):
                indicators.append(label)
                score += 25
                break

        for pattern, label in self.PAYMENT_FRAUD_PATTERNS:
            if re.search(pattern, text_lower):
                indicators.append(label)
                score += 40
                break

        score = min(max(score, 0), 100)

        verdict, risk_level = risk_engine.calculate_verdict(
            score=score,
            is_confirmed_malicious=(score >= 80),
            has_critical_indicators=(score >= 60)
        )

        recommendations = risk_engine.generate_recommendations(verdict, indicators)

        return {
            "verdict": verdict,
            "risk_level": risk_level,
            "risk_score": score,
            "indicators": indicators,
            "recommendations": recommendations,
            "input_type": "message",
            "input_value": text,
        }


message_analyzer = MessageAnalyzer()
