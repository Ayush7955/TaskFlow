'use strict';

const {
  Card,
  List,
  Board,
  WorkspaceMember,
  User,
  CardMember,
  Label,
  CardLabel,
  Checklist,
  ChecklistItem,
  Attachment,
  Comment,
} = require('../models');
const { AppError } = require('../utils/AppError');
const { getParsedPagination, formatPaginated } = require('../utils/pagination');
const { ROLES, isAtLeast } = require('../constants/roles');
const AuditLog = require('../models/AuditLog.model');
const { ACTIONS } = require('../constants/actions');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

class CardService {
  /**
   * Resolve internal list from publicId, verifying workspace membership.
   */
  async _resolveList(listPublicId, userPublicId) {
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

    return { list, board: list.board, user, membership };
  }

  /**
   * Resolve card from publicId, verifying workspace membership.
   */
  async _resolveCard(cardPublicId, userPublicId) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const card = await Card.findOne({
      where: { public_id: cardPublicId, deleted_at: null },
      include: [
        {
          model: List,
          as: 'list',
          include: [{ model: Board, as: 'board' }],
        },
      ],
    });
    if (!card) throw AppError.notFound('Card not found');

    const membership = await WorkspaceMember.findOne({
      where: { workspace_id: card.list.board.workspace_id, user_id: user.id },
    });
    if (!membership) throw AppError.notFound('Card not found');

