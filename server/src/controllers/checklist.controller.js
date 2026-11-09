'use strict';

const checklistService = require('../services/checklist.service');
const { asyncHandler } = require('../utils/asyncHandler');

// Checklists
exports.getAll = asyncHandler(async (req, res) => {
  const data = await checklistService.findAllInCard(req.params.cardId, req.user.publicId);
  res.json({ success: true, message: 'Checklists fetched', data });
});

exports.create = asyncHandler(async (req, res) => {
  const cl = await checklistService.createChecklist(req.params.cardId, req.user.publicId, req.body);
  res.status(201).json({ success: true, message: 'Checklist created', data: cl });
});

exports.update = asyncHandler(async (req, res) => {
  const cl = await checklistService.updateChecklist(req.params.checklistId, req.user.publicId, req.body);
  res.json({ success: true, message: 'Checklist updated', data: cl });
});

exports.remove = asyncHandler(async (req, res) => {
  await checklistService.deleteChecklist(req.params.checklistId, req.user.publicId);
  res.json({ success: true, message: 'Checklist deleted' });
});

// Items
exports.createItem = asyncHandler(async (req, res) => {
  const item = await checklistService.createItem(req.params.checklistId, req.user.publicId, req.body);
  res.status(201).json({ success: true, message: 'Item created', data: item });
});

exports.updateItem = asyncHandler(async (req, res) => {
  const item = await checklistService.updateItem(req.params.itemId, req.user.publicId, req.body);
  res.json({ success: true, message: 'Item updated', data: item });
});

exports.removeItem = asyncHandler(async (req, res) => {
  await checklistService.deleteItem(req.params.itemId, req.user.publicId);
  res.json({ success: true, message: 'Item deleted' });
});

