import urllib.request
import urllib.error
import json

BASE_URL = "http://127.0.0.1:8000"

print("=== 1. Testing Health Endpoint ===")
try:
    resp = urllib.request.urlopen(f"{BASE_URL}/")
    print("Status:", resp.getcode())
    print("Body:", resp.read().decode())
except Exception as e:
    print("Health check failed:", e)

print("\n=== 2. Testing /analyze-action Endpoint ===")
payload = json.dumps({
    "action_type": "purchase",
    "website": "example.com",
    "amount": 47999
}).encode("utf-8")

req = urllib.request.Request(
    f"{BASE_URL}/analyze-action",
    data=payload,
    headers={"Content-Type": "application/json"}
)

try:
    resp = urllib.request.urlopen(req)
    print("Status:", resp.getcode())
    print("Response:")
    print(json.dumps(json.loads(resp.read().decode()), indent=2))
except urllib.error.HTTPError as err:
    print(f"HTTP Error {err.code}:")
    print(err.read().decode())
except Exception as e:
    print("Request failed:", e)
