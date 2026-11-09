'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cards', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      public_id: { type: Sequelize.CHAR(36), unique: true, allowNull: false },
      list_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'lists', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      board_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'boards', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT('medium'), allowNull: true },
      position: { type: Sequelize.DOUBLE, allowNull: false },
      due_date: { type: Sequelize.DATE, allowNull: true },
      start_date: { type: Sequelize.DATE, allowNull: true },
      is_completed: { type: Sequelize.BOOLEAN, defaultValue: false },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      cover_attachment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      priority: { type: Sequelize.ENUM('none', 'low', 'medium', 'high', 'urgent'), defaultValue: 'none' },
      created_by: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL', onUpdate: 'CASCADE',
      },
      is_archived: { type: Sequelize.BOOLEAN, defaultValue: false },
      reminder_sent_at: { type: Sequelize.DATE, allowNull: true },
      overdue_notified_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
      deleted_at: { type: Sequelize.DATE(3), allowNull: true },
    });
    await queryInterface.addIndex('cards', ['list_id', 'position']);
    await queryInterface.addIndex('cards', ['board_id']);
    await queryInterface.addIndex('cards', ['due_date', 'is_completed']);

    // card_members
    await queryInterface.createTable('card_members', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      card_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'cards', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      assigned_by: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL', onUpdate: 'CASCADE',
      },
      assigned_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
    });
    await queryInterface.addIndex('card_members', ['card_id', 'user_id'], { unique: true });

    // card_labels
    await queryInterface.createTable('card_labels', {
      card_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'cards', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      label_id: {
        type: Sequelize.BIGINT.UNSIGNED, allowNull: false,
        references: { model: 'labels', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
    });
    await queryInterface.addConstraint('card_labels', {
      type: 'primary key',
      name: 'card_labels_pkey',
      fields: ['card_id', 'label_id'],
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('card_labels');
    await queryInterface.dropTable('card_members');
    await queryInterface.dropTable('cards');
  },
};

