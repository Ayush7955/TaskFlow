const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      public_id: { type: DataTypes.CHAR(36), unique: true, allowNull: false, defaultValue: () => uuidv4() },
      name: { type: DataTypes.STRING(100), allowNull: false, validate: { len: [1, 100] } },
      email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      avatar_url: { type: DataTypes.STRING(500), allowNull: true },
      is_email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      email_verify_token_hash: { type: DataTypes.CHAR(64), allowNull: true },
      password_reset_token_hash: { type: DataTypes.CHAR(64), allowNull: true },
      password_reset_expires: { type: DataTypes.DATE, allowNull: true },
      fcm_tokens: { type: DataTypes.JSON, allowNull: true },
      notification_prefs: { type: DataTypes.JSON, allowNull: true },
      last_login_at: { type: DataTypes.DATE, allowNull: true },
      token_version: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
      defaultScope: {
        attributes: {
          exclude: ['password_hash', 'email_verify_token_hash', 'password_reset_token_hash', 'token_version'],
        },
      },
      scopes: {
        withSecrets: { attributes: {} },
        withTokenVersion: { attributes: ['id', 'public_id', 'email', 'token_version'] },
      },
      hooks: {
        beforeSave: (user) => {
          if (user.changed('email') && user.email) {
            user.email = user.email.toLowerCase().trim();
          }
        },
      },
    },
  );

  User.associate = (models) => {
    User.belongsToMany(models.Workspace, {
      through: models.WorkspaceMember,
      foreignKey: 'user_id',
      otherKey: 'workspace_id',
      as: 'workspaces',
    });
    User.hasMany(models.WorkspaceMember, { foreignKey: 'user_id' });
    User.hasMany(models.RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
    User.hasMany(models.Notification, { foreignKey: 'user_id', as: 'notifications' });
  };

  return User;
};

