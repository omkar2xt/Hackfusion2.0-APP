import re
from typing import Dict, Any
from app.services.url_analyzer import url_analyzer
from app.services.message_analyzer import message_analyzer
from app.services.risk_engine import risk_engine


class QrAnalyzer:
    URL_PATTERN = re.compile(r"^(https?://|www\.)", re.IGNORECASE)

    def analyze(self, decoded_content: str) -> Dict[str, Any]:
        content = decoded_content.strip()

        lower_content = content.lower()
        if lower_content.startswith(("javascript:", "data:", "file:", "vbscript:")):
            indicators = [
                f"Suspicious executable scheme '{lower_content.split(':')[0]}:' embedded directly in QR code",
                "Direct code execution attempt detected"
            ]
            verdict = "MALICIOUS"
            risk_level = "Critical Threat"
            risk_score = 95
            recommendations = risk_engine.generate_recommendations(verdict, indicators)

            return {
                "verdict": verdict,
                "risk_level": risk_level,
                "risk_score": risk_score,
                "indicators": indicators,
                "recommendations": recommendations,
                "input_type": "qr",
                "input_value": content,
            }

        if self.URL_PATTERN.match(content) or "." in content and not " " in content:
            analysis = url_analyzer.analyze(content)
            analysis["input_type"] = "qr"
            return analysis

        analysis = message_analyzer.analyze(content)
        analysis["input_type"] = "qr"
        return analysis


qr_analyzer = QrAnalyzer()
