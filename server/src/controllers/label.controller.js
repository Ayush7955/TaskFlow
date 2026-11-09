'use strict';

const labelService = require('../services/label.service');
const asyncHandler = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const labels = await labelService.findAllInBoard(req.params.boardId, req.user.publicId);
  res.json({ success: true, message: 'Labels fetched', data: labels });
});

exports.create = asyncHandler(async (req, res) => {
  const label = await labelService.create(req.params.boardId, req.user.publicId, req.body);
  res.status(201).json({ success: true, message: 'Label created', data: label });
});

exports.update = asyncHandler(async (req, res) => {
  const label = await labelService.update(req.params.labelId, req.user.publicId, req.body);
  res.json({ success: true, message: 'Label updated', data: label });
});

exports.remove = asyncHandler(async (req, res) => {
  await labelService.delete(req.params.labelId, req.user.publicId);
  res.json({ success: true, message: 'Label deleted' });
});

