module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      type: {
        type: DataTypes.ENUM(
          'card_assigned', 'card_due_soon', 'card_overdue',
          'card_moved', 'comment_mention', 'invite', 'role_changed',
        ),
        allowNull: false,
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: true },
      data: { type: DataTypes.JSON, allowNull: true },
      read_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'notifications',
      underscored: true,
      timestamps: true,
      updatedAt: false,
      indexes: [{ fields: ['user_id', 'read_at', 'created_at'] }],
    },
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return Notification;
};

