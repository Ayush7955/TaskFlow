'use strict';

const { Comment, Card, List, Board, WorkspaceMember, User } = require('../models');
const { AppError } = require('../utils/AppError');
const { getParsedPagination, formatPaginated } = require('../utils/pagination');
const { ROLES, isAtLeast } = require('../constants/roles');
const AuditLog = require('../models/AuditLog.model');
const { ACTIONS } = require('../constants/actions');
const sequelize = require('../config/database');

class CommentService {
  async _resolveCard(cardPublicId, userPublicId) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const card = await Card.findOne({
      where: { public_id: cardPublicId, deleted_at: null },
      include: [{ model: List, as: 'list', include: [{ model: Board, as: 'board' }] }],
    });
    if (!card) throw AppError.notFound('Card not found');

    const membership = await WorkspaceMember.findOne({
      where: { workspace_id: card.list.board.workspace_id, user_id: user.id },
    });
    if (!membership) throw AppError.notFound('Card not found');

    return { card, board: card.list.board, user, membership };
  }

  async _resolveComment(commentPublicId, userPublicId) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const comment = await Comment.findOne({
      where: { public_id: commentPublicId },
      include: [
        {
          model: Card,
          as: 'card',
          include: [{ model: List, as: 'list', include: [{ model: Board, as: 'board' }] }],
        },
      ],
    });
    if (!comment) throw AppError.notFound('Comment not found');

    const membership = await WorkspaceMember.findOne({
      where: { workspace_id: comment.card.list.board.workspace_id, user_id: user.id },
    });
    if (!membership) throw AppError.notFound('Comment not found');

    return { comment, card: comment.card, board: comment.card.list.board, user, membership };
  }

  /**
   * GET /cards/:cardId/comments
   */
  async findAllInCard(cardPublicId, userPublicId, query) {
    const { card } = await this._resolveCard(cardPublicId, userPublicId);
    const { limit, offset } = getParsedPagination(query);

    const { count, rows } = await Comment.findAndCountAll({
      where: { card_id: card.id, parent_id: null },
      order: [['created_at', 'ASC']],
      include: [
        { model: User, as: 'author', attributes: ['public_id', 'name', 'avatar_url'] },
        {
          model: Comment,
          as: 'replies',
          include: [{ model: User, as: 'author', attributes: ['public_id', 'name', 'avatar_url'] }],
          order: [['created_at', 'ASC']],
        },
      ],
      limit,
      offset,
    });

    return formatPaginated(rows, count, query);
  }

  /**
   * POST /cards/:cardId/comments
   */
  async create(cardPublicId, userPublicId, { content, parentPublicId }) {
    const { card, board, user, membership } = await this._resolveCard(cardPublicId, userPublicId);
    if (!isAtLeast(membership.role, ROLES.MEMBER)) throw AppError.forbidden('Insufficient permissions');

    let parentId = null;
    if (parentPublicId) {
      const parent = await Comment.findOne({ where: { public_id: parentPublicId, card_id: card.id } });
      if (!parent) throw AppError.notFound('Parent comment not found');
      if (parent.parent_id !== null) throw AppError.badRequest('Cannot reply to a reply (max 1 level)');
      parentId = parent.id;
    }

    return sequelize.transaction(async (t) => {
      const comment = await Comment.create(
        { card_id: card.id, user_id: user.id, content, is_edited: false, parent_id: parentId },
        { transaction: t }
      );
      await AuditLog.create(
        { workspace_id: board.workspace_id, actor_id: user.id, action: ACTIONS.COMMENT_CREATED, entity_type: 'comment', entity_id: comment.id, after_state: { card_id: card.public_id } },
        { transaction: t }
      );
      return comment;
    });
  }

  /**
   * PATCH /comments/:commentId
   */
  async update(commentPublicId, userPublicId, { content }) {
    const { comment, board, user } = await this._resolveComment(commentPublicId, userPublicId);

    if (comment.user_id !== user.id) {
      throw AppError.forbidden('You can only edit your own comments');
    }

    return sequelize.transaction(async (t) => {
      comment.content = content;
      comment.is_edited = true;
      await comment.save({ transaction: t });
      await AuditLog.create(
        { workspace_id: board.workspace_id, actor_id: user.id, action: ACTIONS.COMMENT_UPDATED, entity_type: 'comment', entity_id: comment.id },
        { transaction: t }
      );
      return comment;
    });
  }

  /**
   * DELETE /comments/:commentId
   */
  async delete(commentPublicId, userPublicId) {
    const { comment, board, user, membership } = await this._resolveComment(commentPublicId, userPublicId);

    const isOwner = comment.user_id === user.id;
    const isAdmin = isAtLeast(membership.role, ROLES.ADMIN);
    if (!isOwner && !isAdmin) throw AppError.forbidden('Not authorized to delete this comment');

    await sequelize.transaction(async (t) => {
      // Also delete replies
      await Comment.destroy({ where: { parent_id: comment.id }, transaction: t });
      await comment.destroy({ transaction: t });
      await AuditLog.create(
        { workspace_id: board.workspace_id, actor_id: user.id, action: ACTIONS.COMMENT_DELETED, entity_type: 'comment', entity_id: comment.id },
        { transaction: t }
      );
    });
  }
}

module.exports = new CommentService();

