'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workspaces', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      public_id: { type: Sequelize.CHAR(36), unique: true, allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: false },
      slug: { type: Sequelize.STRING(140), unique: true, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      logo_url: { type: Sequelize.STRING(500), allowNull: true },
      owner_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT', onUpdate: 'CASCADE',
      },
      plan: { type: Sequelize.ENUM('free', 'pro', 'enterprise'), defaultValue: 'free' },
      settings: { type: Sequelize.JSON, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
      deleted_at: { type: Sequelize.DATE(3), allowNull: true },
    });
    await queryInterface.addIndex('workspaces', ['owner_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('workspaces');
  },
};

