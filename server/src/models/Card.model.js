const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Card = sequelize.define(
    'Card',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      public_id: { type: DataTypes.CHAR(36), unique: true, allowNull: false, defaultValue: () => uuidv4() },
      list_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      board_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT('medium'), allowNull: true },
      position: { type: DataTypes.DOUBLE, allowNull: false },
      due_date: { type: DataTypes.DATE, allowNull: true },
      start_date: { type: DataTypes.DATE, allowNull: true },
      is_completed: { type: DataTypes.BOOLEAN, defaultValue: false },
      completed_at: { type: DataTypes.DATE, allowNull: true },
      cover_attachment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      priority: { type: DataTypes.ENUM('none', 'low', 'medium', 'high', 'urgent'), defaultValue: 'none' },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      is_archived: { type: DataTypes.BOOLEAN, defaultValue: false },
      reminder_sent_at: { type: DataTypes.DATE, allowNull: true },
      overdue_notified_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'cards',
      underscored: true,
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['list_id', 'position'] },
        { fields: ['board_id'] },
        { fields: ['due_date', 'is_completed'] },
      ],
    },
  );

  Card.associate = (models) => {
    Card.belongsTo(models.List, { foreignKey: 'list_id', as: 'list' });
    Card.belongsTo(models.Board, { foreignKey: 'board_id', as: 'board' });
    Card.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    Card.belongsToMany(models.User, { through: models.CardMember, foreignKey: 'card_id', otherKey: 'user_id', as: 'assignees' });
    Card.belongsToMany(models.Label, { through: models.CardLabel, foreignKey: 'card_id', otherKey: 'label_id', as: 'labels' });
    Card.hasMany(models.Checklist, { foreignKey: 'card_id', as: 'checklists' });
    Card.hasMany(models.Attachment, { foreignKey: 'card_id', as: 'attachments' });
    Card.hasMany(models.Comment, { foreignKey: 'card_id', as: 'comments' });
  };

  return Card;
};

