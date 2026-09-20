/**
 * AI Decision Firewall — Chrome Extension Popup Script
 *
 * Sends action analysis requests to the FastAPI backend
 * and displays the risk assessment result.
 */

// Use API_URL from config.js (fallback to CONFIG.API_BASE_URL if needed)
const targetApiUrl = (typeof API_URL !== "undefined") ? API_URL : `${CONFIG.API_BASE_URL}/analyze-action`;

// ===== DOM Element References =====
const analyzeForm = document.getElementById("analyzeForm");
const analyzeBtn = document.getElementById("analyzeBtn");
const btnText = document.getElementById("btnText");
const btnLoader = document.getElementById("btnLoader");
const resultArea = document.getElementById("resultArea");
const errorArea = document.getElementById("errorArea");
const errorMessage = document.getElementById("errorMessage");
const backendHostEl = document.getElementById("backendHost");

// Set footer backend URL text dynamically
if (backendHostEl && typeof CONFIG !== "undefined") {
  backendHostEl.textContent = CONFIG.API_BASE_URL;
}

// Result fields
const riskLevelEl = document.getElementById("riskLevel");
const decisionEl = document.getElementById("decision");
const resultActionEl = document.getElementById("resultAction");
const resultWebsiteEl = document.getElementById("resultWebsite");
const resultAmountEl = document.getElementById("resultAmount");
const reasonEl = document.getElementById("reason");

// ===== Form Submission Handler =====
analyzeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Gather form values
  const actionType = document.getElementById("actionType").value.trim();
  const website = document.getElementById("website").value.trim();
  const amountRaw = document.getElementById("amount").value.trim();
  const detailsRaw = document.getElementById("details").value.trim();

  // Basic client-side validation
  if (!actionType) {
    showError("Please select an action type.");
    return;
  }
  if (!website) {
    showError("Please enter a website.");
    return;
  }

  // Build the request payload
  const payload = {
    action_type: actionType,
    website: website,
  };

  // Only include amount if provided
  if (amountRaw !== "") {
    const amount = parseFloat(amountRaw);
    if (isNaN(amount) || amount < 0) {
      showError("Amount must be a valid non-negative number.");
      return;
    }
    payload.amount = amount;
  }

  // Only include details if provided
  if (detailsRaw !== "") {
    payload.details = { item: detailsRaw };
  }

  // Set loading state
  setLoading(true);
  hideResult();
  hideError();

  try {
    const response = await fetch(targetApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Try to extract error detail from backend
      let detail = `Server returned HTTP ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody.detail) {
          detail = errBody.detail;
        }
      } catch (_) {
        // Response body wasn't JSON
      }
      showError(detail);
      return;
    }

    const data = await response.json();
    showResult(data);
  } catch (err) {
    // Network error or backend unreachable
    const hostInfo = (typeof CONFIG !== "undefined") ? CONFIG.API_BASE_URL : "http://127.0.0.1:8000";
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      showError(
        "Cannot reach the backend server.\n" +
        `Make sure FastAPI is running at ${hostInfo}`
      );
    } else {
      showError(`Request failed: ${err.message}`);
    }
  } finally {
    setLoading(false);
  }
});

// ===== Display Functions =====

/**
 * Shows the risk assessment result in the popup.
 */
function showResult(data) {
  hideError();

  // Risk Level badge
  riskLevelEl.textContent = data.risk_level || "—";
  riskLevelEl.className = "result-value badge " + getBadgeClass(data.risk_level, "risk");

  // Decision badge
  decisionEl.textContent = data.decision || "—";
  decisionEl.className = "result-value badge " + getBadgeClass(data.decision, "decision");

  // Text fields
  resultActionEl.textContent = data.action_type || "—";
  resultWebsiteEl.textContent = data.website || "—";
  resultAmountEl.textContent =
    data.amount != null ? `₹${Number(data.amount).toLocaleString("en-IN")}` : "—";
  reasonEl.textContent = data.reason || "No reason provided.";

  resultArea.classList.remove("hidden");
}

/**
 * Returns the appropriate CSS badge class for a risk level or decision value.
 */
function getBadgeClass(value, type) {
  if (!value) return "";
  const normalized = value.toUpperCase();

  if (type === "risk") {
    const map = {
      LOW: "badge-low",
      MEDIUM: "badge-medium",
      HIGH: "badge-high",
      CRITICAL: "badge-critical",
    };
    return map[normalized] || "";
  }

  if (type === "decision") {
    const map = {
      ALLOW: "badge-allow",
      REVIEW: "badge-review",
      BLOCK: "badge-block",
    };
    return map[normalized] || "";
  }

  return "";
}

/**
 * Shows an error message to the user.
 */
function showError(message) {
  hideResult();
  errorMessage.textContent = message;
  errorArea.classList.remove("hidden");
}

function hideResult() {
  resultArea.classList.add("hidden");
}

function hideError() {
  errorArea.classList.add("hidden");
}

/**
 * Toggles the loading spinner on the submit button.
 */
function setLoading(isLoading) {
  analyzeBtn.disabled = isLoading;
  if (isLoading) {
    btnText.textContent = "Analyzing...";
    btnLoader.classList.remove("hidden");
  } else {
    btnText.textContent = "🔍 Analyze Action";
    btnLoader.classList.add("hidden");
  }
}
