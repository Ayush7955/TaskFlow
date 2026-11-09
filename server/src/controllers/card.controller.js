'use strict';

const cardService = require('../services/card.service');
const asyncHandler = require('../utils/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const data = await cardService.findAllInList(req.params.listId, req.user.publicId, req.query);
  res.json({ success: true, message: 'Cards fetched', ...data });
});

exports.getBoardPayload = asyncHandler(async (req, res) => {
  const data = await cardService.getBoardPayload(req.params.boardId, req.user.publicId);
  res.json({ success: true, message: 'Board payload fetched', data });
});

exports.getOne = asyncHandler(async (req, res) => {
  const card = await cardService.findById(req.params.cardId, req.user.publicId);
  res.json({ success: true, message: 'Card fetched', data: card });
});

exports.create = asyncHandler(async (req, res) => {
  const card = await cardService.create(req.params.listId, req.user.publicId, req.body);
  res.status(201).json({ success: true, message: 'Card created', data: card });
});

exports.update = asyncHandler(async (req, res) => {
  const card = await cardService.update(req.params.cardId, req.user.publicId, req.body);
  res.json({ success: true, message: 'Card updated', data: card });
});

exports.move = asyncHandler(async (req, res) => {
  const card = await cardService.move(req.params.cardId, req.user.publicId, req.body);
  res.json({ success: true, message: 'Card moved', data: card });
});

exports.archive = asyncHandler(async (req, res) => {
  const card = await cardService.setArchived(req.params.cardId, req.user.publicId, true);
  res.json({ success: true, message: 'Card archived', data: card });
});

exports.unarchive = asyncHandler(async (req, res) => {
  const card = await cardService.setArchived(req.params.cardId, req.user.publicId, false);
  res.json({ success: true, message: 'Card unarchived', data: card });
});

exports.remove = asyncHandler(async (req, res) => {
  await cardService.softDelete(req.params.cardId, req.user.publicId);
  res.json({ success: true, message: 'Card deleted' });
});

// Members
exports.addMember = asyncHandler(async (req, res) => {
  await cardService.addMember(req.params.cardId, req.user.publicId, req.body.userPublicId);
  res.status(201).json({ success: true, message: 'Member assigned' });
});

exports.removeMember = asyncHandler(async (req, res) => {
  await cardService.removeMember(req.params.cardId, req.user.publicId, req.params.userId);
  res.json({ success: true, message: 'Member removed' });
});

// Labels
exports.addLabel = asyncHandler(async (req, res) => {
  await cardService.addLabel(req.params.cardId, req.user.publicId, req.body.labelPublicId);
  res.status(201).json({ success: true, message: 'Label applied' });
});

exports.removeLabel = asyncHandler(async (req, res) => {
  await cardService.removeLabel(req.params.cardId, req.user.publicId, req.params.labelId);
  res.json({ success: true, message: 'Label removed' });
});

