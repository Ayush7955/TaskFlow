const boardService = require('../services/board.service');
const cardService = require('../services/card.service');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const board = await boardService.create(req.params.wsId, req.user.publicId, req.body);
  res.status(201).json({ success: true, data: { board } });
});

const list = asyncHandler(async (req, res) => {
  const result = await boardService.findAllInWorkspace(req.params.wsId, req.user.publicId, req.query);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const payload = await cardService.getBoardPayload(req.params.boardId, req.user.publicId);
  res.json({ success: true, data: payload });
});

const update = asyncHandler(async (req, res) => {
  const board = await boardService.update(req.params.boardId, req.user.publicId, req.body);
  res.json({ success: true, data: { board } });
});

const archive = asyncHandler(async (req, res) => {
  const board = await boardService.archive(req.params.boardId, req.user.publicId);
  res.json({ success: true, data: { board } });
});

const restore = asyncHandler(async (req, res) => {
  const board = await boardService.restore(req.params.boardId, req.user.publicId);
  res.json({ success: true, data: { board } });
});

const remove = asyncHandler(async (req, res) => {
  await boardService.softDelete(req.params.boardId, req.user.publicId);
  res.status(204).send();
});

module.exports = { create, list, getOne, update, archive, restore, remove };

