#!/usr/bin/env python3
"""Test Flask endpoint with actual APK file"""

import sys
import os
import json
import zipfile
from io import BytesIO

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'analyzer'))

from analyzer.app import app

print("=" * 80)
print("Testing Flask Endpoint After Risk Score Fix")
print("=" * 80)

# Create a mock APK with 46 dangerous permissions (similar to MovieBlast)
def create_test_apk_with_46_dangerous():
    """Create test APK with 46 dangerous permissions"""
    apk_bytes = BytesIO()
    
    dangerous_perms = [
        'android.permission.WRITE_EXTERNAL_STORAGE',
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
        'android.permission.AUTHENTICATE_ACCOUNTS',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.VIBRATE'
    ]
    
    with zipfile.ZipFile(apk_bytes, 'w') as apk:
        manifest_xml = '''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.movieblast">
    <application android:label="MovieBlast" android:name=".MainActivity">
        <activity android:name=".MainActivity" />
    </application>
'''
        
        for perm in dangerous_perms:
            manifest_xml += f'    <uses-permission android:name="{perm}" />\n'
        
        manifest_xml += '</manifest>'
        
        apk.writestr('AndroidManifest.xml', manifest_xml.encode('utf-8'))
    
    apk_bytes.seek(0)
    return apk_bytes

print("\n[TEST] Uploading test APK to Flask /analyze endpoint...")
try:
    client = app.test_client()
    test_apk = create_test_apk_with_46_dangerous()
    
    response = client.post('/analyze',
        data={'apkFile': (test_apk, 'movieblast_test.apk')},
        content_type='multipart/form-data')
    
    print(f"\n✓ Status Code: {response.status_code}")
    
    data = json.loads(response.get_data(as_text=True))
    
    # Check for essential fields
    print("\n[RESPONSE CHECK]")
    essential_fields = {
        'appName': None,
        'packageName': None,
        'riskScore': None,
        'riskLevel': None,
        'permissions': None,
    }
    
    for field in essential_fields.keys():
        if field in data:
            value = data[field]
            if field == 'permissions':
                value = f"{{dangerous: {len(value.get('dangerous', []))}, normal: {len(value.get('normal', []))}, special: {len(value.get('special', []))}}}"
            print(f"  ✅ {field:20} = {value}")
        else:
            print(f"  ❌ {field:20} = MISSING")
    
    # Final validation
    print("\n[VALIDATION]")
    if data.get('riskScore') is not None:
        print(f"  ✅ Risk Score calculation: {data['riskScore']}/100")
    else:
        print(f"  ❌ Risk Score is missing!")
    
    if data.get('riskLevel'):
        print(f"  ✅ Risk Level: {data['riskLevel']}")
    else:
        print(f"  ❌ Risk Level is missing!")
    
    if data.get('riskScore', 0) > 50 and 'Critical' in data.get('riskLevel', ''):
        print(f"\n  ✅✅✅ SUCCESS! Risk score is being calculated correctly!")
    else:
        print(f"\n  ❌ ISSUE: Risk score may not be calculated correctly")
    
except Exception as e:
    print(f"  ❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
