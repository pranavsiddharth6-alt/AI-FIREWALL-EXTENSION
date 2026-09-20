import os
import json
import logging
import urllib.request
import urllib.error
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class LLMEvaluationResult(BaseModel):
    risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, or CRITICAL")
    decision: str = Field(..., description="ALLOW, REVIEW, or BLOCK")
    reason: str = Field(..., description="Explanation for the risk assessment")


def analyze_ambiguous_action_with_llm(
    action_type: str,
    website: str,
    amount: Optional[float] = None,
    details: Optional[Dict[str, Any]] = None,
) -> Optional[LLMEvaluationResult]:
    """Analyzes ambiguous browser actions using Gemini LLM API.

    Returns:
        Optional[LLMEvaluationResult]: Validated evaluation result, or None if unconfigured/failed.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip() or os.getenv("LLM_API_KEY", "").strip()
    if not api_key:
        logger.info("LLM API key not configured in environment. Skipping LLM evaluation.")
        return None

    prompt = f"""You are an AI Safety Firewall for web browser actions.
Evaluate the security risk of this ambiguous browser action:
- Action Type: {action_type}
- Target Website: {website}
- Monetary Amount: {amount if amount is not None else 'N/A'}
- Context Details: {json.dumps(details or {})}

Classify into one of these strict categories:
- risk_level: LOW, MEDIUM, HIGH, or CRITICAL
- decision: ALLOW, REVIEW, or BLOCK
- reason: Concise clear explanation (1 sentence).

Return ONLY valid JSON with keys "risk_level", "decision", "reason"."""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json"
        }
    }).encode("utf-8")

    try:
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if not candidates:
                return None
            
            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                return None
            
            raw_text = parts[0].get("text", "").strip()
            parsed = json.loads(raw_text)

            valid_risk = str(parsed.get("risk_level", "MEDIUM")).upper()
            valid_decision = str(parsed.get("decision", "REVIEW")).upper()
            valid_reason = str(parsed.get("reason", "Ambiguous action evaluated by AI safety model."))

            if valid_risk not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
                valid_risk = "MEDIUM"
            if valid_decision not in ["ALLOW", "REVIEW", "BLOCK"]:
                valid_decision = "REVIEW"

            return LLMEvaluationResult(
                risk_level=valid_risk,
                decision=valid_decision,
                reason=valid_reason,
            )
    except Exception as e:
        logger.error(f"LLM analysis failed: {str(e)}")
        return None
