# 🛡️ AI Decision Firewall

> **Real-Time Security & Policy Guardrail for Autonomous AI Agents and Browser Automation**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-4285F4?style=flat-square&logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Render](https://img.shields.io/badge/Deployment-Render%20Cloud-46E3B7?style=flat-square&logo=render)](https://render.com/)

---

## 1. Problem
As autonomous AI agents (e.g., AutoGPT, Web Arena agents, Computer-Use agents) gain web browsing capabilities, they can autonomously perform high-stakes browser actions—such as submitting financial transactions, transferring funds, uploading confidential files, or deleting database resources—without human oversight or security verification. 

Standard web applications lack a dedicated, external guardrail to intercept and evaluate autonomous AI actions before execution.

---

## 2. Solution
**AI Decision Firewall** is an external security layer operating between autonomous browser agents and target websites. 

By combining a **Chrome Extension (Manifest V3)**, a high-throughput **FastAPI Risk & Policy Engine**, **Supabase PostgreSQL Audit Logging**, and **Gemini LLM Analysis** for ambiguous actions, it intercepts, evaluates, and enforces real-time security policies (`ALLOW`, `REVIEW`, `BLOCK`) before consequential browser actions can proceed.

---

## 3. Key Features
* 🔍 **Real-Time Action Interception**: Intercepts form submissions, file uploads, sensitive credential entries, and purchase clicks in real time.
* ⚡ **Hybrid Risk Engine**: Evaluates known actions deterministically via rule-mapping (<5ms) and delegates ambiguous actions to Gemini LLM Engine.
* 🛑 **Emergency Kill Switch**: Prominently accessible control to instantly pause or block all AI agent browser actions.
* 📊 **Live Activity Audit Logs**: Real-time logging of all evaluated actions to Supabase PostgreSQL for compliance, auditing, and hackathon review.
* ⚠️ **Interactive Approval Overlay Modal**: Renders high-risk warning overlays on active browser tabs (`ALLOW ONCE`, `REVIEW`, `BLOCK`).
* 🔒 **Zero Trust Privacy**: Extracts only non-sensitive DOM metadata. Never captures passwords, tokens, or credit card numbers.

---

## 4. Architecture

```
                                    ┌────────────────────────────────┐
                                    │      Target Web Page DOM       │
                                    └───────────────┬────────────────┘
                                                    │
                                     (Intercepts Form Submit / Upload / Purchase Click)
                                                    │
                                                    ▼
                                    ┌────────────────────────────────┐
                                    │  Content Script (content.js)   │
                                    └───────────────┬────────────────┘
                                                    │
                                      (chrome.runtime.sendMessage)
                                                    │
                                                    ▼
                                    ┌────────────────────────────────┐
                                    │ Background Worker (bg.js)      │
                                    └───────────────┬────────────────┘
                                                    │
                                        (HTTPS POST /analyze-action)
                                                    │
                                                    ▼
                                    ┌────────────────────────────────┐
                                    │  FastAPI Backend (Render)      │
                                    └───────┬────────────────┬───────┘
                                            │                │
                        ┌───────────────────┴──┐          ┌──┴───────────────────┐
                        │ Risk & Policy Engine │          │  Gemini LLM Engine   │
                        └───────────┬──────────┘          └──────────┬───────────┘
                                    │ (Deterministic)                │ (Ambiguous)
                                    └────────────────┬───────────────┘
                                                     │
                                                     ▼
                                    ┌────────────────────────────────┐
                                    │   Supabase PostgreSQL DB       │
                                    └────────────────┬───────────────┘
                                                     │
                                                     ▼
                                    ┌────────────────────────────────┐
                                    │ Response & Approval Overlay UI │
                                    └────────────────────────────────┘
```

---

## 5. Technology Stack
* **Frontend / Extension**: Chrome Extension Manifest V3, HTML5, Vanilla CSS3 (Custom Dark Theme), JavaScript (ES6+).
* **Backend API**: Python 3.11+, FastAPI, Uvicorn ASGI server.
* **Database & Auditing**: Supabase (PostgreSQL), `supabase-py` client library.
* **AI Analysis**: Google Gemini 1.5 Flash REST API (for ambiguous action classification).
* **Deployment**: Render Cloud Web Service, GitHub Actions / Git Version Control.

---

## 6. How It Works
1. **Detection**: The Content Script listens to DOM events (`submit`, `change`, `click`) on the active tab.
2. **Sanitization**: Non-sensitive metadata (action type, domain, button label) is extracted. Passwords, tokens, and credit card numbers are stripped.
3. **Evaluation**:
   * **Rule Engine**: Evaluates known patterns (`search` → LOW/ALLOW, `purchase` → HIGH/REVIEW, `delete_file` → CRITICAL/BLOCK).
   * **LLM Fallback**: Ambiguous actions are analyzed via Gemini LLM Engine on Render.
4. **Audit Logging**: The assessment result is stored asynchronously in Supabase `public.action_logs`.
5. **Enforcement**:
   * **ALLOW**: Action proceeds naturally.
   * **BLOCK**: Action is halted immediately with a notification toast.
   * **REVIEW**: Renders the modal overlay on screen for human approval (`ALLOW ONCE`, `REVIEW`, `BLOCK`).

---

## 7. Installation & Setup

### Prerequisites
* Google Chrome (or Chromium-based browser)
* Python 3.10+
* Git

### Step 1: Clone Repository
```bash
git clone https://github.com/pranavsiddharth6-alt/AI-FIREWALL-EXTENSION.git
cd AI-FIREWALL-EXTENSION
```

### Step 2: Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in upper right corner).
3. Click **Load unpacked**.
4. Select the `extension/` folder inside this repository.

---

## 8. Local Backend Development

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env` file (refer to `.env.example`):
   ```env
   PORT=8000
   HOST=127.0.0.1
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
5. Start the local server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

## 9. Render Deployment Setup

1. Connect your GitHub repository to **[Render Dashboard](https://dashboard.render.com)**.
2. Create a **New Web Service**:
   * **Root Directory**: `backend`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add Environment Variables on Render:
   * `SUPABASE_URL`
   * `SUPABASE_SERVICE_ROLE_KEY`
   * `GEMINI_API_KEY`
   * `CORS_ORIGINS` = `*`

---

## 10. Supabase Database Setup

Run the following DDL in your **Supabase SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS public.action_logs (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    action_type TEXT NOT NULL,
    website TEXT NOT NULL,
    amount NUMERIC NULL,
    risk_level TEXT NOT NULL,
    decision TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;
```

---

## 11. Security Considerations
* **Secret Isolation**: Supabase Service Role Key and Gemini API Key reside **exclusively** on the FastAPI backend on Render.
* **No Client Credential Storage**: No secrets exist inside the Chrome Extension codebase.
* **Sanitized Payloads**: DOM values of password inputs, credit cards, and tokens are excluded from API payloads.
* **Git Safeguards**: `.gitignore` strictly excludes `.env`, credential files, and virtual environments.

---

## 12. Limitations
* **Shadow DOM & iFrames**: Actions inside isolated cross-origin iFrames or closed Shadow DOM trees require active Tab permissions.
* **Non-DOM AI Executions**: Direct background network fetches executed by headless Python agents without a browser window bypass DOM event listeners.

---

## 13. Future Improvements
* 🔑 **OAuth2 Multi-Tenant Auth**: Add user authentication for enterprise team management.
* 🤖 **Agent Behavioral Fingerprinting**: Track agent velocity to detect runaway automated loops.
* 📱 **Mobile & Desktop Sidecar Agent Support**: Extend firewall protection to desktop automation agents.

---

## 📄 License
Licensed under the [MIT License](LICENSE).
