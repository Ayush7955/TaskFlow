module.exports = (sequelize, DataTypes) => {
  const Attachment = sequelize.define(
    'Attachment',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      public_id: { type: DataTypes.CHAR(36), allowNull: false, unique: true, defaultValue: DataTypes.UUIDV4 },
      card_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      uploaded_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      filename: { type: DataTypes.STRING(255), allowNull: true },
      original_name: { type: DataTypes.STRING(255), allowNull: false },
      mime_type: { type: DataTypes.STRING(120), allowNull: false },
      file_size: { type: DataTypes.BIGINT, allowNull: false },
      url: { type: DataTypes.TEXT, allowNull: false },
      provider: { type: DataTypes.STRING(50), defaultValue: 'cloudinary' },
      provider_public_id: { type: DataTypes.STRING(255), allowNull: true },
    },
    { tableName: 'attachments', underscored: true, timestamps: true },
  );

  Attachment.associate = (models) => {
    Attachment.belongsTo(models.Card, { foreignKey: 'card_id', as: 'card' });
    Attachment.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploadedBy' });
  };

  return Attachment;
};
