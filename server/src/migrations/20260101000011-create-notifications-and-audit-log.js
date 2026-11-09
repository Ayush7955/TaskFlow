'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // notifications
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM(
          'card_assigned',
          'card_due_soon',
          'card_overdue',
          'card_moved',
          'comment_mention',
          'invite',
          'role_changed'
        ),
        allowNull: false,
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: true },
      data: { type: Sequelize.JSON, allowNull: true },
      read_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
    });
    await queryInterface.addIndex('notifications', ['user_id', 'read_at', 'created_at']);

    // audit_log
    await queryInterface.createTable('audit_log', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      workspace_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      board_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      entity_type: {
        type: Sequelize.ENUM(
          'workspace',
          'member',
          'board',
          'list',
          'card',
          'checklist',
          'checklist_item',
          'label',
          'attachment',
          'comment'
        ),
        allowNull: false,
      },
      entity_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      action: { type: Sequelize.STRING(60), allowNull: false },
      before: { type: Sequelize.JSON, allowNull: true },
      after: { type: Sequelize.JSON, allowNull: true },
      meta: { type: Sequelize.JSON, allowNull: true },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
    });
    await queryInterface.addIndex('audit_log', ['workspace_id', 'created_at']);
    await queryInterface.addIndex('audit_log', ['board_id', 'created_at']);
    await queryInterface.addIndex('audit_log', ['entity_type', 'entity_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_log');
    await queryInterface.dropTable('notifications');
  },
};

