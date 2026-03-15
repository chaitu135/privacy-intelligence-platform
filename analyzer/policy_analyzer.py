import re
import json
import requests
from typing import Dict, List, Tuple
from urllib.parse import urlparse
import pdfplumber
import docx

class PolicyAnalyzer:
    def __init__(self):
        self.red_flag_keywords = [
            'share data', 'sell data', 'third party advertising', 'location tracking',
            'biometric data', 'contacts access', 'call logs', 'microphone recording',
            'precise location', 'personal information', 'advertising partners',
            'data brokers', 'marketing purposes', 'targeted ads', 'user profiling'
        ]
        
        self.green_flag_keywords = [
            'we do not sell', 'user data deletion', 'data encryption', 'minimal data collection',
            'opt out', 'privacy protection', 'data minimization', 'user consent',
            'secure storage', 'anonymized data', 'privacy by design', 'data protection'
        ]
        
        self.yellow_flag_keywords = [
            'analytics', 'cookies', 'usage data', 'device identifiers', 'crash reporting',
            'performance monitoring', 'usage statistics', 'anonymous usage', 'third parties',
            'service providers', 'necessary cookies', 'functional cookies'
        ]

    def analyze_text(self, text: str) -> Dict:
        """Analyze policy text and return flags and insights"""
        text_lower = text.lower()
        
        red_flags = self._find_flags(text_lower, self.red_flag_keywords, 'red')
        green_flags = self._find_flags(text_lower, self.green_flag_keywords, 'green')
        yellow_flags = self._find_flags(text_lower, self.yellow_flag_keywords, 'yellow')
        
        # Calculate risk score
        risk_score = (len(red_flags) * 15) + (len(yellow_flags) * 5) - (len(green_flags) * 10)
        risk_score = max(0, min(100, risk_score))  # Clamp between 0-100
        
        return {
            'red_flags': red_flags,
            'green_flags': green_flags,
            'yellow_flags': yellow_flags,
            'risk_score': risk_score,
            'risk_level': self._get_risk_level(risk_score),
            'total_flags': len(red_flags) + len(green_flags) + len(yellow_flags),
            'analysis_summary': self._generate_summary(red_flags, green_flags, yellow_flags)
        }

    def _find_flags(self, text: str, keywords: List[str], flag_type: str) -> List[Dict]:
        """Find flags in text based on keywords"""
        flags = []
        for keyword in keywords:
            if keyword in text:
                # Find context around the keyword
                matches = re.finditer(f'.{{0,50}}{re.escape(keyword)}.{{0,50}}', text, re.IGNORECASE)
                for match in matches:
                    flags.append({
                        'type': flag_type,
                        'keyword': keyword,
                        'context': match.group().strip(),
                        'severity': self._get_severity(keyword, flag_type)
                    })
        return flags

    def _get_severity(self, keyword: str, flag_type: str) -> str:
        """Determine severity of a flag"""
        high_severity_keywords = [
            'sell data', 'biometric data', 'precise location', 'call logs', 'microphone recording'
        ]
        
        if flag_type == 'red' and keyword in high_severity_keywords:
            return 'high'
        elif flag_type == 'red':
            return 'medium'
        elif flag_type == 'yellow':
            return 'low'
        else:
            return 'info'

    def _get_risk_level(self, score: int) -> str:
        """Convert risk score to risk level"""
        if score <= 20:
            return 'Low Risk'
        elif score <= 50:
            return 'Moderate Risk'
        elif score <= 80:
            return 'High Risk'
        else:
            return 'Critical Risk'

    def _generate_summary(self, red_flags: List, green_flags: List, yellow_flags: List) -> str:
        """Generate analysis summary"""
        if len(red_flags) > 5:
            return "This privacy policy shows significant privacy concerns with multiple red flags indicating potential data sharing and tracking practices."
        elif len(red_flags) > 2:
            return "The privacy policy contains several concerning statements that may impact user privacy."
        elif len(green_flags) > len(red_flags):
            return "The privacy policy appears to prioritize user privacy with strong protective measures."
        elif len(yellow_flags) > 3:
            return "The policy uses standard data practices but lacks clear privacy commitments."
        else:
            return "The privacy policy provides basic information but could be more transparent about data practices."

    def analyze_from_url(self, url: str) -> Dict:
        """Analyze privacy policy from URL"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Extract text from HTML
            text = self._extract_text_from_html(response.text)
            return self.analyze_text(text)
            
        except Exception as e:
            return {
                'error': f'Failed to analyze policy from URL: {str(e)}',
                'red_flags': [],
                'green_flags': [],
                'yellow_flags': [],
                'risk_score': 50,
                'risk_level': 'Moderate Risk'
            }

    def analyze_from_file(self, file_path: str) -> Dict:
        """Analyze privacy policy from file"""
        try:
            if file_path.endswith('.pdf'):
                text = self._extract_text_from_pdf(file_path)
            elif file_path.endswith('.docx'):
                text = self._extract_text_from_docx(file_path)
            elif file_path.endswith('.txt'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
            else:
                return {
                    'error': 'Unsupported file format. Please use PDF, DOCX, or TXT files.',
                    'red_flags': [],
                    'green_flags': [],
                    'yellow_flags': [],
                    'risk_score': 50,
                    'risk_level': 'Moderate Risk'
                }
            
            return self.analyze_text(text)
            
        except Exception as e:
            return {
                'error': f'Failed to analyze policy file: {str(e)}',
                'red_flags': [],
                'green_flags': [],
                'yellow_flags': [],
                'risk_score': 50,
                'risk_level': 'Moderate Risk'
            }

    def _extract_text_from_html(self, html: str) -> str:
        """Extract text from HTML content"""
        # Simple HTML tag removal
        import re
        text = re.sub(r'<[^>]+>', '', html)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            print(f"PDF extraction error: {e}")
        return text.strip()

    def _extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        text = ""
        try:
            doc = docx.Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            print(f"DOCX extraction error: {e}")
        return text.strip()
