'use strict';

const { Checklist, ChecklistItem, Card, List, Board, WorkspaceMember, User } = require('../models');
const { AppError } = require('../utils/AppError');
const { ROLES, isAtLeast } = require('../constants/roles');
const AuditLog = require('../models/AuditLog.model');
const { ACTIONS } = require('../constants/actions');
const sequelize = require('../config/database');

class ChecklistService {
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

  async _resolveChecklist(checklistPublicId, userPublicId) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const checklist = await Checklist.findOne({
      where: { public_id: checklistPublicId },
      include: [
        {
          model: Card,
          as: 'card',
          include: [{ model: List, as: 'list', include: [{ model: Board, as: 'board' }] }],
        },
      ],
    });
    if (!checklist) throw AppError.notFound('Checklist not found');

    const membership = await WorkspaceMember.findOne({
      where: { workspace_id: checklist.card.list.board.workspace_id, user_id: user.id },
    });
    if (!membership) throw AppError.notFound('Checklist not found');

    return { checklist, card: checklist.card, board: checklist.card.list.board, user, membership };
  }

  // ─── Checklists ───────────────────────────────────────────────────────────

  async findAllInCard(cardPublicId, userPublicId) {
    const { card } = await this._resolveCard(cardPublicId, userPublicId);
    return Checklist.findAll({
      where: { card_id: card.id },
      order: [['position', 'ASC']],
      include: [{ model: ChecklistItem, as: 'items', order: [['position', 'ASC']] }],
    });
  }

  async createChecklist(cardPublicId, userPublicId, { title }) {
    const { card, board, user, membership } = await this._resolveCard(cardPublicId, userPublicId);
    if (!isAtLeast(membership.role, ROLES.MEMBER)) throw AppError.forbidden('Insufficient permissions');

    const maxCl = await Checklist.findOne({ where: { card_id: card.id }, order: [['position', 'DESC']] });
    const position = maxCl ? maxCl.position + 1000.0 : 1000.0;

    return sequelize.transaction(async (t) => {
      const cl = await Checklist.create({ card_id: card.id, title, position }, { transaction: t });
      await AuditLog.create(
        { workspace_id: board.workspace_id, actor_id: user.id, action: ACTIONS.CHECKLIST_CREATED, entity_type: 'checklist', entity_id: cl.id, after_state: { title } },
        { transaction: t }
      );
      return cl;
    });
  }

  async updateChecklist(checklistPublicId, userPublicId, { title }) {
    const { checklist, board, user, membership } = await this._resolveChecklist(checklistPublicId, userPublicId);
    if (!isAtLeast(membership.role, ROLES.MEMBER)) throw AppError.forbidden('Insufficient permissions');

    return sequelize.transaction(async (t) => {
      checklist.title = title;
      await checklist.save({ transaction: t });
      await AuditLog.create(
        { workspace_id: board.workspace_id, actor_id: user.id, action: ACTIONS.CHECKLIST_UPDATED, entity_type: 'checklist', entity_id: checklist.id },
        { transaction: t }
      );
      return checklist;
    });
  }

  async deleteChecklist(checklistPublicId, userPublicId) {
    const { checklist, board, user, membership } = await this._resolveChecklist(checklistPublicId, userPublicId);
    if (!isAtLeast(membership.role, ROLES.MEMBER)) throw AppError.forbidden('Insufficient permissions');

    await sequelize.transaction(async (t) => {
      await ChecklistItem.destroy({ where: { checklist_id: checklist.id }, transaction: t });
      await checklist.destroy({ transaction: t });
      await AuditLog.create(
        { workspace_id: board.workspace_id, actor_id: user.id, action: ACTIONS.CHECKLIST_DELETED, entity_type: 'checklist', entity_id: checklist.id },
        { transaction: t }
      );
    });
  }

  // ─── Checklist Items ──────────────────────────────────────────────────────

  async createItem(checklistPublicId, userPublicId, { content, due_date }) {
    const { checklist, board, user, membership } = await this._resolveChecklist(checklistPublicId, userPublicId);
    if (!isAtLeast(membership.role, ROLES.MEMBER)) throw AppError.forbidden('Insufficient permissions');

    const maxItem = await ChecklistItem.findOne({ where: { checklist_id: checklist.id }, order: [['position', 'DESC']] });
    const position = maxItem ? maxItem.position + 1000.0 : 1000.0;

    return sequelize.transaction(async (t) => {
      const item = await ChecklistItem.create(
        { checklist_id: checklist.id, content, is_checked: false, due_date: due_date || null, position },
        { transaction: t }
      );
      await AuditLog.create(
        { workspace_id: board.workspace_id, actor_id: user.id, action: ACTIONS.CHECKLIST_ITEM_CREATED, entity_type: 'checklist_item', entity_id: item.id },
        { transaction: t }
      );
      return item;
    });
  }

  async updateItem(itemPublicId, userPublicId, updates) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const item = await ChecklistItem.findOne({
      where: { public_id: itemPublicId },
      include: [
        {
          model: Checklist,
          as: 'checklist',
          include: [{ model: Card, as: 'card', include: [{ model: List, as: 'list', include: [{ model: Board, as: 'board' }] }] }],
        },
      ],
    });
    if (!item) throw AppError.notFound('Checklist item not found');

    const board = item.checklist.card.list.board;
    const membership = await WorkspaceMember.findOne({ where: { workspace_id: board.workspace_id, user_id: user.id } });
    if (!membership) throw AppError.notFound('Item not found');
    if (!isAtLeast(membership.role, ROLES.MEMBER)) throw AppError.forbidden('Insufficient permissions');

    const allowed = ['content', 'is_checked', 'due_date', 'assignee_id'];
    for (const key of allowed) {
      if (updates[key] !== undefined) item[key] = updates[key];
    }

    return sequelize.transaction(async (t) => {
      await item.save({ transaction: t });
      await AuditLog.create(
        { workspace_id: board.workspace_id, actor_id: user.id, action: ACTIONS.CHECKLIST_ITEM_UPDATED, entity_type: 'checklist_item', entity_id: item.id },
        { transaction: t }
      );
      return item;
    });
  }

  async deleteItem(itemPublicId, userPublicId) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const item = await ChecklistItem.findOne({
      where: { public_id: itemPublicId },
      include: [
        {
          model: Checklist,
          as: 'checklist',
          include: [{ model: Card, as: 'card', include: [{ model: List, as: 'list', include: [{ model: Board, as: 'board' }] }] }],
        },
      ],
    });
    if (!item) throw AppError.notFound('Checklist item not found');

    const board = item.checklist.card.list.board;
    const membership = await WorkspaceMember.findOne({ where: { workspace_id: board.workspace_id, user_id: user.id } });
    if (!membership) throw AppError.notFound('Item not found');
    if (!isAtLeast(membership.role, ROLES.MEMBER)) throw AppError.forbidden('Insufficient permissions');

    await sequelize.transaction(async (t) => {
      await item.destroy({ transaction: t });
      await AuditLog.create(
        { workspace_id: board.workspace_id, actor_id: user.id, action: ACTIONS.CHECKLIST_ITEM_DELETED, entity_type: 'checklist_item', entity_id: item.id },
        { transaction: t }
      );
    });
  }
}

module.exports = new ChecklistService();

