const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');

module.exports = (sequelize, DataTypes) => {
  const Workspace = sequelize.define(
    'Workspace',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      public_id: { type: DataTypes.CHAR(36), unique: true, allowNull: false, defaultValue: () => uuidv4() },
      name: { type: DataTypes.STRING(120), allowNull: false, validate: { len: [1, 120] } },
      slug: { type: DataTypes.STRING(140), unique: true, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      logo_url: { type: DataTypes.STRING(500), allowNull: true },
      owner_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      plan: { type: DataTypes.ENUM('free', 'pro', 'enterprise'), defaultValue: 'free' },
      settings: { type: DataTypes.JSON, allowNull: true },
    },
    {
      tableName: 'workspaces',
      underscored: true,
      timestamps: true,
      paranoid: true,
      hooks: {
        beforeValidate: async (workspace) => {
          if (workspace.isNewRecord || workspace.changed('name')) {
            const base = slugify(workspace.name || '', { lower: true, strict: true }) || 'workspace';
            let slug = base;
            let counter = 1;
            // eslint-disable-next-line no-constant-condition
            while (true) {
              // eslint-disable-next-line no-await-in-loop
              const existing = await Workspace.findOne({ where: { slug }, paranoid: false });
              if (!existing || existing.id === workspace.id) break;
              slug = `${base}-${counter}`;
              counter += 1;
            }
            workspace.slug = slug;
          }
        },
      },
    },
  );

  Workspace.associate = (models) => {
    Workspace.belongsToMany(models.User, {
      through: models.WorkspaceMember,
      foreignKey: 'workspace_id',
      otherKey: 'user_id',
      as: 'memberUsers',
    });
    Workspace.hasMany(models.WorkspaceMember, { foreignKey: 'workspace_id', as: 'memberships' });
    Workspace.hasMany(models.Board, { foreignKey: 'workspace_id', as: 'boards' });
    Workspace.hasMany(models.WorkspaceInvite, { foreignKey: 'workspace_id', as: 'invites' });
    Workspace.belongsTo(models.User, { foreignKey: 'owner_id', as: 'owner' });
  };

  return Workspace;
};

