#!/usr/bin/env python3
"""Test the full API response to verify risk scoring is working"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'analyzer'))

# Test the complete analyze_apk flow
from analyzer.app import app
from io import BytesIO
import zipfile

print("=" * 70)
print("Testing Full API Response - Flask Backend")
print("=" * 70)

# Create a mock APK with 46 dangerous permissions
def create_mock_apk():
    """Create a fake APK file for testing"""
    print("\n1. Creating mock APK with 46 dangerous permissions...")
    
    # Create a BytesIO object to hold the APK
    apk_bytes = BytesIO()
    
    # Create a ZIP file (APK is just a ZIP file)
    with zipfile.ZipFile(apk_bytes, 'w') as apk:
        # Create a basic AndroidManifest.xml with 46 dangerous permissions
        manifest_xml = '''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.movieblast"
    android:versionCode="1"
    android:versionName="1.0">
    
    <application
        android:label="MovieBlast"
        android:name=".MainActivity">
        <activity android:name=".MainActivity" />
    </application>
'''
        
        # Add 46 dangerous permissions
        dangerous_perms = [
            'android.permission.INTERNET',
            'android.permission.ACCESS_FINE_LOCATION',
            'android.permission.ACCESS_COARSE_LOCATION',
            'android.permission.CAMERA',
            'android.permission.RECORD_AUDIO',
            'android.permission.READ_CONTACTS',
            'android.permission.WRITE_CONTACTS',
            'android.permission.READ_CALL_LOG',
            'android.permission.WRITE_CALL_LOG',
            'android.permission.READ_SMS',
            'android.permission.RECEIVE_SMS',
            'android.permission.SEND_SMS',
            'android.permission.READ_PHONE_STATE',
            'android.permission.CALL_PHONE',
            'android.permission.USE_SIP',
            'android.permission.PROCESS_OUTGOING_CALLS',
            'android.permission.READ_CALENDAR',
            'android.permission.WRITE_CALENDAR',
            'android.permission.BODY_SENSORS',
            'android.permission.ACCESS_MEDIA_LOCATION',
            'android.permission.ACTIVITY_RECOGNITION',
            'android.permission.MODIFY_AUDIO_SETTINGS',
            'android.permission.WRITE_EXTERNAL_STORAGE',
            'android.permission.READ_EXTERNAL_STORAGE',
            'android.permission.GET_ACCOUNTS',
            'android.permission.READ_PHONE_NUMBERS',
            'android.permission.ANSWER_PHONE_CALLS',
            'android.permission.ACCEPT_HANDOVER',
            'android.permission.ACCESS_BACKGROUND_LOCATION',
            'android.permission.READ_SYNC_SETTINGS',
            'android.permission.WRITE_SYNC_SETTINGS',
            'android.permission.READ_SYNC_STATS',
            'android.permission.SET_ALARM',
            'android.permission.NEARBY_WIFI_DEVICES',
            'android.permission.READ_LOGS',
            'android.permission.WRITE_SETTINGS',
            'android.permission.SYSTEM_ALERT_WINDOW',
            'android.permission.INSTALL_PACKAGES',
            'android.permission.REQUEST_DELETE_PACKAGES',
            'android.permission.CHANGE_NETWORK_STATE',
            'android.permission.CHANGE_WIFI_STATE',
            'android.permission.WRITE_APN_SETTINGS',
            'android.permission.BIND_DEVICE_ADMIN',
            'android.permission.ACCESS_NOTIFICATIONS',
            'android.permission.POST_NOTIFICATIONS',
            'android.permission.AUTHENTICATE_ACCOUNTS'
        ]
        
        for perm in dangerous_perms:
            manifest_xml += f'    <uses-permission android:name="{perm}" />\n'
        
        manifest_xml += '</manifest>'
        
        # Write manifest to APK
        apk.writestr('AndroidManifest.xml', manifest_xml.encode('utf-8'))
    
    apk_bytes.seek(0)
    print(f"   ✓ Mock APK created ({len(dangerous_perms)} dangerous permissions)")
    return apk_bytes

# Test the Flask app
print("\n2. Testing Flask API response...")
try:
    # Create test client
    client = app.test_client()
    
    # Create mock APK
    mock_apk = create_mock_apk()
    
    # Send POST request to /analyze endpoint
    response = client.post('/analyze',
        data={'apkFile': (mock_apk, 'MovieBlast.apk')},
        content_type='multipart/form-data')
    
    print(f"\n   Response Status: {response.status_code}")
    
    # Parse response
    import json
    data = json.loads(response.get_data(as_text=True))
    
    print("\n3. Response Fields Check:")
    print(f"   ✓ appName: {data.get('appName', 'MISSING')}")
    print(f"   ✓ packageName: {data.get('packageName', 'MISSING')}")
    print(f"   ✓ riskScore: {data.get('riskScore', 'MISSING')}")
    print(f"   ✓ riskLevel: {data.get('riskLevel', 'MISSING')}")
    
    print("\n4. Permission Summary:")
    perms = data.get('permissions', {})
    print(f"   Normal: {len(perms.get('normal', []))} permissions")
    print(f"   Dangerous: {len(perms.get('dangerous', []))} permissions")
    print(f"   Special: {len(perms.get('special', []))} permissions")
    
    print("\n5. Validation:")
    if data.get('riskScore') is not None and data.get('riskScore') > 50:
        print(f"   ✅ Risk Score is correct: {data['riskScore']}")
    else:
        print(f"   ❌ Risk Score is WRONG: {data.get('riskScore')} (expected > 50)")
    
    if data.get('riskLevel'):
        print(f"   ✅ Risk Level is present: {data['riskLevel']}")
    else:
        print(f"   ❌ Risk Level is MISSING")
    
    print("\n6. Full Response Preview:")
    print(json.dumps({k: v if k != 'explained_permissions' else f"[{len(v)} entries]" for k, v in data.items()}, indent=2))
    
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
