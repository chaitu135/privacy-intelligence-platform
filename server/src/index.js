const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// APK upload configuration
const apkUpload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.apk')) {
      cb(null, true);
    } else {
      cb(new Error('Only APK files are allowed'), false);
    }
  }
});

// Policy file upload configuration
const policyUpload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.docx'];
    const fileExtension = '.' + file.originalname.split('.').pop().toLowerCase();
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, or DOCX files are allowed'), false);
    }
  }
});

// APK upload endpoint
app.post('/api/upload-apk', apkUpload.single('apkFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    
    // Forward to Python analyzer service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';
    
    const formData = new FormData();
    formData.append('apkFile', fs.createReadStream(filePath), req.file.originalname);

    const response = await axios.post(`${pythonServiceUrl}/analyze`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000 // 30 seconds timeout
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    const result = response.data;
    res.json(result);

  } catch (error) {
    console.error('Error processing APK:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'Analysis service unavailable' });
    } else if (error.code === 'ETIMEDOUT') {
      res.status(408).json({ error: 'Analysis timeout' });
    } else {
      res.status(500).json({ error: 'Failed to analyze APK' });
    }
  }
});

// Policy file upload endpoint
app.post('/api/analyze-policy', policyUpload.single('policyFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    
    // Forward to Python analyzer service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';
    
    const formData = new FormData();
    formData.append('policyFile', fs.createReadStream(filePath), req.file.originalname);

    const response = await axios.post(`${pythonServiceUrl}/analyze-policy`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    const result = response.data;
    res.json(result);

  } catch (error) {
    console.error('Error processing policy:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'Analysis service unavailable' });
    } else {
      res.status(500).json({ error: 'Failed to analyze policy' });
    }
  }
});

// Policy URL analysis endpoint
app.post('/api/analyze-policy-url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Forward to Python analyzer service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

    const response = await axios.post(`${pythonServiceUrl}/analyze-policy-url`, {
      url: url
    }, {
      timeout: 30000
    });

    const result = response.data;
    res.json(result);

  } catch (error) {
    console.error('Error analyzing policy URL:', error);
    
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'Analysis service unavailable' });
    } else {
      res.status(500).json({ error: 'Failed to analyze policy URL' });
    }
  }
});

// App link analysis endpoint
app.post('/api/analyze-app-link', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'Play Store URL is required' });
    }

    // Extract package name from Play Store URL
    const packageMatch = url.match(/id=([a-zA-Z0-9_.]+)/);
    const packageName = packageMatch ? packageMatch[1] : url;
    
    // Forward to Python analyzer service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

    const response = await axios.post(`${pythonServiceUrl}/analyze-app-link`, {
      url: url,
      package: packageName
    }, {
      timeout: 30000
    });

    const result = response.data;
    res.json(result);

  } catch (error) {
    console.error('Error analyzing app link:', error);
    
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ 
        status: 'failed',
        reason: 'Play Store metadata service unavailable' 
      });
    } else if (error.response && error.response.status === 404) {
      res.status(404).json({ 
        status: 'failed',
        reason: 'App not found in Play Store' 
      });
    } else {
      res.status(500).json({ 
        status: 'failed',
        reason: 'Play Store metadata unavailable' 
      });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  res.status(500).json({ error: error.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
