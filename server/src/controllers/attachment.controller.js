'use strict';

const attachmentService = require('../services/attachment.service');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const data = await attachmentService.findAllInCard(req.params.cardId, req.user.publicId);
  res.json({ success: true, message: 'Attachments fetched', data });
});

exports.upload = asyncHandler(async (req, res) => {
  const { buffer, originalname, mimetype, size } = req.file;
  const attachment = await attachmentService.upload(
    req.params.cardId,
    req.user.publicId,
    buffer,
    { originalname, mimetype, size }
  );
  res.status(201).json({ success: true, message: 'File uploaded', data: attachment });
});

exports.remove = asyncHandler(async (req, res) => {
  await attachmentService.delete(req.params.attachmentId, req.user.publicId);
  res.json({ success: true, message: 'Attachment deleted' });
});

