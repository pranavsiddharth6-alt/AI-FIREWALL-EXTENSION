import urllib.request
import urllib.error
import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_risk_scenarios():
    test_cases = [
        # 1. LOW Risk / ALLOW Policy
        {
            "name": "LOW risk action (search)",
            "payload": {"action_type": "search", "website": "google.com"},
            "expected_risk": "LOW",
            "expected_decision": "ALLOW"
        },
        # 2. MEDIUM Risk / REVIEW Policy
        {
            "name": "MEDIUM risk action (upload_file)",
            "payload": {"action_type": "upload_file", "website": "example.com", "details": {"file_count": 1}},
            "expected_risk": "MEDIUM",
            "expected_decision": "REVIEW"
        },
        # 3. HIGH Risk / REVIEW Policy (ASK)
        {
            "name": "HIGH risk action (purchase)",
            "payload": {"action_type": "purchase", "website": "example.com", "amount": 47999},
            "expected_risk": "HIGH",
            "expected_decision": "REVIEW"
        },
        # 4. CRITICAL Risk / BLOCK Policy
        {
            "name": "CRITICAL risk action (delete_file)",
            "payload": {"action_type": "delete_file", "website": "cloud.com"},
            "expected_risk": "CRITICAL",
            "expected_decision": "BLOCK"
        },
        # 5. Ambiguous Action (Triggers LLM fallback or LLM analysis)
        {
            "name": "Ambiguous action (modify_user_permissions)",
            "payload": {"action_type": "modify_user_permissions", "website": "admin.example.com", "details": {"role": "admin"}},
            "expected_risk": None,  # Dynamically evaluated
            "expected_decision": None
        }
    ]

    print("==================================================")
    print("  AI DECISION FIREWALL - TASK 6 SCENARIO TESTS   ")
    print("==================================================")

    for case in test_cases:
        print(f"\nTesting: {case['name']}...")
        response = client.post("/analyze-action", json=case["payload"])
        assert response.status_code == 200, f"Failed on {case['name']}: {response.text}"
        
        data = response.json()
        print(f" -> Risk Level: {data['risk_level']}")
        print(f" -> Decision:   {data['decision']}")
        print(f" -> Reason:     {data['reason']}")

        if case["expected_risk"]:
            assert data["risk_level"] == case["expected_risk"]
        if case["expected_decision"]:
            assert data["decision"] == case["expected_decision"]

    print("\n[SUCCESS] All Task 6 risk scenarios evaluated cleanly!")

if __name__ == "__main__":
    test_risk_scenarios()
