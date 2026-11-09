module.exports = (sequelize, DataTypes) => {
  const WorkspaceMember = sequelize.define(
    'WorkspaceMember',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      workspace_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      role: { type: DataTypes.ENUM('owner', 'admin', 'member'), allowNull: false },
      invited_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      joined_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: 'workspace_members',
      underscored: true,
      timestamps: true,
      indexes: [{ unique: true, fields: ['workspace_id', 'user_id'] }],
    },
  );

  WorkspaceMember.associate = (models) => {
    WorkspaceMember.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    WorkspaceMember.belongsTo(models.Workspace, { foreignKey: 'workspace_id', as: 'workspace' });
    WorkspaceMember.belongsTo(models.User, { foreignKey: 'invited_by', as: 'inviter' });
  };

  return WorkspaceMember;
};

