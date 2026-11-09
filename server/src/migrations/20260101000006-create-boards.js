'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('boards', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      public_id: { type: Sequelize.CHAR(36), unique: true, allowNull: false },
      workspace_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'workspaces', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      name: { type: Sequelize.STRING(120), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      background: { type: Sequelize.STRING(60), allowNull: true },
      visibility: { type: Sequelize.ENUM('private', 'workspace'), defaultValue: 'workspace' },
      created_by: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL', onUpdate: 'CASCADE',
      },
      is_archived: { type: Sequelize.BOOLEAN, defaultValue: false },
      version: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
      deleted_at: { type: Sequelize.DATE(3), allowNull: true },
    });
    await queryInterface.addIndex('boards', ['workspace_id', 'is_archived']);
    await queryInterface.addIndex('boards', ['created_by']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('boards');
  },
};

