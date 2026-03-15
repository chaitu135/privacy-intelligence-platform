#!/usr/bin/env python3
"""Test with exact MovieBlast permissions to diagnose the issue"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'analyzer'))

print("=" * 80)
print("Testing with EXACT MovieBlast Permissions")
print("=" * 80)

# Exact data from MovieBlast.apk
movieblast_permissions = {
    "dangerous": [
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE",
        "android.permission.QUICKBOOT_POWERON",
        "android.permission.FOREGROUND_SERVICE_DATA_SYNC",
        "android.permission.POST_NOTIFICATIONS",
        "me.everything.badger.permission.BADGE_COUNT_READ",
        "com.majeur.launcher.permission.UPDATE_BADGE",
        "com.sec.android.provider.badge.permission.WRITE",
        "com.htc.launcher.permission.READ_SETTINGS",
        "android.permifControllerActivityssion.RECEIVE_BOOT_COMPLETED",
        "android.permission.CHANGE_WIFI_MULTICAST_STATE",
        "com.movieblast.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION",
        "com.sonyericsson.home.permission.BROADCAST_BADGE",
        "com.sec.android.provider.badge.permission.READ",
        "android.permission.READ_ACTIVE_NOTIFICATIONS",
        "android.permission.ACCESS_ADSERVICES_ATTRIBUTION",
        "android.permission.EXPAND_STATUS_BAR",
        "android.permission.READ_PHONE_STATE",
        "com.anddoes.launcher.permission.UPDATE_COUNT",
        "com.oppo.launcher.permission.WRITE_SETTINGS",
        "android.permission.ACCESS_COARSE_LOCATION",
        "com.google.android.c2dm.permission.RECEIVE",
        "android.permission.READ_MEDIA_VIDEO",
        "com.android.launcher.permission.INSTALL_SHORTCUT",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.USE_BIOMETRIC",
        "me.everything.badger.permission.BADGE_COUNT_WRITE",
        "com.huawei.android.launcher.permission.WRITE_SETTINGS",
        "com.applovin.array.apphub.permission.BIND_APPHUB_SERVICE",
        "android.permission.ACCESS_ADSERVICES_TOPICS",
        "com.oppo.launcher.permission.READ_SETTINGS",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "com.android.vending.CHECK_LICENSE",
        "com.movieblast.permission.C2D_MESSAGE",
        "android.permission.READ_APP_BADGE",
        "android.permission.ACCESS_ADSERVICES_AD_ID",
        "com.google.android.providers.gsf.permission.READ_GSERVICES",
        "android.permission.USE_FINGERPRINT",
        "android.permission.ACCESS_FINE_LOCATION",
        "com.htc.launcher.permission.UPDATE_SHORTCUT",
        "com.google.android.gms.permission.AD_ID",
        "com.huawei.android.launcher.permission.CHANGE_BADGE",
        "com.huawei.android.launcher.permission.READ_SETTINGS",
        "com.sonymobile.home.permission.PROVIDER_INSERT_BADGE",
        "android.permission.READ_MEDIA_AUDIO"
    ],
    "normal": [
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.VIBRATE",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.INTERNET",
        "android.permission.WAKE_LOCK",
        "android.permission.ACCESS_WIFI_STATE"
    ],
    "special": [
        "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
        "android.permission.REQUEST_INSTALL_PACKAGES",
        "android.permission.PACKAGE_USAGE_STATS"
    ]
}

print(f"\n1. Permission Summary:")
print(f"   Normal: {len(movieblast_permissions['normal'])}")
print(f"   Dangerous: {len(movieblast_permissions['dangerous'])}")
print(f"   Special: {len(movieblast_permissions['special'])}")
print(f"   Total: {sum(len(v) for v in movieblast_permissions.values())}")

print(f"\n2. Testing RiskEngine directly...")
try:
    from analyzer.risk_engine import RiskEngine
    risk_engine = RiskEngine()
    result = risk_engine.calculate_apk_risk(movieblast_permissions)
    
    print(f"   ✓ RiskEngine result keys: {list(result.keys())}")
    print(f"   ✓ apk_risk_score: {result.get('apk_risk_score')}")
    print(f"   ✓ risk_level: {result.get('risk_level')}")
    print(f"   ✓ dangerous_count: {result.get('dangerous_count')}")
    print(f"   ✓ special_count: {result.get('special_count')}")
    
except Exception as e:
    print(f"   ✗ Error: {e}")
    import traceback
    traceback.print_exc()

print(f"\n3. Testing Flask endpoint with MovieBlast data...")
try:
    from analyzer.app import app
    import json
    
    client = app.test_client()
    
    # Create a JSON payload to test (simulate what the backend would return)
    test_response = {
        'appName': 'MovieBlast',
        'packageName': 'com.movieblast',
        'permissions': movieblast_permissions,
        'metadata': {
            'analysis_type': 'androguard',
            'permissions_count': 56
        }
    }
    
    # Now simulate the risk calculation that Flask does
    print("   Testing risk calculation on this response...")
    try:
        from analyzer.risk_engine import RiskEngine
        risk_engine = RiskEngine()
        apk_risk = risk_engine.calculate_apk_risk(test_response.get('permissions', {}))
        test_response['riskScore'] = apk_risk['apk_risk_score']
        test_response['riskLevel'] = apk_risk.get('risk_level', 'Unknown')
        
        print(f"   ✓ After risk calculation:")
        print(f"     - riskScore: {test_response['riskScore']}")
        print(f"     - riskLevel: {test_response['riskLevel']}")
    except Exception as e:
        print(f"   ✗ Risk calculation error: {e}")
        test_response['riskScore'] = 0
        test_response['riskLevel'] = 'Unknown'
    
    print(f"\n   Final response would be:")
    print(f"   {json.dumps({k: v if k != 'explained_permissions' else '...' for k, v in test_response.items()}, indent=2)}")
        
except Exception as e:
    print(f"   ✗ Flask test error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
