from fastapi import APIRouter, HTTPException, status
from app.services.risk_engine import ActionRequest, RiskAssessment, evaluate_action_risk
from app.services.supabase_service import save_action_log

router = APIRouter(tags=["Action Analysis"])


@router.post(
    "/analyze-action",
    response_model=RiskAssessment,
    summary="Analyze AI Agent Action Risk",
    description="Evaluates an incoming AI action against safety rules, logs the result to Supabase database, and returns the risk assessment.",
)
async def analyze_action(payload: ActionRequest) -> RiskAssessment:
    # Step 1: Risk Engine evaluation
    try:
        assessment = evaluate_action_risk(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate action risk: {str(e)}",
        )

    # Step 2: Save to Supabase action_logs
    try:
        save_action_log(
            action_type=assessment.action_type,
            website=assessment.website,
            amount=assessment.amount,
            risk_level=assessment.risk_level,
            decision=assessment.decision,
            reason=assessment.reason,
        )
    except Exception as e:
        # Graceful error handling for database issues without exposing secrets
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Risk analysis error: {str(e)}",
        )

    # Step 3: Return result to client
    return assessment
