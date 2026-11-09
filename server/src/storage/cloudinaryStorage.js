'use strict';

const cloudinary = require('../config/cloudinary');
const { AppError } = require('../utils/AppError');

const FOLDER = 'taskflow';

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer - file buffer from multer memoryStorage
 * @param {string} originalName - original filename for display
 * @param {string} mimeType - mime type for resource_type detection
 * @returns {Promise<{url: string, providerPublicId: string, provider: 'cloudinary'}>}
 */
async function upload(buffer, originalName, mimeType) {
  const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: FOLDER,
        resource_type: resourceType,
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(AppError.internal('Cloudinary upload failed: ' + error.message));
        resolve({
          url: result.secure_url,
          providerPublicId: result.public_id,
          provider: 'cloudinary',
        });
      }
    );

    // Convert buffer to stream
    const { Readable } = require('stream');
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

/**
 * Delete a file from Cloudinary.
 * @param {string} providerPublicId - Cloudinary public_id
 * @param {string} mimeType - used to determine resource_type
 */
async function remove(providerPublicId, mimeType) {
  const resourceType = mimeType && mimeType.startsWith('image/') ? 'image' : 'raw';
  try {
    await cloudinary.uploader.destroy(providerPublicId, { resource_type: resourceType });
  } catch (err) {
    // Log but don't throw — DB record should still be deleted
    require('../config/logger').warn({ err, providerPublicId }, 'Cloudinary delete failed');
  }
}

module.exports = { upload, remove };

