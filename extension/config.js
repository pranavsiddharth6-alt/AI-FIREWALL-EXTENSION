/**
 * AI Decision Firewall — Extension Configuration
 *
 * Configuration file for API backend endpoint.
 *
 * To connect to your live Render backend deployment:
 * Set API_BASE_URL to your Render service URL (e.g. "https://ai-decision-firewall.onrender.com").
 *
 * For local development:
 * Keep API_BASE_URL as "http://127.0.0.1:8000".
 */

const CONFIG = {
  // Base URL of the FastAPI backend service
  API_BASE_URL: "http://127.0.0.1:8000",
};

// Full API endpoint for analyzing actions
const API_URL = `${CONFIG.API_BASE_URL}/analyze-action`;
