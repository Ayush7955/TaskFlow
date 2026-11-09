'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // attachments
    await queryInterface.createTable('attachments', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      card_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'cards', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      uploaded_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      original_name: { type: Sequelize.STRING(255), allowNull: false },
      mime_type: { type: Sequelize.STRING(120), allowNull: false },
      size_bytes: { type: Sequelize.BIGINT, allowNull: false },
      provider: { type: Sequelize.ENUM('cloudinary', 's3'), allowNull: false },
      storage_key: { type: Sequelize.STRING(500), allowNull: false },
      url: { type: Sequelize.STRING(1000), allowNull: false },
      thumbnail_url: { type: Sequelize.STRING(1000), allowNull: true },
      is_cover: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
    });
    await queryInterface.addIndex('attachments', ['card_id']);

    // comments
    await queryInterface.createTable('comments', {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      card_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'cards', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      body: { type: Sequelize.TEXT, allowNull: false },
      edited_at: { type: Sequelize.DATE, allowNull: true },
      parent_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'comments', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
    });
    await queryInterface.addIndex('comments', ['card_id', 'created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('comments');
    await queryInterface.dropTable('attachments');
  },
};

