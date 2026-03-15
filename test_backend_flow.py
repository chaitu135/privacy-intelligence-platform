import requests

# Test backend to Python analyzer connection
print("Testing backend health...")
response = requests.get('http://localhost:3001/api/health')
print(f"Backend status: {response.status_code}")
print(f"Response: {response.json()}")

print("\nTesting Play Store analysis through backend...")
data = {"url": "https://play.google.com/store/apps/details?id=com.whatsapp"}
response = requests.post('http://localhost:3001/api/analyze-app-link', json=data)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    print(f"App name: {result.get('app_name', 'N/A')}")
    print(f"Risk score: {result.get('risk_assessment', {}).get('final_risk_score', 'N/A')}")
else:
    print(f"Error: {response.text}")
