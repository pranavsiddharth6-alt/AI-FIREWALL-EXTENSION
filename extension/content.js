/**
 * AI Decision Firewall — Content Script (Manifest V3)
 *
 * Detects real browser actions (form submit, file upload, sensitive inputs, purchase clicks),
 * sends sanitized payloads to the background service worker, and renders the approval modal overlay.
 */

(function () {
  // Prevent duplicate injection
  if (window.__aidf_injected) return;
  window.__aidf_injected = true;

  // Track actions allowed for one-time execution by user decision
  const allowedActionsOnce = new WeakSet();

  // Keyword matchers
  const PURCHASE_KEYWORDS = ["buy", "purchase", "checkout", "pay", "place order", "order now", "subscribe"];
  const SENSITIVE_KEYWORDS = ["password", "ssn", "social security", "credit card", "cvv", "card number", "secret"];

  // Helper: Sanitize & Extract host
  function getHostname() {
    return window.location.hostname || "unknown-website";
  }

  // Helper: Check if element or form contains purchase keywords
  function isPurchaseAction(element, form) {
    const textContent = (element ? element.textContent : "") + " " + (form ? form.textContent : "");
    const lowerText = textContent.toLowerCase();
    return PURCHASE_KEYWORDS.some((kw) => lowerText.includes(kw));
  }

  // Helper: Check if form contains sensitive input fields
  function hasSensitiveInputs(form) {
    if (!form) return false;
    const pwdInputs = form.querySelectorAll("input[type='password']");
    if (pwdInputs.length > 0) return true;

    const inputs = form.querySelectorAll("input");
    for (const input of inputs) {
      const nameAttr = (input.name || "") + " " + (input.id || "") + " " + (input.autocomplete || "");
      if (SENSITIVE_KEYWORDS.some((kw) => nameAttr.toLowerCase().includes(kw))) {
        return true;
      }
    }
    return false;
  }

  // ===== Event Listeners =====

  // 1. Form Submission Detection
  document.addEventListener(
    "submit",
    function (event) {
      const form = event.target;
      if (!form || allowedActionsOnce.has(form)) {
        return; // User explicitly approved this specific form submit
      }

      let actionType = "form_submit";
      if (isPurchaseAction(null, form)) {
        actionType = "purchase";
      } else if (hasSensitiveInputs(form)) {
        actionType = "fill_personal_info";
      }

      // PRIVACY: Only send non-sensitive metadata (no password values or form text)
      const payload = {
        action_type: actionType,
        website: getHostname(),
        amount: null,
        details: {
          form_action: form.action ? new URL(form.action, window.location.href).pathname : "",
          field_count: form.elements ? form.elements.length : 0,
        },
      };

      // Pause submission until evaluated
      event.preventDefault();
      event.stopPropagation();

      evaluateAndHandleAction(payload, () => {
        allowedActionsOnce.add(form);
        form.submit(); // Resume submission
      });
    },
    true
  );

  // 2. File Upload Detection
  document.addEventListener(
    "change",
    function (event) {
      const target = event.target;
      if (target && target.tagName === "INPUT" && target.type === "file") {
        if (!target.files || target.files.length === 0) return;

        const filesInfo = Array.from(target.files).map((f) => ({
          name: f.name,
          size_bytes: f.size,
          type: f.type,
        }));

        const payload = {
          action_type: "upload_file",
          website: getHostname(),
          amount: null,
          details: {
            file_count: filesInfo.length,
            file_names: filesInfo.map((f) => f.name),
          },
        };

        evaluateAndHandleAction(payload, null);
      }
    },
    true
  );

  // 3. Purchase Button Click Detection
  document.addEventListener(
    "click",
    function (event) {
      const target = event.target.closest("button, a, input[type='submit'], input[type='button']");
      if (!target || allowedActionsOnce.has(target)) return;

      const btnText = target.textContent || target.value || "";
      const isPurchase = PURCHASE_KEYWORDS.some((kw) => btnText.toLowerCase().includes(kw));

      if (isPurchase) {
        // Pause click
        event.preventDefault();
        event.stopPropagation();

        const payload = {
          action_type: "purchase",
          website: getHostname(),
          amount: null,
          details: {
            button_label: btnText.trim().substring(0, 40),
          },
        };

        evaluateAndHandleAction(payload, () => {
          allowedActionsOnce.add(target);
          target.click(); // Resume click
        });
      }
    },
    true
  );

  // ===== Evaluation & Overlay Handler =====

  function evaluateAndHandleAction(payload, resumeCallback) {
    chrome.runtime.sendMessage(
      { type: "ANALYZE_ACTION", payload: payload },
      (response) => {
        if (!response || !response.success) {
          console.warn("[AIDF] Evaluation error or backend unreachable:", response ? response.error : "No response");
          // If backend error occurs, show graceful toast warning
          showToast(`Firewall Alert: ${response ? response.error : 'Backend unreachable'}`);
          return;
        }

        const data = response.data;
        const decision = data.decision ? data.decision.toUpperCase() : "REVIEW";
        const riskLevel = data.risk_level ? data.risk_level.toUpperCase() : "MEDIUM";

        if (decision === "ALLOW" && riskLevel === "LOW") {
          if (resumeCallback) resumeCallback();
        } else if (decision === "BLOCK") {
          showToast(`🚫 ACTION BLOCKED by AI Firewall: ${data.reason}`);
        } else {
          // REVIEW or HIGH/CRITICAL risk -> Show Approval Modal Overlay (TASK 3)
          showApprovalModal(data, resumeCallback);
        }
      }
    );
  }

  // ===== UI Modal Overlay =====

  function showApprovalModal(assessment, resumeCallback) {
    // Remove any existing overlay
    const existing = document.getElementById("aidf-overlay-root");
    if (existing) existing.remove();

    const backdrop = document.createElement("div");
    backdrop.id = "aidf-overlay-root";
    backdrop.className = "aidf-overlay-backdrop";

    const badgeClass = getBadgeClass(assessment.risk_level);

    backdrop.innerHTML = `
      <div class="aidf-modal-card">
        <div class="aidf-modal-header">
          <span class="aidf-modal-icon">⚠️</span>
          <h2 class="aidf-modal-title">HIGH RISK ACTION</h2>
        </div>
        <div class="aidf-modal-body">
          <div class="aidf-info-row">
            <span class="aidf-info-label">Action</span>
            <span class="aidf-info-value">${escapeHtml(assessment.action_type || "Form Action")}</span>
          </div>
          <div class="aidf-info-row">
            <span class="aidf-info-label">Website</span>
            <span class="aidf-info-value">${escapeHtml(assessment.website || getHostname())}</span>
          </div>
          <div class="aidf-info-row">
            <span class="aidf-info-label">Risk Level</span>
            <span class="aidf-badge ${badgeClass}">${escapeHtml(assessment.risk_level || "HIGH")}</span>
          </div>
          <div class="aidf-reason-box">
            <div class="aidf-reason-label">Reason</div>
            <div class="aidf-reason-text">${escapeHtml(assessment.reason || "High risk action requires explicit user confirmation.")}</div>
          </div>
        </div>
        <div class="aidf-modal-actions">
          <button id="aidf-btn-block" class="aidf-btn aidf-btn-block">BLOCK</button>
          <button id="aidf-btn-review" class="aidf-btn aidf-btn-review">REVIEW</button>
          <button id="aidf-btn-allow" class="aidf-btn aidf-btn-allow">ALLOW ONCE</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Button Click Listeners
    document.getElementById("aidf-btn-block").addEventListener("click", () => {
      backdrop.remove();
      showToast("🚫 Action blocked by user.");
    });

    document.getElementById("aidf-btn-review").addEventListener("click", () => {
      showToast("ℹ️ Action placed under review.");
    });

    document.getElementById("aidf-btn-allow").addEventListener("click", () => {
      backdrop.remove();
      showToast("✅ Action allowed for this instance.");
      if (resumeCallback) resumeCallback();
    });
  }

  // Toast Notification
  function showToast(message) {
    const existing = document.getElementById("aidf-toast-root");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "aidf-toast-root";
    toast.className = "aidf-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 4000);
  }

  function getBadgeClass(riskLevel) {
    const lvl = (riskLevel || "").toUpperCase();
    if (lvl === "LOW") return "aidf-badge-low";
    if (lvl === "MEDIUM") return "aidf-badge-medium";
    if (lvl === "HIGH") return "aidf-badge-high";
    if (lvl === "CRITICAL") return "aidf-badge-critical";
    return "aidf-badge-medium";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
