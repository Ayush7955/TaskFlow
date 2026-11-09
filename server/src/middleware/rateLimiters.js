const rateLimit = require('express-rate-limit');

const getConfig = () => require('../config/env').rateLimit;

const createLimiter = (windowMsKey, maxKey, message) =>
  rateLimit({
    windowMs: getConfig()[windowMsKey],
    max: getConfig()[maxKey],
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMITED', message: message || 'Too many requests, please try again later' },
    },
  });

const globalLimiter = createLimiter('globalWindowMs', 'globalMax');
const authLimiter = createLimiter('authWindowMs', 'authMax', 'Too many auth attempts, please try again later');
const uploadLimiter = createLimiter('uploadWindowMs', 'uploadMax', 'Upload rate limit exceeded');

module.exports = { globalLimiter, authLimiter, uploadLimiter };

