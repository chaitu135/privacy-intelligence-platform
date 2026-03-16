import { useState } from 'react'
import './App.css'

function PrivacyDashboard() {
  const [activeTab, setActiveTab] = useState('apk')
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
      if (activeTab === 'apk') {
        handleApkFile(file)
      } else if (activeTab === 'policy') {
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
        data: data
      })
    } catch (error) {
      console.error('Error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const analyzePolicy = async () => {
    if (policyInputMode === 'file' && !policyFile) {
      alert('Please upload a policy file')
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
        data: data
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
      alert('Please enter a Play Store URL')
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
        data: data
      })
    } catch (error) {
      console.error('Error:', error)
      alert('App analysis failed. Please try again.')
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'apk':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">APK Scanner</h2>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                
                <p className="text-gray-300 mb-2">
                  Drag and drop your APK file here, or
                </p>
                
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".apk"
                    onChange={(e) => handleApkFile(e.target.files[0])}
                    className="hidden"
                  />
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                    Browse Files
                  </span>
                </label>
              </div>

              {apkFile && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-300">Selected file:</p>
                  <p className="font-medium">{apkFile.name}</p>
                  <p className="text-sm text-gray-400">{(apkFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}

              <button
                onClick={analyzeApk}
                disabled={!apkFile || uploading}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                {uploading ? 'Analyzing APK...' : 'Analyze APK'}
              </button>
            </div>
          </div>
        )

      case 'policy':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Policy Scanner</h2>
              
              <div className="mb-4">
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => setPolicyInputMode('file')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      policyInputMode === 'file' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Upload Policy File
                  </button>
                  <button
                    onClick={() => setPolicyInputMode('url')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      policyInputMode === 'url' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Policy URL
                  </button>
                </div>

                {policyInputMode === 'file' ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    
                    <p className="text-gray-300 mb-2">
                      Upload PDF, TXT, or DOCX file
                    </p>
                    
                    <label className="inline-block">
                      <input
                        type="file"
                        accept=".pdf,.txt,.docx"
                        onChange={(e) => handlePolicyFile(e.target.files[0])}
                        className="hidden"
                      />
                      <span className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                        Browse Files
                      </span>
                    </label>
                  </div>

                  {policyFile && (
                    <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-300">Selected file:</p>
                      <p className="font-medium">{policyFile.name}</p>
                      <p className="text-sm text-gray-400">{(policyFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Privacy Policy URL
                    </label>
                    <input
                      type="url"
                      value={policyUrl}
                      onChange={(e) => setPolicyUrl(e.target.value)}
                      placeholder="https://example.com/privacy-policy"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <button
                  onClick={analyzePolicy}
                  disabled={uploading || (policyInputMode === 'file' ? !policyFile : !policyUrl)}
                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  {uploading ? 'Analyzing Policy...' : 'Analyze Policy'}
                </button>
              </div>
            </div>
          </div>
        )

      case 'app':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">App Link Scanner</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google Play Store URL
                </label>
                <input
                  type="url"
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=com.example.app"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                
                <div className="mt-2 text-sm text-gray-400">
                  Example: https://play.google.com/store/apps/details?id=com.example.app
                </div>
              </div>

              <button
                onClick={analyzeAppLink}
                disabled={!appUrl || uploading}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                {uploading ? 'Analyzing App...' : 'Analyze App'}
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
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Risk Assessment</h2>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-8 border-gray-700"></div>
                <div 
                  className={`absolute top-0 left-0 w-32 h-32 rounded-full border-8 ${getRiskBgColor(data.riskScore || 0)}`}
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((data.riskScore * 3.6 - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((data.riskScore * 3.6 - 90) * Math.PI / 180)}%)`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getRiskColor(data.riskScore || 0)}`}>
                      {data.riskScore || 0}
                    </div>
                    <div className="text-xs text-gray-400">Risk Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* App Info */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">App Information</h2>
            <div className="space-y-2">
              <div>
                <span className="text-gray-400">Name:</span>
                <span className="ml-2 font-medium">{data.appName}</span>
              </div>
              <div>
                <span className="text-gray-400">Package:</span>
                <span className="ml-2 font-medium">{data.packageName}</span>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Permissions</h2>
            <div className="space-y-4">
              {['normal', 'dangerous', 'special'].map(category => (
                <div key={category}>
                  <h3 className={`${category === 'normal' ? 'text-green-400' : category === 'dangerous' ? 'text-yellow-400' : 'text-red-400'} font-medium mb-2`}>
                    {category.charAt(0).toUpperCase() + category.slice(1)} ({data.permissions[category]?.length || 0})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.permissions[category]?.map((perm, idx) => (
                      <span key={idx} className={`px-2 py-1 ${
                        category === 'normal' ? 'bg-green-500/20 text-green-400' :
                        category === 'dangerous' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      } rounded text-sm`}>
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
          {/* Risk Score */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Policy Risk Assessment</h2>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-8 border-gray-700"></div>
                <div 
                  className={`absolute top-0 left-0 w-32 h-32 rounded-full border-8 ${getRiskBgColor(data.risk_score || 0)}`}
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((data.risk_score * 3.6 - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((data.risk_score * 3.6 - 90) * Math.PI / 180)}%)`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getRiskColor(data.risk_score || 0)}`}>
                      {data.risk_score || 0}
                    </div>
                    <div className="text-xs text-gray-400">Risk Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Policy Flags */}
          <div className="space-y-4">
            {data.red_flags && data.red_flags.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-red-400">🔴 Red Flags</h3>
                <div className="space-y-2">
                  {data.red_flags.slice(0, 5).map((flag, idx) => (
                    <div key={idx} className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                      <p className="text-sm text-red-300">{flag.context}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.green_flags && data.green_flags.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-400">🟢 Green Flags</h3>
                <div className="space-y-2">
                  {data.green_flags.slice(0, 3).map((flag, idx) => (
                    <div key={idx} className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <p className="text-sm text-green-300">{flag.context}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.yellow_flags && data.yellow_flags.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-yellow-400">🟡 Neutral Flags</h3>
                <div className="space-y-2">
                  {data.yellow_flags.slice(0, 3).map((flag, idx) => (
                    <div key={idx} className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
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
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">App Information</h2>
            <div className="space-y-2">
              <div>
                <span className="text-gray-400">Name:</span>
                <span className="ml-2 font-medium">{data.app_name || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-gray-400">Developer:</span>
                <span className="ml-2 font-medium">{data.developer || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-gray-400">Category:</span>
                <span className="ml-2 font-medium">{data.category || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-gray-400">Rating:</span>
                <span className="ml-2 font-medium">{data.rating || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400">Installs:</span>
                <span className="ml-2 font-medium">{data.installs || 'N/A'}</span>
              </div>
            </div>
          </div>

          {data.privacy_policy_url && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Privacy Policy</h2>
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
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-300">{data.description}</p>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Privacy Intelligence Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Multi-Input Privacy Risk Analyzer
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 rounded-lg p-1 flex space-x-1">
            <button
              onClick={() => setActiveTab('apk')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'apk' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              APK Scanner
            </button>
            <button
              onClick={() => setActiveTab('policy')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'policy' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Policy Scanner
            </button>
            <button
              onClick={() => setActiveTab('app')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'app' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              App Link Scanner
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {renderTabContent()}

            {uploading && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span>Processing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-6">
            {result ? (
              <>
                {renderResults()}
                
                {/* Download Button */}
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
                  className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Download Analysis Report
                </button>
              </>
            ) : (
              <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Upload a file or enter a URL to see analysis results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyDashboard
