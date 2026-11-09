const { Op } = require('sequelize');
const { Workspace, WorkspaceMember, User, AuditLog, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const { comparePassword } = require('../utils/hash');
const { ROLES } = require('../constants/roles');
const { parsePagination, formatPaginated } = require('../utils/pagination');

/**
 * Resolve internal workspace id from public_id, verify user is a member.
 * Returns 404 for both not-found and non-member (tenant isolation).
 */
const resolveMembership = async (workspacePublicId, userPublicId) => {
  const ws = await Workspace.findOne({ where: { public_id: workspacePublicId } });
  if (!ws) throw AppError.notFound('Workspace');

  const user = await User.findOne({ where: { public_id: userPublicId } });
  if (!user) throw AppError.notFound('User');

  const membership = await WorkspaceMember.findOne({
    where: { workspace_id: ws.id, user_id: user.id },
  });
  if (!membership) throw AppError.notFound('Workspace');

  return { workspace: ws, user, membership };
};

const create = async (userPublicId, { name, description }) => {
  const user = await User.findOne({ where: { public_id: userPublicId } });
  if (!user) throw AppError.notFound('User');

  const workspace = await sequelize.transaction(async (t) => {
    const ws = await Workspace.create(
      { name, description: description || null, owner_id: user.id },
      { transaction: t },
    );
    await WorkspaceMember.create(
      { workspace_id: ws.id, user_id: user.id, role: ROLES.OWNER, joined_at: new Date() },
      { transaction: t },
    );
    await AuditLog.create(
      {
        workspace_id: ws.id,
        user_id: user.id,
        entity_type: 'workspace',
        entity_id: ws.id,
        action: 'WORKSPACE_CREATED',
        after: { name },
      },
      { transaction: t },
    );
    return ws;
  });

  return workspace;
};

const findAllForUser = async (userPublicId, query) => {
  const user = await User.findOne({ where: { public_id: userPublicId } });
  if (!user) throw AppError.notFound('User');

  const { page, limit, offset } = parsePagination(query);

  const { count, rows } = await Workspace.findAndCountAll({
    include: [
      {
        model: WorkspaceMember,
        as: 'memberships',
        where: { user_id: user.id },
        attributes: ['role'],
        required: true,
      },
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return formatPaginated(rows, count, page, limit);
};

const findById = async (workspacePublicId, userPublicId) => {
  const { workspace } = await resolveMembership(workspacePublicId, userPublicId);
  return workspace;
};

const update = async (workspacePublicId, userPublicId, patch) => {
  const { workspace, user } = await resolveMembership(workspacePublicId, userPublicId);
  const before = { name: workspace.name, description: workspace.description };

  const updated = await sequelize.transaction(async (t) => {
    const result = await workspace.update(patch, { transaction: t });
    await AuditLog.create(
      {
        workspace_id: workspace.id,
        user_id: user.id,
        entity_type: 'workspace',
        entity_id: workspace.id,
        action: 'WORKSPACE_UPDATED',
        before,
        after: patch,
      },
      { transaction: t },
    );
    return result;
  });

  return updated;
};

const softDelete = async (workspacePublicId, userPublicId, { password }) => {
  const { workspace, user } = await resolveMembership(workspacePublicId, userPublicId);

  // Re-confirm password
  const userWithSecrets = await User.scope('withSecrets').findByPk(user.id);
  const valid = await comparePassword(password, userWithSecrets.password_hash);
  if (!valid) throw AppError.badRequest('Invalid password');

  await sequelize.transaction(async (t) => {
    await workspace.destroy({ transaction: t });
    await AuditLog.create(
      {
        workspace_id: workspace.id,
        user_id: user.id,
        entity_type: 'workspace',
        entity_id: workspace.id,
        action: 'WORKSPACE_DELETED',
      },
      { transaction: t },
    );
  });
};

module.exports = { create, findAllForUser, findById, update, softDelete };

