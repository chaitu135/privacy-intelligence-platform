import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import './App.css'

const API_BASE = "https://privacy-intelligence-platform.onrender.com";
function SecurityDashboard() {
  const [activeModule, setActiveModule] = useState('apk')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState(null)
  const [analysisHistory, setAnalysisHistory] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // APK Scanner State
  const [apkFile, setApkFile] = useState(null)
  
  // Policy Scanner State
  const [policyFile, setPolicyFile] = useState(null)
  const [policyUrl, setPolicyUrl] = useState('')
  const [policyInputMode, setPolicyInputMode] = useState('file')
  
  // App Link Scanner State
  const [appUrl, setAppUrl] = useState('')

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    warnings: 0,
    avgRiskScore: 0
  })

  useEffect(() => {
    if (analysisHistory.length > 0) {
      const total = analysisHistory.length
      const successful = analysisHistory.filter(h => !h.error).length
      const warnings = analysisHistory.filter(h => h.data?.riskScore > 50 || h.data?.risk_score > 50).length
      const avgRisk = analysisHistory.reduce((sum, h) => {
        const score = h.data?.riskScore || h.data?.risk_score || h.data?.risk_assessment?.final_risk_score || 0
        return sum + score
      }, 0) / total
      
      setStats({
        total,
        successful,
        warnings,
        avgRiskScore: Math.round(avgRisk)
      })
    }
  }, [analysisHistory])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (activeModule === 'apk') {
        handleApkFile(file)
      } else if (activeModule === 'policy') {
        handlePolicyFile(file)
      }
    }
  }

  const handleApkFile = (file) => {
    const maxSize = 1000 * 1024 * 1024
    
    if (file.size > maxSize) {
      setError(`APK file size exceeds 1000MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(1)}MB`)
      return
    }
    
    if (file.name.endsWith('.apk')) {
      setApkFile(file)
      setError(null)
    } else {
      setError('Please upload an APK file')
    }
  }

  const handlePolicyFile = (file) => {
    const allowedTypes = ['.pdf', '.txt', '.docx']
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    
    if (allowedTypes.includes(fileExtension)) {
      setPolicyFile(file)
      setError(null)
    } else {
      setError('Please upload a PDF, TXT, or DOCX file')
    }
  }

  const analyzeApk = async () => {
    if (!apkFile) return

    setUploading(true)
    setError(null)
    setShowSuccess(false)
    const formData = new FormData()
    formData.append('apkFile', apkFile)

    try {
      const response = await fetch('https://privacy-intelligence-platform.onrender.com/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      const newResult = {
        type: 'apk',
        data: data,
        timestamp: new Date().toISOString()
      }
      setResult(newResult)
      setAnalysisHistory(prev => [...prev, newResult])
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error:', error)
      setError('Application analysis failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const analyzePolicy = async () => {
    if (policyInputMode === 'file' && !policyFile) {
      setError('Please upload a policy document')
      return
    }
    
    if (policyInputMode === 'url' && !policyUrl) {
      setError('Please enter a policy URL')
      return
    }

    setUploading(true)
    setError(null)
    setShowSuccess(false)

    try {
      let response
      if (policyInputMode === 'file') {
        const formData = new FormData()
        formData.append('policyFile', policyFile)
        response = await fetch('https://privacy-intelligence-platform.onrender.com/analyze-policy', {
          method: 'POST',
          body: formData,
        })
      } else {
        response = await fetch('https://privacy-intelligence-platform.onrender.com/analyze-policy-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: policyUrl }),
        })
      }

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      const newResult = {
        type: 'policy',
        data: data,
        timestamp: new Date().toISOString()
      }
      setResult(newResult)
      setAnalysisHistory(prev => [...prev, newResult])
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error:', error)
      setError('Policy analysis failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const analyzeAppLink = async () => {
    if (!appUrl) {
      setError('Please enter an application URL')
      return
    }

    setUploading(true)
    setError(null)
    setShowSuccess(false)

    try {
      const response = await fetch('https://privacy-intelligence-platform.onrender.com/analyze-app-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: appUrl }),
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      
      if (data.status === 'failed') {
        setError(`Play Store analysis failed: ${data.reason}`)
        return
      }
      
      const newResult = {
        type: 'app',
        data: data,
        timestamp: new Date().toISOString()
      }
      setResult(newResult)
      setAnalysisHistory(prev => [...prev, newResult])
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error:', error)
      setError('Application analysis failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const getRiskColor = (score) => {
    if (score <= 20) return '#10b981'
    if (score <= 50) return '#f59e0b'
    if (score <= 80) return '#ef4444'
    return '#dc2626'
  }

  const getRiskLevel = (score) => {
    if (score <= 20) return 'Low Risk'
    if (score <= 50) return 'Moderate Risk'
    if (score <= 80) return 'High Risk'
    return 'Critical Risk'
  }

  const modules = [
    { id: 'apk', name: 'Application Analysis', icon: 'shield' },
    { id: 'policy', name: 'Policy Analysis', icon: 'file-text' },
    { id: 'app', name: 'App Store Analysis', icon: 'search' }
  ]

  const renderIcon = (icon) => {
    const icons = {
      'shield': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      'file-text': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
      'search': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    }
    return icons[icon] || null
  }

  const renderUploadArea = () => {
    if (activeModule === 'apk') {
      return (
        <div className="upload-card">
          <div className="upload-header apk-gradient">
            <div className="upload-icon-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3>Application Security Analysis</h3>
            <p>Upload APK file for comprehensive security assessment</p>
          </div>
          
          <div className="upload-body">
            <div
              className={`upload-dropzone ${dragActive ? 'active' : ''} ${apkFile ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="upload-icon-large">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p className="upload-text">Drag and drop your APK file here</p>
              <p className="upload-subtext">or click to browse</p>
              <label className="browse-btn">
                <input
                  type="file"
                  accept=".apk"
                  onChange={(e) => handleApkFile(e.target.files[0])}
                  className="hidden"
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Browse Files
              </label>
            </div>

            {apkFile && (
              <div className="file-preview">
                <div className="file-icon-small">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                  </svg>
                </div>
                <div className="file-info-text">
                  <p className="file-name">{apkFile.name}</p>
                  <p className="file-size">{(apkFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button className="remove-file-btn" onClick={() => setApkFile(null)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            )}

            <button
              onClick={analyzeApk}
              disabled={!apkFile || uploading}
              className={`analyze-btn apk-gradient ${uploading ? 'loading' : ''}`}
            >
              {uploading ? (
                <>
                  <div className="spinner"></div>
                  Analyzing Application...
                </>
              ) : (
                'Analyze APK'
              )}
            </button>
          </div>
        </div>
      )
    } else if (activeModule === 'policy') {
      return (
        <div className="upload-card">
          <div className="upload-header policy-gradient">
            <div className="upload-icon-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3>Policy Compliance Analysis</h3>
            <p>Evaluate privacy policies for compliance risks</p>
          </div>
          
          <div className="upload-body">
            <div className="mode-tabs">
              <button
                className={`mode-tab ${policyInputMode === 'file' ? 'active' : ''}`}
                onClick={() => setPolicyInputMode('file')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                </svg>
                Upload Document
              </button>
              <button
                className={`mode-tab ${policyInputMode === 'url' ? 'active' : ''}`}
                onClick={() => setPolicyInputMode('url')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                URL Analysis
              </button>
            </div>

            {policyInputMode === 'file' ? (
              <div
                className={`upload-dropzone ${dragActive ? 'active' : ''} ${policyFile ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="upload-icon-large">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p className="upload-text">Upload Policy Document</p>
                <p className="upload-subtext">PDF, TXT, or DOCX files supported</p>
                <label className="browse-btn policy-btn">
                  <input
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={(e) => handlePolicyFile(e.target.files[0])}
                    className="hidden"
                  />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Select Document
                </label>
              </div>
            ) : (
              <div className="url-input-container">
                <label className="input-label">Privacy Policy URL</label>
                <div className="url-input-wrapper">
                  <svg className="url-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  <input
                    type="url"
                    value={policyUrl}
                    onChange={(e) => setPolicyUrl(e.target.value)}
                    placeholder="https://example.com/privacy-policy"
                    className="url-input"
                  />
                </div>
                <p className="input-help">Enter complete URL of privacy policy you want to analyze</p>
              </div>
            )}

            {policyFile && policyInputMode === 'file' && (
              <div className="file-preview">
                <div className="file-icon-small">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                  </svg>
                </div>
                <div className="file-info-text">
                  <p className="file-name">{policyFile.name}</p>
                  <p className="file-size">{(policyFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button className="remove-file-btn" onClick={() => setPolicyFile(null)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            )}

            <button
              onClick={analyzePolicy}
              disabled={uploading || (policyInputMode === 'file' ? !policyFile : !policyUrl)}
              className={`analyze-btn policy-gradient ${uploading ? 'loading' : ''}`}
            >
              {uploading ? (
                <>
                  <div className="spinner"></div>
                  Analyzing Policy...
                </>
              ) : (
                'Analyze Policy'
              )}
            </button>
          </div>
        </div>
      )
    } else {
      return (
        <div className="upload-card">
          <div className="upload-header app-gradient">
            <div className="upload-icon-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <h3>App Store Intelligence</h3>
            <p>Extract application metadata and insights</p>
          </div>
          
          <div className="upload-body">
            <div className="url-input-container">
              <label className="input-label">Application Store URL</label>
              <div className="url-input-wrapper">
                <svg className="url-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="url"
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=com.example.app"
                  className="url-input"
                />
              </div>
              <div className="example-box">
                <span className="example-label">Example URL:</span>
                <span className="example-url">https://play.google.com/store/apps/details?id=com.whatsapp</span>
              </div>
            </div>

            <button
              onClick={analyzeAppLink}
              disabled={!appUrl || uploading}
              className={`analyze-btn app-gradient ${uploading ? 'loading' : ''}`}
            >
              {uploading ? (
                <>
                  <div className="spinner"></div>
                  Analyzing Application...
                </>
              ) : (
                'Analyze App'
              )}
            </button>
          </div>
        </div>
      )
    }
  }

  const renderResults = () => {
    if (!result) {
      return (
        <div className="results-empty">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/>
            </svg>
          </div>
          <h3>No Analysis Results</h3>
          <p>Select an analysis module and provide input to view comprehensive results and security insights.</p>
        </div>
      )
    }

    const { type, data } = result
    
    // Extract risk score - handle 0 properly (0 is valid, only fallback if undefined/null)
    let score = 0
    if (data.riskScore !== undefined && data.riskScore !== null) {
      score = data.riskScore
    } else if (data.risk_score !== undefined && data.risk_score !== null) {
      score = data.risk_score
    } else if (data.risk_assessment?.final_risk_score !== undefined && data.risk_assessment?.final_risk_score !== null) {
      score = data.risk_assessment.final_risk_score
    }
    
    // Extract actual metrics from data - handles APK, Policy, and Play Store data structures
    const getPermissionCount = () => {
      // APK structure
      if (data.permissions) {
        if (Array.isArray(data.permissions)) {
          return data.permissions.length
        }
        const normal = data.permissions.normal?.length || 0
        const dangerous = data.permissions.dangerous?.length || 0
        const special = data.permissions.special?.length || 0
        return normal + dangerous + special
      }
      // Play Store structure
      if (Array.isArray(data.permissions)) return data.permissions.length
      if (data.permissions_count !== undefined) return data.permissions_count
      if (data.metadata?.total_permissions) return data.metadata.total_permissions
      return 'N/A'
    }
    
    const getFindingsCount = () => {
      // Policy analysis structure
      if (data.policy_analysis?.flags?.length) return data.policy_analysis.flags.length
      if (data.policy_analysis?.findings?.length) return data.policy_analysis.findings.length
      if (data.policy_analysis?.issues?.length) return data.policy_analysis.issues.length
      // General structure
      if (data.findings?.length) return data.findings.length
      if (data.flags?.length) return data.flags.length
      if (data.issues?.length) return data.issues.length
      if (data.vulnerabilities?.length) return data.vulnerabilities.length
      // Risk assessment findings
      if (data.risk_assessment?.findings?.length) return data.risk_assessment.findings.length
      return 'N/A'
    }
    
    const getVulnerabilitiesCount = () => {
      // Direct vulnerabilities
      if (data.vulnerabilities?.length) return data.vulnerabilities.length
      // Dangerous permissions from APK
      if (data.permissions?.dangerous?.length) return data.permissions.dangerous.length
      // Policy analysis risk indicators
      if (data.policy_analysis?.risk_indicators?.length) return data.policy_analysis.risk_indicators.length
      // Risk assessment
      if (data.risk_assessment?.vulnerabilities_count) return data.risk_assessment.vulnerabilities_count
      return 'N/A'
    }
    
    const getDataCollectionCount = () => {
      // Direct data collection
      if (data.data_collection?.length) return data.data_collection.length
      if (data.personal_data?.length) return data.personal_data.length
      // Policy analysis data practices
      if (data.policy_analysis?.data_practices?.length) return data.policy_analysis.data_practices.length
      if (data.policy_analysis?.collected_data?.length) return data.policy_analysis.collected_data.length
      // Metadata
      if (data.metadata?.data_collection_count) return data.metadata.data_collection_count
      return 'N/A'
    }
    
    const getThirdPartyCount = () => {
      // Direct third party
      if (data.third_party?.length) return data.third_party.length
      if (data.trackers?.length) return data.trackers.length
      if (data.ad_networks?.length) return data.ad_networks.length
      if (data.sdks?.length) return data.sdks.length
      // Metadata
      if (data.metadata?.third_party_count) return data.metadata.third_party_count
      return 'N/A'
    }
    
    // Play Store specific data extraction
    const getPlayStoreData = () => {
      if (type !== 'app') return null
      
      // Debug: log the actual data structure
      console.log('Play Store data:', data)
      
      return {
        appName: data.app_name || data.appName || data.name || 'Unknown App',
        developer: data.developer || data.developer_name || data.author || 'Unknown Developer',
        category: data.category || data.genre || 'Unknown Category',
        rating: data.rating || data.score || data.rating_score || 'N/A',
        reviews: data.reviews || data.review_count || data.num_reviews || 'N/A',
        installs: data.installs || data.install_count || data.downloads || 'N/A',
        size: data.size || data.app_size || 'N/A',
        privacyPolicyUrl: data.privacy_policy_url || data.privacyUrl || data.privacy_policy || null,
        description: data.description || data.app_description || data.summary || '',
        lastUpdated: data.last_updated || data.updated || data.lastUpdate || 'N/A',
        contentRating: data.content_rating || data.contentRating || data.age_rating || 'N/A'
      }
    }
    
    const playStoreData = getPlayStoreData()
    
    const riskColor = getRiskColor(score)
    const riskLevel = getRiskLevel(score)

    return (
      <div className="results-container">
        {showSuccess && (
          <div className="success-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Analysis completed successfully!
          </div>
        )}

        <div className="results-header">
          <h3>Analysis Results</h3>
          <button className="download-btn" onClick={() => {
            // Generate comprehensive PDF report
            const doc = new jsPDF()
            const pageWidth = doc.internal.pageSize.width
            const margin = 20
            const contentWidth = pageWidth - (margin * 2)
            let yPosition = margin

            // Helper functions
            const addTitle = (text, size = 18) => {
              doc.setFontSize(size)
              doc.setTextColor(31, 41, 55)
              doc.setFont('helvetica', 'bold')
              doc.text(text, margin, yPosition)
              yPosition += size * 0.5
            }

            const addSubtitle = (text, size = 12) => {
              doc.setFontSize(size)
              doc.setTextColor(100, 116, 139)
              doc.setFont('helvetica', 'normal')
              doc.text(text, margin, yPosition)
              yPosition += size * 0.4
            }

            const addSection = (title, content, isList = false) => {
              if (yPosition > 250) {
                doc.addPage()
                yPosition = margin
              }
              doc.setFontSize(14)
              doc.setTextColor(31, 41, 55)
              doc.setFont('helvetica', 'bold')
              doc.text(title, margin, yPosition)
              yPosition += 10

              doc.setFontSize(10)
              doc.setTextColor(75, 85, 99)
              doc.setFont('helvetica', 'normal')

              if (isList && Array.isArray(content) && content.length > 0) {
                content.forEach((item, idx) => {
                  if (yPosition > 270) {
                    doc.addPage()
                    yPosition = margin
                  }
                  const text = typeof item === 'string' ? item : (item.title || item.description || item.data_type || item.name || JSON.stringify(item))
                  const lines = doc.splitTextToSize(`• ${text}`, contentWidth)
                  doc.text(lines, margin + 5, yPosition)
                  yPosition += (lines.length * 4) + 2
                })
              } else if (typeof content === 'string' && content) {
                const lines = doc.splitTextToSize(content, contentWidth)
                doc.text(lines, margin, yPosition)
                yPosition += (lines.length * 4) + 5
              } else {
                doc.text('No data available', margin, yPosition)
                yPosition += 5
              }
              yPosition += 5
            }

            // Header
            addTitle('Privacy Intelligence Report', 22)
            addSubtitle(`Generated: ${new Date(result.timestamp).toLocaleString()}`, 11)
            yPosition += 15

            // Analysis Type & Risk Score
            addSection('Analysis Overview', '')
            doc.setFontSize(11)
            doc.setTextColor(31, 41, 55)
            doc.text(`Type: ${type === 'apk' ? 'Application Analysis' : type === 'policy' ? 'Policy Analysis' : 'App Store Analysis'}`, margin, yPosition)
            yPosition += 8
            doc.text(`Risk Score: ${score}% - ${riskLevel}`, margin, yPosition)
            yPosition += 8
            doc.text(`Findings: ${getFindingsCount() !== 'N/A' ? getFindingsCount() : '0'} issues identified`, margin, yPosition)
            yPosition += 20

            // Key Metrics
            addSection('Key Metrics', '')
            doc.setFontSize(10)
            doc.text(`• Vulnerabilities: ${getVulnerabilitiesCount()}`, margin + 5, yPosition)
            yPosition += 6
            doc.text(`• Permissions: ${getPermissionCount()}`, margin + 5, yPosition)
            yPosition += 6
            doc.text(`• Data Collection Points: ${getDataCollectionCount()}`, margin + 5, yPosition)
            yPosition += 6
            doc.text(`• Third-Party SDKs: ${getThirdPartyCount()}`, margin + 5, yPosition)
            yPosition += 20

            // Play Store Info (if applicable)
            if (type === 'app' && playStoreData) {
              addSection('App Store Information', '')
              doc.setFontSize(10)
              doc.text(`• App Name: ${playStoreData.appName}`, margin + 5, yPosition)
              yPosition += 6
              doc.text(`• Developer: ${playStoreData.developer}`, margin + 5, yPosition)
              yPosition += 6
              doc.text(`• Category: ${playStoreData.category}`, margin + 5, yPosition)
              yPosition += 6
              doc.text(`• Rating: ${playStoreData.rating}`, margin + 5, yPosition)
              yPosition += 6
              doc.text(`• Reviews: ${playStoreData.reviews}`, margin + 5, yPosition)
              yPosition += 6
              doc.text(`• Installs: ${playStoreData.installs}`, margin + 5, yPosition)
              yPosition += 6
              if (playStoreData.privacyPolicyUrl) {
                doc.text(`• Privacy Policy: ${playStoreData.privacyPolicyUrl}`, margin + 5, yPosition)
                yPosition += 6
              }
              yPosition += 15
            }

            // Summary
            if (type === 'policy' && data.policy_analysis) {
              addSection('Analysis Summary', 
                getFindingsCount() !== 'N/A' && getFindingsCount() > 0 
                  ? `This privacy policy contains ${getFindingsCount()} potential compliance issues that should be reviewed. Consider comparing against GDPR, CCPA, and other relevant privacy regulations.`
                  : 'No significant compliance issues detected in this privacy policy. The document appears to follow standard privacy practices.',
                false
              )
            } else if (type === 'app') {
              addSection('Analysis Summary',
                `${playStoreData?.appName || 'This app'} by ${playStoreData?.developer || 'Unknown Developer'} has been analyzed. ` +
                `${getPermissionCount() !== 'N/A' && getPermissionCount() > 0 ? `It requires ${getPermissionCount()} permissions. ` : ''}` +
                `${data.policy_analysis?.flags?.length > 0 ? `${data.policy_analysis.flags.length} policy concerns were detected.` : 'No major policy concerns found.'}`,
                false
              )
            } else if (type === 'apk') {
              addSection('Analysis Summary',
                `APK analysis completed with a risk score of ${score}%. ` +
                `${getPermissionCount() !== 'N/A' && getPermissionCount() > 0 ? `The app requests ${getPermissionCount()} permissions. ` : ''}` +
                `${getVulnerabilitiesCount() !== 'N/A' && getVulnerabilitiesCount() > 0 ? `${getVulnerabilitiesCount()} vulnerabilities were identified and should be addressed.` : 'No critical vulnerabilities detected.'}`,
                false
              )
            }

            // Detailed Findings
            const allFindings = (data.findings || data.flags || data.issues || 
              data.policy_analysis?.flags || data.policy_analysis?.findings || [])
            if (allFindings.length > 0) {
              addSection('Detailed Findings', allFindings, true)
            }

            // Data Collection Practices
            const dataPractices = (data.data_collection || data.personal_data || 
              data.policy_analysis?.data_practices || data.policy_analysis?.collected_data || [])
            if (dataPractices.length > 0) {
              addSection('Data Collection Practices', dataPractices, true)
            }

            // Vulnerabilities Section in PDF
            const allVulnerabilities = (data.vulnerabilities || data.risk_indicators || 
              data.policy_analysis?.risk_indicators || [])
            if (allVulnerabilities.length > 0) {
              addSection('Vulnerabilities & Risk Indicators', allVulnerabilities.map(v => {
                const title = v.title || v.name || (typeof v === 'string' ? v : 'Unknown')
                const severity = v.severity ? `[${v.severity.toUpperCase()}] ` : ''
                const desc = v.description ? `: ${v.description}` : ''
                const impact = v.impact ? ` (Impact: ${v.impact})` : ''
                return `${severity}${title}${desc}${impact}`
              }), true)
            }

            // Permissions Section in PDF
            if (data.permissions && (Array.isArray(data.permissions) || 
                data.permissions.dangerous?.length > 0 || 
                data.permissions.special?.length > 0 || 
                data.permissions.normal?.length > 0)) {
              
              addSection('Permissions Analysis', '')
              
              // Dangerous Permissions
              if (data.permissions.dangerous?.length > 0) {
                doc.setFontSize(11)
                doc.setTextColor(220, 38, 38)
                doc.text(`Dangerous Permissions (${data.permissions.dangerous.length}):`, margin, yPosition)
                yPosition += 6
                doc.setFontSize(9)
                doc.setTextColor(75, 85, 99)
                data.permissions.dangerous.forEach(perm => {
                  if (yPosition > 270) { doc.addPage(); yPosition = margin }
                  const permText = typeof perm === 'string' ? perm : (perm.name || perm.permission || 'Unknown')
                  const lines = doc.splitTextToSize(`• ${permText}`, contentWidth)
                  doc.text(lines, margin + 5, yPosition)
                  yPosition += (lines.length * 3) + 2
                })
                yPosition += 5
              }
              
              // Special Permissions
              if (data.permissions.special?.length > 0) {
                doc.setFontSize(11)
                doc.setTextColor(245, 158, 11)
                doc.text(`Special Permissions (${data.permissions.special.length}):`, margin, yPosition)
                yPosition += 6
                doc.setFontSize(9)
                doc.setTextColor(75, 85, 99)
                data.permissions.special.forEach(perm => {
                  if (yPosition > 270) { doc.addPage(); yPosition = margin }
                  const permText = typeof perm === 'string' ? perm : (perm.name || perm.permission || 'Unknown')
                  const lines = doc.splitTextToSize(`• ${permText}`, contentWidth)
                  doc.text(lines, margin + 5, yPosition)
                  yPosition += (lines.length * 3) + 2
                })
                yPosition += 5
              }
              
              // Normal Permissions
              if (data.permissions.normal?.length > 0) {
                doc.setFontSize(11)
                doc.setTextColor(16, 185, 129)
                doc.text(`Normal Permissions (${data.permissions.normal.length}):`, margin, yPosition)
                yPosition += 6
                doc.setFontSize(9)
                doc.setTextColor(75, 85, 99)
                data.permissions.normal.forEach(perm => {
                  if (yPosition > 270) { doc.addPage(); yPosition = margin }
                  const permText = typeof perm === 'string' ? perm : (perm.name || perm.permission || 'Unknown')
                  const lines = doc.splitTextToSize(`• ${permText}`, contentWidth)
                  doc.text(lines, margin + 5, yPosition)
                  yPosition += (lines.length * 3) + 2
                })
                yPosition += 5
              }
              
              // Simple array permissions
              if (Array.isArray(data.permissions)) {
                data.permissions.forEach(perm => {
                  if (yPosition > 270) { doc.addPage(); yPosition = margin }
                  const permText = typeof perm === 'string' ? perm : (perm.name || perm.permission || 'Unknown')
                  const lines = doc.splitTextToSize(`• ${permText}`, contentWidth)
                  doc.text(lines, margin, yPosition)
                  yPosition += (lines.length * 3) + 2
                })
                yPosition += 5
              }
            }

            // Risk Assessment Section (for Policy Analysis)
            if (type === 'policy') {
              addSection('Risk Assessment', '')
              
              const riskLevelText = score > 70 ? 'HIGH' : score > 40 ? 'MODERATE' : 'LOW'
              
              doc.setFontSize(11)
              doc.setTextColor(220, 38, 38)
              doc.text(`Overall Risk Level: ${riskLevelText}`, margin, yPosition)
              yPosition += 8
              
              doc.setFontSize(10)
              doc.setTextColor(75, 85, 99)
              
              if (score > 70) {
                doc.text('Why this is risky:', margin, yPosition)
                yPosition += 5
                const riskReasons = [
                  '• Significant compliance gaps with GDPR, CCPA, and other privacy regulations',
                  '• Missing or inadequate user rights disclosures',
                  '• Unclear data retention and deletion policies',
                  '• Potential for regulatory fines and legal action',
                  '• Lack of transparency in data sharing practices',
                  '• Users may not understand what data is collected or how it is used'
                ]
                riskReasons.forEach(reason => {
                  const lines = doc.splitTextToSize(reason, contentWidth)
                  doc.text(lines, margin, yPosition)
                  yPosition += (lines.length * 4) + 2
                })
              } else if (score > 40) {
                doc.text('Why this needs attention:', margin, yPosition)
                yPosition += 5
                const riskReasons = [
                  '• Some compliance gaps that could become issues',
                  '• Missing details on specific data practices',
                  '• User rights may not be fully explained',
                  '• Data sharing practices need more clarity',
                  '• Risk of user complaints or regulatory inquiries'
                ]
                riskReasons.forEach(reason => {
                  const lines = doc.splitTextToSize(reason, contentWidth)
                  doc.text(lines, margin, yPosition)
                  yPosition += (lines.length * 4) + 2
                })
              } else {
                doc.text('Why this is acceptable:', margin, yPosition)
                yPosition += 5
                const riskReasons = [
                  '• Policy appears to cover major compliance requirements',
                  '• User rights are reasonably well explained',
                  '• Data collection purposes are generally clear',
                  '• Regular review still recommended to maintain compliance'
                ]
                riskReasons.forEach(reason => {
                  const lines = doc.splitTextToSize(reason, contentWidth)
                  doc.text(lines, margin, yPosition)
                  yPosition += (lines.length * 4) + 2
                })
              }
              
              yPosition += 5
              
              // Add precautions section
              doc.setFontSize(11)
              doc.setTextColor(16, 185, 129)
              doc.text('Precautions to Take:', margin, yPosition)
              yPosition += 6
              
              doc.setFontSize(10)
              doc.setTextColor(75, 85, 99)
              
              const precautions = score > 70 ? [
                '1. IMMEDIATE: Consult with privacy legal counsel',
                '2. PRIORITY: Update policy to address all compliance gaps',
                '3. REQUIRED: Add clear user consent mechanisms',
                '4. ESSENTIAL: Define specific data retention periods',
                '5. CRITICAL: Document all data sharing agreements',
                '6. NECESSARY: Implement user rights request procedures',
                '7. IMPORTANT: Conduct regular policy audits'
              ] : score > 40 ? [
                '1. RECOMMENDED: Review with legal counsel',
                '2. SUGGESTED: Clarify data collection purposes',
                '3. ADVISED: Add missing user rights details',
                '4. RECOMMENDED: Improve transparency on data sharing',
                '5. SUGGESTED: Set up periodic compliance reviews'
              ] : [
                '1. GOOD PRACTICE: Continue regular reviews',
                '2. RECOMMENDED: Stay updated on regulatory changes',
                '3. SUGGESTED: Consider user testing for clarity',
                '4. ADVISED: Monitor for emerging privacy requirements'
              ]
              
              precautions.forEach(precaution => {
                if (yPosition > 270) {
                  doc.addPage()
                  yPosition = margin
                }
                const lines = doc.splitTextToSize(precaution, contentWidth)
                doc.text(lines, margin, yPosition)
                yPosition += (lines.length * 4) + 2
              })
              
              yPosition += 5
            }

            // Recommendations
            addSection('Recommendations', '')
            const recommendations = []
            
            // Policy-specific detailed recommendations
            if (type === 'policy') {
              if (score > 70) {
                recommendations.push('CRITICAL: This privacy policy has significant compliance gaps that could result in regulatory penalties')
                recommendations.push('Immediate action required: Update policy to include all required GDPR/CCPA disclosures')
                recommendations.push('Add clear data retention periods and user rights sections')
                recommendations.push('Include specific third-party data sharing agreements and purposes')
              } else if (score > 40) {
                recommendations.push('MODERATE RISK: Policy has gaps that should be addressed to ensure compliance')
                recommendations.push('Review and clarify data collection purposes and legal bases')
                recommendations.push('Add missing user rights information (access, deletion, portability)')
                recommendations.push('Improve transparency around data sharing practices')
              } else {
                recommendations.push('LOW RISK: Policy is generally compliant but should be regularly reviewed')
                recommendations.push('Continue monitoring for regulatory changes')
                recommendations.push('Consider periodic user testing of policy clarity')
              }
              
              // Add specific compliance recommendations
              const complianceGaps = data.compliance_gaps || data.policy_analysis?.compliance_gaps || []
              if (complianceGaps.length > 0) {
                recommendations.push('')
                recommendations.push('Specific Compliance Issues to Address:')
                complianceGaps.forEach((gap, idx) => {
                  recommendations.push(`${idx + 1}. ${gap}`)
                })
              }
              
              // Add data practice recommendations
              const dataPractices = data.data_collection || data.policy_analysis?.data_practices || []
              if (dataPractices.length > 0) {
                recommendations.push('')
                recommendations.push('Data Collection Review Required:')
                recommendations.push('- Verify all stated data practices have legal basis')
                recommendations.push('- Ensure retention periods are clearly defined')
                recommendations.push('- Confirm user consent mechanisms are documented')
              }
              
              recommendations.push('')
              recommendations.push('General Policy Recommendations:')
              recommendations.push('- Compare against GDPR, CCPA, and other relevant privacy regulations')
              recommendations.push('- Review policy clarity with legal counsel')
              recommendations.push('- Implement user-friendly privacy controls')
            } else {
              // General recommendations for APK and App
              if (score > 70) {
                recommendations.push('High risk detected - Review all findings and implement security improvements immediately')
                recommendations.push('Conduct a full security audit of the application')
              } else if (score > 40) {
                recommendations.push('Moderate risk - Review permissions and data collection practices')
                recommendations.push('Consider implementing additional privacy protections')
              } else {
                recommendations.push('Low risk profile - Continue monitoring for changes')
                recommendations.push('Stay updated with privacy best practices')
              }
              
              if (type === 'app' && data.privacy_policy_url) {
                recommendations.push(`Review the app's privacy policy at: ${data.privacy_policy_url}`)
              }
            }

            doc.setFontSize(10)
            recommendations.forEach((rec, idx) => {
              if (yPosition > 270) {
                doc.addPage()
                yPosition = margin
              }
              const lines = doc.splitTextToSize(`${idx + 1}. ${rec}`, contentWidth)
              doc.text(lines, margin, yPosition)
              yPosition += (lines.length * 4) + 3
            })

            // Footer
            const totalPages = doc.getNumberOfPages()
            for (let i = 1; i <= totalPages; i++) {
              doc.setPage(i)
              doc.setFontSize(8)
              doc.setTextColor(156, 163, 175)
              doc.text(`Page ${i} of ${totalPages} | Privacy Intelligence Platform`, margin, 285)
            }

            // Save PDF
            doc.save(`privacy_analysis_report_${type}_${Date.now()}.pdf`)
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download PDF Report
          </button>
        </div>

        <div className="risk-score-card" style={{ '--risk-color': riskColor }}>
          <p className="risk-label">Risk Score</p>
          <h2 className="risk-percentage" style={{ color: riskColor }}>{score}%</h2>
          <span className="risk-badge" style={{ backgroundColor: `${riskColor}20`, color: riskColor }}>
            {riskLevel}
          </span>
        </div>

        <div className="metrics-grid">
          <div className="metric-item">
            <span className="metric-label">Type</span>
            <span className="metric-value">{type === 'apk' ? 'Application Analysis' : type === 'policy' ? 'Policy Analysis' : 'App Store Analysis'}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Findings</span>
            <span className="metric-value">{getFindingsCount()} issues</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Vulnerabilities</span>
            <span className="metric-value" style={{ color: getVulnerabilitiesCount() > 0 ? '#ef4444' : '#10b981' }}>{getVulnerabilitiesCount()}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Permissions</span>
            <span className="metric-value">{getPermissionCount()}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Data Collection</span>
            <span className="metric-value" style={{ color: getDataCollectionCount() > 0 ? '#f59e0b' : '#10b981' }}>{getDataCollectionCount()}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Third-Party SDKs</span>
            <span className="metric-value">{getThirdPartyCount()}</span>
          </div>
        </div>

        <div className="analysis-timestamp">
          Analyzed: {new Date(result.timestamp).toLocaleString()}
        </div>

        {/* Play Store App Info */}
        {type === 'app' && playStoreData && (
          <div className="playstore-info-section">
            <h4 className="section-title">📱 App Store Information</h4>
            <div className="playstore-details">
              <div className="playstore-header">
                <div className="playstore-app-name">{playStoreData.appName}</div>
                <div className="playstore-developer">by {playStoreData.developer}</div>
              </div>
              <div className="playstore-meta-grid">
                <div className="playstore-meta-item">
                  <span className="meta-label">Category</span>
                  <span className="meta-value">{playStoreData.category}</span>
                </div>
                <div className="playstore-meta-item">
                  <span className="meta-label">Rating</span>
                  <span className={`meta-value ${playStoreData.rating === 'N/A' ? 'na-value' : ''}`}>{playStoreData.rating}</span>
                </div>
                <div className="playstore-meta-item">
                  <span className="meta-label">Reviews</span>
                  <span className={`meta-value ${playStoreData.reviews === 'N/A' ? 'na-value' : ''}`}>{playStoreData.reviews}</span>
                </div>
                <div className="playstore-meta-item">
                  <span className="meta-label">Installs</span>
                  <span className={`meta-value ${playStoreData.installs === 'N/A' ? 'na-value' : ''}`}>{playStoreData.installs}</span>
                </div>
                <div className="playstore-meta-item">
                  <span className="meta-label">Size</span>
                  <span className={`meta-value ${playStoreData.size === 'N/A' ? 'na-value' : ''}`}>{playStoreData.size}</span>
                </div>
                <div className="playstore-meta-item">
                  <span className="meta-label">Content Rating</span>
                  <span className="meta-value">{playStoreData.contentRating}</span>
                </div>
              </div>
              
              {/* Privacy Policy Link */}
              {playStoreData.privacyPolicyUrl ? (
                <div className="privacy-policy-section">
                  <div className="privacy-policy-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>Privacy Policy Found</span>
                  </div>
                  <a 
                    href={playStoreData.privacyPolicyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="privacy-policy-link"
                  >
                    <span className="link-text">{playStoreData.privacyPolicyUrl}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                </div>
              ) : (
                <div className="privacy-policy-missing">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>No privacy policy link found in Play Store listing</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary & Recommendations Section */}
        <div className="summary-section">
          <h4 className="section-title">📋 Analysis Summary</h4>
          <div className="summary-content">
            {type === 'policy' && (
              <>
                <div className="analysis-summary">
                  <p className="summary-text">
                    {getFindingsCount() !== 'N/A' && getFindingsCount() > 0 
                      ? `This privacy policy contains ${getFindingsCount()} potential compliance issues that should be reviewed.`
                      : 'No significant compliance issues detected in this privacy policy.'}
                  </p>
                  {data.policy_analysis?.compliance_gaps?.length > 0 && (
                    <div className="compliance-gaps">
                      <strong>Compliance Gaps:</strong>
                      <ul>
                        {data.policy_analysis.compliance_gaps.slice(0, 5).map((gap, idx) => (
                          <li key={idx}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Risk Assessment Section for Policy */}
                <div className="risk-assessment-section">
                  <h5 className="subsection-title">
                    {score > 70 ? '🔴 High Risk Assessment' : score > 40 ? '🟠 Moderate Risk Assessment' : '🟢 Low Risk Assessment'}
                  </h5>
                  
                  <div className="risk-explanation">
                    <strong>Why {score > 70 ? 'this is risky' : score > 40 ? 'this needs attention' : 'this is acceptable'}:</strong>
                    <ul className="risk-reasons">
                      {score > 70 ? (
                        <>
                          <li>Significant compliance gaps with GDPR, CCPA, and other privacy regulations</li>
                          <li>Missing or inadequate user rights disclosures</li>
                          <li>Unclear data retention and deletion policies</li>
                          <li>Potential for regulatory fines and legal action</li>
                          <li>Lack of transparency in data sharing practices</li>
                        </>
                      ) : score > 40 ? (
                        <>
                          <li>Some compliance gaps that could become issues</li>
                          <li>Missing details on specific data practices</li>
                          <li>User rights may not be fully explained</li>
                          <li>Risk of user complaints or regulatory inquiries</li>
                        </>
                      ) : (
                        <>
                          <li>Policy appears to cover major compliance requirements</li>
                          <li>User rights are reasonably well explained</li>
                          <li>Data collection purposes are generally clear</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="precautions-section">
                    <strong>Precautions to Take:</strong>
                    <ul className="precautions-list">
                      {score > 70 ? (
                        <>
                          <li className="precaution-critical">IMMEDIATE: Consult with privacy legal counsel</li>
                          <li className="precaution-priority">PRIORITY: Update policy to address all compliance gaps</li>
                          <li className="precaution-required">REQUIRED: Add clear user consent mechanisms</li>
                          <li className="precaution-essential">ESSENTIAL: Define specific data retention periods</li>
                          <li className="precaution-critical">CRITICAL: Document all data sharing agreements</li>
                          <li className="precaution-necessary">NECESSARY: Implement user rights request procedures</li>
                        </>
                      ) : score > 40 ? (
                        <>
                          <li className="precaution-recommended">RECOMMENDED: Review with legal counsel</li>
                          <li className="precaution-suggested">SUGGESTED: Clarify data collection purposes</li>
                          <li className="precaution-advised">ADVISED: Add missing user rights details</li>
                          <li className="precaution-recommended">RECOMMENDED: Improve transparency on data sharing</li>
                          <li className="precaution-suggested">SUGGESTED: Set up periodic compliance reviews</li>
                        </>
                      ) : (
                        <>
                          <li className="precaution-good">GOOD PRACTICE: Continue regular reviews</li>
                          <li className="precaution-recommended">RECOMMENDED: Stay updated on regulatory changes</li>
                          <li className="precaution-suggested">SUGGESTED: Consider user testing for clarity</li>
                          <li className="precaution-advised">ADVISED: Monitor for emerging privacy requirements</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </>
            )}
            {type === 'app' && (
              <div className="analysis-summary">
                <p className="summary-text">
                  {playStoreData?.appName && (
                    <><strong>{playStoreData.appName}</strong> by {playStoreData.developer}. </>
                  )}
                  {getPermissionCount() !== 'N/A' && getPermissionCount() > 0 && (
                    <>Requires {getPermissionCount()} permissions. </>
                  )}
                  {data.policy_analysis?.flags?.length > 0 && (
                    <><span className="warning-text">{data.policy_analysis.flags.length} policy concerns detected.</span></>
                  )}
                </p>
              </div>
            )}
            {type === 'apk' && (
              <div className="analysis-summary">
                <p className="summary-text">
                  APK analysis completed with risk score of {score}%.
                  {getPermissionCount() !== 'N/A' && getPermissionCount() > 0 && (
                    <> App requests {getPermissionCount()} permissions. </>
                  )}
                  {getVulnerabilitiesCount() !== 'N/A' && getVulnerabilitiesCount() > 0 && (
                    <><span className="alert-text">{getVulnerabilitiesCount()} vulnerabilities identified.</span></>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Findings Section */}
        {(data.findings?.length > 0 || data.flags?.length > 0 || data.issues?.length > 0 || 
          data.policy_analysis?.flags?.length > 0 || data.policy_analysis?.findings?.length > 0) && (
          <div className="findings-section">
            <h4 className="section-title">🔍 Detailed Findings</h4>
            <div className="findings-list">
              {(data.findings || data.flags || data.issues || 
                data.policy_analysis?.flags || data.policy_analysis?.findings || []).map((finding, idx) => (
                <div key={idx} className={`finding-item ${finding.severity || finding.type || 'medium'}`}>
                  <div className="finding-header">
                    <span className="finding-severity">{(finding.severity || finding.type || 'INFO').toUpperCase()}</span>
                    <span className="finding-title">{finding.title || finding.issue || finding.description || finding}</span>
                  </div>
                  {finding.description && finding.title && (
                    <p className="finding-description">{finding.description}</p>
                  )}
                  {finding.recommendation && (
                    <div className="finding-recommendation">
                      <strong>Recommendation:</strong> {finding.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Collection Section */}
        {(data.data_collection?.length > 0 || data.personal_data?.length > 0 || 
          data.policy_analysis?.data_practices?.length > 0 || data.policy_analysis?.collected_data?.length > 0) && (
          <div className="data-collection-section">
            <h4 className="section-title">📊 Data Collection Practices</h4>
            <div className="data-practices-list">
              {(data.data_collection || data.personal_data || 
                data.policy_analysis?.data_practices || data.policy_analysis?.collected_data || []).map((practice, idx) => (
                <div key={idx} className="data-practice-item">
                  <div className="practice-name">{typeof practice === 'string' ? practice : practice.data_type || practice.type || practice.name || 'Unknown'}</div>
                  {practice.purpose && (
                    <div className="practice-purpose"><strong>Purpose:</strong> {practice.purpose}</div>
                  )}
                  {practice.shared_with && (
                    <div className="practice-shared"><strong>Shared with:</strong> {practice.shared_with}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vulnerabilities Section */}
        {(data.vulnerabilities?.length > 0 || data.risk_indicators?.length > 0 || 
          data.policy_analysis?.risk_indicators?.length > 0 || data.policy_analysis?.vulnerabilities?.length > 0) && (
          <div className="vulnerabilities-section">
            <h4 className="section-title">🚨 Vulnerabilities & Risk Indicators</h4>
            <div className="vulnerabilities-list">
              {(data.vulnerabilities || data.risk_indicators || 
                data.policy_analysis?.risk_indicators || data.policy_analysis?.vulnerabilities || []).map((vuln, idx) => (
                <div key={idx} className={`vulnerability-item ${vuln.severity || 'medium'}`}>
                  <div className="vulnerability-header">
                    <span className="vuln-severity">{(vuln.severity || 'MEDIUM').toUpperCase()}</span>
                    <span className="vuln-title">{vuln.title || vuln.name || vuln.description || (typeof vuln === 'string' ? vuln : 'Unknown')}</span>
                  </div>
                  {vuln.description && (
                    <p className="vuln-description">{vuln.description}</p>
                  )}
                  {vuln.impact && (
                    <div className="vuln-impact"><strong>Impact:</strong> {vuln.impact}</div>
                  )}
                  {vuln.mitigation && (
                    <div className="vuln-mitigation"><strong>Mitigation:</strong> {vuln.mitigation}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Permissions Section */}
        {(data.permissions?.length > 0 || data.permissions?.normal?.length > 0 || 
          data.permissions?.dangerous?.length > 0 || data.permissions?.special?.length > 0 ||
          data.play_store_data?.permissions?.length > 0 || data.policy_analysis?.permissions?.length > 0) && (
          <div className="permissions-section">
            <h4 className="section-title">🔐 Permissions Analysis</h4>
            <div className="permissions-list">
              {/* Get permissions from any available source */}
              {(() => {
                const perms = data.permissions || 
                  data.play_store_data?.permissions || 
                  data.policy_analysis?.permissions || {}
                
                const dangerousPerms = perms.dangerous || []
                const specialPerms = perms.special || []
                const normalPerms = perms.normal || []
                const allPerms = Array.isArray(perms) ? perms : []
                
                return (
                  <>
                    {/* Dangerous Permissions */}
                    {dangerousPerms.length > 0 && (
                      <div className="perm-category dangerous">
                        <h5 className="perm-category-title">⚠️ Dangerous Permissions ({dangerousPerms.length})</h5>
                        <div className="perm-items">
                          {dangerousPerms.map((perm, idx) => (
                            <div key={idx} className="perm-item dangerous">
                              <span className="perm-name">{typeof perm === 'string' ? perm : perm.name || perm.permission || 'Unknown'}</span>
                              {perm.description && <span className="perm-desc">{perm.description}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Special Permissions */}
                    {specialPerms.length > 0 && (
                      <div className="perm-category special">
                        <h5 className="perm-category-title">⚡ Special Permissions ({specialPerms.length})</h5>
                        <div className="perm-items">
                          {specialPerms.map((perm, idx) => (
                            <div key={idx} className="perm-item special">
                              <span className="perm-name">{typeof perm === 'string' ? perm : perm.name || perm.permission || 'Unknown'}</span>
                              {perm.description && <span className="perm-desc">{perm.description}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Normal Permissions */}
                    {normalPerms.length > 0 && (
                      <div className="perm-category normal">
                        <h5 className="perm-category-title">✓ Normal Permissions ({normalPerms.length})</h5>
                        <div className="perm-items">
                          {normalPerms.map((perm, idx) => (
                            <div key={idx} className="perm-item normal">
                              <span className="perm-name">{typeof perm === 'string' ? perm : perm.name || perm.permission || 'Unknown'}</span>
                              {perm.description && <span className="perm-desc">{perm.description}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Simple array permissions */}
                    {allPerms.length > 0 && (
                      <div className="perm-category">
                        <h5 className="perm-category-title">📋 All Permissions ({allPerms.length})</h5>
                        <div className="perm-items">
                          {allPerms.map((perm, idx) => (
                            <div key={idx} className="perm-item">
                              <span className="perm-name">{typeof perm === 'string' ? perm : perm.name || perm.permission || 'Unknown'}</span>
                              {perm.description && <span className="perm-desc">{perm.description}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        <div className="recommendations-section">
          <h4 className="section-title">💡 Recommendations</h4>
          <div className="recommendations-list">
            {score > 70 ? (
              <>
                <div className="recommendation-item high-risk">
                  <span className="rec-icon">⚠️</span>
                  <span>High risk detected - Review all findings and implement security improvements immediately</span>
                </div>
                <div className="recommendation-item">
                  <span className="rec-icon">📋</span>
                  <span>Conduct a full security audit of the application</span>
                </div>
              </>
            ) : score > 40 ? (
              <>
                <div className="recommendation-item medium-risk">
                  <span className="rec-icon">🔍</span>
                  <span>Moderate risk - Review permissions and data collection practices</span>
                </div>
                <div className="recommendation-item">
                  <span className="rec-icon">🛡️</span>
                  <span>Consider implementing additional privacy protections</span>
                </div>
              </>
            ) : (
              <>
                <div className="recommendation-item low-risk">
                  <span className="rec-icon">✅</span>
                  <span>Low risk profile - Continue monitoring for changes</span>
                </div>
                <div className="recommendation-item">
                  <span className="rec-icon">📚</span>
                  <span>Stay updated with privacy best practices</span>
                </div>
              </>
            )}
            {type === 'policy' && (
              <div className="recommendation-item">
                <span className="rec-icon">📝</span>
                <span>Compare against GDPR, CCPA, and other relevant privacy regulations</span>
              </div>
            )}
            {type === 'app' && data.privacy_policy_url && (
              <div className="recommendation-item">
                <span className="rec-icon">🔗</span>
                <span>Review the app's privacy policy at: {data.privacy_policy_url}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-dashboard">
      {/* Header */}
      <header className="modern-header">
        <div className="header-brand">
          <div className="brand-logo">
            <span>PI</span>
          </div>
          <div className="brand-text">
            <h1>Privacy Intelligence Platform</h1>
            <p>Advanced Security & Compliance Analysis</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="history-btn" onClick={() => setShowHistory(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            History ({analysisHistory.length})
          </button>
          <div className="status-badge">
            <span className="status-dot"></span>
            Ready
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-icon blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18"/><path d="M18 9l-5 5-3-3-4 4"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Analyses</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.successful}</span>
            <span className="stat-label">Successful</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon yellow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.warnings}</span>
            <span className="stat-label">Warnings</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.avgRiskScore}%</span>
            <span className="stat-label">Avg Risk Score</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        {modules.map(module => (
          <button
            key={module.id}
            className={`nav-tab ${activeModule === module.id ? 'active' : ''}`}
            onClick={() => {
              setActiveModule(module.id)
              // Clear previous analysis results when switching modules
              setResult(null)
              setError(null)
            }}
          >
            <span className="tab-icon">{renderIcon(module.icon)}</span>
            {module.name}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-layout">
          {/* Left Panel */}
          <div className="left-panel">
            {renderUploadArea()}
          </div>

          {/* Right Panel */}
          <div className="right-panel">
            {error && (
              <div className="error-alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div className="error-content">
                  <strong>Analysis Failed</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}
            {renderResults()}
          </div>
        </div>
      </main>

      {/* History Modal */}
      {showHistory && (
        <div className="history-modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h3>Analysis History</h3>
              <button className="close-btn" onClick={() => setShowHistory(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="history-modal-body">
              {analysisHistory.length === 0 ? (
                <div className="history-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <p>No analysis history yet</p>
                </div>
              ) : (
                <div className="history-list">
                  {analysisHistory.map((item, index) => (
                    <div 
                      key={index} 
                      className="history-item"
                      onClick={() => {
                        setResult(item)
                        setShowHistory(false)
                      }}
                    >
                      <div className="history-item-icon">
                        {item.type === 'apk' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                        ) : item.type === 'policy' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                          </svg>
                        )}
                      </div>
                      <div className="history-item-info">
                        <span className="history-item-type">
                          {item.type === 'apk' ? 'Application Analysis' : item.type === 'policy' ? 'Policy Analysis' : 'App Store Analysis'}
                        </span>
                        <span className="history-item-time">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="history-item-risk" style={{ color: getRiskColor(item.data?.riskScore !== undefined && item.data?.riskScore !== null ? item.data.riskScore : item.data?.risk_score !== undefined && item.data?.risk_score !== null ? item.data.risk_score : 0) }}>
                        {(item.data?.riskScore !== undefined && item.data?.riskScore !== null ? item.data.riskScore : item.data?.risk_score !== undefined && item.data?.risk_score !== null ? item.data.risk_score : 0)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SecurityDashboard
