/**
 * AI Decision Firewall — Extension Configuration
 *
 * Production Render service URL: https://ai-firewall-extension.onrender.com
 */

const CONFIG = {
  // Base URL of the FastAPI backend service
  API_BASE_URL: "https://ai-firewall-extension.onrender.com",
};

// Full API endpoint for analyzing actions
const API_URL = `${CONFIG.API_BASE_URL}/analyze-action`;