    return { card, list: card.list, board: card.list.board, user, membership };
  }

  /**
   * GET /lists/:listId/cards
   */
  async findAllInList(listPublicId, userPublicId, query) {
    const { list } = await this._resolveList(listPublicId, userPublicId);
    const { limit, offset } = getParsedPagination(query);

    const { count, rows } = await Card.findAndCountAll({
      where: { list_id: list.id, is_archived: false, deleted_at: null },
      order: [['position', 'ASC']],
      include: [
        {
          model: User,
          as: 'assignees',
          attributes: ['public_id', 'name', 'avatar_url'],
          through: { attributes: [] },
        },
        {
          model: Label,
          as: 'labels',
          attributes: ['id', 'name', 'color'],
          through: { attributes: [] },
        },
      ],
      limit,
      offset,
    });

    return formatPaginated(rows, count, query);
  }

  /**
   * GET /boards/:boardId — full board payload (lists + cards + members + labels)
   * Uses ≤4 queries via separate fetches + in-memory grouping.
   */
  async getBoardPayload(boardPublicId, userPublicId) {
    const { User: UserModel } = require('../models');
    const user = await UserModel.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const board = await Board.findOne({
      where: { public_id: boardPublicId, deleted_at: null },
    });
    if (!board) throw AppError.notFound('Board not found');

    const membership = await WorkspaceMember.findOne({
      where: { workspace_id: board.workspace_id, user_id: user.id },
    });
    if (!membership) throw AppError.notFound('Board not found');

    // Query 1: Lists
    const lists = await List.findAll({
      where: { board_id: board.id, is_archived: false, deleted_at: null },
      order: [['position', 'ASC']],
      raw: true,
    });

    // Query 2: Cards with assignees + labels (eager)
    const listIds = lists.map((l) => l.id);
    const cards =
      listIds.length > 0
        ? await Card.findAll({
            where: { list_id: listIds, is_archived: false, deleted_at: null },
            order: [['position', 'ASC']],
            include: [
              {
                model: User,
                as: 'assignees',
                attributes: ['public_id', 'name', 'avatar_url'],
                through: { attributes: [] },
              },
              {
                model: Label,
                as: 'labels',
                attributes: ['id', 'name', 'color'],
                through: { attributes: [] },
              },
            ],
          })
        : [];

    // Query 3: Labels for the board
    const labels = await Label.findAll({
      where: { board_id: board.id },
      order: [['name', 'ASC']],
    });

    // Group cards by list
    const cardsByList = {};
    for (const card of cards) {
      if (!cardsByList[card.list_id]) cardsByList[card.list_id] = [];
      cardsByList[card.list_id].push(card);
    }

    return {
      board: {
        public_id: board.public_id,
        name: board.name,
        description: board.description,
        visibility: board.visibility,
        status: board.status,
        background_color: board.background_color,
        cover_image_url: board.cover_image_url,
      },
      lists: lists.map((l) => ({
        ...l,
        cards: cardsByList[l.id] || [],
      })),
      labels,
    };
  }

  /**
   * GET /cards/:cardId — single card with full details
   */
  async findById(cardPublicId, userPublicId) {
    const { card, board } = await this._resolveCard(cardPublicId, userPublicId);

    const full = await Card.findOne({
      where: { id: card.id },
      include: [
        {
          model: User,
          as: 'assignees',
          attributes: ['public_id', 'name', 'avatar_url', 'email'],
          through: { attributes: [] },
        },
        {
          model: Label,
          as: 'labels',
          attributes: ['id', 'name', 'color'],
          through: { attributes: [] },
        },
        {
          model: Checklist,
          as: 'checklists',
          order: [['position', 'ASC']],
          include: [
            {
              model: ChecklistItem,
              as: 'items',
              order: [['position', 'ASC']],
            },
          ],
        },
        {
          model: Attachment,
          as: 'attachments',
          include: [
            { model: User, as: 'uploadedBy', attributes: ['public_id', 'name', 'avatar_url'] },
          ],
        },
        {
          model: Comment,
          as: 'comments',
          where: { parent_id: null },
          required: false,
          order: [['created_at', 'ASC']],
          include: [
            { model: User, as: 'author', attributes: ['public_id', 'name', 'avatar_url'] },
            {
              model: Comment,
              as: 'replies',
              include: [
                { model: User, as: 'author', attributes: ['public_id', 'name', 'avatar_url'] },
              ],
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['public_id', 'name', 'avatar_url'],
        },
      ],
    });

    return full;
  }

  /**
   * POST /lists/:listId/cards
   */
  async create(listPublicId, userPublicId, data) {
    const { list, board, user, membership } = await this._resolveList(listPublicId, userPublicId);

    if (!isAtLeast(membership.role, ROLES.MEMBER)) {
      throw AppError.forbidden('Insufficient permissions');
    }

    const { title, description, priority, due_date, start_date, estimated_hours } = data;

    const maxCard = await Card.findOne({
      where: { list_id: list.id, deleted_at: null },
      order: [['position', 'DESC']],
    });
    const position = maxCard ? maxCard.position + 1000.0 : 1000.0;

    const result = await sequelize.transaction(async (t) => {
      const card = await Card.create(
        {
          list_id: list.id,
          board_id: board.id,
          title,
          description: description || null,
          position,
          priority: priority || 'medium',
          due_date: due_date || null,
          start_date: start_date || null,
          is_complete: false,
          is_archived: false,
          created_by: user.id,
          estimated_hours: estimated_hours || null,
        },
        { transaction: t }
      );

      await AuditLog.create(
        {
          workspace_id: board.workspace_id,
          actor_id: user.id,
          action: ACTIONS.CARD_CREATED,
          entity_type: 'card',
          entity_id: card.id,
          after_state: { title, list_id: list.public_id, position },
        },
        { transaction: t }
      );

      return card;
    });

    return result;
  }

  /**
   * PATCH /cards/:cardId
   */
  async update(cardPublicId, userPublicId, updates) {
    const { card, board, user, membership } = await this._resolveCard(cardPublicId, userPublicId);

    if (!isAtLeast(membership.role, ROLES.MEMBER)) {
      throw AppError.forbidden('Insufficient permissions');
    }

    const allowed = [
      'title',
      'description',
      'priority',
      'due_date',
      'start_date',
      'is_complete',
      'estimated_hours',
      'actual_hours',
      'cover_attachment_id',
    ];

    const before = {};
    const after = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        before[key] = card[key];
        card[key] = updates[key];
        after[key] = updates[key];
      }
    }

    const result = await sequelize.transaction(async (t) => {
      await card.save({ transaction: t });
      await AuditLog.create(
        {
          workspace_id: board.workspace_id,
          actor_id: user.id,
          action: ACTIONS.CARD_UPDATED,
          entity_type: 'card',
          entity_id: card.id,
          before_state: before,
          after_state: after,
        },
        { transaction: t }
      );
      return card;
    });

    return result;
  }

  /**
   * POST /cards/:cardId/move — move card to different list / position
   */
  async move(cardPublicId, userPublicId, { listPublicId, position }) {
    const { card, board, user, membership } = await this._resolveCard(cardPublicId, userPublicId);

    if (!isAtLeast(membership.role, ROLES.MEMBER)) {
      throw AppError.forbidden('Insufficient permissions');
    }

    let targetListId = card.list_id;
    if (listPublicId) {
      const targetList = await List.findOne({
        where: { public_id: listPublicId, board_id: board.id, deleted_at: null },
      });
      if (!targetList) throw AppError.notFound('Target list not found');
      targetListId = targetList.id;
    }

    const before = { list_id: card.list_id, position: card.position };

    await sequelize.transaction(async (t) => {
      card.list_id = targetListId;
      card.position = position;
      await card.save({ transaction: t });

      await AuditLog.create(
        {
          workspace_id: board.workspace_id,
          actor_id: user.id,
          action: ACTIONS.CARD_MOVED,
          entity_type: 'card',
          entity_id: card.id,
          before_state: before,
          after_state: { list_id: targetListId, position },
        },
        { transaction: t }
      );
    });

    return card;
  }

  /**
   * POST /cards/:cardId/archive  |  POST /cards/:cardId/unarchive
   */
  async setArchived(cardPublicId, userPublicId, archived) {
    const { card, board, user, membership } = await this._resolveCard(cardPublicId, userPublicId);

    if (!isAtLeast(membership.role, ROLES.MEMBER)) {
      throw AppError.forbidden('Insufficient permissions');
    }

    await sequelize.transaction(async (t) => {
      card.is_archived = archived;
      await card.save({ transaction: t });
      await AuditLog.create(
        {
          workspace_id: board.workspace_id,
          actor_id: user.id,
          action: archived ? ACTIONS.CARD_ARCHIVED : ACTIONS.CARD_UNARCHIVED,
          entity_type: 'card',
          entity_id: card.id,
        },
        { transaction: t }
      );
    });

    return card;
  }

  /**
   * DELETE /cards/:cardId
   */
  async softDelete(cardPublicId, userPublicId) {
    const { card, board, user, membership } = await this._resolveCard(cardPublicId, userPublicId);

    if (!isAtLeast(membership.role, ROLES.ADMIN)) {
      throw AppError.forbidden('Only admins can delete cards');
    }

    await sequelize.transaction(async (t) => {
      await card.destroy({ transaction: t });
      await AuditLog.create(
        {
          workspace_id: board.workspace_id,
          actor_id: user.id,
          action: ACTIONS.CARD_DELETED,
          entity_type: 'card',
          entity_id: card.id,
          before_state: { title: card.title },
        },
        { transaction: t }
      );
    });
  }

  // ─── Members ──────────────────────────────────────────────────────────────

  async addMember(cardPublicId, userPublicId, memberPublicId) {
    const { card, board, user, membership } = await this._resolveCard(cardPublicId, userPublicId);
    if (!isAtLeast(membership.role, ROLES.MEMBER)) throw AppError.forbidden('Insufficient permissions');

    const memberUser = await User.findOne({ where: { public_id: memberPublicId } });
    if (!memberUser) throw AppError.notFound('User not found');

    const isMember = await WorkspaceMember.findOne({
      where: { workspace_id: board.workspace_id, user_id: memberUser.id },
    });
    if (!isMember) throw AppError.badRequest('User is not a workspace member');

    const existing = await CardMember.findOne({ where: { card_id: card.id, user_id: memberUser.id } });
    if (existing) throw AppError.conflict('User is already assigned to this card');

    await sequelize.transaction(async (t) => {
      await CardMember.create({ card_id: card.id, user_id: memberUser.id }, { transaction: t });
      await AuditLog.create(
        {
          workspace_id: board.workspace_id,
          actor_id: user.id,
          action: ACTIONS.CARD_MEMBER_ADDED,
          entity_type: 'card',
          entity_id: card.id,
          after_state: { member_id: memberPublicId },
        },
        { transaction: t }
      );
    });
  }

  async removeMember(cardPublicId, userPublicId, memberPublicId) {
    const { card, board, user, membership } = await this._resolveCard(cardPublicId, userPublicId);
    if (!isAtLeast(membership.role, ROLES.MEMBER)) throw AppError.forbidden('Insufficient permissions');

    const memberUser = await User.findOne({ where: { public_id: memberPublicId } });
    if (!memberUser) throw AppError.notFound('User not found');

    const existing = await CardMember.findOne({ where: { card_id: card.id, user_id: memberUser.id } });
    if (!existing) throw AppError.notFound('Member not assigned to this card');

    await sequelize.transaction(async (t) => {
      await existing.destroy({ transaction: t });
      await AuditLog.create(
        {
          workspace_id: board.workspace_id,
          actor_id: user.id,
          action: ACTIONS.CARD_MEMBER_REMOVED,
          entity_type: 'card',
          entity_id: card.id,
          after_state: { member_id: memberPublicId },
        },
        { transaction: t }
      );
    });
  }

  // ─── Labels ───────────────────────────────────────────────────────────────

  async addLabel(cardPublicId, userPublicId, labelPublicId) {
    const { card, board, user, membership } = await this._resolveCard(cardPublicId, userPublicId);
    if (!isAtLeast(membership.role, ROLES.MEMBER)) throw AppError.forbidden('Insufficient permissions');

    const label = await Label.findOne({ where: { public_id: labelPublicId, board_id: board.id } });
    if (!label) throw AppError.notFound('Label not found');

    const existing = await CardLabel.findOne({ where: { card_id: card.id, label_id: label.id } });
    if (existing) throw AppError.conflict('Label already applied');

    await sequelize.transaction(async (t) => {
      await CardLabel.create({ card_id: card.id, label_id: label.id }, { transaction: t });
      await AuditLog.create(
        {
          workspace_id: board.workspace_id,
          actor_id: user.id,
          action: ACTIONS.CARD_LABEL_ADDED,
          entity_type: 'card',
          entity_id: card.id,
          after_state: { label_id: labelPublicId },
        },
        { transaction: t }
      );
    });
  }

  async removeLabel(cardPublicId, userPublicId, labelPublicId) {
    const { card, board, user, membership } = await this._resolveCard(cardPublicId, userPublicId);
    if (!isAtLeast(membership.role, ROLES.MEMBER)) throw AppError.forbidden('Insufficient permissions');

    const label = await Label.findOne({ where: { public_id: labelPublicId, board_id: board.id } });
    if (!label) throw AppError.notFound('Label not found');

    const existing = await CardLabel.findOne({ where: { card_id: card.id, label_id: label.id } });
    if (!existing) throw AppError.notFound('Label not applied to this card');

    await sequelize.transaction(async (t) => {
      await existing.destroy({ transaction: t });
      await AuditLog.create(
        {
          workspace_id: board.workspace_id,
          actor_id: user.id,
          action: ACTIONS.CARD_LABEL_REMOVED,
          entity_type: 'card',
          entity_id: card.id,
          after_state: { label_id: labelPublicId },
        },
        { transaction: t }
      );
    });
  }
}

module.exports = new CardService();

