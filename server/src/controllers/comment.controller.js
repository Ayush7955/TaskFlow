'use strict';

const commentService = require('../services/comment.service');
const asyncHandler = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const data = await commentService.findAllInCard(req.params.cardId, req.user.publicId, req.query);
  res.json({ success: true, message: 'Comments fetched', ...data });
});

exports.create = asyncHandler(async (req, res) => {
  const comment = await commentService.create(req.params.cardId, req.user.publicId, req.body);
  res.status(201).json({ success: true, message: 'Comment created', data: comment });
});

exports.update = asyncHandler(async (req, res) => {
  const comment = await commentService.update(req.params.commentId, req.user.publicId, req.body);
  res.json({ success: true, message: 'Comment updated', data: comment });
});

exports.remove = asyncHandler(async (req, res) => {
  await commentService.delete(req.params.commentId, req.user.publicId);
  res.json({ success: true, message: 'Comment deleted' });
});

