from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/")
    assert response.status_code == 200
    print("Health check response:", response.json())

def test_analyze_action_success():
    response = client.post(
        "/analyze-action",
        json={
            "action_type": "purchase",
            "website": "example.com",
            "amount": 47999
        }
    )
    print("Analyze action status code:", response.status_code)
    print("Analyze action response body:", response.json())
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "HIGH"
    assert data["decision"] == "REVIEW"

if __name__ == "__main__":
    test_health()
    test_analyze_action_success()
    print("\n[SUCCESS] Full end-to-end integration test passed! (FastAPI -> Risk Engine -> Supabase)")

