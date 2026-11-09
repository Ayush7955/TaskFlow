'use strict';

const { upload: cloudinaryUpload } = require('./cloudinaryStorage');
const { AppError } = require('../utils/AppError');
const { upload: uploadCfg } = require('../config/env');

/**
 * Unified storage adapter. Routes to Cloudinary (or S3 in future).
 */
async function uploadFile(buffer, originalName, mimeType) {
  const provider = uploadCfg.provider || 'cloudinary';

  if (provider === 'cloudinary') {
    return cloudinaryUpload(buffer, originalName, mimeType);
  }

  // Placeholder for S3
  throw AppError.internal(`Storage provider "${provider}" not configured`);
}

async function deleteFile(providerPublicId, mimeType, provider = 'cloudinary') {
  if (provider === 'cloudinary') {
    const { remove } = require('./cloudinaryStorage');
    return remove(providerPublicId, mimeType);
  }
  require('../config/logger').warn({ providerPublicId }, 'deleteFile: unknown provider');
}

module.exports = { uploadFile, deleteFile };

