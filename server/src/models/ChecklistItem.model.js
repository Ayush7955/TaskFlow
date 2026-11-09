module.exports = (sequelize, DataTypes) => {
  const ChecklistItem = sequelize.define(
    'ChecklistItem',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      public_id: { type: DataTypes.CHAR(36), allowNull: false, unique: true, defaultValue: DataTypes.UUIDV4 },
      checklist_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      content: { type: DataTypes.STRING(500), allowNull: false },
      is_checked: { type: DataTypes.BOOLEAN, defaultValue: false },
      assignee_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      due_date: { type: DataTypes.DATE, allowNull: true },
      position: { type: DataTypes.DOUBLE, allowNull: false },
    },
    { tableName: 'checklist_items', underscored: true, timestamps: true },
  );

  ChecklistItem.associate = (models) => {
    ChecklistItem.belongsTo(models.Checklist, { foreignKey: 'checklist_id', as: 'checklist' });
    ChecklistItem.belongsTo(models.User, { foreignKey: 'assignee_id', as: 'assignee' });
  };

  return ChecklistItem;
};
