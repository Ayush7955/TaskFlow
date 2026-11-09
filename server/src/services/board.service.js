const { Op } = require('sequelize');
const { Board, Workspace, WorkspaceMember, User, AuditLog, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, formatPaginated } = require('../utils/pagination');

/**
 * Resolve user internal id from public_id
 */
const resolveUser = async (userPublicId) => {
  const user = await User.findOne({ where: { public_id: userPublicId } });
  if (!user) throw AppError.notFound('User');
  return user;
};

/**
 * Verify user is member of the workspace that owns the board.
 * Returns 404 for both not-found and non-member (tenant isolation).
 */
const resolveBoardAccess = async (boardPublicId, userPublicId) => {
  const user = await resolveUser(userPublicId);

  const board = await Board.findOne({ where: { public_id: boardPublicId } });
  if (!board) throw AppError.notFound('Board');

  const membership = await WorkspaceMember.findOne({
    where: { workspace_id: board.workspace_id, user_id: user.id },
  });
  if (!membership) throw AppError.notFound('Board');

  return { board, user, membership, role: membership.role };
};

const resolveWorkspaceAccess = async (workspacePublicId, userPublicId) => {
  const user = await resolveUser(userPublicId);
  const ws = await Workspace.findOne({ where: { public_id: workspacePublicId } });
  if (!ws) throw AppError.notFound('Workspace');
  const membership = await WorkspaceMember.findOne({ where: { workspace_id: ws.id, user_id: user.id } });
  if (!membership) throw AppError.notFound('Workspace');
  return { workspace: ws, user, membership };
};

const create = async (workspacePublicId, userPublicId, { name, description, background, visibility }) => {
  const { workspace, user } = await resolveWorkspaceAccess(workspacePublicId, userPublicId);

  const board = await sequelize.transaction(async (t) => {
    const created = await Board.create(
      {
        workspace_id: workspace.id,
        name,
        description: description || null,
        background: background || null,
        visibility: visibility || 'workspace',
        created_by: user.id,
      },
      { transaction: t },
    );
    await AuditLog.create(
      {
        workspace_id: workspace.id,
        board_id: created.id,
        user_id: user.id,
        entity_type: 'board',
        entity_id: created.id,
        action: 'BOARD_CREATED',
        after: { name, visibility: visibility || 'workspace' },
      },
      { transaction: t },
    );
    return created;
  });

  return board;
};

const findAllInWorkspace = async (workspacePublicId, userPublicId, query) => {
  const { workspace } = await resolveWorkspaceAccess(workspacePublicId, userPublicId);
  const { page, limit, offset } = parsePagination(query);

  const where = { workspace_id: workspace.id };
  if (query.archived === 'true') where.is_archived = true;
  else if (query.archived !== 'all') where.is_archived = false;
  if (query.q) {
    where.name = { [Op.like]: `%${query.q.replace(/[%_]/g, '\\$&')}%` };
  }

  const { count, rows } = await Board.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });

  return formatPaginated(rows, count, page, limit);
};

const findById = async (boardPublicId, userPublicId) => {
  const { board } = await resolveBoardAccess(boardPublicId, userPublicId);
  return board;
};

const update = async (boardPublicId, userPublicId, patch) => {
  const { board, user } = await resolveBoardAccess(boardPublicId, userPublicId);
  const before = { name: board.name, description: board.description, background: board.background };

  const updated = await sequelize.transaction(async (t) => {
    const result = await board.update(patch, { transaction: t });
    // Bump board version for socket reconciliation
    await board.increment('version', { transaction: t });
    await AuditLog.create(
      {
        workspace_id: board.workspace_id,
        board_id: board.id,
        user_id: user.id,
        entity_type: 'board',
        entity_id: board.id,
        action: 'BOARD_UPDATED',
        before,
        after: patch,
      },
      { transaction: t },
    );
    return result;
  });

  return updated;
};

const archive = async (boardPublicId, userPublicId) => {
  const { board, user } = await resolveBoardAccess(boardPublicId, userPublicId);

  await sequelize.transaction(async (t) => {
    await board.update({ is_archived: true }, { transaction: t });
    await AuditLog.create(
      {
        workspace_id: board.workspace_id,
        board_id: board.id,
        user_id: user.id,
        entity_type: 'board',
        entity_id: board.id,
        action: 'BOARD_ARCHIVED',
      },
      { transaction: t },
    );
  });

  return board;
};

const restore = async (boardPublicId, userPublicId) => {
  const { board, user } = await resolveBoardAccess(boardPublicId, userPublicId);

  await sequelize.transaction(async (t) => {
    await board.update({ is_archived: false }, { transaction: t });
    await AuditLog.create(
      {
        workspace_id: board.workspace_id,
        board_id: board.id,
        user_id: user.id,
        entity_type: 'board',
        entity_id: board.id,
        action: 'BOARD_RESTORED',
      },
      { transaction: t },
    );
  });

  return board;
};

const softDelete = async (boardPublicId, userPublicId) => {
  const { board, user } = await resolveBoardAccess(boardPublicId, userPublicId);

  await sequelize.transaction(async (t) => {
    await board.destroy({ transaction: t });
    await AuditLog.create(
      {
        workspace_id: board.workspace_id,
        board_id: board.id,
        user_id: user.id,
        entity_type: 'board',
        entity_id: board.id,
        action: 'BOARD_DELETED',
      },
      { transaction: t },
    );
  });
};

module.exports = { create, findAllInWorkspace, findById, update, archive, restore, softDelete };

