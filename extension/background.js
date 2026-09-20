/**
 * AI Decision Firewall — Background Service Worker (Manifest V3)
 *
 * Handles background API communication between content scripts and the FastAPI backend.
 */

// Import configuration
importScripts("config.js");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "ANALYZE_ACTION") {
    const targetUrl = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL)
      ? `${CONFIG.API_BASE_URL}/analyze-action`
      : "http://127.0.0.1:8000/analyze-action";

    fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request.payload),
    })
      .then(async (response) => {
        if (!response.ok) {
          let detail = `HTTP ${response.status}`;
          try {
            const errJson = await response.json();
            if (errJson.detail) detail = errJson.detail;
          } catch (_) {}
          sendResponse({ success: false, error: detail });
        } else {
          const data = await response.json();
          sendResponse({ success: true, data: data });
        }
      })
      .catch((err) => {
        sendResponse({
          success: false,
          error: `Backend unreachable: ${err.message}`,
        });
      });

    // Return true to indicate asynchronous response handler
    return true;
  }
});
