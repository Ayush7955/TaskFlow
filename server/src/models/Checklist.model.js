module.exports = (sequelize, DataTypes) => {
  const Checklist = sequelize.define(
    'Checklist',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      public_id: { type: DataTypes.CHAR(36), allowNull: false, unique: true, defaultValue: DataTypes.UUIDV4 },
      card_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      position: { type: DataTypes.DOUBLE, allowNull: false },
    },
    { tableName: 'checklists', underscored: true, timestamps: true },
  );

  Checklist.associate = (models) => {
    Checklist.belongsTo(models.Card, { foreignKey: 'card_id', as: 'card' });
    Checklist.hasMany(models.ChecklistItem, { foreignKey: 'checklist_id', as: 'items' });
  };

  return Checklist;
};
