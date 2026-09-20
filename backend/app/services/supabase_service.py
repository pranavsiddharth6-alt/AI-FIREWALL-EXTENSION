import os
import logging
from typing import Optional, Dict, Any
from supabase import create_client, Client

logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    """Initializes and returns the Supabase client using environment variables.

    Raises:
        ValueError: If environment variables are missing or default placeholders.
        RuntimeError: If initialization fails.
    """
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    # Normalize Supabase base URL if REST endpoint was provided
    if url.endswith("/rest/v1/"):
        url = url[:-9]
    elif url.endswith("/rest/v1"):
        url = url[:-8]
    url = url.rstrip("/")

    if not url or not key or "your_supabase_url" in url or "your_service_role_key" in key:
        raise ValueError("Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing or set to placeholders.")


    try:
        return create_client(url, key)
    except Exception as e:
        # Sanitize credentials from logs
        sanitized_msg = str(e)
        if url:
            sanitized_msg = sanitized_msg.replace(url, "[SUPABASE_URL]")
        if key:
            sanitized_msg = sanitized_msg.replace(key, "[SUPABASE_SERVICE_ROLE_KEY]")
        logger.error(f"Failed to initialize Supabase client: {sanitized_msg}")
        raise RuntimeError("Could not connect to Supabase database.") from None


def save_action_log(
    action_type: str,
    website: str,
    amount: Optional[float],
    risk_level: str,
    decision: str,
    reason: str,
) -> Dict[str, Any]:
    """Saves an evaluated action record into the action_logs table in Supabase.

    Returns:
        Dict[str, Any]: The inserted record data from Supabase.
    """
    client = get_supabase_client()

    log_data = {
        "action_type": action_type,
        "website": website,
        "amount": amount,
        "risk_level": risk_level,
        "decision": decision,
        "reason": reason,
    }

    try:
        response = client.table("action_logs").insert(log_data).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return log_data
    except Exception as e:
        # Sanitize credentials from error message
        error_str = str(e)
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        if url:
            error_str = error_str.replace(url, "[SUPABASE_URL]")
        if key:
            error_str = error_str.replace(key, "[SUPABASE_SERVICE_ROLE_KEY]")

        logger.error(f"Supabase write error: {error_str}")
        raise RuntimeError(f"Database insertion failed: {error_str}") from None
