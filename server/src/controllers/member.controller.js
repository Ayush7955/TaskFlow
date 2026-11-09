'use strict';

const { memberService, inviteService } = require('../services/member.service');
const asyncHandler = require('../utils/asyncHandler');

// Members
exports.listMembers = asyncHandler(async (req, res) => {
  const data = await memberService.findAll(req.params.workspaceId, req.user.publicId);
  res.json({ success: true, message: 'Members fetched', data });
});

exports.changeRole = asyncHandler(async (req, res) => {
  const data = await memberService.changeRole(req.params.workspaceId, req.user.publicId, req.params.userId, req.body.role);
  res.json({ success: true, message: 'Role updated', data });
});

exports.removeMember = asyncHandler(async (req, res) => {
  await memberService.remove(req.params.workspaceId, req.user.publicId, req.params.userId);
  res.json({ success: true, message: 'Member removed' });
});

exports.leave = asyncHandler(async (req, res) => {
  await memberService.leave(req.params.workspaceId, req.user.publicId);
  res.json({ success: true, message: 'Left workspace' });
});

// Invites
exports.invite = asyncHandler(async (req, res) => {
  const { invite } = await inviteService.invite(req.params.workspaceId, req.user.publicId, req.body);
  res.status(201).json({ success: true, message: 'Invite sent', data: invite });
});

exports.listInvites = asyncHandler(async (req, res) => {
  const data = await inviteService.listPending(req.params.workspaceId, req.user.publicId);
  res.json({ success: true, message: 'Invites fetched', data });
});

exports.revokeInvite = asyncHandler(async (req, res) => {
  await inviteService.revoke(req.params.inviteId, req.user.publicId);
  res.json({ success: true, message: 'Invite revoked' });
});

exports.acceptInvite = asyncHandler(async (req, res) => {
  const ws = await inviteService.accept(req.params.token, req.user.publicId);
  res.json({ success: true, message: 'Invite accepted', data: ws });
});

