import requests

# Test Play Store analysis
data = {
    "url": "https://play.google.com/store/apps/details?id=com.whatsapp"
}
response = requests.post('http://localhost:5000/analyze-app-link', json=data)
print("Status:", response.status_code)
print("Response:", response.json())
