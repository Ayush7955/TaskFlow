module.exports = (sequelize, DataTypes) => {
  const CardLabel = sequelize.define(
    'CardLabel',
    {
      card_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      label_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    },
    {
      tableName: 'card_labels',
      underscored: true,
      timestamps: false,
    },
  );

  CardLabel.associate = (models) => {
    CardLabel.belongsTo(models.Card, { foreignKey: 'card_id' });
    CardLabel.belongsTo(models.Label, { foreignKey: 'label_id' });
  };

  return CardLabel;
};

