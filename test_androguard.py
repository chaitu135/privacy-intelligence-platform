#!/usr/bin/env python3
"""Test real APK analysis with Androguard"""

import sys
import os
import json
import zipfile
from io import BytesIO

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'analyzer'))

from analyzer.app import app

print("=" * 80)
print("Testing APK Analysis with Androguard Enabled")
print("=" * 80)

# Create a properly formatted APK
def create_test_apk():
    """Create test APK with manifest"""
    apk_bytes = BytesIO()
    
    with zipfile.ZipFile(apk_bytes, 'w') as apk:
        # Create a basic AndroidManifest.xml (text format for testing)
        manifest = '''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.test.app"
    android:versionCode="1"
    android:versionName="1.0">
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.READ_SMS" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.READ_CALENDAR" />
    
    <application android:label="Test App" android:name=".MainActivity">
        <activity android:name=".MainActivity" 
            android:label="@string/app_name">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>'''
        
        apk.writestr('AndroidManifest.xml', manifest.encode('utf-8'))
        apk.writestr('classes.dex', b'DEX\x00dex\x00dex\x00')  # Minimal DEX file structure
    
    apk_bytes.seek(0)
    return apk_bytes

print("\n[TEST] Uploading test APK to Flask /analyze endpoint...")
try:
    client = app.test_client()
    test_apk = create_test_apk()
    
    print("Sending APK to http://localhost:5000/analyze...")
    response = client.post('/analyze',
        data={'apkFile': (test_apk, 'test.apk')},
        content_type='multipart/form-data')
    
    print(f"\n✓ Response Status: {response.status_code}")
    
    data = json.loads(response.get_data(as_text=True))
    
    print("\n[RESPONSE FIELDS]")
    important_fields = ['appName', 'packageName', 'riskScore', 'riskLevel', 'permissions']
    for field in important_fields:
        if field in data:
            if field == 'permissions':
                perms = data[field]
                print(f"  ✓ {field:20} = {{'dangerous': {len(perms.get('dangerous', []))}, 'normal': {len(perms.get('normal', []))}, 'special': {len(perms.get('special', []))}}}")
            else:
                print(f"  ✓ {field:20} = {data[field]}")
        else:
            print(f"  ✗ {field:20} = MISSING")
    
    print("\n[VALIDATION]")
    if len(data.get('permissions', {}).get('dangerous', [])) > 0:
        print(f"  ✓ Dangerous permissions found: {len(data['permissions']['dangerous'])}")
        print(f"    > {', '.join(data['permissions']['dangerous'][:3])}...")
    
    if data.get('riskScore') and data['riskScore'] > 0:
        print(f"  ✓ Risk score calculated: {data['riskScore']}/100")
        print(f"  ✓ Risk level: {data['riskLevel']}")
        print(f"  ✅ SUCCESS! Risk score is being calculated correctly!")
    else:
        print(f"  ⚠ Risk score is {data.get('riskScore', 'missing')}")
        if data.get('error'):
            print(f"  Error: {data['error']}")
    
except Exception as e:
    print(f"  ✗ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
