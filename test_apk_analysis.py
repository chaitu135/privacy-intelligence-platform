import requests

# Test APK analysis with real test APK
with open('analyzer/real_test.apk', 'rb') as f:
    files = {'apkFile': f}
    response = requests.post('http://localhost:5000/analyze', files=files)
    print("Status:", response.status_code)
    print("Response:", response.json())
