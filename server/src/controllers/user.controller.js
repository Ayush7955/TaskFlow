'use strict';

const userService = require('../services/user.service');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.publicId);
  res.json({ success: true, message: 'Profile fetched', data: user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.publicId, req.body);
  res.json({ success: true, message: 'Profile updated', data: user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user.publicId, req.body);
  res.json({ success: true, message: 'Password changed successfully' });
});

exports.deactivate = asyncHandler(async (req, res) => {
  await userService.deactivate(req.user.publicId, req.body);
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Account deactivated' });
});
