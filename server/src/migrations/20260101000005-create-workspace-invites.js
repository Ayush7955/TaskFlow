'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workspace_invites', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      workspace_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'workspaces', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      email: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.ENUM('admin', 'member'), allowNull: false },
      token_hash: { type: Sequelize.CHAR(64), unique: true, allowNull: true },
      invited_by: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL', onUpdate: 'CASCADE',
      },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      accepted_at: { type: Sequelize.DATE, allowNull: true },
      revoked_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
    });
    await queryInterface.addIndex('workspace_invites', ['workspace_id', 'email']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('workspace_invites');
  },
};

