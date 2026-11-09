const jwt = require('jsonwebtoken');

// Lazy-load config to avoid circular deps at boot
const getConfig = () => require('../config/env').jwt;

const signAccessToken = (payload) => {
  const { accessSecret, accessTtl } = getConfig();
  return jwt.sign(payload, accessSecret, { expiresIn: accessTtl });
};

const signRefreshToken = (payload) => {
  const { refreshSecret, refreshTtl } = getConfig();
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshTtl });
};

const verifyAccessToken = (token) => {
  const { accessSecret } = getConfig();
  return jwt.verify(token, accessSecret);
};

const verifyRefreshToken = (token) => {
  const { refreshSecret } = getConfig();
  return jwt.verify(token, refreshSecret);
};

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };

