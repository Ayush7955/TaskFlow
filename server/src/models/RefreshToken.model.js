const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define(
    'RefreshToken',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      token_hash: { type: DataTypes.CHAR(64), unique: true, allowNull: false },
      family_id: { type: DataTypes.CHAR(36), allowNull: false, defaultValue: () => uuidv4() },
      user_agent: { type: DataTypes.STRING(500), allowNull: true },
      ip: { type: DataTypes.STRING(45), allowNull: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      revoked_at: { type: DataTypes.DATE, allowNull: true },
      replaced_by_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    },
    {
      tableName: 'refresh_tokens',
      underscored: true,
      timestamps: true,
    },
  );

  RefreshToken.associate = (models) => {
    RefreshToken.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return RefreshToken;
};

