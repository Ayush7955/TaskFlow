'use strict';

const { Label, Board, WorkspaceMember, User } = require('../models');
const { AppError } = require('../utils/AppError');
const { ROLES, isAtLeast } = require('../constants/roles');
const AuditLog = require('../models/AuditLog.model');
const { ACTIONS } = require('../constants/actions');
const sequelize = require('../config/database');

class LabelService {
  async _resolveBoard(boardPublicId, userPublicId) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const board = await Board.findOne({ where: { public_id: boardPublicId, deleted_at: null } });
    if (!board) throw AppError.notFound('Board not found');

    const membership = await WorkspaceMember.findOne({ where: { workspace_id: board.workspace_id, user_id: user.id } });
    if (!membership) throw AppError.notFound('Board not found');

    return { board, user, membership };
  }

  async findAllInBoard(boardPublicId, userPublicId) {
    const { board } = await this._resolveBoard(boardPublicId, userPublicId);
    return Label.findAll({ where: { board_id: board.id }, order: [['name', 'ASC']] });
  }

  async create(boardPublicId, userPublicId, { name, color }) {
    const { board, user, membership } = await this._resolveBoard(boardPublicId, userPublicId);
    if (!isAtLeast(membership.role, ROLES.MEMBER)) throw AppError.forbidden('Insufficient permissions');

    return sequelize.transaction(async (t) => {
      const label = await Label.create({ board_id: board.id, name, color }, { transaction: t });
      await AuditLog.create(
        { workspace_id: board.workspace_id, actor_id: user.id, action: ACTIONS.LABEL_CREATED, entity_type: 'label', entity_id: label.id, after_state: { name, color } },
        { transaction: t }
      );
      return label;
    });
  }

  async update(labelPublicId, userPublicId, { name, color }) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const label = await Label.findOne({
      where: { public_id: labelPublicId },
      include: [{ model: Board, as: 'board' }],
    });
    if (!label) throw AppError.notFound('Label not found');

    const membership = await WorkspaceMember.findOne({ where: { workspace_id: label.board.workspace_id, user_id: user.id } });
    if (!membership) throw AppError.notFound('Label not found');
    if (!isAtLeast(membership.role, ROLES.MEMBER)) throw AppError.forbidden('Insufficient permissions');

    return sequelize.transaction(async (t) => {
      if (name !== undefined) label.name = name;
      if (color !== undefined) label.color = color;
      await label.save({ transaction: t });
      await AuditLog.create(
        { workspace_id: label.board.workspace_id, actor_id: user.id, action: ACTIONS.LABEL_UPDATED, entity_type: 'label', entity_id: label.id },
        { transaction: t }
      );
      return label;
    });
  }

  async delete(labelPublicId, userPublicId) {
    const user = await User.findOne({ where: { public_id: userPublicId } });
    if (!user) throw AppError.notFound('User not found');

    const label = await Label.findOne({
      where: { public_id: labelPublicId },
      include: [{ model: Board, as: 'board' }],
    });
    if (!label) throw AppError.notFound('Label not found');

    const membership = await WorkspaceMember.findOne({ where: { workspace_id: label.board.workspace_id, user_id: user.id } });
    if (!membership) throw AppError.notFound('Label not found');
    if (!isAtLeast(membership.role, ROLES.ADMIN)) throw AppError.forbidden('Only admins can delete labels');

    await sequelize.transaction(async (t) => {
      // CardLabel pivot rows will cascade delete if FK ON DELETE CASCADE is set;
      // otherwise delete manually
      const { CardLabel } = require('../models');
      await CardLabel.destroy({ where: { label_id: label.id }, transaction: t });
      await label.destroy({ transaction: t });
      await AuditLog.create(
        { workspace_id: label.board.workspace_id, actor_id: user.id, action: ACTIONS.LABEL_DELETED, entity_type: 'label', entity_id: label.id },
        { transaction: t }
      );
    });
  }
}

module.exports = new LabelService();

