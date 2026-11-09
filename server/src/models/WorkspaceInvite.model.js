module.exports = (sequelize, DataTypes) => {
  const WorkspaceInvite = sequelize.define(
    'WorkspaceInvite',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      workspace_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false },
      role: { type: DataTypes.ENUM('admin', 'member'), allowNull: false },
      token_hash: { type: DataTypes.CHAR(64), unique: true, allowNull: true },
      invited_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      accepted_at: { type: DataTypes.DATE, allowNull: true },
      revoked_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'workspace_invites',
      underscored: true,
      timestamps: true,
      indexes: [{ fields: ['workspace_id', 'email'] }],
    },
  );

  WorkspaceInvite.associate = (models) => {
    WorkspaceInvite.belongsTo(models.Workspace, { foreignKey: 'workspace_id' });
    WorkspaceInvite.belongsTo(models.User, { foreignKey: 'invited_by', as: 'inviter' });
  };

  return WorkspaceInvite;
};

