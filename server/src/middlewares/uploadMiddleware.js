import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from './errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store in uploads/documents folder
    const uploadPath = path.join(__dirname, '../../uploads/documents');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename: hospitalID-timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `hospitalID-${uniqueSuffix}-${nameWithoutExt}${ext}`);
  }
});

// File filter - only allow specific document types
const fileFilter = (req, file, cb) => {
  // Allowed file types: PDF, JPG, JPEG, PNG
  const allowedTypes = /pdf|jpg|jpeg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new AppError('Only PDF, JPG, JPEG, and PNG files are allowed for Hospital ID', 400));
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter
});

// Middleware for single hospital ID upload
export const uploadHospitalID = upload.single('hospitalID');

// Middleware to handle multer errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File size cannot exceed 5MB', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected file field', 400));
    }
    return next(new AppError(err.message, 400));
  }
  next(err);
};

// Helper function to validate hospital ID presence
export const validateHospitalID = (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Hospital ID document is required for registration', 400));
  }
  next();
};

export default {
  uploadHospitalID,
  handleUploadError,
  validateHospitalID
};
