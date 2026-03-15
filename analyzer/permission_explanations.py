# Permission explanations for Android permissions
PERMISSION_EXPLANATIONS = {
    # Location Permissions
    'ACCESS_FINE_LOCATION': {
        'description': 'Allows the app to access precise GPS location',
        'risk_level': 'High',
        'privacy_impact': 'Can track your exact location at all times',
        'use_case': 'Navigation, location-based services, weather apps'
    },
    'ACCESS_COARSE_LOCATION': {
        'description': 'Allows the app to access approximate location',
        'risk_level': 'Medium',
        'privacy_impact': 'Can track your general area (city-level)',
        'use_case': 'Local content, weather, regional services'
    },
    'ACCESS_BACKGROUND_LOCATION': {
        'description': 'Allows the app to access location in the background',
        'risk_level': 'Critical',
        'privacy_impact': 'Can track your location even when app is not in use',
        'use_case': 'Navigation, fitness tracking, geofencing'
    },
    
    # Camera and Microphone
    'CAMERA': {
        'description': 'Allows the app to capture photos and videos',
        'risk_level': 'High',
        'privacy_impact': 'Can record you without your knowledge',
        'use_case': 'Video calls, photo editing, QR scanning'
    },
    'RECORD_AUDIO': {
        'description': 'Allows the app to record microphone input',
        'risk_level': 'High',
        'privacy_impact': 'Can listen to conversations and ambient audio',
        'use_case': 'Voice calls, voice recording, audio apps'
    },
    
    # Contacts and Communication
    'READ_CONTACTS': {
        'description': 'Allows the app to read your contact list',
        'risk_level': 'High',
        'privacy_impact': 'Can access all your contacts and their information',
        'use_case': 'Messaging apps, social media, contact management'
    },
    'WRITE_CONTACTS': {
        'description': 'Allows the app to modify your contact list',
        'risk_level': 'Medium',
        'privacy_impact': 'Can add, edit, or delete your contacts',
        'use_case': 'Contact sync, social media integration'
    },
    'READ_SMS': {
        'description': 'Allows the app to read your text messages',
        'risk_level': 'Critical',
        'privacy_impact': 'Can read all your SMS messages including verification codes',
        'use_case': 'Messaging apps, backup services'
    },
    'RECEIVE_SMS': {
        'description': 'Allows the app to receive and process incoming SMS',
        'risk_level': 'High',
        'privacy_impact': 'Can intercept and read incoming messages',
        'use_case': 'Two-factor authentication, messaging apps'
    },
    'SEND_SMS': {
        'description': 'Allows the app to send SMS messages',
        'risk_level': 'High',
        'privacy_impact': 'Can send messages without your interaction',
        'use_case': 'Messaging apps, verification services'
    },
    'READ_CALL_LOG': {
        'description': 'Allows the app to read your call history',
        'risk_level': 'High',
        'privacy_impact': 'Can access your call records and contacts',
        'use_case': 'Call management apps, backup services'
    },
    'WRITE_CALL_LOG': {
        'description': 'Allows the app to modify your call history',
        'risk_level': 'Medium',
        'privacy_impact': 'Can edit or delete your call records',
        'use_case': 'Call management, backup services'
    },
    'CALL_PHONE': {
        'description': 'Allows the app to make phone calls',
        'risk_level': 'Medium',
        'privacy_impact': 'Can make calls without your direct action',
        'use_case': 'VoIP apps, emergency services'
    },
    
    # Storage
    'READ_EXTERNAL_STORAGE': {
        'description': 'Allows the app to read from external storage',
        'risk_level': 'Medium',
        'privacy_impact': 'Can access your photos, videos, and files',
        'use_case': 'File managers, photo editors, document apps'
    },
    'WRITE_EXTERNAL_STORAGE': {
        'description': 'Allows the app to write to external storage',
        'risk_level': 'Medium',
        'privacy_impact': 'Can modify or delete your files',
        'use_case': 'File managers, download managers'
    },
    
    # Device Information
    'READ_PHONE_STATE': {
        'description': 'Allows the app to access phone status and identity',
        'risk_level': 'High',
        'privacy_impact': 'Can access phone number, IMEI, and call status',
        'use_case': 'Telephony apps, device identification'
    },
    'GET_ACCOUNTS': {
        'description': 'Allows the app to get the list of accounts on device',
        'risk_level': 'Medium',
        'privacy_impact': 'Can access your email accounts and other services',
        'use_case': 'Account management, authentication'
    },
    
    # System Level Permissions
    'SYSTEM_ALERT_WINDOW': {
        'description': 'Allows the app to display alerts over other apps',
        'risk_level': 'High',
        'privacy_impact': 'Can show overlays that may trick you into actions',
        'use_case': 'Chat heads, screen overlays, accessibility'
    },
    'WRITE_SETTINGS': {
        'description': 'Allows the app to modify system settings',
        'risk_level': 'High',
        'privacy_impact': 'Can change device settings without your knowledge',
        'use_case': 'Settings automation, device management'
    },
    'REQUEST_IGNORE_BATTERY_OPTIMIZATIONS': {
        'description': 'Allows the app to run in background',
        'risk_level': 'Medium',
        'privacy_impact': 'Can drain battery and track activity continuously',
        'use_case': 'Fitness apps, messaging apps, alarms'
    },
    'REQUEST_INSTALL_PACKAGES': {
        'description': 'Allows the app to install other applications',
        'risk_level': 'Critical',
        'privacy_impact': 'Can install malicious apps without your consent',
        'use_case': 'App stores, package managers'
    },
    'BIND_DEVICE_ADMIN': {
        'description': 'Allows the app to become device administrator',
        'risk_level': 'Critical',
        'privacy_impact': 'Can control device settings and security',
        'use_case': 'Device management, security apps'
    },
    'BIND_ACCESSIBILITY_SERVICE': {
        'description': 'Allows the app to monitor your actions and assist',
        'risk_level': 'Critical',
        'privacy_impact': 'Can read everything on screen and control device',
        'use_case': 'Accessibility tools, screen readers'
    },
    
    # Network
    'INTERNET': {
        'description': 'Allows the app to access the internet',
        'risk_level': 'Low',
        'privacy_impact': 'Can send and receive data online',
        'use_case': 'Most apps require internet access'
    },
    'ACCESS_NETWORK_STATE': {
        'description': 'Allows the app to view network connections',
        'risk_level': 'Low',
        'privacy_impact': 'Can check if you are connected to internet',
        'use_case': 'Network-aware apps, offline mode'
    },
    'ACCESS_WIFI_STATE': {
        'description': 'Allows the app to view Wi-Fi network information',
        'risk_level': 'Low',
        'privacy_impact': 'Can check Wi-Fi status and networks',
        'use_case': 'Wi-Fi management, network apps'
    },
    
    # Other Common Permissions
    'VIBRATE': {
        'description': 'Allows the app to control vibration',
        'risk_level': 'Low',
        'privacy_impact': 'Can make device vibrate for notifications',
        'use_case': 'Notifications, haptic feedback'
    },
    'WAKE_LOCK': {
        'description': 'Allows the app to keep device awake',
        'risk_level': 'Low',
        'privacy_impact': 'Can prevent device from sleeping',
        'use_case': 'Video playback, downloads, alarms'
    },
    'RECEIVE_BOOT_COMPLETED': {
        'description': 'Allows the app to start when device boots',
        'risk_level': 'Medium',
        'privacy_impact': 'Can run automatically at startup',
        'use_case': 'Background services, alarms'
    },
    
    # Body Sensors
    'BODY_SENSORS': {
        'description': 'Allows the app to access body sensor data',
        'risk_level': 'High',
        'privacy_impact': 'Can access health and fitness data',
        'use_case': 'Fitness apps, health monitoring'
    },
    
    # Calendar
    'READ_CALENDAR': {
        'description': 'Allows the app to read calendar events',
        'risk_level': 'Medium',
        'privacy_impact': 'Can access your schedule and appointments',
        'use_case': 'Calendar apps, scheduling tools'
    },
    'WRITE_CALENDAR': {
        'description': 'Allows the app to modify calendar events',
        'risk_level': 'Medium',
        'privacy_impact': 'Can add, edit, or delete your events',
        'use_case': 'Calendar apps, scheduling tools'
    }
}

def get_permission_explanation(permission_name: str) -> dict:
    """Get explanation for a permission"""
    # Remove android.permission. prefix if present
    clean_name = permission_name.replace('android.permission.', '')
    
    return PERMISSION_EXPLANATIONS.get(clean_name, {
        'description': f'Allows the app to access {clean_name.lower()}',
        'risk_level': 'Medium',
        'privacy_impact': 'May access sensitive device features',
        'use_case': 'Various app functionalities'
    })

def get_permissions_by_risk_level(risk_level: str) -> list:
    """Get all permissions of a specific risk level"""
    return [
        perm for perm, details in PERMISSION_EXPLANATIONS.items()
        if details['risk_level'] == risk_level
    ]

def get_risk_level_color(risk_level: str) -> str:
    """Get color for risk level"""
    colors = {
        'Low': '#10b981',      # green
        'Medium': '#f59e0b',   # yellow
        'High': '#ef4444',     # red
        'Critical': '#991b1b'  # dark red
    }
    return colors.get(risk_level, '#6b7280')  # gray default
