from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import sys
import traceback

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

# Import new analyzer modules FIRST before Flask
try:
    from risk_engine import RiskEngine
except Exception as e:
    RiskEngine = None
    print(f"Warning: RiskEngine import failed: {e}")

try:
    from policy_analyzer import PolicyAnalyzer
except Exception as e:
    PolicyAnalyzer = None
    print(f"Warning: PolicyAnalyzer import failed: {e}")

try:
    from playstore_scraper import PlayStoreScraper
except Exception as e:
    PlayStoreScraper = None
    print(f"Warning: PlayStoreScraper import failed: {e}")

try:
    from permission_explanations import get_permission_explanation
except Exception as e:
    get_permission_explanation = None
    print(f"Warning: permission_explanations import failed: {e}")

# Fallback for permission explanation
if not get_permission_explanation:
    get_permission_explanation = lambda perm: "Permission to access device features" 

# Try to import androguard, fallback to simple analysis
try:
    from utils.andro_extract import analyze_apk_from_file
    USE_ANDROGUARD = True
    print("✓ Using Androguard for APK analysis")
except ImportError as e:
    try:
        from utils.simple_extract import analyze_file_simple
        USE_ANDROGUARD = False
        print(f"⚠ Androguard not available, using simple analysis: {e}")
    except ImportError:
        USE_ANDROGUARD = False
        print(f"⚠ Both analyzers failed, using basic analysis: {e}")
        analyze_file_simple = None

print(f"Module Status - RiskEngine: {RiskEngine is not None}, PolicyAnalyzer: {PolicyAnalyzer is not None}, PlayStoreScraper: {PlayStoreScraper is not None}")

def analyze_apk_basic(file_obj):
    """Basic APK analysis when androguard/simple_extract fail
    
    Note: Real APKs have binary-encoded AndroidManifest.xml files which cannot
    be parsed as plain text. This function will return a fallback response with
    generic permissions for testing purposes.
    """
    try:
        import zipfile
        import tempfile
        import os
        
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.apk') as tmp_file:
            file_obj.save(tmp_file.name)
            tmp_path = tmp_file.name
        
        try:
            with zipfile.ZipFile(tmp_path, 'r') as apk:
                # Verify it's a valid APK (has required files)
                file_list = apk.namelist()
                
                # Check if it has manifest or other APK files
                has_manifest = any('AndroidManifest' in f for f in file_list)
                has_classes = any('classes.dex' in f for f in file_list)
                is_valid_apk = has_manifest or has_classes
                
                if not is_valid_apk:
                    return {
                        'error': 'File does not appear to be a valid APK (missing required files)',
                        'permissions': {'normal': [], 'dangerous': [], 'special': []},
                        'metadata': {
                            'analysis_type': 'validation_failed',
                            'reason': 'Invalid APK structure'
                        }
                    }
                
                # Try to parse manifest text-based way (will work for some APKs)
                import xml.etree.ElementTree as ET
                
                manifest_files = [f for f in file_list if f.endswith('AndroidManifest.xml')]
                permissions = []
                app_name = "Unknown"
                package_name = "Unknown"
                
                if manifest_files:
                    try:
                        manifest_path = manifest_files[0]
                        with apk.open(manifest_path) as manifest_file:
                            manifest_content = manifest_file.read()
                            
                            # Try to decode and parse (works for text-based manifests)
                            try:
                                manifest_str = manifest_content.decode('utf-8')
                                root = ET.fromstring(manifest_str)
                                
                                # Extract package name
                                package_name = root.get('package', 'Unknown')
                                
                                # Extract app name
                                app_elem = root.find('.//application')
                                if app_elem is not None:
                                    app_name = app_elem.get('{http://schemas.android.com/apk/res/android}label', 'Unknown')
                                
                                # Get permissions
                                perm_elems = root.findall('.//uses-permission')
                                for perm in perm_elems:
                                    perm_name = perm.get('{http://schemas.android.com/apk/res/android}name', '')
                                    if perm_name:
                                        permissions.append(perm_name)
                            except Exception as parse_error:
                                # Manifest is binary encoded (normal for real APKs)
                                # Return generic response - requires Androguard for proper parsing
                                print(f"NOTE: Manifest is binary-encoded (this is normal for real APKs). Use Androguard for proper analysis.")
                                pass
                    except Exception as e:
                        print(f"Could not extract manifest: {e}")
                
                # Classify permissions
                from utils.simple_extract import classify_permission
                classified_permissions = {
                    'normal': [],
                    'dangerous': [],
                    'special': []
                }
                for perm in permissions:
                    category = classify_permission(perm)
                    classified_permissions[category].append(perm)
                
                return {
                    'appName': app_name,
                    'packageName': package_name,
                    'permissions': classified_permissions,
                    'metadata': {
                        'total_permissions': len(permissions),
                        'analysis_type': 'basic_fallback',
                        'note': 'For accurate analysis of real APKs, Androguard library is required'
                    }
                }
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
                
    except Exception as e:
        print(f"Basic APK analysis failed: {e}")
        return {
            'error': f'APK analysis failed: {str(e)}',
            'permissions': {'normal': [], 'dangerous': [], 'special': []},
            'metadata': {
                'analysis_type': 'error',
                'error_message': str(e)
            }
        }

