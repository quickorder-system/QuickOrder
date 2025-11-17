const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    } else {
      cb(null, true);
    }
  }
});

// Handle file uploads (for payment screenshots and inventory item images)
router.post('/', (req, res) => {
  upload.single('paymentScreenshot')(req, res, (err) => {
    // Handle multer errors
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File size exceeds 5MB limit' });
      }
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }

    // Check if file was uploaded
    if (!req.file) {
      console.log('No file in request:', { body: req.body, file: req.file });
      return res.status(400).json({ error: 'No file provided' });
    }

    try {
      const fileUrl = `/uploads/${req.file.filename}`;
      console.log('File uploaded successfully:', fileUrl);
      res.json({ 
        message: 'File uploaded successfully',
        fileUrl: fileUrl
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file: ' + error.message });
    }
  });
});

module.exports = router;