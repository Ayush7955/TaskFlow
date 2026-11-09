'use strict';

const { User } = require('../models');
const { AppError } = require('../utils/AppError');
const { hashPassword, comparePassword } = require('../utils/hash');
const sequelize = require('../config/database');

class UserService {
  /**
   * GET /users/me — get current user profile.
   */
  async getProfile(userPublicId) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');
    return user;
  }

  /**
   * PATCH /users/me — update name or avatar.
   */
  async updateProfile(userPublicId, { name, avatarUrl }) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    if (name !== undefined) user.name = name;
    if (avatarUrl !== undefined) user.avatar_url = avatarUrl;

    await user.save();
    return user;
  }

  /**
   * POST /users/me/change-password
   */
  async changePassword(userPublicId, { currentPassword, newPassword }) {
    const user = await User.scope('withSecrets').findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const valid = await comparePassword(currentPassword, user.password_hash);
    if (!valid) throw AppError.badRequest('Current password is incorrect');

    const hash = await hashPassword(newPassword);

    await sequelize.transaction(async (t) => {
      user.password_hash = hash;
      user.token_version += 1; // invalidate all existing refresh tokens
      await user.save({ transaction: t });
    });
  }

  /**
   * DELETE /users/me — deactivate account.
   */
  async deactivate(userPublicId, { password }) {
    const user = await User.scope('withSecrets').findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) throw AppError.badRequest('Password is incorrect');

    user.is_active = false;
    user.token_version += 1;
    await user.save();
  }
}

module.exports = new UserService();

