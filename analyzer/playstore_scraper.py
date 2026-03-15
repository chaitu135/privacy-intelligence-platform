import requests
import re
import json
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs

class PlayStoreScraper:
    def __init__(self):
        self.base_url = "https://play.google.com/store/apps/details"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Referer': 'https://www.google.com/'
        }

    def extract_app_id(self, url: str) -> str:
        """Extract app ID from Play Store URL"""
        patterns = [
            r'id=([a-zA-Z0-9._]+)',
            r'/store/apps/details/([a-zA-Z0-9._]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return url

    def scrape_by_package(self, package_name: str) -> dict:
        """Scrape app data using package name directly"""
        try:
            url = f"{self.base_url}?id={package_name}"
            response = requests.get(url, headers=self.headers, timeout=15)
            
            if response.status_code != 200:
                return None
                
            return self._parse_app_page(response.text, package_name)
            
        except Exception as e:
            print(f"Error scraping by package: {e}")
            return None

    def scrape_app(self, url: str) -> dict:
        """Scrape app data using full URL"""
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            
            if response.status_code != 200:
                return None
                
            return self._parse_app_page(response.text, self.extract_app_id(url))
            
        except Exception as e:
            print(f"Error scraping app: {e}")
            return None

    def _parse_app_page(self, html_content: str, app_id: str = None) -> dict:
        """Parse HTML content and extract app metadata using multiple methods"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Try to extract from JSON-LD scripts first (most reliable)
            json_ld_data = self._extract_json_ld(soup)
            
            # Extract from modern Play Store structure
            metadata = {
                'app_id': app_id,
                'app_name': self._extract_app_name(soup, json_ld_data),
                'developer': self._extract_developer(soup, json_ld_data),
                'category': self._extract_category(soup, json_ld_data),
                'rating': self._extract_rating(soup, json_ld_data),
                'reviews': self._extract_reviews(soup, json_ld_data),
                'installs': self._extract_installs(soup),
                'size': self._extract_size(soup),
                'privacy_policy_url': self._extract_privacy_policy_url(soup, html_content, json_ld_data),
                'description': self._extract_description(soup, json_ld_data),
                'permissions': self._extract_permissions(soup),
                'screenshots': self._extract_screenshots(soup),
                'last_updated': self._extract_last_updated(soup),
                'content_rating': self._extract_content_rating(soup),
                'price': self._extract_price(soup, json_ld_data),
                'app_icon': self._extract_app_icon(soup, json_ld_data),
                'version': self._extract_version(soup)
            }
            
            return metadata
            
        except Exception as e:
            print(f"Error parsing app page: {e}")
            return {
                'error': f'Failed to parse app page: {str(e)}',
                'app_id': app_id
            }

    def _extract_json_ld(self, soup) -> dict:
        """Extract JSON-LD structured data from page"""
        try:
            scripts = soup.find_all('script', type='application/ld+json')
            for script in scripts:
                if script.string:
                    try:
                        data = json.loads(script.string)
                        if isinstance(data, dict) and data.get('@type') in ['MobileApplication', 'SoftwareApplication']:
                            return data
                    except:
                        continue
        except Exception as e:
            print(f"Error extracting JSON-LD: {e}")
        return {}

    def _extract_app_name(self, soup, json_ld_data: dict) -> str:
        """Extract app name using multiple methods"""
        # Try JSON-LD first
        if json_ld_data.get('name'):
            return json_ld_data['name']
        
        # Modern Play Store selectors
        selectors = [
            'h1 span',  # Main title
            'header h1',
            '[itemprop="name"]',
            '.pdO6Zc',  # New Play Store class
            '.zoLrYd',
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                text = element.get_text().strip()
                if text and len(text) > 1:
                    return text
        
        # Try meta tags
        meta = soup.find('meta', property='og:title')
        if meta and meta.get('content'):
            return meta['content'].replace(' - Apps on Google Play', '')
        
        return 'Unknown App'

    def _extract_developer(self, soup, json_ld_data: dict) -> str:
        """Extract developer name"""
        # Try JSON-LD first
        author = json_ld_data.get('author')
        if isinstance(author, dict):
            return author.get('name', 'Unknown Developer')
        elif isinstance(author, str):
            return author
        
        # Try modern selectors
        selectors = [
            'a[href*="developer"]',  # Developer link
            '.VfPpkd-WsjYwc-H9qlCb .VfPpkd-HU1gCc',  # Developer name in header
            '[data-g-id="developer"]',
            '.zoLrYd + div a',  # Link after title
            'header a[href*="dev"]',  # Developer link in header
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                text = element.get_text().strip()
                if text and text not in ['Developer', 'Visit website']:
                    return text
        
        # Try to find developer in links
        for link in soup.find_all('a', href=True):
            href = link.get('href', '')
            if 'dev?id=' in href or 'developer?' in href:
                text = link.get_text().strip()
                if text and len(text) > 1:
                    return text
        
        return 'Unknown Developer'

    def _extract_category(self, soup, json_ld_data: dict) -> str:
        """Extract app category"""
        # Try JSON-LD first
        if json_ld_data.get('applicationCategory'):
            return json_ld_data['applicationCategory']
        
        # Try modern selectors
        selectors = [
            'a[href*="category"]',  # Category link
            '[itemprop="genre"]',
            '.VfPpkd-WsjYwc-H9qlCb a[href*="category"]',
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                text = element.get_text().strip()
                if text:
                    return text
        
        return 'Unknown Category'

    def _extract_rating(self, soup, json_ld_data: dict) -> str:
        """Extract app rating"""
        # Try JSON-LD first
        aggregate = json_ld_data.get('aggregateRating', {})
        if aggregate.get('ratingValue'):
            return str(aggregate['ratingValue'])
        
        # Try modern selectors - look for rating value
        selectors = [
            'div[aria-label*="star"]',  # Rating score
            '.TT9eCd',  # Rating score
            '.BHMmbe',  # Classic rating
            '[itemprop="ratingValue"]',
            'div[data-score]',
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                # Try aria-label first
                aria_label = element.get('aria-label', '')
                match = re.search(r'(\d+\.?\d*)\s*star', aria_label, re.IGNORECASE)
                if match:
                    return match.group(1)
                
                # Try data attribute
                score = element.get('data-score')
                if score:
                    return str(score)
                
                # Try text content
                text = element.get_text().strip()
                if text and re.match(r'^\d+\.?\d*$', text):
                    return text
        
        return 'N/A'

    def _extract_reviews(self, soup, json_ld_data: dict) -> str:
        """Extract number of reviews"""
        # Try JSON-LD first
        aggregate = json_ld_data.get('aggregateRating', {})
        if aggregate.get('reviewCount'):
            return str(aggregate['reviewCount'])
        
        if aggregate.get('ratingCount'):
            return str(aggregate['ratingCount'])
        
        # Try modern selectors
        selectors = [
            'span[aria-label*="reviews"]',  # Reviews count
            '.g1rdde',  # Reviews text
            '.EymY4b',
            '[itemprop="ratingCount"]',
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                aria_label = element.get('aria-label', '')
                match = re.search(r'([\d,]+)\s*reviews?', aria_label, re.IGNORECASE)
                if match:
                    return match.group(1)
                
                text = element.get_text().strip()
                # Look for patterns like "1.2M reviews" or "50,000 reviews"
                match = re.search(r'([\d.MK,]+)', text)
                if match and ('review' in text.lower() or 'rating' in text.lower()):
                    return match.group(1)
        
        return 'N/A'

    def _extract_installs(self, soup) -> str:
        """Extract number of installs"""
        selectors = [
            'div[aria-label*="downloads"]',  # Downloads label
            'div[aria-label*="installs"]',
            '.Cl1Eob',
            '.xg1aie',
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                aria_label = element.get('aria-label', '')
                match = re.search(r'([\d.MK,]+)\s*(?:downloads?|installs?)', aria_label, re.IGNORECASE)
                if match:
                    return match.group(1)
                
                text = element.get_text().strip()
                # Look for patterns like "10M+" or "50,000,000+"
                match = re.search(r'([\d.MK+,]+)', text)
                if match:
                    return match.group(1)
        
        return 'N/A'

    def _extract_size(self, soup) -> str:
        """Extract app size"""
        # Look for size in various divs
        size_divs = soup.find_all(['div', 'span'])
        for div in size_divs:
            text = div.get_text().strip()
            if re.match(r'^\d+\.?\d*\s*(MB|GB|KB)$', text, re.IGNORECASE):
                return text
        
        # Try aria labels
        size_elements = soup.find_all(attrs={'aria-label': re.compile(r'.*(MB|GB|KB)', re.IGNORECASE)})
        for elem in size_elements:
            aria = elem.get('aria-label', '')
            match = re.search(r'(\d+\.?\d*\s*(MB|GB|KB))', aria, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return 'N/A'

    def _extract_privacy_policy_url(self, soup, html_content: str, json_ld_data: dict = None) -> str:
        """Extract privacy policy URL - tries multiple methods to get the actual app policy"""
        
        # Helper to check if URL is a generic Google policy
        def is_generic_google_policy(url):
            if not url:
                return True
            generic_patterns = [
                'policies.google.com',
                'support.google.com',
                'play.google.com',
                'google.com/privacy',
                'google.com/intl',
            ]
            return any(pattern in url.lower() for pattern in generic_patterns)
        
        # Method 1: Try JSON-LD first (most reliable)
        if json_ld_data and json_ld_data.get('privacyPolicyUrl'):
            url = json_ld_data['privacyPolicyUrl']
            if not is_generic_google_policy(url):
                return url
        
        # Method 2: Look for links with specific privacy policy text
        for link in soup.find_all('a', href=True):
            link_text = link.get_text().strip().lower()
            href = link['href']
            
            # Look for explicit privacy policy links
            if 'privacy policy' in link_text or 'privacy_policy' in link_text:
                if href.startswith('http') and not is_generic_google_policy(href):
                    return href
            
            # Also check aria-label
            aria_label = link.get('aria-label', '').lower()
            if 'privacy' in aria_label:
                if href.startswith('http') and not is_generic_google_policy(href):
                    return href
        
        # Method 3: Look for data-ui-meta attribute which often contains the real URL
        for link in soup.find_all('a', {'data-ui-meta': True}):
            try:
                meta_data = json.loads(link.get('data-ui-meta', '{}'))
                href = meta_data.get('href', '')
                if 'privacy' in href.lower() and href.startswith('http'):
                    if not is_generic_google_policy(href):
                        return href
            except:
                pass
        
        # Method 4: Search in onclick attributes
        for link in soup.find_all('a', onclick=True):
            onclick = link.get('onclick', '')
            match = re.search(r'(https?://[^\s"\'>]+privacy[^\s"\'>]*)', onclick, re.I)
            if match:
                url = match.group(1)
                if not is_generic_google_policy(url):
                    return url
        
        # Method 5: Search in entire HTML for app-specific privacy URLs
        # Look for patterns like "carx-tech.com/privacy" or similar
        domain_patterns = [
            r'(https?://[\w.-]+/privacy[\w./?&=~-]*)',
            r'(https?://[\w.-]+/privacy-policy[\w./?&=~-]*)',
            r'(https?://[\w.-]+/legal/privacy[\w./?&=~-]*)',
        ]
        for pattern in domain_patterns:
            matches = re.findall(pattern, html_content, re.I)
            for url in matches:
                if not is_generic_google_policy(url):
                    return url
        
        # Method 6: Try to construct from developer website
        dev_website = self._extract_developer_website(soup)
        if dev_website:
            # Common privacy policy paths
            possible_paths = [
                '/privacy',
                '/privacy-policy',
                '/legal/privacy',
                '/privacy.html',
            ]
            for path in possible_paths:
                constructed_url = dev_website.rstrip('/') + path
                # Don't return if it looks like a Google URL
                if not is_generic_google_policy(constructed_url):
                    return constructed_url
        
        # Method 7: Check all links for any non-Google privacy URL
        for link in soup.find_all('a', href=True):
            href = link.get('href', '')
            if 'privacy' in href.lower() and href.startswith('http'):
                if not is_generic_google_policy(href):
                    return href
        
        return None
    
    def _extract_developer_website(self, soup) -> str:
        """Extract developer website URL"""
        for link in soup.find_all('a', href=True):
            text = link.get_text().strip().lower()
            if any(keyword in text for keyword in ['visit website', 'developer website', 'homepage']):
                href = link['href']
                if href.startswith('http') and 'play.google.com' not in href:
                    return href
        return None

    def _extract_description(self, soup, json_ld_data: dict) -> str:
        """Extract app description"""
        # Try JSON-LD first
        if json_ld_data.get('description'):
            return json_ld_data['description'][:500]
        
        selectors = [
            'div[data-g-id="description"]',
            '[itemprop="description"]',
            '.bARER',
            '.DWPxHb',
            '.PD3uP',
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                text = element.get_text().strip()
                if text and len(text) > 10:
                    return text[:500]
        
        return 'No description available'

    def _extract_permissions(self, soup) -> list:
        """Extract app permissions"""
        permissions = []
        
        # Look for permission section
        perm_section = soup.find(string=re.compile(r'Permissions', re.I))
        if perm_section:
            parent = perm_section.parent
            if parent:
                for elem in parent.find_all_next(['div', 'span'], limit=30):
                    text = elem.get_text().strip()
                    if text and len(text) > 3 and text not in permissions:
                        permissions.append(text)
                        if len(permissions) >= 10:
                            break
        
        return permissions

    def _extract_screenshots(self, soup) -> list:
        """Extract app screenshots"""
        screenshots = []
        
        # Look for screenshot images
        for img in soup.find_all('img', src=True):
            src = img['src']
            if any(pattern in src.lower() for pattern in ['screenshot', 'play-lh.googleusercontent.com']):
                if src not in screenshots:
                    screenshots.append(src)
                    if len(screenshots) >= 5:
                        break
        
        return screenshots

    def _extract_last_updated(self, soup) -> str:
        """Extract last updated date"""
        # Look for updated text
        for div in soup.find_all(['div', 'span']):
            text = div.get_text().strip()
            if re.search(r'(updated|released)\s+(on\s+)?', text, re.I):
                return text
        
        return 'N/A'

    def _extract_content_rating(self, soup) -> str:
        """Extract content rating"""
        selectors = [
            'span[aria-label*="Rated"]',  # Content rating with aria-label
            'div[aria-label*="Rated"]',
            '.g1rdde',  # Often contains content rating
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                aria_label = element.get('aria-label', '')
                if 'Rated' in aria_label:
                    return aria_label
                
                text = element.get_text().strip()
                if re.search(r'Rated.*\d\+|PEGI|ESRB', text):
                    return text
        
        return 'N/A'

    def _extract_price(self, soup, json_ld_data: dict) -> str:
        """Extract app price"""
        # Try JSON-LD
        offers = json_ld_data.get('offers', {})
        if isinstance(offers, dict):
            price = offers.get('price')
            if price and price != '0':
                return f"${price}"
            else:
                return 'Free'
        
        # Try to find price button or text
        for elem in soup.find_all(['button', 'span']):
            text = elem.get_text().strip()
            if text in ['Install', 'Free']:
                return 'Free'
            elif re.match(r'^\$?\d+\.?\d*$', text):
                return text
        
        return 'Free'

    def _extract_app_icon(self, soup, json_ld_data: dict) -> str:
        """Extract app icon URL"""
        # Try JSON-LD
        if json_ld_data.get('image'):
            return json_ld_data['image']
        
        # Try meta tags
        meta = soup.find('meta', property='og:image')
        if meta and meta.get('content'):
            return meta['content']
        
        # Try to find icon image
        for img in soup.find_all('img', src=True):
            src = img['src']
            if 'play-lh.googleusercontent.com' in src:
                return src
        
        return None

    def _extract_version(self, soup) -> str:
        """Extract app version"""
        # Look for version text
        for div in soup.find_all(['div', 'span']):
            text = div.get_text().strip()
            match = re.search(r'Version\s*([\d.]+)', text, re.I)
            if match:
                return match.group(1)
        
        return 'N/A'

    def validate_url(self, url: str) -> bool:
        """Validate if URL is a Play Store URL"""
        return 'play.google.com' in url.lower() and ('/store/apps/details' in url.lower() or 'id=' in url.lower())
