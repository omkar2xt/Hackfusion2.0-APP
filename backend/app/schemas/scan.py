from typing import List, Literal
from datetime import datetime
from pydantic import BaseModel, Field


VerdictType = Literal["MALICIOUS", "SUSPICIOUS", "LOW_RISK", "UNKNOWN"]
InputType = Literal["url", "message", "qr"]


class ScanUrlRequest(BaseModel):
    url: str = Field(..., min_length=3, max_length=2048, description="Target URL to inspect")


class ScanMessageRequest(BaseModel):
    message_text: str = Field(..., min_length=3, max_length=10000, description="SMS, email, or message body to analyze")


class ScanQrRequest(BaseModel):
    decoded_content: str = Field(..., min_length=1, max_length=4096, description="Decoded content from QR code")


class ScanResultResponse(BaseModel):
    scan_id: str
    verdict: VerdictType
    risk_level: str
    risk_score: int
    scoring_version: str = "v1.2-explainable"
    indicators: List[str]
    recommendations: List[str]
    checked_at: str
    input_type: InputType
    input_value: str

    model_config = {
        "from_attributes": True
    }

