import androguard.misc as androconf
import androguard.core.bytecodes.apk as apk
import json
import tempfile
import os

# Permission classification mapping
PERMISSION_CATEGORIES = {
    # Normal permissions (low risk)
    'normal': [
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.INTERNET',
        'android.permission.ACCESS_WIFI_STATE',
        'android.permission.CHANGE_NETWORK_STATE',
        'android.permission.CHANGE_WIFI_STATE',
        'android.permission.VIBRATE',
        'android.permission.WAKE_LOCK',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.SET_ALARM',
        'android.permission.SET_WALLPAPER',
        'android.permission.SET_TIME_ZONE',
        'android.permission.SET_WALLPAPER_HINTS',
        'android.permission.BROADCAST_STICKY',
        'android.permission.INSTALL_SHORTCUT',
        'android.permission.UNINSTALL_SHORTCUT',
        'android.permission.KILL_BACKGROUND_PROCESSES'
    ],
    
    # Dangerous permissions (medium risk)
    'dangerous': [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.READ_CONTACTS',
        'android.permission.WRITE_CONTACTS',
        'android.permission.READ_CALENDAR',
        'android.permission.WRITE_CALENDAR',
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_PHONE_STATE',
        'android.permission.CALL_PHONE',
        'android.permission.READ_CALL_LOG',
        'android.permission.WRITE_CALL_LOG',
        'android.permission.ADD_VOICEMAIL',
        'android.permission.USE_SIP',
        'android.permission.PROCESS_OUTGOING_CALLS',
        'android.permission.SEND_SMS',
        'android.permission.RECEIVE_SMS',
        'android.permission.READ_SMS',
        'android.permission.RECEIVE_WAP_PUSH',
        'android.permission.RECEIVE_MMS',
        'android.permission.BODY_SENSORS',
        'android.permission.ACCESS_MEDIA_LOCATION'
    ],
    
    # Special permissions (high risk)
    'special': [
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.WRITE_SETTINGS',
        'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
        'android.permission.REQUEST_INSTALL_PACKAGES',
        'android.permission.PACKAGE_USAGE_STATS',
        'android.permission.BIND_ACCESSIBILITY_SERVICE',
        'android.permission.BIND_DEVICE_ADMIN',
        'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
        'android.permission.MANAGE_EXTERNAL_STORAGE',
        'android.permission.QUERY_ALL_PACKAGES',
        'android.permission.GET_ACCOUNTS',
        'android.permission.MANAGE_ACCOUNTS',
        'android.permission.CHANGE_CONFIGURATION',
        'android.permission.MODIFY_PHONE_STATE',
        'android.permission.READ_LOGS',
        'android.permission.DIAGNOSTIC',
        'android.permission.FACTORY_TEST',
        'android.permission.INJECT_EVENTS',
        'android.permission.SET_ORIENTATION',
        'android.permission.SIGNAL_PERSISTENT_PROCESSES',
        'android.permission.WRITE_APN_SETTINGS',
        'android.permission.WRITE_SECURE_SETTINGS'
    ]
}

def classify_permission(permission):
    """Classify a permission into normal/dangerous/special category"""
    for category, permissions in PERMISSION_CATEGORIES.items():
        if permission in permissions:
            return category
    
    # Default to dangerous for unknown permissions
    return 'dangerous'

def analyze_apk(apk_path):
    """Analyze APK file and extract permissions and metadata"""
    try:
        # Check if file exists and is valid
        if not os.path.exists(apk_path):
            raise Exception("APK file not found")
        
        # Load APK with error handling
        try:
            a = apk.APK(apk_path)
        except Exception as e:
            raise Exception(f"Invalid APK file: {str(e)}")
        
        # Extract basic app info with fallbacks
        try:
            app_name = a.get_app_name() or a.get_package() or 'Unknown'
        except:
            app_name = 'Unknown'
            
        try:
            package_name = a.get_package() or 'Unknown'
        except:
            package_name = 'Unknown'
        
        # Get manifest metadata with error handling
        min_sdk = None
        target_sdk = None
        try:
            manifest = a.get_android_manifest_xml()
            if manifest is not None:
                uses_sdk = manifest.find('uses-sdk')
                if uses_sdk is not None:
                    min_sdk = uses_sdk.get('{http://schemas.android.com/apk/res/android}minSdkVersion')
                    target_sdk = uses_sdk.get('{http://schemas.android.com/apk/res/android}targetSdkVersion')
        except Exception as e:
            print(f"Warning: Could not parse manifest: {e}")
        
        # Get all permissions with error handling
        permissions = []
        try:
            permissions = a.get_permissions() or []
        except Exception as e:
            print(f"Warning: Could not get permissions: {e}")
            permissions = []
        
        # Classify permissions
        classified_permissions = {
            'normal': [],
            'dangerous': [],
            'special': []
        }
        
        for perm in permissions:
            if perm:  # Ensure permission is not None or empty
                category = classify_permission(perm)
                classified_permissions[category].append(perm)
        
        # Build result with safe values
        result = {
            'appName': app_name,
            'packageName': package_name,
            'permissions': classified_permissions,
            'metadata': {
                'minSdk': int(min_sdk) if min_sdk and min_sdk.isdigit() else None,
                'targetSdk': int(target_sdk) if target_sdk and target_sdk.isdigit() else None,
                'versionCode': a.get_androidversion_code(),
                'versionName': a.get_androidversion_name(),
                'permissions_count': len(permissions),
                'manifest_version': '1.0'
            }
        }
        
        return result
        
    except Exception as e:
        raise Exception(f"Failed to analyze APK: {str(e)}")

def analyze_apk_from_file(file_obj):
    """Analyze APK from file object"""
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.apk') as temp_file:
        file_obj.save(temp_file.name)
        temp_path = temp_file.name
    
    try:
        result = analyze_apk(temp_path)
        return result
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.unlink(temp_path)
