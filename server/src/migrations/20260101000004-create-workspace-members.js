'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workspace_members', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      workspace_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'workspaces', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      role: { type: Sequelize.ENUM('owner', 'admin', 'member'), allowNull: false },
      invited_by: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL', onUpdate: 'CASCADE',
      },
      joined_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
    });
    await queryInterface.addIndex('workspace_members', ['workspace_id', 'user_id'], { unique: true });
    await queryInterface.addIndex('workspace_members', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('workspace_members');
  },
};

