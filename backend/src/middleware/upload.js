const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { cloudinary } = require('../config/cloudinary');

// Ensure public/uploads directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File validation
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only receipt images (jpg, jpeg, png, webp, gif) are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

/**
 * Uploads a local file to Cloudinary or falls back to local serving URL
 * @param {Express.Multer.File} file 
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = async (file) => {
  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'roomies-khata-receipts',
      });
      
      // Delete temporary local file after successful upload to Cloudinary
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Failed to delete temp local file:', err.message);
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload failed, falling back to local file path:', error.message);
    }
  }

  // Local URL fallback
  // Serve path prefix dynamically
  const localUrl = `/uploads/${file.filename}`;
  return {
    url: localUrl,
    publicId: file.filename, // use filename as local deletion reference
  };
};

module.exports = { upload, uploadToCloudinary };
