'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/attachment.controller');
const { authenticate } = require('../middleware/authenticate');
const { upload: multerUpload, validateUpload } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiters');

router.use(authenticate);

// Under /cards/:cardId/attachments
router.get('/', ctrl.getAll);
router.post(
  '/',
  uploadLimiter,
  multerUpload.single('file'),
  validateUpload,
  ctrl.upload
);

// Individual attachment
router.delete('/:attachmentId', ctrl.remove);

module.exports = router;
