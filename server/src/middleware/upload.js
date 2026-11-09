'use strict';

const multer = require('multer');
const { AppError } = require('../utils/AppError');

// Lazy-load config to avoid crashing in test environments without DB_HOST
function getUploadConfig() {
  try {
    return require('../config/env').upload;
  } catch {
    return { allowedMime: ['image/jpeg', 'image/png', 'image/webp'], maxMb: 10 };
  }
}

// Use memory storage so we can inspect the buffer for magic bytes
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = new Set(getUploadConfig().allowedMime);
const MAX_SIZE_BYTES = getUploadConfig().maxMb * 1024 * 1024;

// Magic byte signatures for allowed file types
const MAGIC_BYTES = {
  'image/jpeg': [
    [0xff, 0xd8, 0xff],
  ],
  'image/png': [
    [0x89, 0x50, 0x4e, 0x47],
  ],
  'image/webp': [
    // RIFF????WEBP
    null, // checked separately
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38],
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46],
  ],
};

/**
 * Verify that a file buffer matches its declared MIME type via magic bytes.
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @returns {boolean}
 */
function verifyMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 4) return false;

  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (mimeType === 'image/webp') {
    // RIFF at bytes 0-3, WEBP at bytes 8-11
    if (buffer.length < 12) return false;
    return (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    );
  }
  if (mimeType === 'image/gif') {
    return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
  }
  if (mimeType === 'application/pdf') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }
  // For other MIME types not in MAGIC_BYTES, allow (less secure — log warning)
  return true;
}

/**
 * Multer file filter — validates MIME type.
 */
function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(AppError.badRequest(`File type "${file.mimetype}" is not allowed`));
  }
  cb(null, true);
}

/**
 * Single file upload middleware.
 * After multer runs, call validateUpload() to verify magic bytes.
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_BYTES,
    files: 1,
  },
});

/**
 * Express middleware to verify magic bytes AFTER multer has stored the buffer.
 * Use as: router.post('/upload', upload.single('file'), validateUpload, controller)
 */
function validateUpload(req, _res, next) {
  if (!req.file) return next(AppError.badRequest('No file uploaded'));

  const { buffer, mimetype } = req.file;
  if (!verifyMagicBytes(buffer, mimetype)) {
    return next(AppError.badRequest('File content does not match declared type (magic byte mismatch)'));
  }

  next();
}

module.exports = { upload, validateUpload, verifyMagicBytes };

