module.exports = (sequelize, DataTypes) => {
  const CardMember = sequelize.define(
    'CardMember',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      card_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      assigned_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      assigned_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: 'card_members',
      underscored: true,
      timestamps: true,
      indexes: [{ unique: true, fields: ['card_id', 'user_id'] }],
    },
  );

  CardMember.associate = (models) => {
    CardMember.belongsTo(models.Card, { foreignKey: 'card_id' });
    CardMember.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    CardMember.belongsTo(models.User, { foreignKey: 'assigned_by', as: 'assigner' });
  };

  return CardMember;
};

