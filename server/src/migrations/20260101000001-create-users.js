'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      public_id: { type: Sequelize.CHAR(36), unique: true, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(255), unique: true, allowNull: false },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      avatar_url: { type: Sequelize.STRING(500), allowNull: true },
      is_email_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      email_verify_token_hash: { type: Sequelize.CHAR(64), allowNull: true },
      password_reset_token_hash: { type: Sequelize.CHAR(64), allowNull: true },
      password_reset_expires: { type: Sequelize.DATE, allowNull: true },
      fcm_tokens: { type: Sequelize.JSON, allowNull: true },
      notification_prefs: { type: Sequelize.JSON, allowNull: true },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      token_version: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};

