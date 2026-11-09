module.exports = (sequelize, DataTypes) => {
  const Label = sequelize.define(
    'Label',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      board_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(60), allowNull: true },
      color: { type: DataTypes.CHAR(7), allowNull: false },
    },
    {
      tableName: 'labels',
      underscored: true,
      timestamps: true,
      indexes: [{ unique: true, fields: ['board_id', 'name', 'color'] }],
    },
  );

  Label.associate = (models) => {
    Label.belongsTo(models.Board, { foreignKey: 'board_id', as: 'board' });
    Label.belongsToMany(models.Card, { through: models.CardLabel, foreignKey: 'label_id', otherKey: 'card_id', as: 'cards' });
  };

  return Label;
};

