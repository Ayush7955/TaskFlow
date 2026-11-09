const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Board = sequelize.define(
    'Board',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      public_id: { type: DataTypes.CHAR(36), unique: true, allowNull: false, defaultValue: () => uuidv4() },
      workspace_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(120), allowNull: false, validate: { len: [1, 120] } },
      description: { type: DataTypes.TEXT, allowNull: true },
      background: { type: DataTypes.STRING(60), allowNull: true },
      visibility: { type: DataTypes.ENUM('private', 'workspace'), defaultValue: 'workspace' },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      is_archived: { type: DataTypes.BOOLEAN, defaultValue: false },
      version: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: 'boards',
      underscored: true,
      timestamps: true,
      paranoid: true,
      indexes: [{ fields: ['workspace_id', 'is_archived'] }],
    },
  );

  Board.associate = (models) => {
    Board.belongsTo(models.Workspace, { foreignKey: 'workspace_id', as: 'workspace' });
    Board.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    Board.hasMany(models.List, { foreignKey: 'board_id', as: 'lists' });
    Board.hasMany(models.Card, { foreignKey: 'board_id', as: 'cards' });
    Board.hasMany(models.Label, { foreignKey: 'board_id', as: 'labels' });
  };

  return Board;
};

