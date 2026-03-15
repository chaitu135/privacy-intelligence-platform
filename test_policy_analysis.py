import requests

# Test Policy URL analysis
data = {
    "url": "https://policies.google.com/privacy"
}
response = requests.post('http://localhost:5000/analyze-policy-url', json=data)
print("Status:", response.status_code)
print("Response:", response.json())
