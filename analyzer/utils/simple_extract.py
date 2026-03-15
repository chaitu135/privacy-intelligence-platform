import os
import tempfile

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

def analyze_file_simple(file_obj):
    """Simple file analysis that works for any file"""
    try:
        # Get file info
        filename = getattr(file_obj, 'filename', 'unknown.apk')
        file_size = getattr(file_obj, 'content_length', 0)
        
        # Generate mock permissions based on file size for demo
        mock_permissions = []
        
        # Add some common permissions for demo
        if file_size > 1000000:  # Larger files get more permissions
            mock_permissions.extend([
                'android.permission.INTERNET',
                'android.permission.ACCESS_NETWORK_STATE',
                'android.permission.ACCESS_FINE_LOCATION',
                'android.permission.CAMERA',
                'android.permission.READ_EXTERNAL_STORAGE'
            ])
        else:
            mock_permissions.extend([
                'android.permission.INTERNET',
                'android.permission.ACCESS_NETWORK_STATE'
            ])
        
        # Classify permissions
        classified_permissions = {
            'normal': [],
            'dangerous': [],
            'special': []
        }
        
        for perm in mock_permissions:
            category = classify_permission(perm)
            classified_permissions[category].append(perm)
        
        # Extract app name from filename
        app_name = filename.replace('.apk', '').replace('_', ' ').title() if filename.endswith('.apk') else filename
        
        # Build result
        result = {
            'appName': app_name,
            'packageName': f'com.example.{filename.lower().replace(".apk", "")}',
            'permissions': classified_permissions,
            'metadata': {
                'minSdk': 21,
                'targetSdk': 33,
                'versionCode': '1',
                'versionName': '1.0',
                'permissions_count': len(mock_permissions),
                'manifest_version': '1.0',
                'file_size': file_size,
                'analysis_type': 'simple_demo'
            }
        }
        
        return result
        
    except Exception as e:
        raise Exception(f"Failed to analyze file: {str(e)}")
