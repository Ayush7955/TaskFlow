const workspaceService = require('../services/workspace.service');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.create(req.user.publicId, req.body);
  res.status(201).json({ success: true, data: { workspace } });
});

const list = asyncHandler(async (req, res) => {
  const result = await workspaceService.findAllForUser(req.user.publicId, req.query);
  res.json({ success: true, ...result });
});

const getOne = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.findById(req.params.wsId, req.user.publicId);
  res.json({ success: true, data: { workspace } });
});

const update = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.update(req.params.wsId, req.user.publicId, req.body);
  res.json({ success: true, data: { workspace } });
});

const remove = asyncHandler(async (req, res) => {
  await workspaceService.softDelete(req.params.wsId, req.user.publicId, req.body);
  res.status(204).send();
});

module.exports = { create, list, getOne, update, remove };

