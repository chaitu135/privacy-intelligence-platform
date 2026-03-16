import { useState, useEffect } from 'react'
import './App.css'

function CleanWebDashboard() {
  const [activeModule, setActiveModule] = useState('apk')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)

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
      const response = await fetch('https://privacy-intelligence-platform.onrender.com/api/upload-apk', {
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
        response = await fetch('https://privacy-intelligence-platform.onrender.com/api/analyze-policy', {
          method: 'POST',
          body: formData,
        })
      } else {
        response = await fetch('https://privacy-intelligence-platform.onrender.com/api/analyze-policy-url', {
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
      const response = await fetch('https://privacy-intelligence-platform.onrender.com/api/analyze-app-link', {
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
    if (score <= 20) return '#10b981'  // Green
    if (score <= 50) return '#f59e0b'  // Yellow
    if (score <= 80) return '#ef4444'  // Red
    return '#dc2626'  // Dark Red
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
      description: 'Analyze APK files for security risks',
      icon: '📱',
      color: '#3b82f6'
    },
    {
      id: 'policy',
      name: 'Policy Analysis',
      description: 'Evaluate privacy policies',
      icon: '📋',
      color: '#10b981'
    },
    {
      id: 'app',
      name: 'App Store Analysis',
      description: 'Extract app metadata',
      icon: '🔍',
      color: '#f59e0b'
    }
  ]

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'apk':
        return (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Application Security Analysis</h2>
              <p className="text-blue-100">Upload APK file for comprehensive security assessment</p>
            </div>
            
            <div className="p-8">
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4 font-medium text-lg">
                  Drag and drop your APK file here
                </p>
                
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".apk"
                    onChange={(e) => handleApkFile(e.target.files[0])}
                    className="hidden"
                  />
                  <span className="px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors font-medium flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Browse Files
                  </span>
                </label>
              </div>

              {apkFile && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{apkFile.name}</p>
                        <p className="text-sm text-gray-500">{(apkFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setApkFile(null)}
                      className="text-gray-400 hover:text-gray-600 p-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={analyzeApk}
                disabled={!apkFile || uploading}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
              >
                {uploading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Application...
                  </span>
                ) : 'Analyze APK'}
              </button>
            </div>
          </div>
        )

      case 'policy':
        return (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Policy Compliance Analysis</h2>
              <p className="text-green-100">Evaluate privacy policies for compliance risks</p>
            </div>
            
            <div className="p-8">
              <div className="mb-6">
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setPolicyInputMode('file')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                      policyInputMode === 'file' 
                        ? 'bg-green-600 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📄 Upload Document
                  </button>
                  <button
                    onClick={() => setPolicyInputMode('url')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                      policyInputMode === 'url' 
                        ? 'bg-green-600 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🔗 URL Analysis
                  </button>
                </div>

                {policyInputMode === 'file' ? (
                  <div>
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        dragActive 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <div className="mb-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-2 font-medium text-lg">
                        Upload Policy Document
                      </p>
                      <p className="text-gray-500 text-sm mb-4">PDF, TXT, or DOCX formats supported</p>
                      
                      <label className="inline-block">
                        <input
                          type="file"
                          accept=".pdf,.txt,.docx"
                          onChange={(e) => handlePolicyFile(e.target.files[0])}
                          className="hidden"
                        />
                        <span className="px-6 py-3 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition-colors font-medium flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Select Document
                        </span>
                      </label>
                    </div>

                    {policyFile && (
                      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{policyFile.name}</p>
                              <p className="text-sm text-gray-500">{(policyFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setPolicyFile(null)}
                            className="text-gray-400 hover:text-gray-600 p-2"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Privacy Policy URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={policyUrl}
                        onChange={(e) => setPolicyUrl(e.target.value)}
                        placeholder="https://example.com/privacy-policy"
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      />
                      <div className="absolute left-3 top-3.5">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Enter the complete URL of the privacy policy you want to analyze
                    </p>
                  </div>
                )}

                <button
                  onClick={analyzePolicy}
                  disabled={uploading || (policyInputMode === 'file' ? !policyFile : !policyUrl)}
                  className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing Policy...
                    </span>
                  ) : 'Analyze Policy'}
                </button>
              </div>
            </div>
          </div>
        )

      case 'app':
        return (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">App Store Intelligence</h2>
              <p className="text-yellow-100">Extract application metadata and insights</p>
            </div>
            
            <div className="p-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Application Store URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    placeholder="https://play.google.com/store/apps/details?id=com.example.app"
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                  />
                  <div className="absolute left-3 top-3.5">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-gray-700">
                    <strong>Example URL:</strong><br />
                    https://play.google.com/store/apps/details?id=com.whatsapp
                  </p>
                </div>
              </div>

              <button
                onClick={analyzeAppLink}
                disabled={!appUrl || uploading}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg"
              >
                {uploading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Application...
                  </span>
                ) : 'Analyze App'}
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
          {/* Risk Score */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <h2 className="text-2xl font-bold text-white">Security Assessment Report</h2>
            </div>
            <div className="p-8">
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="w-40 h-40 rounded-full border-8 border-gray-200"></div>
                  <div 
                    className={`absolute top-0 left-0 w-40 h-40 rounded-full border-8 ${getRiskBgColor(data.riskScore || 0)}`}
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((data.riskScore * 3.6 - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((data.riskScore * 3.6 - 90) * Math.PI / 180)}%)`
                    }}
                  ></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold" style={{color: getRiskColor(data.riskScore || 0)}}>
                      {data.riskScore || 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">RISK SCORE</div>
                    <div className="text-sm font-bold mt-1" style={{color: getRiskColor(data.riskScore || 0)}}>
                      {getRiskLevel(data.riskScore || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* App Information */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Application Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Application Name</p>
                  <p className="font-semibold text-gray-900">{data.appName || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Package Name</p>
                  <p className="font-semibold text-gray-900">{data.packageName || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Permissions Analysis</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {['normal', 'dangerous', 'special'].map(category => (
                  <div key={category}>
                    <h4 className="font-bold mb-3 text-lg" style={{color: getRiskColor(category === 'normal' ? 20 : category === 'dangerous' ? 50 : 80)}}>
                      {category.charAt(0).toUpperCase() + category.slice(1)} Permissions
                      <span className="ml-2 text-sm font-normal text-gray-500">({data.permissions[category]?.length || 0})</span>
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {data.permissions[category]?.length > 0 ? (
                        <ol className="list-decimal list-inside space-y-2">
                          {data.permissions[category].map((perm, idx) => (
                            <li key={idx} className="text-gray-700 font-medium">
                              {perm.replace('android.permission.', '')}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-gray-500 italic">No {category} permissions found</p>
                      )}
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
              <h2 className="text-2xl font-bold text-white">Compliance Assessment Report</h2>
            </div>
            <div className="p-8">
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="w-40 h-40 rounded-full border-8 border-gray-200"></div>
                  <div 
                    className={`absolute top-0 left-0 w-40 h-40 rounded-full border-8 ${getRiskBgColor(data.risk_score || 0)}`}
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((data.risk_score * 3.6 - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((data.risk_score * 3.6 - 90) * Math.PI / 180)}%)`
                    }}
                  ></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold" style={{color: getRiskColor(data.risk_score || 0)}}>
                      {data.risk_score || 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">COMPLIANCE SCORE</div>
                    <div className="text-sm font-bold mt-1" style={{color: getRiskColor(data.risk_score || 0)}}>
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
              <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
                <div className="bg-red-50 p-6 border-b border-red-200">
                  <h3 className="text-xl font-bold text-red-600 flex items-center">
                    🔴 Critical Compliance Issues
                    <span className="ml-2 text-sm font-normal text-red-500">({data.red_flags.length})</span>
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {data.red_flags.slice(0, 5).map((flag, idx) => (
                      <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-700">{flag.context}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {data.green_flags && data.green_flags.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-green-200 overflow-hidden">
                <div className="bg-green-50 p-6 border-b border-green-200">
                  <h3 className="text-xl font-bold text-green-600 flex items-center">
                    🟢 Compliance Strengths
                    <span className="ml-2 text-sm font-normal text-green-500">({data.green_flags.length})</span>
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {data.green_flags.slice(0, 3).map((flag, idx) => (
                      <div key={idx} className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-700">{flag.context}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {data.yellow_flags && data.yellow_flags.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-yellow-200 overflow-hidden">
                <div className="bg-yellow-50 p-6 border-b border-yellow-200">
                  <h3 className="text-xl font-bold text-yellow-600 flex items-center">
                    🟡 Moderate Concerns
                    <span className="ml-2 text-sm font-normal text-yellow-500">({data.yellow_flags.length})</span>
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {data.yellow_flags.slice(0, 3).map((flag, idx) => (
                      <div key={idx} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6">
              <h2 className="text-2xl font-bold text-white">Market Intelligence Report</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Application Name</p>
                  <p className="font-semibold text-gray-900">{data.app_name || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Developer</p>
                  <p className="font-semibold text-gray-900">{data.developer || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="font-semibold text-gray-900">{data.category || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">User Rating</p>
                  <p className="font-semibold text-gray-900">{data.rating || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Installations</p>
                  <p className="font-semibold text-gray-900">{data.installs || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Content Rating</p>
                  <p className="font-semibold text-gray-900">{data.content_rating || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {data.privacy_policy_url && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Privacy Policy</h3>
              </div>
              <div className="p-6">
                <a 
                  href={data.privacy_policy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline flex items-center"
                >
                  {data.privacy_policy_url}
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          )}

          {data.description && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Application Description</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed">{data.description}</p>
              </div>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mr-4">
                PI
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Privacy Intelligence Platform</h1>
                <p className="text-gray-600">Advanced Security & Compliance Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {modules.map(module => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeModule === module.id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{module.icon}</span>
                {module.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {renderModuleContent()}

            {uploading && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <svg className="animate-spin -ml-1 mr-3 h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-lg font-semibold text-gray-900">Processing Analysis</p>
                    <p className="text-gray-600">Please wait while we analyze your request...</p>
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
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Export Analysis Report</h3>
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
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download JSON Report
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Analysis Results</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Select an analysis module and provide input to view comprehensive results and security insights.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">© 2024 Privacy Intelligence Platform. All rights reserved.</p>
            <p className="text-gray-600 text-sm">Advanced Security & Compliance Analysis System</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default CleanWebDashboard
