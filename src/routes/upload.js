const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

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
  upload.single('paymentScreenshot')(req, res, async (err) => {
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
      // Upload to Cloudinary using buffer
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'quickorder/items',
          resource_type: 'auto',
          max_file_size: 5242880 // 5MB
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({ error: 'Failed to upload to Cloudinary: ' + error.message });
          }

          console.log('File uploaded successfully to Cloudinary:', result.secure_url);
          res.json({ 
            message: 'File uploaded successfully',
            fileUrl: result.secure_url,
            publicId: result.public_id
          });
        }
      );

      // Convert buffer to stream and pipe to Cloudinary
      Readable.from(req.file.buffer).pipe(stream);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file: ' + error.message });
    }
  });
});

module.exports = router;