from typing import Dict, List, Tuple
import json

class RiskEngine:
    def __init__(self):
        self.permission_weights = {
            'dangerous': 10,
            'special': 20,
            'tracking': 15,
            'normal': 0
        }
        
        self.tracking_permissions = [
            'ACCESS_FINE_LOCATION',
            'ACCESS_COARSE_LOCATION',
            'ACCESS_BACKGROUND_LOCATION',
            'READ_PHONE_STATE',
            'GET_ACCOUNTS',
            'READ_CONTACTS',
            'READ_CALL_LOG',
            'READ_SMS',
            'RECEIVE_SMS',
            'RECORD_AUDIO',
            'CAMERA',
            'ACCESS_MEDIA_LOCATION',
            'ACTIVITY_RECOGNITION'
        ]

    def calculate_apk_risk(self, permissions: Dict) -> Dict:
        """Calculate risk score based on APK permissions"""
        dangerous_count = len(permissions.get('dangerous', []))
        special_count = len(permissions.get('special', []))
        normal_count = len(permissions.get('normal', []))
        
        # Identify tracking permissions
        all_permissions = (permissions.get('dangerous', []) + 
                          permissions.get('special', []) + 
                          permissions.get('normal', []))
        
        tracking_count = len([p for p in all_permissions if p in self.tracking_permissions])
        
        # Calculate base risk score
        apk_risk = (dangerous_count * self.permission_weights['dangerous'] +
                   special_count * self.permission_weights['special'] +
                   tracking_count * self.permission_weights['tracking'])
        
        risk_score = min(100, apk_risk)
        
        return {
            'apk_risk_score': risk_score,
            'risk_level': self._get_risk_level(risk_score),
            'dangerous_count': dangerous_count,
            'special_count': special_count,
            'normal_count': normal_count,
            'tracking_count': tracking_count,
            'total_permissions': dangerous_count + special_count + normal_count,
            'risk_factors': self._identify_risk_factors(permissions, tracking_count)
        }

    def calculate_policy_risk(self, policy_analysis: Dict) -> Dict:
        """Calculate risk score based on policy analysis"""
        red_flags = policy_analysis.get('red_flags', [])
        green_flags = policy_analysis.get('green_flags', [])
        yellow_flags = policy_analysis.get('yellow_flags', [])
        
        # Weighted scoring
        policy_risk = (len(red_flags) * 15) + (len(yellow_flags) * 5) - (len(green_flags) * 10)
        policy_risk = max(0, min(100, policy_risk))
        
        return {
            'policy_risk_score': policy_risk,
            'red_flags_count': len(red_flags),
            'green_flags_count': len(green_flags),
            'yellow_flags_count': len(yellow_flags),
            'total_flags': len(red_flags) + len(green_flags) + len(yellow_flags),
            'policy_risk_factors': self._identify_policy_risk_factors(red_flags, green_flags, yellow_flags)
        }

    def calculate_combined_risk(self, apk_data: Dict, policy_data: Dict = None) -> Dict:
        """Calculate combined privacy risk score"""
        apk_risk = self.calculate_apk_risk(apk_data.get('permissions', {}))
        
        combined_risk = {
            'apk_risk': apk_risk,
            'final_risk_score': apk_risk['apk_risk_score'],
            'risk_level': self._get_risk_level(apk_risk['apk_risk_score']),
            'recommendations': self._generate_recommendations(apk_risk, None)
        }
        
        if policy_data:
            policy_risk = self.calculate_policy_risk(policy_data)
            combined_risk['policy_risk'] = policy_risk
            
            # Combine scores (70% APK, 30% policy)
            final_score = int(apk_risk['apk_risk_score'] * 0.7 + policy_risk['policy_risk_score'] * 0.3)
            combined_risk['final_risk_score'] = final_score
            combined_risk['risk_level'] = self._get_risk_level(final_score)
            combined_risk['recommendations'] = self._generate_recommendations(apk_risk, policy_risk)
        
        return combined_risk

    def _identify_risk_factors(self, permissions: Dict, tracking_count: int) -> List[str]:
        """Identify specific risk factors from permissions"""
        factors = []
        
        dangerous = permissions.get('dangerous', [])
        special = permissions.get('special', [])
        
        if tracking_count > 0:
            factors.append(f"App requests {tracking_count} tracking-related permissions")
        
        if len(dangerous) > 5:
            factors.append(f"High number of dangerous permissions ({len(dangerous)})")
        
        if len(special) > 2:
            factors.append(f"Multiple special permissions ({len(special)})")
        
        # Check for specific high-risk permissions
        high_risk_perms = ['SYSTEM_ALERT_WINDOW', 'WRITE_SECURE_SETTINGS', 'BIND_DEVICE_ADMIN']
        for perm in special:
            if any(hr in perm for hr in high_risk_perms):
                factors.append(f"Requests system-level permission: {perm}")
        
        return factors

    def _identify_policy_risk_factors(self, red_flags: List, green_flags: List, yellow_flags: List) -> List[str]:
        """Identify policy risk factors"""
        factors = []
        
        if len(red_flags) > 3:
            factors.append("Privacy policy contains multiple concerning statements")
        
        if len(green_flags) == 0:
            factors.append("No clear privacy protection commitments found")
        
        if len(yellow_flags) > 5:
            factors.append("Extensive data collection and tracking practices")
        
        # Check for specific concerning patterns
        red_flag_texts = [flag.get('keyword', '') for flag in red_flags]
        if any('sell' in text.lower() for text in red_flag_texts):
            factors.append("Policy mentions selling user data")
        
        if any('third party' in text.lower() for text in red_flag_texts):
            factors.append("Data sharing with third parties")
        
        return factors

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

    def _generate_recommendations(self, apk_risk: Dict, policy_risk: Dict = None) -> List[str]:
        """Generate privacy recommendations"""
        recommendations = []
        
        # APK-based recommendations
        if apk_risk['tracking_count'] > 0:
            recommendations.append("Review location and tracking permissions - consider if they're necessary")
        
        if apk_risk['special_count'] > 2:
            recommendations.append("Be cautious with apps requesting multiple system-level permissions")
        
        if apk_risk['dangerous_count'] > 5:
            recommendations.append("This app requests many sensitive permissions - review privacy settings")
        
        # Policy-based recommendations
        if policy_risk:
            if policy_risk['red_flags_count'] > policy_risk['green_flags_count']:
                recommendations.append("Privacy policy raises concerns - consider alternatives")
            
            if policy_risk['yellow_flags_count'] > 3:
                recommendations.append("App uses extensive analytics and tracking - check settings")
        
        # General recommendations
        if apk_risk['apk_risk_score'] > 60:
            recommendations.append("Consider reviewing app permissions in device settings")
            recommendations.append("Monitor app behavior after installation")
        
        if len(recommendations) == 0:
            recommendations.append("App appears to have standard privacy practices")
        
        return recommendations

    def generate_comprehensive_report(self, app_metadata: Dict, apk_analysis: Dict, 
                                    policy_analysis: Dict = None) -> Dict:
        """Generate comprehensive privacy report"""
        risk_assessment = self.calculate_combined_risk(apk_analysis, policy_analysis)
        
        report = {
            'app_info': {
                'name': app_metadata.get('appName', 'Unknown'),
                'package': app_metadata.get('packageName', 'Unknown'),
                'developer': app_metadata.get('developer', 'Unknown'),
                'category': app_metadata.get('category', 'Unknown'),
                'rating': app_metadata.get('rating', 'N/A'),
                'installs': app_metadata.get('installs', 'N/A')
            },
            'risk_assessment': risk_assessment,
            'permission_analysis': {
                'total_permissions': apk_analysis.get('metadata', {}).get('permissions_count', 0),
                'dangerous': apk_analysis.get('permissions', {}).get('dangerous', []),
                'special': apk_analysis.get('permissions', {}).get('special', []),
                'normal': apk_analysis.get('permissions', {}).get('normal', [])
            },
            'security_recommendations': risk_assessment['recommendations'],
            'report_generated': True
        }
        
        if policy_analysis:
            report['policy_analysis'] = {
                'risk_score': policy_analysis.get('risk_score', 0),
                'risk_level': policy_analysis.get('risk_level', 'Unknown'),
                'red_flags': policy_analysis.get('red_flags', [])[:5],  # Top 5
                'green_flags': policy_analysis.get('green_flags', [])[:3],  # Top 3
                'yellow_flags': policy_analysis.get('yellow_flags', [])[:3]  # Top 3
            }
        
        return report
