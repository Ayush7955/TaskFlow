'use strict';

const listService = require('../services/list.service');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const data = await listService.findAllInBoard(req.params.boardId, req.user.publicId, req.query);
  res.json({ success: true, message: 'Lists fetched', ...data });
});

exports.create = asyncHandler(async (req, res) => {
  const list = await listService.create(req.params.boardId, req.user.publicId, req.body);
  res.status(201).json({ success: true, message: 'List created', data: list });
});

exports.update = asyncHandler(async (req, res) => {
  const list = await listService.update(req.params.listId, req.user.publicId, req.body);
  res.json({ success: true, message: 'List updated', data: list });
});

exports.archive = asyncHandler(async (req, res) => {
  const list = await listService.setArchived(req.params.listId, req.user.publicId, true);
  res.json({ success: true, message: 'List archived', data: list });
});

exports.unarchive = asyncHandler(async (req, res) => {
  const list = await listService.setArchived(req.params.listId, req.user.publicId, false);
  res.json({ success: true, message: 'List unarchived', data: list });
});

exports.remove = asyncHandler(async (req, res) => {
  await listService.softDelete(req.params.listId, req.user.publicId);
  res.json({ success: true, message: 'List deleted' });
});

