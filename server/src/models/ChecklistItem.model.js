module.exports = (sequelize, DataTypes) => {
  const ChecklistItem = sequelize.define(
    'ChecklistItem',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      checklist_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      text: { type: DataTypes.STRING(500), allowNull: false },
      is_done: { type: DataTypes.BOOLEAN, defaultValue: false },
      position: { type: DataTypes.DOUBLE, allowNull: false },
      assigned_to: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      due_date: { type: DataTypes.DATE, allowNull: true },
      completed_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      completed_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'checklist_items', underscored: true, timestamps: true },
  );

  ChecklistItem.associate = (models) => {
    ChecklistItem.belongsTo(models.Checklist, { foreignKey: 'checklist_id' });
    ChecklistItem.belongsTo(models.User, { foreignKey: 'assigned_to', as: 'assignee' });
    ChecklistItem.belongsTo(models.User, { foreignKey: 'completed_by', as: 'completer' });
  };

  return ChecklistItem;
};

