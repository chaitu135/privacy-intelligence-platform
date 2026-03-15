# Privacy Intelligence System

A web-based system for analyzing Android APK files to extract permissions and assess privacy risks. Built with React, Node.js, and Python with Androguard for APK analysis.

## 🏗️ Architecture

```
User (React SPA) ↔ Node.js/Express API ↔ Python Flask Analyzer
```

- **Frontend**: React + TailwindCSS (single-page application)
- **Backend**: Node.js + Express (file upload and orchestration)
- **Analysis Service**: Python Flask + Androguard (APK manifest extraction)

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8 or higher
- npm/yarn
- pip

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd privacy-intel
   ```

2. **Setup Python Analyzer**
   ```bash
   cd analyzer
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Mac/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

3. **Setup Node.js Backend**
   ```bash
   cd ../server
   npm install
   ```

4. **Setup React Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the Python Analyzer Service**
   ```bash
   cd analyzer
   python app.py
   ```
   The service will start on `http://localhost:5000`

2. **Start the Node.js Backend**
   ```bash
   cd server
   npm start
   ```
   The API will start on `http://localhost:3001`

3. **Start the React Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   The application will open on `http://localhost:5173`

## 📁 Project Structure

```
privacy-intel/
├── frontend/                 # React + TailwindCSS SPA
│   ├── src/
│   │   ├── App.jsx          # Main application component
│   │   └── index.css        # Tailwind styles
│   ├── package.json
│   └── tailwind.config.js
├── server/                   # Node.js + Express API
│   ├── src/
│   │   └── index.js         # Main server file
│   └── package.json
├── analyzer/                 # Python Flask analyzer
│   ├── app.py               # Flask application
│   ├── requirements.txt     # Python dependencies
│   └── utils/
│       └── andro_extract.py # APK analysis logic
└── README.md
```

## 🔧 API Endpoints

### Node.js Backend

- `POST /api/upload-apk` - Upload and analyze APK file
- `GET /api/health` - Health check endpoint

### Python Analyzer

- `POST /analyze` - Analyze APK file and return permissions
- `GET /health` - Health check endpoint

## 📊 Risk Scoring

The system calculates privacy risk scores based on permission types:

- **Normal permissions**: 0 points
- **Dangerous permissions**: 10 points each
- **Special permissions**: 15 points each

**Risk Levels:**
- **0-30**: Low Risk (Green)
- **31-60**: Medium Risk (Yellow)
- **61-100**: High Risk (Red)

## 🎯 Features

- **Drag & Drop Upload**: Intuitive file upload interface
- **Real-time Analysis**: Instant permission extraction and risk assessment
- **Permission Classification**: Categorizes permissions into Normal/Dangerous/Special
- **Risk Visualization**: Circular gauge showing risk score
- **Download Reports**: Export analysis results as JSON
- **Responsive Design**: Works on desktop and mobile devices

## 📱 Supported Analysis

- **App Information**: Name, package, version details
- **Permission Extraction**: All permissions from AndroidManifest.xml
- **SDK Information**: Min and target SDK versions
- **Risk Assessment**: Automated privacy risk scoring

## 🔒 Permission Categories

### Normal Permissions
Low-risk permissions like internet access, network state, vibration, etc.

### Dangerous Permissions
Medium-risk permissions that require user consent:
- Location (fine/coarse)
- Contacts (read/write)
- Storage (read/write)
- Camera, microphone
- Phone, SMS

### Special Permissions
High-risk permissions requiring additional oversight:
- System alert window
- Device administrator
- Accessibility service
- Usage access
- Install unknown apps

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel or Netlify
```

### Backend (Render/Heroku/Railway)
```bash
cd server
# Deploy to your preferred platform
# Set PYTHON_SERVICE_URL environment variable
```

### Python Service (Render/Heroku)
```bash
cd analyzer
# Deploy to your preferred platform
# Ensure Androguard is available in the deployment environment
```

## 🧪 Testing

### Test with Sample APKs
1. Download sample APK files
2. Upload through the web interface
3. Verify permission extraction and risk scoring

### API Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Upload APK (replace with actual file)
curl -X POST -F "apkFile=@sample.apk" http://localhost:3001/api/upload-apk
```

## 🐛 Troubleshooting

### Common Issues

1. **Python Service Connection Error**
   - Ensure the Python analyzer is running on port 5000
   - Check firewall settings

2. **Androguard Installation Issues**
   ```bash
   pip install --upgrade androguard
   # If issues persist, try:
   pip install androguard==3.3.5
   ```

3. **File Upload Errors**
   - Check file size limit (50MB max)
   - Ensure file is a valid APK

4. **CORS Issues**
   - The backend includes CORS middleware
   - For production, update allowed origins

## 📈 Future Enhancements

- **Machine Learning**: Advanced privacy risk models
- **Policy Analysis**: Privacy policy extraction and analysis
- **Historical Data**: Store and compare analysis results
- **Batch Processing**: Analyze multiple APKs simultaneously
- **API Rate Limiting**: Prevent abuse
- **User Authentication**: Secure access control

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please open an issue in the repository.
