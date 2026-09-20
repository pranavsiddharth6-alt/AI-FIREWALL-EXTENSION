/**
 * AI Decision Firewall — Hackathon Extension Popup Script
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Elements
  const protectionStatusEl = document.getElementById("protectionStatus");
  const killSwitchBtn = document.getElementById("killSwitchBtn");

  const statTodayEl = document.getElementById("statToday");
  const statAllowedEl = document.getElementById("statAllowed");
  const statReviewedEl = document.getElementById("statReviewed");
  const statBlockedEl = document.getElementById("statBlocked");

  // Tabs
  const tabActivity = document.getElementById("tabActivity");
  const tabDemo = document.getElementById("tabDemo");
  const tabSettings = document.getElementById("tabSettings");

  const viewActivity = document.getElementById("viewActivity");
  const viewDemo = document.getElementById("viewDemo");
  const viewSettings = document.getElementById("viewSettings");

  const activityLogsList = document.getElementById("activityLogsList");
  const refreshLogsBtn = document.getElementById("refreshLogsBtn");

  // Demo buttons
  const demoScenarioHigh = document.getElementById("demoScenarioHigh");
  const demoScenarioLow = document.getElementById("demoScenarioLow");
  const demoScenarioCritical = document.getElementById("demoScenarioCritical");
  const demoScenarioLLM = document.getElementById("demoScenarioLLM");

  const resultArea = document.getElementById("resultArea");
  const errorArea = document.getElementById("errorArea");
  const errorMessage = document.getElementById("errorMessage");
  const backendHostEl = document.getElementById("backendHost");

  // Settings
  const policyModeEl = document.getElementById("policyMode");
  const backendTargetEl = document.getElementById("backendTarget");

  // Base API configuration
  let currentBaseUrl = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL)
    ? CONFIG.API_BASE_URL
    : "https://ai-firewall-extension.onrender.com";

  if (backendHostEl) backendHostEl.textContent = currentBaseUrl;

  // ===== Load State =====
  let isProtectionActive = true;
  let stats = { today: 0, allowed: 0, reviewed: 0, blocked: 0 };

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["protectionActive", "firewallStats", "backendTarget"], (res) => {
      if (res.protectionActive !== undefined) {
        isProtectionActive = res.protectionActive;
      }
      if (res.firewallStats) {
        stats = res.firewallStats;
      }
      if (res.backendTarget) {
        backendTargetEl.value = res.backendTarget;
        if (res.backendTarget === "local") {
          currentBaseUrl = "http://127.0.0.1:8000";
        } else {
          currentBaseUrl = "https://ai-firewall-extension.onrender.com";
        }
        if (backendHostEl) backendHostEl.textContent = currentBaseUrl;
      }
      updateUIState();
    });
  } else {
    updateUIState();
  }

  function updateUIState() {
    // Protection badge
    if (isProtectionActive) {
      protectionStatusEl.className = "status-badge status-active";
      protectionStatusEl.innerHTML = '<span class="status-dot">●</span> ACTIVE';
      killSwitchBtn.className = "btn-killswitch";
      killSwitchBtn.textContent = "🛑 STOP AI";
    } else {
      protectionStatusEl.className = "status-badge status-killed";
      protectionStatusEl.innerHTML = '<span class="status-dot">●</span> PAUSED';
      killSwitchBtn.className = "btn-killswitch active-killed";
      killSwitchBtn.textContent = "▶ START AI";
    }

    // Counters
    statTodayEl.textContent = stats.today;
    statAllowedEl.textContent = stats.allowed;
    statReviewedEl.textContent = stats.reviewed;
    statBlockedEl.textContent = stats.blocked;
  }

  // ===== Kill Switch =====
  killSwitchBtn.addEventListener("click", () => {
    if (isProtectionActive) {
      if (confirm("🛑 Are you sure you want to activate the EMERGENCY KILL SWITCH?\n\nThis will temporarily pause AI Decision Firewall protection.")) {
        isProtectionActive = false;
      }
    } else {
      isProtectionActive = true;
    }
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ protectionActive: isProtectionActive });
    }
    updateUIState();
  });

  // ===== Tab Switching =====
  function switchTab(activeTab, activeView) {
    [tabActivity, tabDemo, tabSettings].forEach((t) => t.classList.remove("active"));
    [viewActivity, viewDemo, viewSettings].forEach((v) => v.classList.add("hidden"));

    activeTab.classList.add("active");
    activeView.classList.remove("hidden");
  }

  tabActivity.addEventListener("click", () => {
    switchTab(tabActivity, viewActivity);
    loadActivityLogs();
  });
  tabDemo.addEventListener("click", () => switchTab(tabDemo, viewDemo));
  tabSettings.addEventListener("click", () => switchTab(tabSettings, viewSettings));

  // Settings Target Change
  backendTargetEl.addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "local") {
      currentBaseUrl = "http://127.0.0.1:8000";
    } else {
      currentBaseUrl = "https://ai-firewall-extension.onrender.com";
    }
    if (backendHostEl) backendHostEl.textContent = currentBaseUrl;
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ backendTarget: val });
    }
    loadActivityLogs();
  });

  // ===== Activity Logs Handler =====
  async function loadActivityLogs() {
    activityLogsList.innerHTML = '<div class="logs-loading">Fetching logs from Supabase...</div>';
    try {
      const resp = await fetch(`${currentBaseUrl}/activity-logs?limit=15`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const logs = await resp.json();

      if (!logs || logs.length === 0) {
        activityLogsList.innerHTML = '<div class="logs-loading">No audit logs recorded yet.</div>';
        return;
      }

      // Update stats based on logs
      stats.today = logs.length;
      stats.allowed = logs.filter((l) => l.decision === "ALLOW").length;
      stats.reviewed = logs.filter((l) => l.decision === "REVIEW").length;
      stats.blocked = logs.filter((l) => l.decision === "BLOCK").length;
      updateUIState();

      // Render items
      activityLogsList.innerHTML = "";
      logs.forEach((log) => {
        const item = document.createElement("div");
        item.className = "log-item";
        
        const dateStr = log.created_at
          ? new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Just now";

        item.innerHTML = `
          <div class="log-left">
            <span class="log-action">${escapeHtml(log.action_type || "action")}</span>
            <span class="log-site">${escapeHtml(log.website || "unknown")} ${log.amount ? '· ₹' + Number(log.amount).toLocaleString('en-IN') : ''}</span>
            <span class="log-time">${dateStr}</span>
          </div>
          <div class="log-right">
            <span class="badge ${getBadgeClass(log.risk_level)}">${escapeHtml(log.risk_level || "MID")}</span>
            <span class="badge ${getBadgeClass(log.decision)}">${escapeHtml(log.decision || "ALLOW")}</span>
          </div>
        `;
        activityLogsList.appendChild(item);
      });
    } catch (err) {
      activityLogsList.innerHTML = `<div class="logs-loading" style="color:var(--color-critical);">Failed to load logs: ${err.message}</div>`;
    }
  }

  refreshLogsBtn.addEventListener("click", loadActivityLogs);

  // ===== Demo Scenario Handlers =====
  async function runDemoScenario(payload) {
    hideError();
    hideResult();

    try {
      const resp = await fetch(`${currentBaseUrl}/analyze-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        let errTxt = `HTTP ${resp.status}`;
        try {
          const eJson = await resp.json();
          if (eJson.detail) errTxt = eJson.detail;
        } catch (_) {}
        showError(errTxt);
        return;
      }

      const data = await resp.json();
      showResult(data);

      // Increment counters
      stats.today++;
      if (data.decision === "ALLOW") stats.allowed++;
      if (data.decision === "REVIEW") stats.reviewed++;
      if (data.decision === "BLOCK") stats.blocked++;
      updateUIState();

    } catch (err) {
      showError(`Demo scenario error: ${err.message}`);
    }
  }

  demoScenarioHigh.addEventListener("click", () => {
    runDemoScenario({
      action_type: "purchase",
      website: "example.com",
      amount: 47999,
      details: { item: "High-end Gaming Laptop" },
    });
  });

  demoScenarioLow.addEventListener("click", () => {
    runDemoScenario({
      action_type: "search",
      website: "google.com",
      details: { query: "FastAPI security best practices" },
    });
  });

  demoScenarioCritical.addEventListener("click", () => {
    runDemoScenario({
      action_type: "delete_file",
      website: "cloud.com",
      details: { filename: "production_database_backup.sql" },
    });
  });

  demoScenarioLLM.addEventListener("click", () => {
    runDemoScenario({
      action_type: "execute_custom_pipeline_script",
      website: "internal.dashboard.io",
      details: { action: "Modify database schema and grant permissions" },
    });
  });

  // Display Functions
  function showResult(data) {
    hideError();
    document.getElementById("riskLevel").textContent = data.risk_level || "—";
    document.getElementById("riskLevel").className = "result-value badge " + getBadgeClass(data.risk_level);

    document.getElementById("decision").textContent = data.decision || "—";
    document.getElementById("decision").className = "result-value badge " + getBadgeClass(data.decision);

    document.getElementById("resultAction").textContent = data.action_type || "—";
    document.getElementById("resultWebsite").textContent = data.website || "—";
    document.getElementById("resultAmount").textContent = data.amount != null ? `₹${Number(data.amount).toLocaleString("en-IN")}` : "—";
    document.getElementById("reason").textContent = data.reason || "No reason provided.";

    resultArea.classList.remove("hidden");
  }

  function showError(msg) {
    hideResult();
    errorMessage.textContent = msg;
    errorArea.classList.remove("hidden");
  }

  function hideResult() { resultArea.classList.add("hidden"); }
  function hideError() { errorArea.classList.add("hidden"); }

  function getBadgeClass(val) {
    if (!val) return "";
    const norm = val.toUpperCase();
    if (norm === "LOW" || norm === "ALLOW") return "badge-low";
    if (norm === "MEDIUM" || norm === "REVIEW") return "badge-medium";
    if (norm === "HIGH") return "badge-high";
    if (norm === "CRITICAL" || norm === "BLOCK") return "badge-critical";
    return "";
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Load initial activity logs
  loadActivityLogs();
});
