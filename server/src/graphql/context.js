'use strict';

const { AppError } = require('../utils/AppError');
const { User } = require('../models');
const createLoaders = require('./loaders');

/**
 * Build GraphQL context from Express request.
 * Called once per request by Apollo Server.
 */
async function buildContext({ req }) {
  const context = {
    loaders: createLoaders(),
    user: null,
  };

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      const { verifyAccessToken } = require('../utils/jwt');
      const token = authHeader.slice(7);
      const payload = verifyAccessToken(token);

      const user = await User.findOne({ where: { public_id: payload.publicId, is_active: true } });
      if (user && user.token_version === payload.tokenVersion) {
        context.user = { publicId: user.public_id, id: user.id };
      }
    } catch {
      // Invalid token — context.user stays null
    }
  }

  return context;
}

/**
 * Assert user is authenticated. Throw GraphQL-compatible error if not.
 */
function requireAuth(context) {
  if (!context.user) {
    throw AppError.unauthorized('Authentication required');
  }
}

module.exports = { buildContext, requireAuth };
