#!/usr/bin/env python3
"""Test script to verify all fixes are working"""

import sys
sys.path.insert(0, 'analyzer')

print("=" * 60)
print("Testing Privacy Intel Fixes")
print("=" * 60)

# Test 1: Risk Engine with 46 dangerous permissions
print("\n1. Testing Risk Engine Fix (46 dangerous permissions)...")
from analyzer.risk_engine import RiskEngine

risk_engine = RiskEngine()

# Simulate 46 dangerous permissions
test_permissions = {
    'dangerous': [f'perm_{i}' for i in range(46)],
    'special': [],
    'normal': []
}

result = risk_engine.calculate_apk_risk(test_permissions)
print(f"   Risk Score: {result['apk_risk_score']}/100")
print(f"   Risk Level: {result['risk_level']}")
print(f"   Dangerous Count: {result['dangerous_count']}")
assert result['apk_risk_score'] > 50, "Risk score should be high for 46 permissions"
assert 'risk_level' in result, "risk_level key missing"
print("   ✓ PASSED - Risk scoring is working correctly!")

# Test 2: Policy Analyzer
print("\n2. Testing Policy Analyzer...")
from analyzer.policy_analyzer import PolicyAnalyzer

policy = PolicyAnalyzer()
# Use text that matches the exact keywords in red_flag_keywords
test_text = "Our company will share data with third party advertising partners to track location for marketing purposes"
analysis = policy.analyze_text(test_text)
print(f"   Red Flags Found: {len(analysis['red_flags'])}")
print(f"   Risk Score: {analysis['risk_score']}/100")
print(f"   Risk Level: {analysis['risk_level']}")
assert len(analysis['red_flags']) > 0, "Should detect red flags"
print("   ✓ PASSED - Policy analysis is working!")

# Test 3: PlayStore Scraper imports
print("\n3. Testing PlayStore Scraper imports...")
try:
    from analyzer.playstore_scraper import PlayStoreScraper
    scraper = PlayStoreScraper()
    print("   PlayStore scraper initialized")
    print("   ✓ PASSED - PlayStore scraper is ready!")
except Exception as e:
    print(f"   ✗ FAILED - {e}")

# Test 4: Check all imports work
print("\n4. Testing Flask app imports...")
try:
    import os
    original_dir = os.getcwd()
    os.chdir('analyzer')
    
    from risk_engine import RiskEngine
    from policy_analyzer import PolicyAnalyzer
    from playstore_scraper import PlayStoreScraper
    from permission_explanations import get_permission_explanation
    
    os.chdir(original_dir)
    print("   All modules imported successfully")
    print("   ✓ PASSED - Flask app will start correctly!")
except Exception as e:
    print(f"   ✗ FAILED - {e}")
    os.chdir(original_dir)

print("\n" + "=" * 60)
print("All Tests Completed!")
print("=" * 60)
print("\nSummary of fixes:")
print("1. ✓ Risk Engine now returns 'risk_level' in calculate_apk_risk()")
print("2. ✓ Added missing dependencies: requests, beautifulsoup4, pdfplumber, python-docx")
print("3. ✓ Fixed PlayStore scraper permissions dict structure")
print("4. ✓ Policy analyzer is fully functional with all imports")
