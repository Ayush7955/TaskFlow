module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    'Comment',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      public_id: { type: DataTypes.CHAR(36), allowNull: false, unique: true, defaultValue: DataTypes.UUIDV4 },
      card_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      content: { type: DataTypes.TEXT, allowNull: false },
      is_edited: { type: DataTypes.BOOLEAN, defaultValue: false },
      parent_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    },
    {
      tableName: 'comments',
      underscored: true,
      timestamps: true,
      indexes: [{ fields: ['card_id', 'created_at'] }],
    },
  );

  Comment.associate = (models) => {
    Comment.belongsTo(models.Card, { foreignKey: 'card_id', as: 'card' });
    Comment.belongsTo(models.User, { foreignKey: 'user_id', as: 'author' });
    Comment.belongsTo(models.Comment, { foreignKey: 'parent_id', as: 'parent' });
    Comment.hasMany(models.Comment, { foreignKey: 'parent_id', as: 'replies' });
  };

  return Comment;
};
