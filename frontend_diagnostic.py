#!/usr/bin/env python3
"""Complete diagnostic test of the frontend-to-backend pipeline"""

import json
import os
import sys
import zipfile
from io import BytesIO

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'analyzer'))

print("=" * 80)
print("PRIVACY INTEL PLATFORM - COMPLETE DIAGNOSTIC TEST")
print("=" * 80)

# 1. Flask Backend Test
print("\n[STEP 1] Testing Flask Backend (/analyze endpoint)")
print("-" * 80)
try:
    from analyzer.app import app
    
    # Create mock APK
    apk_bytes = BytesIO()
    with zipfile.ZipFile(apk_bytes, 'w') as apk:
        manifest = '''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.test.app">
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.READ_CONTACTS"/>
    <uses-permission android:name="android.permission.RECORD_AUDIO"/>
    <uses-permission android:name="android.permission.READ_SMS"/>
    <application android:label="TestApp"/>
</manifest>'''
        apk.writestr('AndroidManifest.xml', manifest.encode('utf-8'))
    apk_bytes.seek(0)
    
    # Test Flask endpoint
    client = app.test_client()
    response = client.post('/analyze',
        data={'apkFile': (apk_bytes, 'test.apk')},
        content_type='multipart/form-data')
    
    flask_data = json.loads(response.get_data(as_text=True))
    
    print(f"✅ Flask Status: {response.status_code}")
    print(f"   - Has riskScore: {'riskScore' in flask_data}")
    print(f"   - riskScore value: {flask_data.get('riskScore', 'N/A')}")
    print(f"   - riskLevel value: {flask_data.get('riskLevel', 'N/A')}")
    print(f"   - appName: {flask_data.get('appName', 'N/A')}")
    print(f"   - permissions keys: {list(flask_data.get('permissions', {}).keys())}")
    
except Exception as e:
    print(f"❌ Flask Error: {e}")
    import traceback
    traceback.print_exc()

# 2. Service Availability Check
print("\n[STEP 2] Checking Service Availability")
print("-" * 80)
try:
    import socket
    
    services = [
        ('Flask', 'localhost', 5000),
        ('Node Proxy', 'localhost', 3001),
        ('Frontend', 'localhost', 5174),
    ]
    
    for name, host, port in services:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            print(f"✅ {name:15} - Running on {host}:{port}")
        else:
            print(f"❌ {name:15} - NOT running on {host}:{port}")
            
except Exception as e:
    print(f"⚠️  Error checking services: {e}")

# 3. API Response Format Check
print("\n[STEP 3] Verifying API Response Format")
print("-" * 80)
try:
    expected_fields = ['riskScore', 'riskLevel', 'appName', 'packageName', 'permissions']
    
    for field in expected_fields:
        if field in flask_data:
            print(f"✅ {field:20} - Present")
        else:
            print(f"❌ {field:20} - MISSING")
            
except Exception as e:
    print(f"❌ Format check error: {e}")

# 4. Frontend Data Flow
print("\n[STEP 4] Frontend Data Reception Check")
print("-" * 80)
print("""
The frontend code does:
1. Fetch to http://localhost:3001/api/upload-apk
2. Receives JSON response
3. Sets state: setResult({ type: 'apk', data: response_json })
4. Renders: {renderRiskScoreCard(data.riskScore || 0)}

Expected flow:
  Browser → Node:3001/api/upload-apk 
     → Node proxies to Flask:5000/analyze
     → Flask returns JSON with riskScore
     → Node returns that JSON to Browser
     → Browser sets data = {riskScore: X, riskLevel: Y, ...}
     → Frontend displays risk score

Potential Issues:
  ⚠️  Check browser console (F12) for errors
  ⚠️  Check Network tab to see actual response from /api/upload-apk
  ⚠️  Verify response has riskScore field (not risk_score)
  ⚠️  Clear browser cache if data looks stale
""")

# 5. What to Test
print("\n[STEP 5] Manual Testing Instructions")
print("-" * 80)
print("""
1. Open browser at http://localhost:5174
2. Open Developer Tools (F12)
3. Go to Network tab
4. Upload an APK file
5. Look for entry: api/upload-apk
6. Check Response tab - should show:
   {
     "riskScore": <number>,
     "riskLevel": "<string>",
     "appName": "<string>",
     "permissions": { ... },
     ...
   }

If you see the response but frontend still shows 0:
  - Check Console tab for JavaScript errors
  - Check if data.riskScore is being received
  - Verify the risk score rendering code is correct
""")

# 6. Summary
print("\n[SUMMARY]")
print("-" * 80)
try:
    if response.status_code == 200 and flask_data.get('riskScore') is not None:
        print("✅ BACKEND IS WORKING CORRECTLY")
        print(f"   Risk score calculation: {flask_data['riskScore']}/100")
        print(f"   Risk level: {flask_data['riskLevel']}")
        print("\n⚠️  ISSUE IS LIKELY IN FRONTEND OR DATA FLOW")
        print("   Check browser console and Network tab for errors")
        print("   Verify the API response is being received by the frontend")
    else:
        print("❌ BACKEND ISSUE DETECTED")
except Exception as e:
    print(f"❌ Diagnostic error: {e}")

print("\n" + "=" * 80)
print("End of diagnostic - Please check the steps above and report findings")
print("=" * 80)
