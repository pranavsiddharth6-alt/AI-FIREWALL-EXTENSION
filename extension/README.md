# AI Decision Firewall — Chrome Extension

A minimal Chrome Extension (Manifest V3) that connects to the local FastAPI Decision Firewall backend to analyze and assess the risk of AI agent actions in real-time.

## 📋 Prerequisites

- **Google Chrome** (version 88 or later — Manifest V3 support)
- **FastAPI backend running** at `http://127.0.0.1:8000`
  - Navigate to `D:\AI FOREWALL\backend`
  - Activate the virtual environment: `venv\Scripts\activate`
  - Start the server: `uvicorn app.main:app --reload`

## 🚀 How to Load the Extension in Chrome

1. Open **Google Chrome**
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **"Load unpacked"**
5. Select the `extension/` folder:
   ```
   D:\AI FOREWALL\extension
   ```
6. The extension icon (🛡️ with a default Chrome icon) will appear in your toolbar

> **Tip:** If the icon doesn't appear in the toolbar, click the puzzle piece icon (Extensions) and pin "AI Decision Firewall".

## 🧪 How to Test

### Step 1: Make sure the backend is running

Open a terminal and verify:
```
curl http://127.0.0.1:8000/
```
Expected response:
```json
{"status": "online", "service": "AI Decision Firewall Backend", "version": "1.0.0"}
```

### Step 2: Click the extension icon in Chrome

A popup will appear with input fields.

### Step 3: Test a purchase action

Fill in:
- **Action Type**: Purchase
- **Website**: example.com
- **Amount**: 47999
- **Details**: Laptop

Click **"🔍 Analyze Action"**

### Expected Result:
| Field       | Value                                      |
|-------------|--------------------------------------------|
| Risk Level  | **HIGH** (red badge)                       |
| Decision    | **REVIEW** (amber badge)                   |
| Reason      | This action creates a financial commitment |

### Step 4: Test other action types

| Action Type        | Expected Risk | Expected Decision |
|--------------------|---------------|-------------------|
| search             | LOW           | ALLOW             |
| open_page          | LOW           | ALLOW             |
| fill_personal_info | MEDIUM        | REVIEW            |
| upload_file        | MEDIUM        | REVIEW            |
| send_email         | HIGH          | REVIEW            |
| purchase           | HIGH          | REVIEW            |
| delete_file        | CRITICAL      | BLOCK             |
| money_transfer     | CRITICAL      | BLOCK             |

### Step 5: Test error handling

- **Backend offline**: Stop the FastAPI server, then click Analyze. You should see:
  `"Cannot reach the backend server. Make sure FastAPI is running at http://127.0.0.1:8000"`
- **Empty fields**: Leave required fields empty — the form won't submit.

## 📁 Files

```
extension/
├── manifest.json   — Chrome Extension Manifest V3 configuration
├── popup.html      — Popup UI layout
├── popup.css       — Dark-themed professional styling
├── popup.js        — Logic: form handling, API calls, result display
└── README.md       — This file
```

## 🔗 How It Works

1. User clicks the extension icon → `popup.html` opens
2. User fills in action details and clicks "Analyze Action"
3. `popup.js` sends a `POST` request to `http://127.0.0.1:8000/analyze-action`
4. Request payload:
   ```json
   {
     "action_type": "purchase",
     "website": "example.com",
     "amount": 47999,
     "details": { "item": "Laptop" }
   }
   ```
5. FastAPI backend evaluates the action against its risk rules
6. Response is displayed with color-coded badges for risk level and decision

## ⚠️ Notes

- **LOCAL ONLY** — This extension connects to `127.0.0.1:8000` only.
- No API keys, secrets, or external services are used.
- No React, Node.js, or build tools required.
- No Supabase or Render integration in this phase.
- The old WXT-based extension has been backed up to `extension_wxt_backup/`.
