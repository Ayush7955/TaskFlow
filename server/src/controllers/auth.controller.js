const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const register = asyncHandler(async (req, res) => {
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const { user, accessToken, refreshToken } = await authService.register(req.body, meta);
  res.cookie('rt', refreshToken, { ...authService.COOKIE_OPTIONS, maxAge: COOKIE_MAX_AGE });
  res.status(201).json({ success: true, data: { user, accessToken } });
});

const login = asyncHandler(async (req, res) => {
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const { user, accessToken, refreshToken } = await authService.login(req.body, meta);
  res.cookie('rt', refreshToken, { ...authService.COOKIE_OPTIONS, maxAge: COOKIE_MAX_AGE });
  res.json({ success: true, data: { user, accessToken } });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies && req.cookies.rt;
  if (!refreshToken) throw AppError.unauthenticated('No refresh token provided');
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  const { user, accessToken, refreshToken: newRt } = await authService.refresh(refreshToken, meta);
  res.cookie('rt', newRt, { ...authService.COOKIE_OPTIONS, maxAge: COOKIE_MAX_AGE });
  res.json({ success: true, data: { user, accessToken } });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies && req.cookies.rt;
  await authService.logout(refreshToken);
  res.clearCookie('rt', authService.COOKIE_OPTIONS);
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.publicId);
  res.clearCookie('rt', authService.COOKIE_OPTIONS);
  res.json({ success: true, data: { message: 'All sessions terminated' } });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.publicId);
  res.json({ success: true, data: { user } });
});

module.exports = { register, login, refresh, logout, logoutAll, getMe };

