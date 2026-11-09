'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // lists
    await queryInterface.createTable('lists', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      public_id: { type: Sequelize.CHAR(36), unique: true, allowNull: false },
      board_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'boards', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(120), allowNull: false },
      position: { type: Sequelize.DOUBLE, allowNull: false },
      is_archived: { type: Sequelize.BOOLEAN, defaultValue: false },
      wip_limit: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
      deleted_at: { type: Sequelize.DATE(3), allowNull: true },
    });
    await queryInterface.addIndex('lists', ['board_id', 'position']);

    // labels
    await queryInterface.createTable('labels', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      board_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'boards', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      name: { type: Sequelize.STRING(60), allowNull: true },
      color: { type: Sequelize.CHAR(7), allowNull: false },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
    });
    await queryInterface.addIndex('labels', ['board_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('labels');
    await queryInterface.dropTable('lists');
  },
};

