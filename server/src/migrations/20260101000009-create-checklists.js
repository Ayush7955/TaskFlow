'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // checklists
    await queryInterface.createTable('checklists', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      card_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'cards', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(120), allowNull: false },
      position: { type: Sequelize.DOUBLE, allowNull: false },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
    });
    await queryInterface.addIndex('checklists', ['card_id']);

    // checklist_items
    await queryInterface.createTable('checklist_items', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      checklist_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'checklists', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      text: { type: Sequelize.STRING(500), allowNull: false },
      is_done: { type: Sequelize.BOOLEAN, defaultValue: false },
      position: { type: Sequelize.DOUBLE, allowNull: false },
      assigned_to: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      due_date: { type: Sequelize.DATE, allowNull: true },
      completed_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
    });
    await queryInterface.addIndex('checklist_items', ['checklist_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('checklist_items');
    await queryInterface.dropTable('checklists');
  },
};
