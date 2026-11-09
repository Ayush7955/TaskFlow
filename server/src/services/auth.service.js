const { v4: uuidv4 } = require('uuid');
const { User, RefreshToken, WorkspaceMember, AuditLog, sequelize } = require('../models');
const { hashPassword, comparePassword, sha256, randomToken } = require('../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/v1/auth',
};

const buildTokenPair = (user) => ({
  accessToken: signAccessToken({ sub: user.public_id, tv: user.token_version }),
  refreshToken: signRefreshToken({ sub: user.public_id, tv: user.token_version }),
});

const storeRefreshToken = async (userId, refreshToken, meta = {}) => {
  const tokenHash = sha256(refreshToken);
  const familyId = uuidv4();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  return RefreshToken.create({
    user_id: userId,
    token_hash: tokenHash,
    family_id: familyId,
    user_agent: meta.userAgent || null,
    ip: meta.ip || null,
    expires_at: expiresAt,
  });
};

const register = async ({ name, email, password }, meta = {}) => {
  const existing = await User.scope('withSecrets').findOne({ where: { email: email.toLowerCase() } });
  if (existing) throw AppError.conflict('Email already in use');

  const password_hash = await hashPassword(password);
  const emailVerifyToken = randomToken();
  const emailVerifyTokenHash = sha256(emailVerifyToken);

  const user = await sequelize.transaction(async (t) => {
    const created = await User.create(
      { name, email, password_hash, email_verify_token_hash: emailVerifyTokenHash },
      { transaction: t },
    );
    // Note: workspace_id 0 for user-level events (no workspace context yet)
    await AuditLog.create(
      {
        workspace_id: 0,
        user_id: created.id,
        entity_type: 'member',
        entity_id: created.id,
        action: 'USER_REGISTERED',
        after: { name, email },
        meta: { ip: meta.ip, userAgent: meta.userAgent },
      },
      { transaction: t },
    );
    return created;
  });

  const { accessToken, refreshToken } = buildTokenPair(user);
  await storeRefreshToken(user.id, refreshToken, meta);

  const safeUser = await User.findByPk(user.id);
  return { user: safeUser, accessToken, refreshToken, emailVerifyToken };
};

const login = async ({ email, password }, meta = {}) => {
  const user = await User.scope('withSecrets').findOne({ where: { email: email.toLowerCase() } });
  if (!user) throw AppError.unauthenticated('Invalid credentials');

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) throw AppError.unauthenticated('Invalid credentials');

  await user.update({ last_login_at: new Date() });

  const { accessToken, refreshToken } = buildTokenPair(user);
  await storeRefreshToken(user.id, refreshToken, meta);

  const safeUser = await User.findByPk(user.id);
  return { user: safeUser, accessToken, refreshToken };
};

const refresh = async (refreshToken, meta = {}) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthenticated('Invalid refresh token');
  }

  const tokenHash = sha256(refreshToken);
  const stored = await RefreshToken.findOne({ where: { token_hash: tokenHash } });

  if (!stored) {
    // Reuse detected — revoke entire family
    const compromisedUser = await User.scope('withSecrets').findOne({ where: { public_id: payload.sub } });
    if (compromisedUser) {
      await RefreshToken.update({ revoked_at: new Date() }, { where: { user_id: compromisedUser.id } });
    }
    throw AppError.unauthenticated('Refresh token reuse detected — all sessions revoked');
  }

  if (stored.revoked_at) {
    await RefreshToken.update({ revoked_at: new Date() }, { where: { family_id: stored.family_id } });
    throw AppError.unauthenticated('Refresh token already used');
  }

  if (new Date() > stored.expires_at) throw AppError.unauthenticated('Refresh token expired');

  const user = await User.scope('withSecrets').findOne({ where: { public_id: payload.sub } });
  if (!user) throw AppError.unauthenticated('User not found');
  if (user.token_version !== payload.tv) throw AppError.unauthenticated('Session invalidated');

  // Rotate
  const { accessToken, refreshToken: newRefreshToken } = buildTokenPair(user);
  const newTokenHash = sha256(newRefreshToken);
  const newToken = await RefreshToken.create({
    user_id: user.id,
    token_hash: newTokenHash,
    family_id: stored.family_id,
    user_agent: meta.userAgent || null,
    ip: meta.ip || null,
    expires_at: new Date(Date.now() + REFRESH_TTL_MS),
  });
  await stored.update({ revoked_at: new Date(), replaced_by_id: newToken.id });

  const safeUser = await User.findByPk(user.id);
  return { user: safeUser, accessToken, refreshToken: newRefreshToken };
};

const logout = async (refreshToken) => {
  if (!refreshToken) return;
  const tokenHash = sha256(refreshToken);
  await RefreshToken.update({ revoked_at: new Date() }, { where: { token_hash: tokenHash } });
};

const logoutAll = async (publicId) => {
  const user = await User.scope('withSecrets').findOne({ where: { public_id: publicId } });
  if (!user) return;
  await user.increment('token_version');
  await RefreshToken.update({ revoked_at: new Date() }, { where: { user_id: user.id } });
};

const getMe = async (publicId) => {
  const user = await User.findOne({
    where: { public_id: publicId },
    include: [{ model: WorkspaceMember, attributes: ['workspace_id', 'role'] }],
  });
  if (!user) throw AppError.notFound('User');
  return user;
};

module.exports = { register, login, refresh, logout, logoutAll, getMe, COOKIE_OPTIONS };

