#!/usr/bin/env python3
import sys
import os

# Change to analyzer directory
os.chdir('c:\\Users\\chaitanya\\OneDrive\\Desktop\\ai\\privacy-intel\\analyzer')
sys.path.insert(0, '.')

print("=" * 60)
print("Diagnostic: Module Import Check")
print("=" * 60)
print(f"Current directory: {os.getcwd()}")
print(f"Python version: {sys.version}")
print()

# Test each import individually
modules_to_test = [
    ('risk_engine', 'RiskEngine'),
    ('policy_analyzer', 'PolicyAnalyzer'),
    ('playstore_scraper', 'PlayStoreScraper'),
    ('permission_explanations', 'get_permission_explanation'),
]

results = {}
for module_name, class_name in modules_to_test:
    try:
        print(f"Testing {module_name}...", end=' ')
        module = __import__(module_name)
        if hasattr(module, class_name):
            print(f"✓ PASS")
            results[module_name] = True
        else:
            print(f"✗ FAIL - No attribute '{class_name}'")
            results[module_name] = False
    except Exception as e:
        print(f"✗ FAIL - {str(e)[:50]}")
        results[module_name] = False
        import traceback
        traceback.print_exc()

print()
print("=" * 60)
print("Summary:")
print("=" * 60)
for module_name, result in results.items():
    status = "✓" if result else "✗"
    print(f"{status} {module_name}: {'Pass' if result else 'Fail'}")
