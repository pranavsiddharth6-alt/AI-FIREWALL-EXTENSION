from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from app.services.llm_engine import analyze_ambiguous_action_with_llm


class ActionRequest(BaseModel):
    action_type: str = Field(..., description="Type of action attempted by AI agent")
    website: str = Field(..., description="Target website domain or URL")
    amount: Optional[float] = Field(None, description="Monetary amount involved, if applicable")
    details: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context parameters")


class RiskAssessment(BaseModel):
    risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, or CRITICAL")
    decision: str = Field(..., description="ALLOW, REVIEW, or BLOCK")
    reason: str = Field(..., description="Explanation for the risk assessment")
    action_type: str
    website: str
    amount: Optional[float] = None


# Rule mapping table for deterministic evaluation
RISK_RULES: Dict[str, Dict[str, str]] = {
    "search": {
        "risk_level": "LOW",
        "decision": "ALLOW",
        "reason": "Informational search action with negligible security impact.",
    },
    "open_page": {
        "risk_level": "LOW",
        "decision": "ALLOW",
        "reason": "Standard webpage navigation.",
    },
    "fill_personal_info": {
        "risk_level": "MEDIUM",
        "decision": "REVIEW",
        "reason": "Form submission containing sensitive personal information.",
    },
    "upload_file": {
        "risk_level": "MEDIUM",
        "decision": "REVIEW",
        "reason": "File upload action detected.",
    },
    "send_email": {
        "risk_level": "HIGH",
        "decision": "REVIEW",
        "reason": "Outbound communication action.",
    },
    "purchase": {
        "risk_level": "HIGH",
        "decision": "REVIEW",
        "reason": "This action creates a financial commitment.",
    },
    "delete_file": {
        "risk_level": "CRITICAL",
        "decision": "BLOCK",
        "reason": "Destructive file removal action detected.",
    },
    "money_transfer": {
        "risk_level": "CRITICAL",
        "decision": "BLOCK",
        "reason": "Direct monetary transfer detected.",
    },
}


def evaluate_action_risk(request: ActionRequest) -> RiskAssessment:
    """Evaluates the risk level and decision for an incoming AI action request.
    Uses Rule Engine first. If action is ambiguous, delegates to LLM Engine.
    """
    action_key = request.action_type.lower().strip()

    if action_key in RISK_RULES:
        rule = RISK_RULES[action_key]
        risk_level = rule["risk_level"]
        decision = rule["decision"]
        reason = rule["reason"]
    else:
        # Action is ambiguous: Invoke LLM analysis if configured
        llm_result = analyze_ambiguous_action_with_llm(
            action_type=request.action_type,
            website=request.website,
            amount=request.amount,
            details=request.details,
        )
        if llm_result:
            risk_level = llm_result.risk_level
            decision = llm_result.decision
            reason = f"[AI Evaluation] {llm_result.reason}"
        else:
            # Safe fallback rule when LLM is unavailable or unconfigured
            risk_level = "MEDIUM"
            decision = "REVIEW"
            reason = f"Unrecognized action type '{request.action_type}' requires human review."

    return RiskAssessment(
        risk_level=risk_level,
        decision=decision,
        reason=reason,
        action_type=request.action_type,
        website=request.website,
        amount=request.amount,
    )
