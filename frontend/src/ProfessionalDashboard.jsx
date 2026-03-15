import { useState, useEffect } from 'react'
import './App.css'

function ProfessionalDashboard() {
  const [activeModule, setActiveModule] = useState('apk')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

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
    if (score <= 20) return 'text-green-500'
    if (score <= 50) return 'text-yellow-500'
    if (score <= 80) return 'text-red-500'
    return 'text-red-700'
  }

  const getRiskBgColor = (score) => {
    if (score <= 20) return 'bg-green-500'
    if (score <= 50) return 'bg-yellow-500'
    if (score <= 80) return 'bg-red-500'
    return 'bg-red-700'
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
      description: 'Comprehensive APK security assessment',
      icon: '📱',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'policy',
      name: 'Policy Compliance',
      description: 'Privacy policy evaluation & analysis',
      icon: '📋',
      color: 'from-purple-600 to-pink-600'
    },
    {
      id: 'app',
      name: 'Market Intelligence',
      description: 'Application metadata & insights',
      icon: '🔍',
      color: 'from-green-600 to-emerald-600'
    }
  ]

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'apk':
        return (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center text-2xl mr-4">
                  📱
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Application Security Analysis</h2>
                  <p className="text-gray-300">Upload APK for comprehensive security assessment</p>
                </div>
              </div>
              
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-600 hover:border-gray-500 bg-white/5'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                
                <p className="text-gray-300 mb-2 text-lg">
                  Drag and drop your APK file here
                </p>
                
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".apk"
                    onChange={(e) => handleApkFile(e.target.files[0])}
                    className="hidden"
                  />
                  <span className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl cursor-pointer hover:from-blue-700 hover:to-cyan-700 transition-all font-medium">
                    Browse Files
                  </span>
                </label>
              </div>

              {apkFile && (
                <div className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Selected File</p>
                      <p className="font-medium text-white">{apkFile.name}</p>
                      <p className="text-sm text-gray-400">{(apkFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => setApkFile(null)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={analyzeApk}
                disabled={!apkFile || uploading}
                className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-cyan-700 transition-all text-lg"
              >
                {uploading ? 'Analyzing Application...' : 'Initiate Security Analysis'}
              </button>
            </div>
          </div>
        )

      case 'policy':
        return (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-2xl mr-4">
                  📋
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Policy Compliance Analysis</h2>
                  <p className="text-gray-300">Evaluate privacy policies for compliance risks</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setPolicyInputMode('file')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                      policyInputMode === 'file' 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    Document Upload
                  </button>
                  <button
                    onClick={() => setPolicyInputMode('url')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                      policyInputMode === 'url' 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    URL Analysis
                  </button>
                </div>

                {policyInputMode === 'file' ? (
                  <div>
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        dragActive 
                          ? 'border-purple-500 bg-purple-500/10' 
                          : 'border-gray-600 hover:border-gray-500 bg-white/5'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      
                      <p className="text-gray-300 mb-2 text-lg">
                        Upload Policy Document
                      </p>
                      <p className="text-gray-400 text-sm mb-4">PDF, TXT, or DOCX formats supported</p>
                      
                      <label className="inline-block">
                        <input
                          type="file"
                          accept=".pdf,.txt,.docx"
                          onChange={(e) => handlePolicyFile(e.target.files[0])}
                          className="hidden"
                        />
                        <span className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl cursor-pointer hover:from-purple-700 hover:to-pink-700 transition-all font-medium">
                          Select Document
                        </span>
                      </label>
                    </div>

                    {policyFile && (
                      <div className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-300">Selected Document</p>
                            <p className="font-medium text-white">{policyFile.name}</p>
                            <p className="text-sm text-gray-400">{(policyFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button
                            onClick={() => setPolicyFile(null)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Privacy Policy URL
                    </label>
                    <input
                      type="url"
                      value={policyUrl}
                      onChange={(e) => setPolicyUrl(e.target.value)}
                      placeholder="https://example.com/privacy-policy"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                )}

                <button
                  onClick={analyzePolicy}
                  disabled={uploading || (policyInputMode === 'file' ? !policyFile : !policyUrl)}
                  className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 transition-all text-lg"
                >
                  {uploading ? 'Analyzing Policy...' : 'Initiate Policy Analysis'}
                </button>
              </div>
            </div>
          </div>
        )

      case 'app':
        return (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center text-2xl mr-4">
                  🔍
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Market Intelligence</h2>
                  <p className="text-gray-300">Extract application metadata and insights</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Application Store URL
                </label>
                <input
                  type="url"
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=com.example.app"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-all"
                />
                
                <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-sm text-gray-400">
                    <strong>Example:</strong> https://play.google.com/store/apps/details?id=com.example.app
                  </p>
                </div>
              </div>

              <button
                onClick={analyzeAppLink}
                disabled={!appUrl || uploading}
                className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-emerald-700 transition-all text-lg"
              >
                {uploading ? 'Analyzing Application...' : 'Initiate Market Analysis'}
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
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Security Assessment Report</h2>
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-40 h-40 rounded-full border-8 border-gray-700"></div>
                <div 
                  className={`absolute top-0 left-0 w-40 h-40 rounded-full border-8 ${getRiskBgColor(data.riskScore || 0)}`}
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((data.riskScore * 3.6 - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((data.riskScore * 3.6 - 90) * Math.PI / 180)}%)`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getRiskColor(data.riskScore || 0)}`}>
                      {data.riskScore || 0}
                    </div>
                    <div className="text-xs text-gray-400">RISK SCORE</div>
                    <div className={`text-sm font-bold ${getRiskColor(data.riskScore || 0)}`}>
                      {getRiskLevel(data.riskScore || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Application Information */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Application Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Application Name</p>
                <p className="font-medium text-white">{data.appName || 'Unknown'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Package Identifier</p>
                <p className="font-medium text-white">{data.packageName || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {/* Permissions Analysis */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6">Permissions Analysis</h3>
            <div className="space-y-6">
              {['normal', 'dangerous', 'special'].map(category => (
                <div key={category}>
                  <h4 className={`${category === 'normal' ? 'text-green-400' : category === 'dangerous' ? 'text-yellow-400' : 'text-red-400'} font-bold mb-3 uppercase tracking-wider`}>
                    {category} ({data.permissions[category]?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.permissions[category]?.map((perm, idx) => (
                      <span key={idx} className={`px-3 py-1 ${
                        category === 'normal' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        category === 'dangerous' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      } rounded-lg text-sm`}>
                        {perm.replace('android.permission.', '')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (type === 'policy') {
      return (
        <div className="space-y-6">
          {/* Policy Risk Assessment */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Compliance Assessment Report</h2>
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-40 h-40 rounded-full border-8 border-gray-700"></div>
                <div 
                  className={`absolute top-0 left-0 w-40 h-40 rounded-full border-8 ${getRiskBgColor(data.risk_score || 0)}`}
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((data.risk_score * 3.6 - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((data.risk_score * 3.6 - 90) * Math.PI / 180)}%)`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getRiskColor(data.risk_score || 0)}`}>
                      {data.risk_score || 0}
                    </div>
                    <div className="text-xs text-gray-400">COMPLIANCE SCORE</div>
                    <div className={`text-sm font-bold ${getRiskColor(data.risk_score || 0)}`}>
                      {getRiskLevel(data.risk_score || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Policy Flags */}
          <div className="space-y-4">
            {data.red_flags && data.red_flags.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-red-500/30">
                <h3 className="text-xl font-bold text-red-400 mb-4">🔴 Critical Compliance Issues</h3>
                <div className="space-y-3">
                  {data.red_flags.slice(0, 5).map((flag, idx) => (
                    <div key={idx} className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                      <p className="text-sm text-red-300">{flag.context}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.green_flags && data.green_flags.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30">
                <h3 className="text-xl font-bold text-green-400 mb-4">🟢 Compliance Strengths</h3>
                <div className="space-y-3">
                  {data.green_flags.slice(0, 3).map((flag, idx) => (
                    <div key={idx} className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                      <p className="text-sm text-green-300">{flag.context}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.yellow_flags && data.yellow_flags.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-yellow-500/30">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">🟡 Moderate Concerns</h3>
                <div className="space-y-3">
                  {data.yellow_flags.slice(0, 3).map((flag, idx) => (
                    <div key={idx} className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                      <p className="text-sm text-yellow-300">{flag.context}</p>
                    </div>
                  ))}
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
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Market Intelligence Report</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Application Name</p>
                <p className="font-medium text-white">{data.app_name || 'Unknown'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Developer</p>
                <p className="font-medium text-white">{data.developer || 'Unknown'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Category</p>
                <p className="font-medium text-white">{data.category || 'Unknown'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">User Rating</p>
                <p className="font-medium text-white">{data.rating || 'N/A'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Installations</p>
                <p className="font-medium text-white">{data.installs || 'N/A'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Content Rating</p>
                <p className="font-medium text-white">{data.content_rating || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {data.privacy_policy_url && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Privacy Policy</h3>
              <a 
                href={data.privacy_policy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {data.privacy_policy_url}
              </a>
            </div>
          )}

          {data.description && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Application Description</h3>
              <p className="text-gray-300">{data.description}</p>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                PI
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Privacy Intelligence Platform</h1>
                <p className="text-gray-400 text-sm">Advanced Security & Compliance Analysis</p>
              </div>
            </div>
            
            {/* Menu Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="lg:hidden p-2 bg-white/10 rounded-lg text-white"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`${showMenu ? 'block' : 'hidden'} lg:block bg-black/10 backdrop-blur-lg border-b border-white/10`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-4">
            {modules.map(module => (
              <button
                key={module.id}
                onClick={() => {
                  setActiveModule(module.id)
                  setShowMenu(false)
                }}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  activeModule === module.id 
                    ? `bg-gradient-to-r ${module.color} text-white shadow-lg` 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <span className="mr-2">{module.icon}</span>
                {module.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {renderModuleContent()}

            {uploading && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <div>
                    <p className="text-white font-medium">Processing Analysis</p>
                    <p className="text-gray-400 text-sm">Please wait while we analyze your request...</p>
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
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">Export Analysis Report</h3>
                  <div className="flex space-x-4">
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
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      📄 Export JSON Report
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-bold text-white mb-2">Analysis Dashboard</h3>
                <p className="text-gray-400">Select an analysis module and provide input to view comprehensive results</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-lg border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 Privacy Intelligence Platform. All rights reserved.</p>
            <p className="text-gray-400 text-sm">Advanced Security & Compliance Analysis System</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ProfessionalDashboard
