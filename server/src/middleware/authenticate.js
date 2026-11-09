const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthenticated();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    // sub = user public_id, tv = token_version
    req.user = { publicId: payload.sub, tokenVersion: payload.tv };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw AppError.tokenExpired();
    }
    throw AppError.unauthenticated('Invalid token');
  }
});

module.exports = authenticate;

