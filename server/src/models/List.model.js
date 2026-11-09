const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const List = sequelize.define(
    'List',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      public_id: { type: DataTypes.CHAR(36), unique: true, allowNull: false, defaultValue: () => uuidv4() },
      board_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      title: { type: DataTypes.STRING(120), allowNull: false },
      position: { type: DataTypes.DOUBLE, allowNull: false },
      is_archived: { type: DataTypes.BOOLEAN, defaultValue: false },
      wip_limit: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'lists',
      underscored: true,
      timestamps: true,
      paranoid: true,
      indexes: [{ fields: ['board_id', 'position'] }],
    },
  );

  List.associate = (models) => {
    List.belongsTo(models.Board, { foreignKey: 'board_id', as: 'board' });
    List.hasMany(models.Card, { foreignKey: 'list_id', as: 'cards' });
  };

  return List;
};

