#!/usr/bin/env python3
"""Test script to debug Play Store scraping for CarX Highway Racing"""

import requests
import sys
import os

# Add the analyzer directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'analyzer'))

from playstore_scraper import PlayStoreScraper

def test_scraper():
    url = "https://play.google.com/store/apps/details?id=com.CarXTech.highWay&pcampaignid=web_share"
    
    print("=" * 60)
    print("Testing Play Store Scraper")
    print("=" * 60)
    print(f"\nURL: {url}")
    print()
    
    scraper = PlayStoreScraper()
    
    # Test extraction
    result = scraper.scrape_app(url)
    
    if result:
        print("\n" + "=" * 60)
        print("SCRAPED DATA:")
        print("=" * 60)
        
        for key, value in result.items():
            if key == 'error':
                print(f"\n❌ ERROR: {value}")
            else:
                print(f"\n{key}: {value}")
        
        # Check critical fields
        print("\n" + "=" * 60)
        print("DATA QUALITY CHECK:")
        print("=" * 60)
        
        checks = [
            ('app_name', result.get('app_name'), 'Unknown App'),
            ('developer', result.get('developer'), 'Unknown Developer'),
            ('rating', result.get('rating'), 'N/A'),
            ('reviews', result.get('reviews'), 'N/A'),
            ('installs', result.get('installs'), 'N/A'),
            ('size', result.get('size'), 'N/A'),
            ('privacy_policy_url', result.get('privacy_policy_url'), None),
        ]
        
        for field, value, bad_value in checks:
            if value and value != bad_value:
                print(f"✅ {field}: {value}")
            else:
                print(f"❌ {field}: FAILED (got '{value}')")
                
        # Check privacy policy specifically
        privacy_url = result.get('privacy_policy_url')
        if privacy_url:
            if 'policies.google.com' in privacy_url or 'support.google.com' in privacy_url:
                print(f"⚠️  Privacy policy appears to be generic Google policy: {privacy_url}")
            else:
                print(f"✅ Privacy policy appears to be app-specific: {privacy_url}")
        else:
            print("❌ No privacy policy URL found")
            
    else:
        print("❌ Scraping returned None")
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    test_scraper()