app = Flask(__name__)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024 * 1024  # 2GB max file size (increased from 500MB)
app.config['UPLOAD_FOLDER'] = 'uploads'

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'apk', 'pdf', 'txt', 'docx'}

def allowed_file(filename, file_type='apk'):
    if file_type == 'apk':
        return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'apk'
    elif file_type == 'policy':
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ['pdf', 'txt', 'docx']
    return False
@app.route("/")
def home():
    return {
        "service": "Privacy Intelligence Analyzer",
        "status": "running",
        "message": "API is active"
    }

@app.route('/analyze', methods=['POST'])
def analyze_apk():
    try:
        # Check if file is in request
        if 'apkFile' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400
        
        file = request.files['apkFile']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # For demo, allow any file extension but warn if not APK
        if not allowed_file(file.filename, 'apk'):
            print(f"Warning: Non-APK file uploaded: {file.filename}")
        
        # Analyze the file
        try:
            if USE_ANDROGUARD and file.filename.endswith('.apk'):
                result = analyze_apk_from_file(file)
            elif file.filename.endswith('.apk'):
                result = analyze_apk_basic(file)
            else:
                # For non-APK files, do basic analysis
                result = {
                    'error': 'Only APK files are supported for detailed analysis'
                }
                if analyze_file_simple:
                    result = analyze_file_simple(file)
            
            # Add permission explanations and risk scoring
            try:
                from risk_engine import RiskEngine
                risk_engine = RiskEngine()
                apk_risk = risk_engine.calculate_apk_risk(result.get('permissions', {}))
                result['riskScore'] = apk_risk['apk_risk_score']
                result['riskLevel'] = apk_risk.get('risk_level', 'Unknown')
                print(f"[RISK CALC] Dangerous: {apk_risk.get('dangerous_count', 0)}, Special: {apk_risk.get('special_count', 0)}, Risk Score: {result['riskScore']}, Level: {result['riskLevel']}")
            except Exception as e:
                print(f"[ERROR] Risk calculation failed: {e}")
                import traceback
                traceback.print_exc()
                result['riskScore'] = 0
                result['riskLevel'] = 'Unknown'
            
            # Add permission explanations
            try:
                explained_permissions = {}
                for category, perms in result.get('permissions', {}).items():
                    explained_permissions[category] = []
                    for perm in perms:
                        explanation = get_permission_explanation(perm) if get_permission_explanation else "Permission explanation unavailable"
                        explained_permissions[category].append({
                            'name': perm,
                            'explanation': explanation
                        })
                result['explained_permissions'] = explained_permissions
            except Exception as e:
                print(f"[ERROR] Error adding explanations: {e}")
            
            return jsonify(result)
        except Exception as e:
            print(f"Analysis error: {e}")
            # Fallback to simple analysis if androguard fails
            if USE_ANDROGUARD:
                try:
                    from simple_extract import analyze_file_simple
                    result = analyze_file_simple(file)
                    result['metadata']['fallback_analysis'] = True
                    
                    # IMPORTANT: Still calculate risk score even in fallback path
                    try:
                        from risk_engine import RiskEngine
                        risk_engine = RiskEngine()
                        apk_risk = risk_engine.calculate_apk_risk(result.get('permissions', {}))
                        result['riskScore'] = apk_risk['apk_risk_score']
                        result['riskLevel'] = apk_risk.get('risk_level', 'Unknown')
                        print(f"[RISK CALC FALLBACK] Dangerous: {apk_risk.get('dangerous_count', 0)}, Special: {apk_risk.get('special_count', 0)}, Risk Score: {result['riskScore']}, Level: {result['riskLevel']}")
                    except Exception as risk_error:
                        print(f"[ERROR] Risk calculation in fallback failed: {risk_error}")
                        result['riskScore'] = 0
                        result['riskLevel'] = 'Unknown'
                    
                    return jsonify(result)
                except Exception as fallback_error:
                    return jsonify({'error': f'Both analysis methods failed: {str(e)}', 'fallback_error': str(fallback_error)}), 500
            else:
                return jsonify({'error': f'Failed to analyze file: {str(e)}'}), 500
    
    except Exception as e:
        print(f"Server error: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/analyze-policy', methods=['POST'])
def analyze_policy_file():
    try:
        if not PolicyAnalyzer:
            return jsonify({'error': 'Policy analyzer not available'}), 503
        
        if 'policyFile' not in request.files:
            return jsonify({'error': 'No policy file uploaded'}), 400
        
        file = request.files['policyFile']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename, 'policy'):
            return jsonify({'error': 'Only PDF, TXT, or DOCX files are allowed'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Analyze policy
            analyzer = PolicyAnalyzer()
            result = analyzer.analyze_from_file(filepath)
            
            # Clean up
            os.unlink(filepath)
            
            # Extract vulnerabilities from risk_indicators for frontend display
            risk_indicators = result.get('risk_indicators', [])
            if risk_indicators:
                result['vulnerabilities'] = risk_indicators
            
            # Extract permissions if mentioned in policy
            permissions_mentioned = result.get('permissions_mentioned', [])
            if permissions_mentioned:
                result['permissions'] = {
                    'dangerous': permissions_mentioned,
                    'special': [],
                    'normal': []
                }
            
            # Extract data collection practices
            data_practices = result.get('data_practices', []) or result.get('collected_data', [])
            if data_practices:
                result['data_collection'] = data_practices
            
            # Extract findings/flags
            flags = result.get('flags', [])
            if flags:
                result['findings'] = flags
                result['issues'] = flags
            
            # Add metadata
            result['metadata'] = {
                'total_permissions': len(permissions_mentioned),
                'findings_count': len(flags),
                'vulnerabilities_count': len(risk_indicators),
                'data_collection_count': len(data_practices),
                'third_party_count': len(result.get('third_party_mentions', []))
            }
            
            return jsonify(result)
        except Exception as e:
            # Clean up on error
            if os.path.exists(filepath):
                os.unlink(filepath)
            return jsonify({'error': f'Policy analysis failed: {str(e)}'}), 500
    
    except Exception as e:
        print(f"Server error: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/analyze-policy-url', methods=['POST'])
def analyze_policy_url():
    try:
        if not PolicyAnalyzer:
            return jsonify({'error': 'Policy analyzer not available'}), 503
        
        data = request.get_json()
        if not data or not data.get('url'):
            return jsonify({'error': 'URL is required'}), 400
        
        url = data['url']
        
        try:
            # Analyze policy from URL
            analyzer = PolicyAnalyzer()
            result = analyzer.analyze_from_url(url)
            
            # Extract vulnerabilities from risk_indicators for frontend display
            risk_indicators = result.get('risk_indicators', [])
            if risk_indicators:
                result['vulnerabilities'] = risk_indicators
            
            # Extract permissions if mentioned in policy
            permissions_mentioned = result.get('permissions_mentioned', [])
            if permissions_mentioned:
                result['permissions'] = {
                    'dangerous': permissions_mentioned,
                    'special': [],
                    'normal': []
                }
            
            # Extract data collection practices
            data_practices = result.get('data_practices', []) or result.get('collected_data', [])
            if data_practices:
                result['data_collection'] = data_practices
            
            # Extract findings/flags
            flags = result.get('flags', [])
            if flags:
                result['findings'] = flags
                result['issues'] = flags
            
            # Add metadata
            result['metadata'] = {
                'total_permissions': len(permissions_mentioned),
                'findings_count': len(flags),
                'vulnerabilities_count': len(risk_indicators),
                'data_collection_count': len(data_practices),
                'third_party_count': len(result.get('third_party_mentions', []))
            }
            
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': f'Policy URL analysis failed: {str(e)}'}), 500
    
    except Exception as e:
        print(f"Server error: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/analyze-app-link', methods=['POST'])
def analyze_app_link():
    try:
        if not PlayStoreScraper:
            return jsonify({'error': 'Play Store scraper not available'}), 503
        
        data = request.get_json()
        if not data or not data.get('url'):
            return jsonify({'error': 'Play Store URL is required'}), 400
        
        url = data['url']
        package_name = data.get('package', url)  # Use extracted package if provided
        
        try:
            # Create scraper instance
            scraper = PlayStoreScraper()
            
            # Try to extract app data using package name first
            if package_name and '/' not in package_name:
                # Direct package name lookup
                app_data = scraper.scrape_by_package(package_name)
            else:
                # Full URL scraping
                app_data = scraper.scrape_app(url)
            
            if not app_data:
                return jsonify({'status': 'failed', 'reason': 'App not found in Play Store'}), 404
            
            # If privacy policy URL found, analyze it
            if app_data.get('privacy_policy_url') and PolicyAnalyzer:
                try:
                    analyzer = PolicyAnalyzer()
                    policy_analysis = analyzer.analyze_from_url(app_data['privacy_policy_url'])
                    app_data['policy_analysis'] = policy_analysis
                    
                    # Calculate combined risk score
                    if RiskEngine:
                        risk_engine = RiskEngine()
                        # Create mock permissions for risk calculation
                        apk_data = {
                            'permissions': {
                                'dangerous': app_data.get('permissions', [])[:3],
                                'special': [],
                                'normal': []
                            }
                        }
                        risk_assessment = risk_engine.calculate_combined_risk(apk_data, policy_analysis)
                        app_data['risk_assessment'] = risk_assessment
                        
                        # Add calculated metrics for frontend display
                        app_data['findings'] = policy_analysis.get('flags', []) or policy_analysis.get('findings', []) or []
                        app_data['flags'] = policy_analysis.get('flags', [])
                        app_data['issues'] = policy_analysis.get('issues', [])
                        
                        # Calculate data collection from policy analysis
                        data_practices = policy_analysis.get('data_practices', []) or policy_analysis.get('collected_data', [])
                        app_data['data_collection'] = data_practices
                        
                        # Calculate vulnerabilities from risk indicators
                        risk_indicators = policy_analysis.get('risk_indicators', []) or []
                        app_data['vulnerabilities'] = risk_indicators
                        
                        # Estimate third-party from policy mentions
                        third_party_mentions = policy_analysis.get('third_party_mentions', []) or []
                        app_data['third_party'] = third_party_mentions
                
                except Exception as policy_error:
                    print(f"Policy analysis failed: {policy_error}")
                    app_data['policy_analysis'] = {'error': 'Policy analysis failed'}
            
            # Ensure permissions is always an array for display
            if not app_data.get('permissions'):
                app_data['permissions'] = []
            
            # Add calculated metadata for frontend
            app_data['metadata'] = {
                'total_permissions': len(app_data.get('permissions', [])),
                'findings_count': len(app_data.get('findings', [])),
                'vulnerabilities_count': len(app_data.get('vulnerabilities', [])),
                'data_collection_count': len(app_data.get('data_collection', [])),
                'third_party_count': len(app_data.get('third_party', []))
            }
            
            return jsonify(app_data)
        
        except Exception as e:
            return jsonify({'status': 'failed', 'reason': f'Play Store metadata unavailable: {str(e)}'}), 500
    
    except Exception as e:
        print(f"Server error: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'service': 'APK Analyzer',
        'version': '1.0.0',
        'using_androguard': USE_ANDROGUARD,
        'advanced_features': {
            'policy_analyzer': PolicyAnalyzer is not None,
            'playstore_scraper': PlayStoreScraper is not None,
            'risk_engine': RiskEngine is not None
        }
    })

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum file size is 2GB.'}), 413

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"Starting APK Analyzer Service on port {port}")
    print(f"Debug mode: {debug}")
    print(f"Using Androguard: {USE_ANDROGUARD}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
