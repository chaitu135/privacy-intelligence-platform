import { useState, useEffect } from 'react'
import './App.css'

function ChromeDashboard() {
  const [activeModule, setActiveModule] = useState('apk')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  // APK Scanner State
  const [apkFile, setApkFile] = useState(null)
  
  // Policy Scanner State
  const [policyFile, setPolicyFile] = useState(null)
  const [policyUrl, setPolicyUrl] = useState('')
  const [policyInputMode, setPolicyInputMode] = useState('file')
  
  // App Link Scanner State
  const [appUrl, setAppUrl] = useState('')

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
    if (file.name.endsWith('.apk')) {
      setApkFile(file)
    } else {
      alert('Please upload an APK file')
    }
  }

  const handlePolicyFile = (file) => {
    const allowedTypes = ['.pdf', '.txt', '.docx']
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    
    if (allowedTypes.includes(fileExtension)) {
      setPolicyFile(file)
    } else {
      alert('Please upload a PDF, TXT, or DOCX file')
    }
  }

  const analyzeApk = async () => {
    if (!apkFile) return

    setUploading(true)
    const formData = new FormData()
    formData.append('apkFile', apkFile)

    try {
      const response = await fetch('http://localhost:3001/api/upload-apk', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      setResult({
        type: 'apk',
        data: data,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error:', error)
      alert('Analysis failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const analyzePolicy = async () => {
    if (policyInputMode === 'file' && !policyFile) {
      alert('Please upload a policy document')
      return
    }
    
    if (policyInputMode === 'url' && !policyUrl) {
      alert('Please enter a policy URL')
      return
    }

    setUploading(true)

    try {
      let response
      if (policyInputMode === 'file') {
        const formData = new FormData()
        formData.append('policyFile', policyFile)
        response = await fetch('http://localhost:3001/api/analyze-policy', {
          method: 'POST',
          body: formData,
        })
      } else {
        response = await fetch('http://localhost:3001/api/analyze-policy-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: policyUrl }),
        })
      }

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      setResult({
        type: 'policy',
        data: data,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error:', error)
      alert('Policy analysis failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const analyzeAppLink = async () => {
    if (!appUrl) {
      alert('Please enter an application URL')
      return
    }

    setUploading(true)

    try {
      const response = await fetch('http://localhost:3001/api/analyze-app-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: appUrl }),
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      setResult({
        type: 'app',
        data: data,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error:', error)
      alert('Application analysis failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const getRiskColor = (score) => {
    if (score <= 20) return '#34a853'  // Google Green
    if (score <= 50) return '#fbbc04'  // Google Yellow
    if (score <= 80) return '#ea4335'  // Google Red
    return '#ea4335'
  }

  const getRiskBgColor = (score) => {
    if (score <= 20) return 'bg-green-500'
    if (score <= 50) return 'bg-yellow-500'
    if (score <= 80) return 'bg-red-500'
    return 'bg-red-600'
  }

  const getRiskLevel = (score) => {
    if (score <= 20) return 'LOW RISK'
    if (score <= 50) return 'MODERATE RISK'
    if (score <= 80) return 'HIGH RISK'
    return 'CRITICAL RISK'
  }

  const modules = [
    {
      id: 'apk',
      name: 'Application Analysis',
      description: 'APK security assessment',
      icon: '📱',
      color: '#4285f4'  // Google Blue
    },
    {
      id: 'policy',
      name: 'Policy Analysis',
      description: 'Privacy policy evaluation',
      icon: '📋',
      color: '#34a853'  // Google Green
    },
    {
      id: 'app',
      name: 'App Store Analysis',
      description: 'Application metadata',
      icon: '🔍',
      color: '#fbbc04'  // Google Yellow
    }
  ]

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'apk':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Application Security Analysis</h2>
              <p className="text-gray-600">Upload APK file for comprehensive security assessment</p>
            </div>
            
            <div className="p-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                
                <p className="text-gray-600 mb-2">
                  Drag and drop your APK file here, or
                </p>
                
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".apk"
                    onChange={(e) => handleApkFile(e.target.files[0])}
                    className="hidden"
                  />
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors">
                    Browse Files
                  </span>
                </label>
              </div>

              {apkFile && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Selected file:</p>
                      <p className="font-medium text-gray-900">{apkFile.name}</p>
                      <p className="text-sm text-gray-500">{(apkFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => setApkFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={analyzeApk}
                disabled={!apkFile || uploading}
                className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {uploading ? 'Analyzing...' : 'Analyze APK'}
              </button>
            </div>
          </div>
        )

      case 'policy':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Policy Analysis</h2>
              <p className="text-gray-600">Evaluate privacy policies for compliance risks</p>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => setPolicyInputMode('file')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      policyInputMode === 'file' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Upload Document
                  </button>
                  <button
                    onClick={() => setPolicyInputMode('url')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      policyInputMode === 'url' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    URL Analysis
                  </button>
                </div>

                {policyInputMode === 'file' ? (
                  <div>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      
                      <p className="text-gray-600 mb-2">
                        Upload policy document
                      </p>
                      <p className="text-gray-500 text-sm mb-4">PDF, TXT, or DOCX formats</p>
                      
                      <label className="inline-block">
                        <input
                          type="file"
                          accept=".pdf,.txt,.docx"
                          onChange={(e) => handlePolicyFile(e.target.files[0])}
                          className="hidden"
                        />
                        <span className="px-4 py-2 bg-green-600 text-white rounded-md cursor-pointer hover:bg-green-700 transition-colors">
                          Select Document
                        </span>
                      </label>
                    </div>

                    {policyFile && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Selected document:</p>
                            <p className="font-medium text-gray-900">{policyFile.name}</p>
                            <p className="text-sm text-gray-500">{(policyFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button
                            onClick={() => setPolicyFile(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Privacy Policy URL
                    </label>
                    <input
                      type="url"
                      value={policyUrl}
                      onChange={(e) => setPolicyUrl(e.target.value)}
                      placeholder="https://example.com/privacy-policy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                )}

                <button
                  onClick={analyzePolicy}
                  disabled={uploading || (policyInputMode === 'file' ? !policyFile : !policyUrl)}
                  className="w-full mt-4 px-6 py-3 bg-green-600 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                >
                  {uploading ? 'Analyzing...' : 'Analyze Policy'}
                </button>
              </div>
            </div>
          </div>
        )

      case 'app':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">App Store Analysis</h2>
              <p className="text-gray-600">Extract application metadata and insights</p>
            </div>
            
            <div className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Store URL
                </label>
                <input
                  type="url"
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=com.example.app"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                
                <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Example:</strong> https://play.google.com/store/apps/details?id=com.example.app
                  </p>
                </div>
              </div>

              <button
                onClick={analyzeAppLink}
                disabled={!appUrl || uploading}
                className="w-full mt-4 px-6 py-3 bg-yellow-500 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-600 transition-colors"
              >
                {uploading ? 'Analyzing...' : 'Analyze App'}
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderResults = () => {
    if (!result) return null

    const { type, data } = result

    if (type === 'apk') {
      return (
        <div className="space-y-6">
          {/* Risk Assessment */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Security Assessment Report</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-8 border-gray-200"></div>
                  <div 
                    className={`absolute top-0 left-0 w-32 h-32 rounded-full border-8 ${getRiskBgColor(data.riskScore || 0)}`}
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((data.riskScore * 3.6 - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((data.riskScore * 3.6 - 90) * Math.PI / 180)}%)`
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{color: getRiskColor(data.riskScore || 0)}}>
                        {data.riskScore || 0}
                      </div>
                      <div className="text-xs text-gray-500">RISK SCORE</div>
                      <div className="text-sm font-bold" style={{color: getRiskColor(data.riskScore || 0)}}>
                        {getRiskLevel(data.riskScore || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* App Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Application Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">App Name</p>
                  <p className="font-medium text-gray-900">{data.appName || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Package</p>
                  <p className="font-medium text-gray-900">{data.packageName || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Permissions Analysis</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {['normal', 'dangerous', 'special'].map(category => (
                  <div key={category}>
                    <h4 className="font-medium mb-2" style={{color: getRiskColor(category === 'normal' ? 20 : category === 'dangerous' ? 50 : 80)}}>
                      {category.charAt(0).toUpperCase() + category.slice(1)} ({data.permissions[category]?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {data.permissions[category]?.map((perm, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm border border-gray-200">
                          {perm.replace('android.permission.', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (type === 'policy') {
      return (
        <div className="space-y-6">
          {/* Policy Risk Assessment */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Compliance Assessment Report</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-8 border-gray-200"></div>
                  <div 
                    className={`absolute top-0 left-0 w-32 h-32 rounded-full border-8 ${getRiskBgColor(data.risk_score || 0)}`}
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((data.risk_score * 3.6 - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((data.risk_score * 3.6 - 90) * Math.PI / 180)}%)`
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{color: getRiskColor(data.risk_score || 0)}}>
                        {data.risk_score || 0}
                      </div>
                      <div className="text-xs text-gray-500">COMPLIANCE SCORE</div>
                      <div className="text-sm font-bold" style={{color: getRiskColor(data.risk_score || 0)}}>
                        {getRiskLevel(data.risk_score || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Policy Flags */}
          <div className="space-y-4">
            {data.red_flags && data.red_flags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-red-200">
                <div className="p-6 border-b border-red-200">
                  <h3 className="text-lg font-semibold text-red-600">🔴 Critical Issues</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-2">
                    {data.red_flags.slice(0, 5).map((flag, idx) => (
                      <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-700">{flag.context}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {data.green_flags && data.green_flags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-green-200">
                <div className="p-6 border-b border-green-200">
                  <h3 className="text-lg font-semibold text-green-600">🟢 Compliance Strengths</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-2">
                    {data.green_flags.slice(0, 3).map((flag, idx) => (
                      <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-700">{flag.context}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {data.yellow_flags && data.yellow_flags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-yellow-200">
                <div className="p-6 border-b border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-600">🟡 Moderate Concerns</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-2">
                    {data.yellow_flags.slice(0, 3).map((flag, idx) => (
                      <div key={idx} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-700">{flag.context}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    if (type === 'app') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Market Intelligence Report</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">App Name</p>
                  <p className="font-medium text-gray-900">{data.app_name || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Developer</p>
                  <p className="font-medium text-gray-900">{data.developer || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium text-gray-900">{data.category || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="font-medium text-gray-900">{data.rating || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Installs</p>
                  <p className="font-medium text-gray-900">{data.installs || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Content Rating</p>
                  <p className="font-medium text-gray-900">{data.content_rating || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {data.privacy_policy_url && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Privacy Policy</h3>
              </div>
              <div className="p-6">
                <a 
                  href={data.privacy_policy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  {data.privacy_policy_url}
                </a>
              </div>
            </div>
          )}

          {data.description && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Description</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700">{data.description}</p>
              </div>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Chrome-style Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center ml-4">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold mr-3">
                PI
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Privacy Intelligence</h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Chrome-style Address Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={`privacy-intelligence.local/${activeModule}`}
            readOnly
            className="bg-transparent flex-1 outline-none text-gray-700"
          />
          <div className="flex items-center space-x-2 ml-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-500">Secure</span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Chrome-style Sidebar */}
        {showSidebar && (
          <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
            <nav className="p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Analysis Tools</h3>
              <div className="space-y-1">
                {modules.map(module => (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-md transition-colors ${
                      activeModule === module.id 
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{module.icon}</span>
                    <div className="text-left">
                      <div className="font-medium">{module.name}</div>
                      <div className="text-xs text-gray-500">{module.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-6xl mx-auto p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Panel - Input */}
              <div className="space-y-6">
                {renderModuleContent()}

                {uploading && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <div>
                        <p className="font-medium text-gray-900">Processing analysis...</p>
                        <p className="text-sm text-gray-500">Please wait while we analyze your request</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel - Results */}
              <div className="space-y-6">
                {result ? (
                  <>
                    {renderResults()}
                    
                    {/* Export Options */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Report</h3>
                      <button
                        onClick={() => {
                          const dataStr = JSON.stringify(result.data, null, 2)
                          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
                          const exportFileDefaultName = `privacy_analysis_${result.type}_${Date.now()}.json`
                          const linkElement = document.createElement('a')
                          linkElement.setAttribute('href', dataUri)
                          linkElement.setAttribute('download', exportFileDefaultName)
                          linkElement.click()
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                      >
                        📄 Download JSON Report
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Results</h3>
                    <p className="text-gray-500">Select an analysis tool and provide input to view results</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Chrome-style Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-1">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Privacy Intelligence Platform</span>
            <span>•</span>
            <span>Secure Connection</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>{result ? `Analysis Complete: ${result.type.toUpperCase()}` : 'Ready'}</span>
            <span>•</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ChromeDashboard
