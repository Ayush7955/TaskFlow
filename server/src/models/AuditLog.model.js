module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      workspace_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      board_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      entity_type: {
        type: DataTypes.ENUM(
          'workspace', 'member', 'board', 'list', 'card',
          'checklist', 'checklist_item', 'label', 'attachment', 'comment',
        ),
        allowNull: false,
      },
      entity_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      action: { type: DataTypes.STRING(60), allowNull: false },
      before: { type: DataTypes.JSON, allowNull: true },
      after: { type: DataTypes.JSON, allowNull: true },
      meta: { type: DataTypes.JSON, allowNull: true },
    },
    {
      tableName: 'audit_log',
      underscored: true,
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ['workspace_id', 'created_at'] },
        { fields: ['board_id', 'created_at'] },
        { fields: ['entity_type', 'entity_id'] },
      ],
    },
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'actor' });
    AuditLog.belongsTo(models.Workspace, { foreignKey: 'workspace_id' });
  };

  return AuditLog;
};

