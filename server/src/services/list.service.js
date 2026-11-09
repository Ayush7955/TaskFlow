'use strict';

const { List, Board, Card, WorkspaceMember } = require('../models');
const { AppError } = require('../utils/AppError');
const { getParsedPagination, formatPaginated } = require('../utils/pagination');
const { ROLES, isAtLeast } = require('../constants/roles');
const AuditLog = require('../models/AuditLog.model');
const { ACTIONS } = require('../constants/actions');
const sequelize = require('../config/database');

class ListService {
  /**
   * Resolve internal board ID from publicId, verifying workspace membership.
   */
  async _resolveBoard(boardPublicId, userPublicId) {
    const { User } = require('../models');
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const board = await Board.findOne({
      where: { public_id: boardPublicId, deleted_at: null },
    });
    if (!board) throw AppError.notFound('Board not found');

    const membership = await WorkspaceMember.findOne({
      where: { workspace_id: board.workspace_id, user_id: user.id },
    });
    if (!membership) throw AppError.notFound('Board not found');

    return { board, user, membership };
  }

  /**
   * GET /boards/:boardId/lists
   */
  async findAllInBoard(boardPublicId, userPublicId, query) {
    const { board } = await this._resolveBoard(boardPublicId, userPublicId);
    const { limit, offset } = getParsedPagination(query);

    const { count, rows } = await List.findAndCountAll({
      where: { board_id: board.id, is_archived: false, deleted_at: null },
      order: [['position', 'ASC']],
      limit,
      offset,
    });

    return formatPaginated(rows, count, query);
  }

  /**
   * POST /boards/:boardId/lists
   */
  async create(boardPublicId, userPublicId, { name, color }) {
    const { board, user, membership } = await this._resolveBoard(boardPublicId, userPublicId);

    if (!isAtLeast(membership.role, ROLES.MEMBER)) {
      throw AppError.forbidden('Insufficient permissions to create lists');
    }

    // Append position: max + 1000
    const maxList = await List.findOne({
      where: { board_id: board.id, deleted_at: null },
      order: [['position', 'DESC']],
    });
    const position = maxList ? maxList.position + 1000.0 : 1000.0;

    const result = await sequelize.transaction(async (t) => {
      const list = await List.create(
        { board_id: board.id, name, color: color || null, position, is_archived: false },
        { transaction: t }
      );

      await AuditLog.create(
        {
          workspace_id: board.workspace_id,
          actor_id: user.id,
          action: ACTIONS.LIST_CREATED,
          entity_type: 'list',
          entity_id: list.id,
          after_state: { name, position },
        },
        { transaction: t }
      );

      return list;
    });

    return result;
  }

  /**
   * PATCH /lists/:listId
   */
  async update(listPublicId, userPublicId, updates) {
    const { List: ListModel, User } = require('../models');
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const list = await List.findOne({
      where: { public_id: listPublicId, deleted_at: null },
      include: [{ model: Board, as: 'board' }],
    });
    if (!list) throw AppError.notFound('List not found');

    const membership = await WorkspaceMember.findOne({
      where: { workspace_id: list.board.workspace_id, user_id: user.id },
    });
    if (!membership) throw AppError.notFound('List not found');

    if (!isAtLeast(membership.role, ROLES.MEMBER)) {
      throw AppError.forbidden('Insufficient permissions');
    }

    const before = { name: list.name, color: list.color };
    const allowed = ['name', 'color'];
    for (const key of allowed) {
      if (updates[key] !== undefined) list[key] = updates[key];
    }

    const result = await sequelize.transaction(async (t) => {
      await list.save({ transaction: t });
      await AuditLog.create(
        {
          workspace_id: list.board.workspace_id,
          actor_id: user.id,
          action: ACTIONS.LIST_UPDATED,
          entity_type: 'list',
          entity_id: list.id,
          before_state: before,
          after_state: updates,
        },
        { transaction: t }
      );
      return list;
    });

    return result;
  }

  /**
   * POST /lists/:listId/archive  |  POST /lists/:listId/unarchive
   */
  async setArchived(listPublicId, userPublicId, archived) {
    const { User } = require('../models');
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const list = await List.findOne({
      where: { public_id: listPublicId, deleted_at: null },
      include: [{ model: Board, as: 'board' }],
    });
    if (!list) throw AppError.notFound('List not found');

    const membership = await WorkspaceMember.findOne({
      where: { workspace_id: list.board.workspace_id, user_id: user.id },
    });
    if (!membership) throw AppError.notFound('List not found');

    if (!isAtLeast(membership.role, ROLES.ADMIN)) {
      throw AppError.forbidden('Only admins can archive lists');
    }

    await sequelize.transaction(async (t) => {
      list.is_archived = archived;
      await list.save({ transaction: t });
      await AuditLog.create(
        {
          workspace_id: list.board.workspace_id,
          actor_id: user.id,
          action: archived ? ACTIONS.LIST_ARCHIVED : ACTIONS.LIST_UNARCHIVED,
          entity_type: 'list',
          entity_id: list.id,
          after_state: { is_archived: archived },
        },
        { transaction: t }
      );
    });

    return list;
  }

  /**
   * DELETE /lists/:listId
   */
  async softDelete(listPublicId, userPublicId) {
    const { User } = require('../models');
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const list = await List.findOne({
      where: { public_id: listPublicId, deleted_at: null },
      include: [{ model: Board, as: 'board' }],
    });
    if (!list) throw AppError.notFound('List not found');

    const membership = await WorkspaceMember.findOne({
      where: { workspace_id: list.board.workspace_id, user_id: user.id },
    });
    if (!membership) throw AppError.notFound('List not found');

    if (!isAtLeast(membership.role, ROLES.ADMIN)) {
      throw AppError.forbidden('Only admins can delete lists');
    }

    await sequelize.transaction(async (t) => {
      await list.destroy({ transaction: t }); // paranoid soft delete
      await AuditLog.create(
        {
          workspace_id: list.board.workspace_id,
          actor_id: user.id,
          action: ACTIONS.LIST_DELETED,
          entity_type: 'list',
          entity_id: list.id,
        },
        { transaction: t }
      );
    });
  }
}

module.exports = new ListService();

