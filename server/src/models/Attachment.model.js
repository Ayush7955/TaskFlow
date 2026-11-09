module.exports = (sequelize, DataTypes) => {
  const Attachment = sequelize.define(
    'Attachment',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      card_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      uploaded_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      original_name: { type: DataTypes.STRING(255), allowNull: false },
      mime_type: { type: DataTypes.STRING(120), allowNull: false },
      size_bytes: { type: DataTypes.BIGINT, allowNull: false },
      provider: { type: DataTypes.ENUM('cloudinary', 's3'), allowNull: false },
      storage_key: { type: DataTypes.STRING(500), allowNull: false },
      url: { type: DataTypes.STRING(1000), allowNull: false },
      thumbnail_url: { type: DataTypes.STRING(1000), allowNull: true },
      is_cover: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { tableName: 'attachments', underscored: true, timestamps: true },
  );

  Attachment.associate = (models) => {
    Attachment.belongsTo(models.Card, { foreignKey: 'card_id', as: 'card' });
    Attachment.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploadedBy' });
  };

  return Attachment;
};

